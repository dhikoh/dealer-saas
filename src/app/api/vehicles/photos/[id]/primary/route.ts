import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT - Set photo as primary
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

        // Find photo with vehicle access check
        const photo = await prisma.vehiclePhoto.findFirst({
            where: { id },
            include: {
                vehicle: {
                    select: { tenantId: true }
                }
            }
        });

        if (!photo) {
            return NextResponse.json(
                { error: "Photo not found" },
                { status: 404 }
            );
        }

        if (photo.vehicle.tenantId !== session.user.tenantId) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        // Unset all other photos as primary
        await prisma.vehiclePhoto.updateMany({
            where: {
                vehicleId: photo.vehicleId,
                isPrimary: true
            },
            data: { isPrimary: false }
        });

        // Set this photo as primary
        await prisma.vehiclePhoto.update({
            where: { id },
            data: { isPrimary: true }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error setting primary photo:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
