import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string, filters?: { type?: string; status?: string; startDate?: Date; endDate?: Date }) {
        const where: any = { tenantId };

        if (filters?.type) where.type = filters.type;
        if (filters?.status) where.status = filters.status;
        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = filters.startDate;
            if (filters.endDate) where.date.lte = filters.endDate;
        }

        return this.prisma.transaction.findMany({
            where,
            include: {
                vehicle: {
                    select: { id: true, make: true, model: true, licensePlate: true, images: true },
                },
                customer: {
                    select: { id: true, name: true, phone: true },
                },
                salesPerson: {
                    select: { id: true, name: true },
                },
                credit: true,
            },
            orderBy: { date: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, tenantId },
            include: {
                vehicle: true,
                customer: true,
                salesPerson: { select: { id: true, name: true, email: true } },
                credit: { include: { payments: true } },
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transaksi tidak ditemukan');
        }

        return transaction;
    }

    async getStats(tenantId: string) {
        const [totalSales, totalPurchases, pendingCount, completedThisMonth] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: { tenantId, type: 'SALE', status: 'PAID' },
                _sum: { finalPrice: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: { tenantId, type: 'PURCHASE', status: 'PAID' },
                _sum: { finalPrice: true },
                _count: true,
            }),
            this.prisma.transaction.count({
                where: { tenantId, status: 'PENDING' },
            }),
            this.prisma.transaction.count({
                where: {
                    tenantId,
                    status: 'PAID',
                    date: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
        ]);

        return {
            totalSalesAmount: totalSales._sum.finalPrice || 0,
            totalSalesCount: totalSales._count,
            totalPurchaseAmount: totalPurchases._sum.finalPrice || 0,
            totalPurchaseCount: totalPurchases._count,
            pendingCount,
            completedThisMonth,
        };
    }

    async create(tenantId: string, salesPersonId: string, data: {
        type: string;
        vehicleId: string;
        customerId: string;
        paymentType: string;
        finalPrice: number;
        notes?: string;
        // Credit fields if paymentType is CREDIT
        creditData?: {
            creditType: string;
            leasingCompany?: string;
            downPayment: number;
            interestRate: number;
            tenorMonths: number;
        };
    }) {
        // Validate vehicle belongs to tenant
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: data.vehicleId, tenantId },
        });
        if (!vehicle) {
            throw new BadRequestException('Kendaraan tidak ditemukan');
        }

        // Validate customer belongs to tenant
        const customer = await this.prisma.customer.findFirst({
            where: { id: data.customerId, tenantId },
        });
        if (!customer) {
            throw new BadRequestException('Customer tidak ditemukan');
        }

        // Create transaction
        const transaction = await this.prisma.transaction.create({
            data: {
                tenantId,
                vehicleId: data.vehicleId,
                customerId: data.customerId,
                salesPersonId,
                type: data.type,
                paymentType: data.paymentType,
                finalPrice: new Decimal(data.finalPrice),
                notes: data.notes,
                status: 'PENDING',
            },
            include: {
                vehicle: { select: { id: true, make: true, model: true } },
                customer: { select: { id: true, name: true } },
            },
        });

        // If credit payment, create credit record
        if (data.paymentType === 'CREDIT' && data.creditData) {
            const cd = data.creditData;
            const totalCredit = data.finalPrice - cd.downPayment;
            const monthlyPayment = (totalCredit * (1 + cd.interestRate / 100)) / cd.tenorMonths;

            await this.prisma.credit.create({
                data: {
                    transactionId: transaction.id,
                    creditType: cd.creditType,
                    leasingCompany: cd.leasingCompany,
                    downPayment: new Decimal(cd.downPayment),
                    totalAmount: new Decimal(totalCredit),
                    interestRate: new Decimal(cd.interestRate),
                    tenorMonths: cd.tenorMonths,
                    monthlyPayment: new Decimal(monthlyPayment),
                    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                },
            });
        }

        // Update vehicle status to BOOKED for sales
        if (data.type === 'SALE') {
            await this.prisma.vehicle.update({
                where: { id: data.vehicleId },
                data: { status: 'BOOKED' },
            });
        }

        return transaction;
    }

    async updateStatus(id: string, tenantId: string, status: string) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, tenantId },
        });

        if (!transaction) {
            throw new NotFoundException('Transaksi tidak ditemukan');
        }

        const updated = await this.prisma.transaction.update({
            where: { id },
            data: { status },
        });

        // If marked as PAID and it's a sale, mark vehicle as SOLD
        if (status === 'PAID' && transaction.type === 'SALE') {
            await this.prisma.vehicle.update({
                where: { id: transaction.vehicleId },
                data: { status: 'SOLD' },
            });
        }

        // If cancelled, revert vehicle to AVAILABLE
        if (status === 'CANCELLED') {
            await this.prisma.vehicle.update({
                where: { id: transaction.vehicleId },
                data: { status: 'AVAILABLE' },
            });
        }

        return updated;
    }

    async delete(id: string, tenantId: string) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, tenantId },
        });

        if (!transaction) {
            throw new NotFoundException('Transaksi tidak ditemukan');
        }

        // Delete associated credit first if exists
        await this.prisma.credit.deleteMany({
            where: { transactionId: id },
        });

        // Delete transaction
        await this.prisma.transaction.delete({
            where: { id },
        });

        // Revert vehicle status
        await this.prisma.vehicle.update({
            where: { id: transaction.vehicleId },
            data: { status: 'AVAILABLE' },
        });

        return { success: true };
    }

    async getMonthlySales(tenantId: string, months: number = 6) {
        const results: { month: string; count: number; revenue: number }[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const monthData = await this.prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'SALE',
                    status: 'PAID',
                    date: { gte: startDate, lte: endDate },
                },
                _sum: { finalPrice: true },
                _count: true,
            });

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            results.push({
                month: monthNames[startDate.getMonth()],
                count: monthData._count,
                revenue: Number(monthData._sum.finalPrice || 0),
            });
        }

        return results;
    }
}
