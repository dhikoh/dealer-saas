import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List transactions
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Only owner and finance can see transactions
        if (!["owner", "finance"].includes(session.user.role)) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: Record<string, unknown> = {
            tenantId: session.user.tenantId
        };

        if (status && status !== "all") {
            where.status = status;
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true
                        }
                    },
                    vehicle: {
                        select: {
                            id: true,
                            stockCode: true,
                            year: true,
                            color: true,
                            variant: {
                                select: {
                                    name: true,
                                    model: {
                                        select: {
                                            name: true,
                                            brand: {
                                                select: { name: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    sales: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    leasingPartner: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { transactionDate: "desc" },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.transaction.count({ where })
        ]);

        return NextResponse.json({
            transactions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
