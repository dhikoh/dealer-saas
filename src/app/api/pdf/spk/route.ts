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
                        pricing: {
                            include: {
                                leasingPartner: true
                            }
                        }
                    }
                }
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
            "SPK",
            transaction.tenant.slug.toUpperCase().slice(0, 3),
            count
        );

        const pricing = salesDraft.pricing;

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
                name: salesDraft.customer.name,
                address: salesDraft.customer.address || "",
                phone: salesDraft.customer.phone,
                nik: salesDraft.customer.nik || undefined
            },
            vehicle: {
                brand: salesDraft.vehicle.variant.model.brand.name,
                model: salesDraft.vehicle.variant.model.name,
                variant: salesDraft.vehicle.variant.name,
                year: salesDraft.vehicle.year,
                color: salesDraft.vehicle.color,
                condition: salesDraft.vehicle.condition as "baru" | "bekas",
                vinNumber: salesDraft.vehicle.vinNumber || undefined,
                engineNumber: salesDraft.vehicle.engineNumber || undefined,
                plateNumber: salesDraft.vehicle.plateNumber || undefined
            },
            pricing: {
                vehiclePrice: pricing ? Number(pricing.vehiclePrice) : Number(transaction.totalAmount),
                discount: pricing?.discount ? Number(pricing.discount) : undefined,
                downPayment: pricing?.downPayment ? Number(pricing.downPayment) : undefined,
                tenor: pricing?.tenor || undefined,
                monthlyPayment: pricing?.monthlyPayment ? Number(pricing.monthlyPayment) : undefined,
                totalAmount: Number(transaction.totalAmount),
                paymentMethod: transaction.paymentMethod as "cash" | "credit",
                leasingPartner: pricing?.leasingPartner?.name || undefined
            },
            deliveryDate: transaction.completedAt || undefined,
            salesName: salesDraft.sales.name
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
