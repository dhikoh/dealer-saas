import { Injectable, ConsoleLogger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupService {
    private readonly logger = new ConsoleLogger(CleanupService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Runs daily at 02:00 AM
     * 
     * Step 1: Mark expired tenants for scheduled deletion (6 months from expiry)
     * Step 2: Soft delete tenants that have passed their scheduled deletion date
     */
    @Cron('0 2 * * *')
    async handleTenantCleanup() {
        this.logger.log('🧹 Running tenant cleanup cron job...');

        const now = new Date();
        const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000; // ~180 days

        // ============ STEP 1: Schedule deletion for expired tenants ============
        // Find tenants where subscription/trial has expired but no deletion is scheduled yet
        const expiredTenants = await this.prisma.tenant.findMany({
            where: {
                deletedAt: null, // Not yet deleted
                scheduledDeletionAt: null, // Not yet scheduled for deletion
                OR: [
                    // Paid subscriptions that expired
                    {
                        subscriptionEndsAt: { lt: now },
                        subscriptionStatus: { in: ['EXPIRED', 'SUSPENDED', 'CANCELLED'] },
                    },
                    // Trial/Demo that expired
                    {
                        planTier: 'DEMO',
                        trialEndsAt: { lt: now },
                    },
                ],
            },
        });

        for (const tenant of expiredTenants) {
            // Calculate deletion date: 6 months after expiry
            const expiryDate = tenant.subscriptionEndsAt || tenant.trialEndsAt || now;
            const scheduledDeletionAt = new Date(expiryDate.getTime() + sixMonthsMs);

            await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                    subscriptionStatus: 'SUSPENDED',
                    scheduledDeletionAt,
                },
            });

            this.logger.log(
                `📅 Tenant "${tenant.name}" (${tenant.id}) scheduled for deletion on ${scheduledDeletionAt.toISOString()}`
            );
        }

        if (expiredTenants.length > 0) {
            this.logger.log(`📅 Scheduled ${expiredTenants.length} tenant(s) for future deletion.`);
        }

        // ============ STEP 2: Soft delete tenants past their scheduled deletion date ============
        const tenantsToDelete = await this.prisma.tenant.findMany({
            where: {
                deletedAt: null, // Not yet deleted
                scheduledDeletionAt: { lt: now }, // Past scheduled deletion date
            },
        });

        for (const tenant of tenantsToDelete) {
            await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                    deletedAt: now,
                    subscriptionStatus: 'CANCELLED',
                },
            });

            this.logger.log(
                `🗑️ Tenant "${tenant.name}" (${tenant.id}) soft deleted.`
            );
        }

        if (tenantsToDelete.length > 0) {
            this.logger.log(`🗑️ Soft deleted ${tenantsToDelete.length} tenant(s).`);
        }

        this.logger.log('✅ Tenant cleanup cron job completed.');
    }
}
