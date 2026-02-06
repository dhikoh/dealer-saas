import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get single sales draft
export async function GET(
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

        const draft = await prisma.salesDraft.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
                // Sales can only see their own drafts
                ...(session.user.role === "sales" ? { salesId: session.user.id } : {})
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
                        },
                        photos: {
                            where: { isPrimary: true },
                            take: 1
                        }
                    }
                },
                sales: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                pricing: {
                    include: {
                        leasingPartner: true
                    }
                }
            }
        });

        if (!draft) {
            return NextResponse.json(
                { error: "Draft tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json(draft);

    } catch (error) {
        console.error("Error fetching sales draft:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update sales draft
export async function PUT(
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

        // Verify draft exists and user has access
        const existing = await prisma.salesDraft.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
                ...(session.user.role === "sales" ? { salesId: session.user.id } : {})
            }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Draft tidak ditemukan" },
                { status: 404 }
            );
        }

        // Cannot update if already converted to transaction
        if (existing.status === "converted") {
            return NextResponse.json(
                { error: "Draft sudah dikonversi ke transaksi" },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Update draft and pricing
        const draft = await prisma.salesDraft.update({
            where: { id },
            data: {
                ...(body.customerId && { customerId: body.customerId }),
                ...(body.vehicleId && { vehicleId: body.vehicleId }),
                ...(body.status && { status: body.status }),
                ...(body.notes !== undefined && { notes: body.notes }),
                pricing: body.pricing ? {
                    upsert: {
                        create: {
                            paymentType: body.pricing.paymentMethod,
                            vehiclePrice: body.pricing.vehiclePrice,
                            discount: body.pricing.discount,
                            netPrice: body.pricing.totalAmount,
                            downPayment: body.pricing.downPayment,
                            tenor: body.pricing.tenor,
                            interestRate: body.pricing.interestRate,
                            monthlyPayment: body.pricing.monthlyPayment,
                            adminFee: body.pricing.adminFee,
                            insuranceFee: body.pricing.insuranceFee,
                            leasingPartnerId: body.pricing.leasingPartnerId
                        },
                        update: {
                            paymentType: body.pricing.paymentMethod,
                            vehiclePrice: body.pricing.vehiclePrice,
                            discount: body.pricing.discount,
                            netPrice: body.pricing.totalAmount,
                            downPayment: body.pricing.downPayment,
                            tenor: body.pricing.tenor,
                            interestRate: body.pricing.interestRate,
                            monthlyPayment: body.pricing.monthlyPayment,
                            adminFee: body.pricing.adminFee,
                            insuranceFee: body.pricing.insuranceFee,
                            leasingPartnerId: body.pricing.leasingPartnerId
                        }
                    }
                } : undefined
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
                pricing: true
            }
        });

        return NextResponse.json(draft);

    } catch (error) {
        console.error("Error updating sales draft:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete/Cancel sales draft
export async function DELETE(
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

        // Verify draft exists
        const existing = await prisma.salesDraft.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
                ...(session.user.role === "sales" ? { salesId: session.user.id } : {})
            }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Draft tidak ditemukan" },
                { status: 404 }
            );
        }

        // Cannot delete if converted
        if (existing.status === "converted") {
            return NextResponse.json(
                { error: "Draft sudah dikonversi ke transaksi" },
                { status: 400 }
            );
        }

        // Soft delete - change status to cancelled
        await prisma.salesDraft.update({
            where: { id },
            data: { status: "cancelled" }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting sales draft:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
