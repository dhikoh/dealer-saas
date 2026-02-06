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

        // Fetch transaction with salesDraft relations
        const transaction = await prisma.transaction.findFirst({
            where: {
                id: transactionId,
                tenantId: session.user.tenantId
            },
            include: {
                tenant: true,
                salesDraft: {
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
                        pricing: true
                    }
                },
                payments: true
            }
        });

        if (!transaction) {
            return NextResponse.json(
                { error: "Transaction not found" },
                { status: 404 }
            );
        }

        const salesDraft = transaction.salesDraft;
        if (!salesDraft?.customer || !salesDraft?.vehicle) {
            return NextResponse.json(
                { error: "Transaction data incomplete" },
                { status: 400 }
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
        const paidAmount = transaction.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalAmount = Number(transaction.totalAmount);
        let paymentStatus: "unpaid" | "partial" | "paid" = "unpaid";

        if (paidAmount >= totalAmount) {
            paymentStatus = "paid";
        } else if (paidAmount > 0) {
            paymentStatus = "partial";
        }

        const pricing = salesDraft.pricing;

        // Build Invoice data
        const invoiceData: InvoiceData = {
            number: documentNumber,
            date: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            dealer: {
                name: transaction.tenant.name,
                address: transaction.tenant.address || "",
                phone: transaction.tenant.phone || "",
                email: transaction.tenant.email || ""
            },
            customer: {
                name: salesDraft.customer.name,
                address: salesDraft.customer.address || "",
                phone: salesDraft.customer.phone,
                email: salesDraft.customer.email || undefined
            },
            vehicle: {
                brand: salesDraft.vehicle.variant.model.brand.name,
                model: salesDraft.vehicle.variant.model.name,
                variant: salesDraft.vehicle.variant.name,
                year: salesDraft.vehicle.year,
                color: salesDraft.vehicle.color,
                condition: salesDraft.vehicle.condition as "baru" | "bekas",
                vinNumber: salesDraft.vehicle.vinNumber || undefined
            },
            pricing: {
                vehiclePrice: pricing ? Number(pricing.vehiclePrice) : totalAmount,
                discount: pricing?.discount ? Number(pricing.discount) : undefined,
                adminFee: pricing?.adminFee ? Number(pricing.adminFee) : undefined,
                totalAmount: totalAmount,
                paymentMethod: transaction.paymentMethod as "cash" | "credit"
            },
            paymentStatus,
            paidAmount,
            salesName: salesDraft.sales.name
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
