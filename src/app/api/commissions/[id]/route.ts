import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT - Update commission status (payout)
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

        // Only owner and finance can update payout
        if (!["owner", "finance"].includes(session.user.role)) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();

        const commission = await prisma.salesCommission.findFirst({
            where: {
                id,
                transaction: {
                    tenantId: session.user.tenantId
                }
            }
        });

        if (!commission) {
            return NextResponse.json(
                { error: "Commission not found" },
                { status: 404 }
            );
        }

        const updated = await prisma.salesCommission.update({
            where: { id },
            data: {
                payoutStatus: body.status,
                paidAt: body.status === "paid" ? new Date() : null,
                notes: body.notes || commission.notes
            }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error("Error updating commission:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
