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
        // SECURITY: Verify credit belongs to tenant via transaction chain
        const credit = await this.prisma.credit.findUnique({
            where: { id },
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

        if (!credit || credit.transaction.tenantId !== tenantId) {
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
    }, tenantId?: string) {
        // SECURITY: Verify transaction belongs to tenant
        if (tenantId) {
            const transaction = await this.prisma.transaction.findFirst({
                where: { id: transactionId, tenantId },
            });
            if (!transaction) {
                throw new NotFoundException('Transaksi tidak ditemukan');
            }
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
        // SECURITY: Verify credit → transaction → tenant chain
        const credit = await this.prisma.credit.findUnique({
            where: { id: creditId },
            include: { transaction: { select: { tenantId: true } } },
        });
        if (!credit || credit.transaction.tenantId !== tenantId) {
            throw new NotFoundException('Data kredit tidak ditemukan');
        }
        return this.prisma.creditPayment.create({
            data: {
                creditId,
                month,
                amount: new Decimal(amount),
                paidAt,
                status,
            },
        });
    }

    // Get overdue payments (cicilan yang belum dibayar)
    async getOverdueCredits(tenantId: string) {
        const credits = await this.prisma.credit.findMany({
            where: {
                status: 'ACTIVE',
                transaction: { tenantId },
            },
            include: {
                transaction: {
                    include: { customer: true, vehicle: true },
                },
                payments: true,
            },
        });

        // Filter credits that have missed payments
        const now = new Date();
        return credits.filter(credit => {
            const paidMonths = credit.payments.length;
            const monthsSinceStart = Math.floor(
                (now.getTime() - credit.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
            );
            return monthsSinceStart > paidMonths;
        });
    }
}
