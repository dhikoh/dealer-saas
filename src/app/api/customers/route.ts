import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List customers
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
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: Record<string, unknown> = {
            tenantId: session.user.tenantId
        };

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } }
            ];
        }

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    address: true,
                    createdAt: true
                },
                orderBy: { name: "asc" },
                take: limit,
                skip: (page - 1) * limit
            }),
            prisma.customer.count({ where })
        ]);

        return NextResponse.json({
            customers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create customer
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        const customer = await prisma.customer.create({
            data: {
                tenantId: session.user.tenantId,
                name: body.name,
                phone: body.phone,
                email: body.email || null,
                address: body.address || null,
                nik: body.nik || null,
                birthDate: body.birthDate ? new Date(body.birthDate) : null,
                gender: body.gender || null,
                job: body.job || null,
                source: body.source || null,
                notes: body.notes || null
            }
        });

        return NextResponse.json(customer, { status: 201 });

    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
