import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";

// GET - Get single vehicle by ID
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

        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId
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
                },
                photos: {
                    orderBy: { sortOrder: "asc" }
                },
                legal: true,
                vehicleCondition: true,
                accessories: true,
                internalNotes: {
                    include: {
                        user: {
                            select: { name: true }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!vehicle) {
            return NextResponse.json(
                { error: "Kendaraan tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json(vehicle);

    } catch (error) {
        console.error("Error fetching vehicle:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update vehicle
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

        // Check role
        if (!["owner", "sales", "staff"].includes(session.user.role)) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        // Verify vehicle exists and belongs to tenant
        const existing = await prisma.vehicle.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId
            }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Kendaraan tidak ditemukan" },
                { status: 404 }
            );
        }

        const body = await request.json();

        // Validate input
        const validationResult = vehicleSchema.partial().safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Update vehicle
        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: {
                ...(data.variantId && { variantId: data.variantId }),
                ...(data.stockCode && { stockCode: data.stockCode }),
                ...(data.year && { year: data.year }),
                ...(data.color && { color: data.color }),
                ...(data.condition && { condition: data.condition }),
                ...(data.vinNumber !== undefined && { vinNumber: data.vinNumber }),
                ...(data.engineNumber !== undefined && { engineNumber: data.engineNumber }),
                ...(data.plateNumber !== undefined && { plateNumber: data.plateNumber }),
                ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
                ...(data.sellingPrice && { sellingPrice: data.sellingPrice }),
                ...(data.status && { status: data.status }),
                ...(data.notes !== undefined && { notes: data.notes })
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
                action: "update",
                entity: "vehicle",
                entityId: id,
                oldValue: JSON.stringify(existing),
                newValue: JSON.stringify(vehicle)
            }
        });

        return NextResponse.json(vehicle);

    } catch (error) {
        console.error("Error updating vehicle:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete vehicle
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

        // Only owner can delete
        if (session.user.role !== "owner") {
            return NextResponse.json(
                { error: "Forbidden - Only owner can delete vehicles" },
                { status: 403 }
            );
        }

        // Verify vehicle exists and belongs to tenant
        const existing = await prisma.vehicle.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId
            }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Kendaraan tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if vehicle is in any active transaction
        const activeTransaction = await prisma.transaction.findFirst({
            where: {
                salesDraft: {
                    vehicleId: id
                },
                status: { in: ["pending", "approved", "processing"] }
            }
        });

        if (activeTransaction) {
            return NextResponse.json(
                { error: "Tidak dapat menghapus kendaraan yang sedang dalam transaksi aktif" },
                { status: 400 }
            );
        }

        // Delete vehicle (cascade will handle related records)
        await prisma.vehicle.delete({
            where: { id }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                tenantId: session.user.tenantId,
                userId: session.user.id,
                action: "delete",
                entity: "vehicle",
                entityId: id,
                oldValue: JSON.stringify(existing)
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting vehicle:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
