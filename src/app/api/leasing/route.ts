import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List leasing partners
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const partners = await prisma.leasingPartner.findMany({
            where: {
                tenantId: session.user.tenantId,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                code: true,
                picName: true,
                picPhone: true
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json({ partners });

    } catch (error) {
        console.error("Error fetching leasing partners:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
