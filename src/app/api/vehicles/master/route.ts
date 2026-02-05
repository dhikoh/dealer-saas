import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get master data (brands, models, variants)
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const tenantId = session.user.tenantId;

        // Fetch brands (global + tenant-specific)
        const brands = await prisma.vehicleBrand.findMany({
            where: {
                OR: [
                    { scope: "global" },
                    { tenantId: tenantId || undefined }
                ]
            },
            orderBy: { name: "asc" }
        });

        // Fetch models (global + tenant-specific)
        const models = await prisma.vehicleModel.findMany({
            where: {
                OR: [
                    { scope: "global" },
                    { tenantId: tenantId || undefined }
                ]
            },
            include: {
                brand: true
            },
            orderBy: { name: "asc" }
        });

        // Fetch variants (global + tenant-specific)
        const variants = await prisma.vehicleVariant.findMany({
            where: {
                OR: [
                    { scope: "global" },
                    { tenantId: tenantId || undefined }
                ]
            },
            include: {
                model: {
                    include: {
                        brand: true
                    }
                }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({
            brands,
            models: models.map(m => ({
                id: m.id,
                name: m.name,
                brandId: m.brandId,
                category: m.category
            })),
            variants: variants.map(v => ({
                id: v.id,
                name: v.name,
                modelId: v.modelId,
                engineCc: v.engineCc,
                transmission: v.transmission,
                fuelType: v.fuelType
            }))
        });

    } catch (error) {
        console.error("Error fetching master data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create new brand/model/variant (for future use)
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Only owner can add master data
        if (session.user.role !== "owner") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { type, data } = body;

        let result;

        switch (type) {
            case "brand":
                result = await prisma.vehicleBrand.create({
                    data: {
                        name: data.name,
                        scope: "tenant",
                        tenantId: session.user.tenantId
                    }
                });
                break;

            case "model":
                result = await prisma.vehicleModel.create({
                    data: {
                        brandId: data.brandId,
                        name: data.name,
                        category: data.category || "motor",
                        scope: "tenant",
                        tenantId: session.user.tenantId
                    }
                });
                break;

            case "variant":
                result = await prisma.vehicleVariant.create({
                    data: {
                        modelId: data.modelId,
                        name: data.name,
                        engineCc: data.engineCc,
                        transmission: data.transmission,
                        fuelType: data.fuelType || "bensin",
                        scope: "tenant",
                        tenantId: session.user.tenantId
                    }
                });
                break;

            default:
                return NextResponse.json(
                    { error: "Invalid type" },
                    { status: 400 }
                );
        }

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error("Error creating master data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
