import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List commissions
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const salesId = searchParams.get("salesId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const where: Record<string, unknown> = {
            tenantId: session.user.tenantId
        };

        // Sales can only see their own commissions
        if (session.user.role === "sales") {
            where.salesId = session.user.id;
        } else if (salesId) {
            where.salesId = salesId;
        }

        if (status && status !== "all") {
            where.status = status;
        }

        const [commissions, total] = await Promise.all([
            prisma.commission.findMany({
                where,
                include: {
                    sales: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    transaction: {
                        select: {
                            id: true,
                            transactionDate: true,
                            totalAmount: true,
                            vehicle: {
                                select: {
                                    stockCode: true,
                                    variant: {
                                        select: {
                                            model: {
                                                select: {
                                                    name: true,
                                                    brand: { select: { name: true } }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            customer: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.commission.count({ where })
        ]);

        // Calculate totals
        const totals = await prisma.commission.groupBy({
            by: ["status"],
            where: {
                tenantId: session.user.tenantId,
                ...(session.user.role === "sales" ? { salesId: session.user.id } : {})
            },
            _sum: {
                amount: true
            }
        });

        const totalPending = totals.find(t => t.status === "pending")?._sum.amount || 0;
        const totalPaid = totals.find(t => t.status === "paid")?._sum.amount || 0;

        return NextResponse.json({
            commissions,
            totals: {
                pending: Number(totalPending),
                paid: Number(totalPaid)
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching commissions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
