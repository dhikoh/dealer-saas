import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { vehicleLegalSchema } from "@/lib/validations";

// GET - Get vehicle legal info
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

        // Verify vehicle belongs to tenant
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId
            },
            include: {
                legal: true
            }
        });

        if (!vehicle) {
            return NextResponse.json(
                { error: "Vehicle not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(vehicle.legal);

    } catch (error) {
        console.error("Error fetching vehicle legal:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update vehicle legal info
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

        // Verify vehicle belongs to tenant
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId
            }
        });

        if (!vehicle) {
            return NextResponse.json(
                { error: "Vehicle not found" },
                { status: 404 }
            );
        }

        const body = await request.json();

        // Upsert legal info
        const legal = await prisma.vehicleLegal.upsert({
            where: { vehicleId: id },
            create: {
                vehicleId: id,
                stnkNumber: body.stnkNumber || null,
                stnkExpiry: body.stnkExpiry ? new Date(body.stnkExpiry) : null,
                stnkName: body.stnkName || null,
                bpkbNumber: body.bpkbNumber || null,
                bpkbStatus: body.bpkbStatus || "ada",
                bpkbName: body.bpkbName || null,
                taxExpiry: body.taxExpiry ? new Date(body.taxExpiry) : null,
                legalStatus: body.legalStatus || "lengkap",
                notes: body.notes || null
            },
            update: {
                stnkNumber: body.stnkNumber || null,
                stnkExpiry: body.stnkExpiry ? new Date(body.stnkExpiry) : null,
                stnkName: body.stnkName || null,
                bpkbNumber: body.bpkbNumber || null,
                bpkbStatus: body.bpkbStatus || "ada",
                bpkbName: body.bpkbName || null,
                taxExpiry: body.taxExpiry ? new Date(body.taxExpiry) : null,
                legalStatus: body.legalStatus || "lengkap",
                notes: body.notes || null
            }
        });

        return NextResponse.json(legal);

    } catch (error) {
        console.error("Error updating vehicle legal:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
