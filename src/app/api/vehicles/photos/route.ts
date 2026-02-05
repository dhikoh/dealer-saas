import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// POST - Upload vehicle photos
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const vehicleId = formData.get("vehicleId") as string;
        const files = formData.getAll("photos") as File[];
        const category = (formData.get("category") as string) || "exterior";

        if (!vehicleId) {
            return NextResponse.json(
                { error: "Vehicle ID required" },
                { status: 400 }
            );
        }

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "No files uploaded" },
                { status: 400 }
            );
        }

        // Verify vehicle exists and belongs to tenant
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                tenantId: session.user.tenantId
            }
        });

        if (!vehicle) {
            return NextResponse.json(
                { error: "Vehicle not found" },
                { status: 404 }
            );
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), "public", "uploads", "vehicles", vehicleId);
        await mkdir(uploadDir, { recursive: true });

        // Check existing photo count
        const existingCount = await prisma.vehiclePhoto.count({
            where: { vehicleId }
        });

        const photos = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate file type
            if (!file.type.startsWith("image/")) {
                continue;
            }

            // Generate unique filename
            const ext = file.name.split(".").pop() || "jpg";
            const filename = `${uuidv4()}.${ext}`;
            const filePath = path.join(uploadDir, filename);

            // Save file
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filePath, buffer);

            // Create database record
            const photo = await prisma.vehiclePhoto.create({
                data: {
                    vehicleId,
                    filePath: `/uploads/vehicles/${vehicleId}/${filename}`,
                    category,
                    isPrimary: existingCount === 0 && i === 0, // First photo is primary
                    sortOrder: existingCount + i
                }
            });

            photos.push(photo);
        }

        return NextResponse.json({ photos }, { status: 201 });

    } catch (error) {
        console.error("Error uploading photos:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
