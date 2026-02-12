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

    // ==================== AUTOMATED REMINDERS (CRON) ====================
    // Runs every day at 09:00 AM
    // @Cron('0 9 * * *') 
    async checkDailyReminders() {
    // Get all tenants
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });

    for (const tenant of tenants) {
        await this.processTenantReminders(tenant.id);
    }
}

    private async processTenantReminders(tenantId: string) {
    // 1. Tax Expiry (30 days and 7 days)
    const expiring7 = await this.getTaxExpiringVehicles(tenantId, 7);

    // Get owners to notify
    const users = await this.prisma.user.findMany({
        where: { tenantId, role: { in: ['OWNER', 'ADMIN'] } },
        select: { id: true }
    });

    // NOTIFY: Tax Expiring Soon (< 7 days)
    if (expiring7.length > 0) {
        const count = expiring7.length;
        for (const user of users) {
            await this.prisma.notification.create({
                data: {
                    userId: user.id,
                    type: 'warning',
                    title: 'Peringatan Pajak Kendaraan',
                    message: `Terdapat ${count} kendaraan dengan masa aktif pajak < 7 hari.`,
                    link: '/app/inventory',
                    read: false,
                }
            });
        }
    }

    // 2. Credit Due (3 days)
    const dueCredits = await this.getCreditDueReminders(tenantId, 3);
    if (dueCredits.length > 0) {
        const count = dueCredits.length;
        for (const user of users) {
            await this.prisma.notification.create({
                data: {
                    userId: user.id,
                    type: 'info',
                    title: 'Jatuh Tempo Kredit',
                    message: `Ada ${count} pembayaran kredit pelanggan yang akan jatuh tempo dalam 3 hari.`,
                    link: '/app/credit',
                    read: false,
                }
            });
        }
    }
}
}
