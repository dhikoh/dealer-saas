import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReminderService {
    constructor(private prisma: PrismaService) { }

    // ==================== TAX EXPIRY REMINDERS ====================

    async getTaxExpiringVehicles(tenantId: string, daysAhead: number = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        return this.prisma.vehicle.findMany({
            where: {
                tenantId,
                status: { not: 'SOLD' },
                stnkExpiry: {
                    lte: futureDate,
                    gte: new Date(),
                },
            },
            orderBy: { stnkExpiry: 'asc' },
            select: {
                id: true,
                licensePlate: true,
                make: true,
                model: true,
                year: true,
                stnkExpiry: true,
            },
        });
    }

    // Get already expired
    async getExpiredTaxVehicles(tenantId: string) {
        return this.prisma.vehicle.findMany({
            where: {
                tenantId,
                status: { not: 'SOLD' },
                stnkExpiry: {
                    lt: new Date(),
                },
            },
            orderBy: { stnkExpiry: 'asc' },
            select: {
                id: true,
                licensePlate: true,
                make: true,
                model: true,
                year: true,
                stnkExpiry: true,
            },
        });
    }

    // ==================== CREDIT PAYMENT REMINDERS ====================

    async getCreditDueReminders(tenantId: string, daysAhead: number = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        return this.prisma.credit.findMany({
            where: {
                status: 'ACTIVE',
                nextDueDate: {
                    lte: futureDate,
                    gte: new Date(),
                },
                transaction: { tenantId },
            },
            include: {
                transaction: {
                    include: {
                        customer: {
                            select: { name: true, phone: true },
                        },
                        vehicle: {
                            select: { make: true, model: true, licensePlate: true },
                        },
                    },
                },
            },
            orderBy: { nextDueDate: 'asc' },
        });
    }

    // Get overdue credits
    async getOverdueCredits(tenantId: string) {
        return this.prisma.credit.findMany({
            where: {
                status: 'ACTIVE',
                nextDueDate: {
                    lt: new Date(),
                },
                transaction: { tenantId },
            },
            include: {
                transaction: {
                    include: {
                        customer: {
                            select: { name: true, phone: true },
                        },
                        vehicle: {
                            select: { make: true, model: true, licensePlate: true },
                        },
                    },
                },
            },
            orderBy: { nextDueDate: 'asc' },
        });
    }

    // ==================== ALL REMINDERS ====================

    async getAllReminders(tenantId: string) {
        const [taxExpiring, taxExpired, creditsDue, creditsOverdue] = await Promise.all([
            this.getTaxExpiringVehicles(tenantId, 30),
            this.getExpiredTaxVehicles(tenantId),
            this.getCreditDueReminders(tenantId, 7),
            this.getOverdueCredits(tenantId),
        ]);

        return {
            tax: {
                expiring: taxExpiring,
                expired: taxExpired,
            },
            credit: {
                duesSoon: creditsDue,
                overdue: creditsOverdue,
            },
            summary: {
                taxExpiringCount: taxExpiring.length,
                taxExpiredCount: taxExpired.length,
                creditDueCount: creditsDue.length,
                creditOverdueCount: creditsOverdue.length,
                totalAlerts: taxExpiring.length + taxExpired.length + creditsDue.length + creditsOverdue.length,
            },
        };
    }
}
