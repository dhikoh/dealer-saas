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

        // Build where clause through transaction relation
        const whereTransaction: Record<string, unknown> = {
            tenantId: session.user.tenantId
        };

        const whereCommission: Record<string, unknown> = {
            transaction: {
                tenantId: session.user.tenantId
            }
        };

        // Sales can only see their own commissions
        if (session.user.role === "sales") {
            whereCommission.salesUserId = session.user.id;
        } else if (salesId) {
            whereCommission.salesUserId = salesId;
        }

        if (status && status !== "all") {
            whereCommission.payoutStatus = status;
        }

        const [commissions, total] = await Promise.all([
            prisma.salesCommission.findMany({
                where: whereCommission,
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
                            salesDraft: {
                                select: {
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
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.salesCommission.count({ where: whereCommission })
        ]);

        // Calculate totals
        const totals = await prisma.salesCommission.groupBy({
            by: ["payoutStatus"],
            where: {
                ...(session.user.role === "sales" ? { salesUserId: session.user.id } : {}),
                transaction: {
                    tenantId: session.user.tenantId
                }
            },
            _sum: {
                amount: true
            }
        });

        const totalPending = totals.find(t => t.payoutStatus === "pending")?._sum.amount || 0;
        const totalPaid = totals.find(t => t.payoutStatus === "paid")?._sum.amount || 0;

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
