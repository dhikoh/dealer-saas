import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    generateQuotation,
    generateDocumentNumber,
    QuotationData
} from "@/lib/pdf";

// POST - Generate Quotation PDF
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
        const { salesDraftId } = body;

        if (!salesDraftId) {
            return NextResponse.json(
                { error: "Sales draft ID required" },
                { status: 400 }
            );
        }

        // Fetch sales draft with all related data
        const draft = await prisma.salesDraft.findFirst({
            where: {
                id: salesDraftId,
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
                pricing: {
                    include: {
                        leasingPartner: true
                    }
                },
                sales: true,
                tenant: true
            }
        });

        if (!draft) {
            return NextResponse.json(
                { error: "Sales draft not found" },
                { status: 404 }
            );
        }

        if (!draft.pricing) {
            return NextResponse.json(
                { error: "Pricing data not found" },
                { status: 400 }
            );
        }

        // Generate document number
        const count = await prisma.salesDraft.count({
            where: {
                tenantId: session.user.tenantId,
                status: { in: ["quoted", "submitted", "approved"] }
            }
        });

        const documentNumber = generateDocumentNumber(
            "QUO",
            draft.tenant.slug.toUpperCase().slice(0, 3),
            count + 1
        );

        // Build quotation data
        const quotationData: QuotationData = {
            number: documentNumber,
            date: new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            dealer: {
                name: draft.tenant.name,
                address: draft.tenant.address || "",
                phone: draft.tenant.phone || "",
                email: draft.tenant.email || "",
                npwp: draft.tenant.npwp || undefined
            },
            customer: {
                name: draft.customer?.name || "Customer",
                address: draft.customer?.address || "",
                phone: draft.customer?.phone || "",
                email: draft.customer?.email || undefined
            },
            vehicle: {
                brand: draft.vehicle.variant.model.brand.name,
                model: draft.vehicle.variant.model.name,
                variant: draft.vehicle.variant.name,
                year: draft.vehicle.year,
                color: draft.vehicle.color,
                condition: draft.vehicle.condition as "baru" | "bekas",
                vinNumber: draft.vehicle.vinNumber || undefined,
                plateNumber: draft.vehicle.plateNumber || undefined
            },
            pricing: {
                vehiclePrice: Number(draft.pricing.vehiclePrice),
                discount: draft.pricing.discount ? Number(draft.pricing.discount) : undefined,
                downPayment: draft.pricing.downPayment ? Number(draft.pricing.downPayment) : undefined,
                tenor: draft.pricing.tenor || undefined,
                monthlyPayment: draft.pricing.monthlyPayment ? Number(draft.pricing.monthlyPayment) : undefined,
                adminFee: draft.pricing.adminFee ? Number(draft.pricing.adminFee) : undefined,
                insuranceFee: draft.pricing.insuranceFee ? Number(draft.pricing.insuranceFee) : undefined,
                totalAmount: Number(draft.pricing.totalAmount),
                paymentMethod: draft.pricing.paymentMethod as "cash" | "credit",
                leasingPartner: draft.pricing.leasingPartner?.name || undefined
            },
            notes: draft.notes || undefined,
            salesName: draft.sales.name,
            salesPhone: undefined
        };

        // Generate PDF HTML
        const { html, fileName } = generateQuotation(quotationData);

        // Update draft status to quoted
        await prisma.salesDraft.update({
            where: { id: salesDraftId },
            data: { status: "quoted" }
        });

        // Return HTML for client-side PDF generation or download
        return NextResponse.json({
            html,
            fileName,
            documentNumber
        });

    } catch (error) {
        console.error("Error generating quotation:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
