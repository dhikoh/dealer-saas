import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CreditService {
    constructor(private prisma: PrismaService) { }

    // ==================== CREDIT SIMULATION ====================

    simulateCredit(params: {
        vehiclePrice: number;
        downPayment: number;
        interestRatePerYear: number;
        tenorMonths: number;
    }) {
        const { vehiclePrice, downPayment, interestRatePerYear, tenorMonths } = params;

        const loanAmount = vehiclePrice - downPayment;
        const monthlyInterestRate = interestRatePerYear / 100 / 12;

        // Calculate monthly payment using amortization formula
        let monthlyPayment: number;
        if (monthlyInterestRate === 0) {
            monthlyPayment = loanAmount / tenorMonths;
        } else {
            monthlyPayment = loanAmount *
                (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenorMonths)) /
                (Math.pow(1 + monthlyInterestRate, tenorMonths) - 1);
        }

        const totalPayment = monthlyPayment * tenorMonths;
        const totalInterest = totalPayment - loanAmount;

        return {
            vehiclePrice,
            downPayment,
            loanAmount,
            interestRatePerYear,
            tenorMonths,
            monthlyPayment: Math.round(monthlyPayment),
            totalPayment: Math.round(totalPayment),
            totalInterest: Math.round(totalInterest),
        };
    }

    // Generate simulation table for multiple tenors
    generateSimulationTable(vehiclePrice: number, downPayment: number, interestRate: number) {
        const tenors = [6, 12, 24, 36, 48, 60];
        return tenors.map(tenor => this.simulateCredit({
            vehiclePrice,
            downPayment,
            interestRatePerYear: interestRate,
            tenorMonths: tenor,
        }));
    }

    // ==================== CREDIT CRUD ====================

    async findAllByTenant(tenantId: string) {
        return this.prisma.credit.findMany({
            where: {
                transaction: { tenantId },
            },
            include: {
                transaction: {
                    include: {
                        vehicle: true,
                        customer: true,
                    },
                },
                payments: {
                    orderBy: { month: 'desc' },
                    take: 3,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        // SECURITY: Use findFirst with tenantId filter via transaction relation
        // Never use findUnique({ id }) alone for tenant-scoped models (IDOR risk)
        const credit = await this.prisma.credit.findFirst({
            where: {
                id,
                transaction: { tenantId },
            },
            include: {
                transaction: {
                    include: {
                        vehicle: true,
                        customer: true,
                    },
                },
                payments: {
                    orderBy: { month: 'asc' },
                },
            },
        });

        if (!credit) {
            throw new NotFoundException('Data kredit tidak ditemukan');
        }

        return credit;
    }

    async create(transactionId: string, data: {
        downPayment: number;
        totalAmount: number;
        interestRate: number;
        tenorMonths: number;
        monthlyPayment: number;
    }, tenantId: string) {
        // SECURITY: Always verify transaction belongs to tenant (mandatory)
        const transaction = await this.prisma.transaction.findFirst({
            where: { id: transactionId, tenantId },
        });
        if (!transaction) {
            throw new NotFoundException('Transaksi tidak ditemukan');
        }

        return this.prisma.credit.create({
            data: {
                transactionId,
                downPayment: new Decimal(data.downPayment),
                totalAmount: new Decimal(data.totalAmount),
                interestRate: new Decimal(data.interestRate),
                tenorMonths: data.tenorMonths,
                monthlyPayment: new Decimal(data.monthlyPayment),
            },
        });
    }

    async addPayment(creditId: string, tenantId: string, month: number, amount: number, paidAt: Date, status: string = 'PAID') {
        // SECURITY: Verify credit → transaction → tenant chain using findFirst
        const credit = await this.prisma.credit.findFirst({
            where: {
                id: creditId,
                transaction: { tenantId },
            },
            include: {
                transaction: { select: { tenantId: true, id: true } },
                payments: { select: { id: true } },
            },
        });
        if (!credit) {
            throw new NotFoundException('Data kredit tidak ditemukan');
        }

        const payment = await this.prisma.creditPayment.create({
            data: {
                creditId,
                month,
                amount: new Decimal(amount),
                paidAt,
                status,
            },
        });

        // Update credit: advance nextDueDate and check completion
        const paidCount = credit.payments.length + 1; // +1 for the payment we just created
        const isCompleted = paidCount >= credit.tenorMonths;

        await this.prisma.credit.update({
            where: { id: creditId },
            data: {
                nextDueDate: isCompleted
                    ? null
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: isCompleted ? 'COMPLETED' : 'ACTIVE',
            },
        });

        // If completed, also update parent transaction paymentStatus
        if (isCompleted) {
            await this.prisma.transaction.update({
                where: { id: credit.transaction.id },
                data: { paymentStatus: 'PAID', status: 'COMPLETED' },
            });
        }

        return payment;
    }

    // Get overdue payments (cicilan yang belum dibayar)
    async getOverdueCredits(tenantId: string) {
        const now = new Date();
        const credits = await this.prisma.credit.findMany({
            where: {
                status: 'ACTIVE',
                transaction: { tenantId },
                // Use nextDueDate for accurate overdue detection
                OR: [
                    { nextDueDate: { lt: now } },
                    { nextDueDate: null }, // fallback: check manually for old data
                ],
            },
            include: {
                transaction: {
                    include: { customer: true, vehicle: true },
                },
                payments: true,
            },
        });

        // For credits with nextDueDate, they're already overdue (filtered above).
        // For credits without, use fallback logic.
        return credits.filter(credit => {
            if (credit.nextDueDate) return true; // Already filtered by query
            // Fallback: approximate check for old data missing nextDueDate
            const paidMonths = credit.payments.length;
            const monthsSinceStart = Math.floor(
                (now.getTime() - credit.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
            );
            return monthsSinceStart > paidMonths;
        });
    }
}
