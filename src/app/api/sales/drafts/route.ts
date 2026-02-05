import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { salesDraftSchema } from "@/lib/validations";

// GET - List sales drafts
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const salesId = searchParams.get("salesId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        // Build where clause with tenant isolation
        const where: Record<string, unknown> = {
            tenantId: session.user.tenantId
        };

        // Sales can only see their own drafts, owner/finance can see all
        if (session.user.role === "sales") {
            where.salesId = session.user.id;
        } else if (salesId) {
            where.salesId = salesId;
        }

        if (status && status !== "all") {
            where.status = status;
        }

        const [drafts, total] = await Promise.all([
            prisma.salesDraft.findMany({
                where,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true
                        }
                    },
                    vehicle: {
                        select: {
                            id: true,
                            stockCode: true,
                            year: true,
                            color: true,
                            sellingPrice: true,
                            variant: {
                                select: {
                                    name: true,
                                    model: {
                                        select: {
                                            name: true,
                                            brand: {
                                                select: { name: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    sales: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    pricing: {
                        select: {
                            paymentMethod: true,
                            totalAmount: true
                        }
                    }
                },
                orderBy: { updatedAt: "desc" },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.salesDraft.count({ where })
        ]);

        return NextResponse.json({
            drafts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching sales drafts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create sales draft
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Only sales and owner can create drafts
        if (!["owner", "sales"].includes(session.user.role)) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate input
        const validationResult = salesDraftSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Verify customer exists and belongs to tenant
        const customer = await prisma.customer.findFirst({
            where: {
                id: data.customerId,
                tenantId: session.user.tenantId
            }
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer tidak ditemukan" },
                { status: 404 }
            );
        }

        // Verify vehicle exists and belongs to tenant
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id: data.vehicleId,
                tenantId: session.user.tenantId
            }
        });

        if (!vehicle) {
            return NextResponse.json(
                { error: "Kendaraan tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if vehicle is available (not in active transaction)
        if (vehicle.status !== "available" && vehicle.status !== "reserved") {
            return NextResponse.json(
                { error: "Kendaraan tidak tersedia untuk dijual" },
                { status: 400 }
            );
        }

        // Create sales draft with pricing
        const draft = await prisma.salesDraft.create({
            data: {
                tenantId: session.user.tenantId,
                customerId: data.customerId,
                vehicleId: data.vehicleId,
                salesId: session.user.id,
                status: "draft",
                notes: data.notes,
                pricing: data.pricing ? {
                    create: {
                        paymentMethod: data.pricing.paymentMethod,
                        vehiclePrice: data.pricing.vehiclePrice,
                        discount: data.pricing.discount,
                        downPayment: data.pricing.downPayment,
                        tenor: data.pricing.tenor,
                        interestRate: data.pricing.interestRate,
                        monthlyPayment: data.pricing.monthlyPayment,
                        adminFee: data.pricing.adminFee,
                        insuranceFee: data.pricing.insuranceFee,
                        totalAmount: data.pricing.totalAmount,
                        leasingPartnerId: data.pricing.leasingPartnerId
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

        return NextResponse.json(draft, { status: 201 });

    } catch (error) {
        console.error("Error creating sales draft:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
