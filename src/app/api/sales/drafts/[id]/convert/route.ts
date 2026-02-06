import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateCommission } from "@/lib/kernel";

// POST - Convert sales draft to transaction
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Only owner and finance can convert to transaction
        if (!["owner", "finance"].includes(session.user.role)) {
            return NextResponse.json(
                { error: "Forbidden - Hanya Owner/Finance yang dapat mengonversi" },
                { status: 403 }
            );
        }

        // Fetch draft with all data
        const draft = await prisma.salesDraft.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId
            },
            include: {
                customer: true,
                vehicle: true,
                pricing: {
                    include: {
                        leasingPartner: true
                    }
                },
                sales: true
            }
        });

        if (!draft) {
            return NextResponse.json(
                { error: "Draft tidak ditemukan" },
                { status: 404 }
            );
        }

        // Validate status
        if (draft.status !== "submitted") {
            return NextResponse.json(
                { error: "Draft harus dalam status 'submitted' untuk dikonversi" },
                { status: 400 }
            );
        }

        if (!draft.pricing) {
            return NextResponse.json(
                { error: "Draft harus memiliki data pricing" },
                { status: 400 }
            );
        }

        // Check vehicle is still available
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id: draft.vehicleId,
                status: { in: ["available", "reserved"] }
            }
        });

        if (!vehicle) {
            return NextResponse.json(
                { error: "Kendaraan sudah tidak tersedia" },
                { status: 400 }
            );
        }

        // Calculate commission using kernel
        const commissionAmount = calculateCommission(
            Number(draft.pricing.netPrice),
            draft.pricing.paymentType === "credit" ? "credit" : "cash"
        );

        // Create transaction in a single atomic operation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transaction = await prisma.$transaction(async (tx: any) => {
            // 1. Create transaction - using correct schema fields
            const newTransaction = await tx.transaction.create({
                data: {
                    tenantId: session.user.tenantId!,
                    salesDraftId: id,
                    transactionDate: new Date(),
                    paymentMethod: draft.pricing!.paymentType,
                    totalAmount: draft.pricing!.netPrice,
                    status: "pending"
                }
            });

            // 2. Update vehicle status to SOLD
            await tx.vehicle.update({
                where: { id: draft.vehicleId },
                data: { status: "sold" }
            });

            // 3. Update draft status to converted
            await tx.salesDraft.update({
                where: { id },
                data: { status: "completed" }
            });

            // 4. Create commission record for sales using SalesCommission model
            await tx.salesCommission.create({
                data: {
                    transactionId: newTransaction.id,
                    salesUserId: draft.salesUserId,
                    amount: commissionAmount,
                    payoutStatus: "pending"
                }
            });

            // 5. Create audit log
            await tx.auditLog.create({
                data: {
                    tenantId: session.user.tenantId!,
                    userId: session.user.id,
                    action: "create",
                    entity: "transaction",
                    entityId: newTransaction.id,
                    newValue: JSON.stringify({
                        draftId: id,
                        transactionId: newTransaction.id,
                        vehicleId: draft.vehicleId,
                        customerId: draft.customerId,
                        totalAmount: String(draft.pricing!.netPrice)
                    })
                }
            });

            return newTransaction;
        });

        return NextResponse.json({
            success: true,
            transaction: {
                id: transaction.id,
                status: transaction.status,
                totalAmount: transaction.totalAmount
            },
            message: "Draft berhasil dikonversi ke transaksi"
        });

    } catch (error) {
        console.error("Error converting draft to transaction:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
