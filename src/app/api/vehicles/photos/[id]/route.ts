import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

// DELETE - Delete a photo
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

        // Delete file from disk
        try {
            const filePath = path.join(process.cwd(), "public", photo.filePath);
            await unlink(filePath);
        } catch (err) {
            console.error("Error deleting file:", err);
            // Continue even if file doesn't exist
        }

        // Delete database record
        await prisma.vehiclePhoto.delete({
            where: { id }
        });

        // If this was primary, set another photo as primary
        if (photo.isPrimary) {
            const nextPhoto = await prisma.vehiclePhoto.findFirst({
                where: { vehicleId: photo.vehicleId },
                orderBy: { sortOrder: "asc" }
            });

            if (nextPhoto) {
                await prisma.vehiclePhoto.update({
                    where: { id: nextPhoto.id },
                    data: { isPrimary: true }
                });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting photo:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
