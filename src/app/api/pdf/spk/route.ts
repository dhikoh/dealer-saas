import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    generateSPK,
    generateDocumentNumber,
    SPKData
} from "@/lib/pdf";

// POST - Generate SPK PDF
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { transactionId } = body;

        if (!transactionId) {
            return NextResponse.json(
                { error: "Transaction ID required" },
                { status: 400 }
            );
        }

        // Fetch transaction with all related data
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                tenantId: session.user.tenantId
            },
            include: {
                customer: true,
                vehicle: {
                    include: {
                        variant: {
                            include: {
                                model: {
                                    include: {
                                        brand: true
                                    }
                                }
                            }
                        }
                    }
                },
                leasingPartner: true,
                sales: true,
                tenant: true
            }
        });

        if (!transaction) {
            return NextResponse.json(
                { error: "Transaction not found" },
                { status: 404 }
            );
        }

        // Generate document number
        const count = await prisma.transaction.count({
            where: {
                tenantId: session.user.tenantId
            }
        });

        const documentNumber = generateDocumentNumber(
            "SPK",
            transaction.tenant.slug.toUpperCase().slice(0, 3),
            count
        );

        // Build SPK data
        const spkData: SPKData = {
            number: documentNumber,
            date: transaction.transactionDate,
            dealer: {
                name: transaction.tenant.name,
                address: transaction.tenant.address || "",
                phone: transaction.tenant.phone || "",
                email: transaction.tenant.email || ""
            },
            customer: {
                name: transaction.customer.name,
                address: transaction.customer.address || "",
                phone: transaction.customer.phone,
                nik: transaction.customer.nik || undefined
            },
            vehicle: {
                brand: transaction.vehicle.variant.model.brand.name,
                model: transaction.vehicle.variant.model.name,
                variant: transaction.vehicle.variant.name,
                year: transaction.vehicle.year,
                color: transaction.vehicle.color,
                condition: transaction.vehicle.condition as "baru" | "bekas",
                vinNumber: transaction.vehicle.vinNumber || undefined,
                engineNumber: transaction.vehicle.engineNumber || undefined,
                plateNumber: transaction.vehicle.plateNumber || undefined
            },
            pricing: {
                vehiclePrice: Number(transaction.vehiclePrice),
                discount: transaction.discount ? Number(transaction.discount) : undefined,
                downPayment: transaction.downPayment ? Number(transaction.downPayment) : undefined,
                tenor: transaction.tenor || undefined,
                monthlyPayment: transaction.monthlyPayment ? Number(transaction.monthlyPayment) : undefined,
                totalAmount: Number(transaction.totalAmount),
                paymentMethod: transaction.paymentMethod as "cash" | "credit",
                leasingPartner: transaction.leasingPartner?.name || undefined
            },
            deliveryDate: transaction.deliveryDate || undefined,
            salesName: transaction.sales.name
        };

        // Generate PDF HTML
        const { html, fileName } = generateSPK(spkData);

        return NextResponse.json({
            html,
            fileName,
            documentNumber
        });

    } catch (error) {
        console.error("Error generating SPK:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
