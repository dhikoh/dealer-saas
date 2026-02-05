import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";

// GET - List vehicles for tenant
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized - No tenant access" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        // Build where clause with tenant isolation
        const where: Record<string, unknown> = {
            tenantId: session.user.tenantId
        };

        if (status && status !== "all") {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { stockCode: { contains: search } },
                { plateNumber: { contains: search } },
                { vinNumber: { contains: search } },
                { variant: { name: { contains: search } } },
                { variant: { model: { name: { contains: search } } } }
            ];
        }

        const [vehicles, total] = await Promise.all([
            prisma.vehicle.findMany({
                where,
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
                    },
                    legal: {
                        select: {
                            legalStatus: true,
                            stnkExpiry: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.vehicle.count({ where })
        ]);

        return NextResponse.json({
            vehicles,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create new vehicle
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized - No tenant access" },
                { status: 401 }
            );
        }

        // Check role (only owner and sales can add vehicles)
        if (!["owner", "sales", "staff"].includes(session.user.role)) {
            return NextResponse.json(
                { error: "Forbidden - Insufficient permissions" },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate input
        const validationResult = vehicleSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Verify variant exists and is accessible
        const variant = await prisma.vehicleVariant.findFirst({
            where: {
                id: data.variantId,
                OR: [
                    { scope: "global" },
                    { tenantId: session.user.tenantId }
                ]
            }
        });

        if (!variant) {
            return NextResponse.json(
                { error: "Vehicle variant not found" },
                { status: 404 }
            );
        }

        // Create vehicle
        const vehicle = await prisma.vehicle.create({
            data: {
                tenantId: session.user.tenantId,
                variantId: data.variantId,
                stockCode: data.stockCode,
                year: data.year,
                color: data.color,
                condition: data.condition,
                vinNumber: data.vinNumber,
                engineNumber: data.engineNumber,
                plateNumber: data.plateNumber,
                purchasePrice: data.purchasePrice,
                sellingPrice: data.sellingPrice,
                status: data.status || "available",
                notes: data.notes
            },
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
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                tenantId: session.user.tenantId,
                userId: session.user.id,
                action: "create",
                entity: "vehicle",
                entityId: vehicle.id,
                newValue: JSON.stringify(vehicle)
            }
        });

        return NextResponse.json(vehicle, { status: 201 });

    } catch (error) {
        console.error("Error creating vehicle:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
