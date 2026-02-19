
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStateService } from '../billing/subscription-state.service';

@Injectable()
export class CleanupService {
    private readonly logger = new Logger(CleanupService.name);

    constructor(
        private prisma: PrismaService,
        private subscriptionStateService: SubscriptionStateService
    ) { }

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
                        subscriptionStatus: { in: ['SUSPENDED', 'CANCELLED'] },
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

            try {
                // 1. Transition Status to SUSPENDED (Hard Block)
                await this.subscriptionStateService.transition(
                    tenant.id,
                    'SUSPENDED',
                    'Expired > Scheduled for Deletion',
                    'SYSTEM',
                    undefined,
                    'HARD'
                );

                // 2. Set Deletion Schedule
                await this.prisma.tenant.update({
                    where: { id: tenant.id },
                    data: { scheduledDeletionAt },
                });

                this.logger.log(
                    `📅 Tenant "${tenant.name}" (${tenant.id}) scheduled for deletion on ${scheduledDeletionAt.toISOString()}`
                );
            } catch (error) {
                this.logger.error(`Failed to schedule deletion for tenant ${tenant.id}: ${error.message}`);
            }
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
            try {
                // 1. Transition Status to CANCELLED
                await this.subscriptionStateService.transition(
                    tenant.id,
                    'CANCELLED',
                    'Auto Soft Delete (Scheduled)',
                    'SYSTEM'
                );

                // 2. Perform Soft Delete
                await this.prisma.tenant.update({
                    where: { id: tenant.id },
                    data: { deletedAt: now },
                });

                this.logger.log(
                    `🗑️ Tenant "${tenant.name}" (${tenant.id}) soft deleted.`
                );
            } catch (error) {
                this.logger.error(`Failed to soft delete tenant ${tenant.id}: ${error.message}`);
            }
        }

        if (tenantsToDelete.length > 0) {
            this.logger.log(`🗑️ Soft deleted ${tenantsToDelete.length} tenant(s).`);
        }

        this.logger.log('✅ Tenant cleanup cron job completed.');
    }
}
