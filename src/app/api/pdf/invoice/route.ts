import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    generateInvoice,
    generateDocumentNumber,
    InvoiceData
} from "@/lib/pdf";

// POST - Generate Invoice PDF
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
            "INV",
            transaction.tenant.slug.toUpperCase().slice(0, 3),
            count
        );

        // Calculate payment status
        const paidAmount = Number(transaction.paidAmount || 0);
        const totalAmount = Number(transaction.totalAmount);
        let paymentStatus: "unpaid" | "partial" | "paid" = "unpaid";

        if (paidAmount >= totalAmount) {
            paymentStatus = "paid";
        } else if (paidAmount > 0) {
            paymentStatus = "partial";
        }

        // Build Invoice data
        const invoiceData: InvoiceData = {
            number: documentNumber,
            date: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            dealer: {
                name: transaction.tenant.name,
                address: transaction.tenant.address || "",
                phone: transaction.tenant.phone || "",
                email: transaction.tenant.email || "",
                npwp: transaction.tenant.npwp || undefined
            },
            customer: {
                name: transaction.customer.name,
                address: transaction.customer.address || "",
                phone: transaction.customer.phone,
                email: transaction.customer.email || undefined
            },
            vehicle: {
                brand: transaction.vehicle.variant.model.brand.name,
                model: transaction.vehicle.variant.model.name,
                variant: transaction.vehicle.variant.name,
                year: transaction.vehicle.year,
                color: transaction.vehicle.color,
                condition: transaction.vehicle.condition as "baru" | "bekas",
                vinNumber: transaction.vehicle.vinNumber || undefined
            },
            pricing: {
                vehiclePrice: Number(transaction.vehiclePrice),
                discount: transaction.discount ? Number(transaction.discount) : undefined,
                adminFee: transaction.adminFee ? Number(transaction.adminFee) : undefined,
                totalAmount: totalAmount,
                paymentMethod: transaction.paymentMethod as "cash" | "credit"
            },
            paymentStatus,
            paidAmount,
            salesName: transaction.sales.name
        };

        // Generate PDF HTML
        const { html, fileName } = generateInvoice(invoiceData);

        return NextResponse.json({
            html,
            fileName,
            documentNumber
        });

    } catch (error) {
        console.error("Error generating invoice:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
