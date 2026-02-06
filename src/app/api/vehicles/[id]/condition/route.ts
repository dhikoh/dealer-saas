import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Get vehicle condition
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
                vehicleCondition: true
            }
        });

        if (!vehicle) {
            return NextResponse.json(
                { error: "Vehicle not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(vehicle.vehicleCondition);

    } catch (error) {
        console.error("Error fetching vehicle condition:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT - Update vehicle condition
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

        const condition = await prisma.vehicleCondition.upsert({
            where: { vehicleId: id },
            create: {
                vehicleId: id,
                mileage: body.mileage || null,
                engineCondition: body.engineCondition || null,
                bodyCondition: body.bodyCondition || null,
                interiorCondition: body.interiorCondition || null,
                electricalCondition: body.electricalCondition || null,
                tireCondition: body.tireCondition || null,
                serviceHistory: body.serviceHistory || false,
                repairNotes: body.repairNotes || null,
                grade: body.grade || null
            },
            update: {
                mileage: body.mileage || null,
                engineCondition: body.engineCondition || null,
                bodyCondition: body.bodyCondition || null,
                interiorCondition: body.interiorCondition || null,
                electricalCondition: body.electricalCondition || null,
                tireCondition: body.tireCondition || null,
                serviceHistory: body.serviceHistory || false,
                repairNotes: body.repairNotes || null,
                grade: body.grade || null
            }
        });

        return NextResponse.json(condition);

    } catch (error) {
        console.error("Error updating vehicle condition:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
