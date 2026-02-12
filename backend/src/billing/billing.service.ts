import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { Cron, CronExpression } from '@nestjs/schedule';

const PLAN_TIERS = {
    DEMO: { name: 'Demo', price: 0, maxVehicles: 5, maxUsers: 1 },
    BASIC: { name: 'Basic', price: 150000, maxVehicles: 20, maxUsers: 2 },
    PRO: { name: 'Pro', price: 350000, maxVehicles: 100, maxUsers: 5 },
    UNLIMITED: { name: 'Unlimited', price: 999000, maxVehicles: -1, maxUsers: -1 }
};

const getPlanById = (id: string) => PLAN_TIERS[id] || null;

const canUpgrade = (currentId: string, newId: string) => {
    const levels = ['DEMO', 'BASIC', 'PRO', 'UNLIMITED'];
    return levels.indexOf(newId) > levels.indexOf(currentId);
};

const canDowngrade = (currentId: string, newId: string) => {
    const levels = ['DEMO', 'BASIC', 'PRO', 'UNLIMITED'];
    return levels.indexOf(newId) < levels.indexOf(currentId);
};

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService
    ) { }

    // ... (rest of the file until uploadPaymentProof)

    async verifyPayment(invoiceId: string, approved: boolean, verifiedBy: string) {
        const invoice = await (this.prisma as any).systemInvoice.findUnique({
            where: { id: invoiceId },
            include: { tenant: true } // Need tenant to find owner
        });

        if (!invoice) throw new BadRequestException('Invoice not found');

        // Find Tenant Owner for notification
        const owner = await this.prisma.user.findFirst({
            where: { tenantId: invoice.tenantId, role: 'OWNER' }
        });

        if (approved) {
            // Approve payment
            await (this.prisma as any).systemInvoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID' }
            });

            // Activate subscription
            const now = new Date();
            const subscriptionEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            await this.prisma.tenant.update({
                where: { id: invoice.tenantId },
                data: {
                    subscriptionStatus: 'ACTIVE',
                    subscriptionStartedAt: now,
                    subscriptionEndsAt,
                    nextBillingDate: subscriptionEndsAt,
                    scheduledDeletionAt: null, // Cancel auto-deletion timer
                }
            });

            // Notify Owner
            if (owner) {
                await this.notificationService.createNotification({
                    userId: owner.id,
                    title: 'Pembayaran Diterima ✅',
                    message: `Pembayaran untuk Invoice #${invoice.invoiceNumber} telah diverifikasi. Langganan Anda aktif kembali.`,
                    type: 'success',
                    link: '/app/billing'
                });
            }

            return { success: true, message: 'Payment verified and subscription activated' };
        } else {
            // Reject payment
            await (this.prisma as any).systemInvoice.update({
                where: { id: invoiceId },
                data: { status: 'REJECTED' }
            });

            // Notify Owner
            if (owner) {
                await this.notificationService.createNotification({
                    userId: owner.id,
                    title: 'Pembayaran Ditolak ❌',
                    message: `Pembayaran untuk Invoice #${invoice.invoiceNumber} ditolak. Silakan upload bukti yang valid.`,
                    type: 'error',
                    link: '/app/billing'
                });
            }

            return { success: true, message: 'Payment rejected' };
        }
    }

    // ... (rest of methods)

    async uploadPaymentProof(invoiceId: string, tenantId: string, proofUrl: string) {
        const invoice = await (this.prisma as any).systemInvoice.findUnique({
            where: { id: invoiceId },
            include: { tenant: true }
        });

        if (!invoice) throw new BadRequestException('Invoice not found');
        if (invoice.tenantId !== tenantId) throw new BadRequestException('Access denied');
        if (invoice.status !== 'PENDING' && invoice.status !== 'REJECTED') {
            // Allow re-upload if rejected? Logic says PENDING only usually, but let's be flexible
            if (invoice.status !== 'PENDING') throw new BadRequestException('Invoice is not pending');
        }

        const updated = await (this.prisma as any).systemInvoice.update({
            where: { id: invoiceId },
            data: {
                status: 'VERIFYING',
                paymentProof: proofUrl, // FIXED: paymentProofUrl -> paymentProof
            },
        });

        // Notify Superadmins
        const superadmins = await this.prisma.user.findMany({
            where: { role: 'SUPERADMIN' }
        });

        for (const admin of superadmins) {
            await this.notificationService.createNotification({
                userId: admin.id,
                title: 'New Payment Proof 💸',
                message: `Tenant ${invoice.tenant?.name} uploaded proof for #${invoice.invoiceNumber}.`,
                type: 'info',
                link: '/superadmin/invoices'
            });
        }

        return updated;
    }

    // ==================== SUBSCRIPTION STATUS ====================

    async checkSubscriptionStatus(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                planTier: true,
                subscriptionStatus: true,
                trialEndsAt: true,
                subscriptionEndsAt: true,
                autoRenew: true,
                monthlyBill: true,
            }
        });

        if (!tenant) throw new BadRequestException('Tenant not found');

        const now = new Date();
        let status = tenant.subscriptionStatus;
        let daysRemaining = 0;

        // Check trial expiry
        if (tenant.planTier === 'DEMO' && tenant.trialEndsAt) {
            if (now > tenant.trialEndsAt) {
                status = 'EXPIRED';
            } else {
                daysRemaining = Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            }
        }

        // Check subscription expiry
        if (tenant.subscriptionEndsAt && now > tenant.subscriptionEndsAt) {
            if (tenant.autoRenew) {
                status = 'PENDING_RENEWAL';
            } else {
                status = 'EXPIRED';
            }
        } else if (tenant.subscriptionEndsAt) {
            daysRemaining = Math.ceil((tenant.subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
            planTier: tenant.planTier,
            planDetails: getPlanById(tenant.planTier),
            status,
            daysRemaining,
            autoRenew: tenant.autoRenew,
            monthlyBill: Number(tenant.monthlyBill || 0),
        };
    }

    // ==================== PLAN MANAGEMENT ====================

    async upgradePlan(tenantId: string, newPlanId: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new BadRequestException('Tenant not found');

        if (!canUpgrade(tenant.planTier, newPlanId)) {
            throw new BadRequestException(`Cannot upgrade from ${tenant.planTier} to ${newPlanId}`);
        }

        const newPlan = getPlanById(newPlanId);
        if (!newPlan) throw new BadRequestException('Invalid plan');

        const now = new Date();
        const subscriptionEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        // Generate invoice for upgrade
        const invoice = await this.generateInvoice(tenantId, newPlan.price, `Upgrade to ${newPlan.name}`);

        // Update tenant
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                planTier: newPlanId,
                subscriptionStatus: 'PENDING_PAYMENT',
                monthlyBill: newPlan.price,
                nextBillingDate: subscriptionEndsAt,
                scheduledDeletionAt: null, // Cancel auto-deletion timer
            }
        });

        return { success: true, invoice, newPlan };
    }

    async downgradePlan(tenantId: string, newPlanId: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new BadRequestException('Tenant not found');

        if (!canDowngrade(tenant.planTier, newPlanId)) {
            throw new BadRequestException(`Cannot downgrade from ${tenant.planTier} to ${newPlanId}`);
        }

        const newPlan = getPlanById(newPlanId);
        if (!newPlan) throw new BadRequestException('Invalid plan');

        // Downgrade takes effect at end of current billing period
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                // Keep current plan until period ends
                // Store pending downgrade in metadata or separate field
                monthlyBill: newPlan.price,
            }
        });

        return { success: true, message: `Downgrade to ${newPlan.name} will take effect at end of billing period` };
    }

    // ==================== INVOICE GENERATION ====================

    async generateInvoice(tenantId: string, amount: number, description: string) {
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days to pay

        const invoice = await (this.prisma as any).systemInvoice.create({
            data: {
                tenantId,
                invoiceNumber,
                amount,
                dueDate,
                status: 'PENDING',
                items: JSON.stringify([{ description, amount }]),
            }
        });

        return invoice;
    }

    async generateMonthlyInvoices() {
        // Get all tenants with active subscriptions due for billing
        const now = new Date();
        const tenants = await this.prisma.tenant.findMany({
            where: {
                subscriptionStatus: 'ACTIVE',
                planTier: { not: 'DEMO' },
                autoRenew: true,
                nextBillingDate: { lte: now },
            }
        });

        const results: { tenantId: string; invoiceId: string }[] = [];
        for (const tenant of tenants) {
            const plan = getPlanById(tenant.planTier);
            if (plan) {
                const invoice = await this.generateInvoice(
                    tenant.id,
                    plan.price,
                    `Monthly subscription - ${plan.name}`
                );
                results.push({ tenantId: tenant.id, invoiceId: invoice.id });
            }
        }

        return { generated: results.length, invoices: results };
    }

    // ==================== PAYMENT VERIFICATION ====================
    // Methods verifyPayment and uploadPaymentProof are already defined above.
    // access denied logic and notifications are handled there.

    // ==================== TRIAL MANAGEMENT ====================

    async startTrial(tenantId: string) {
        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                planTier: 'DEMO',
                subscriptionStatus: 'TRIAL',
                trialEndsAt,
            }
        });

        return { success: true, trialEndsAt };
    }

    async getExpiredTrials() {
        const now = new Date();
        return this.prisma.tenant.findMany({
            where: {
                planTier: 'DEMO',
                trialEndsAt: { lt: now },
                subscriptionStatus: { not: 'CANCELLED' },
            }
        });
    }

    // ==================== ADMIN STATS ====================

    async getBillingStats() {
        const [
            totalTenants,
            activePaid,
            trialTenants,
            suspendedTenants,
            pendingInvoices,
            totalMrr
        ] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE', planTier: { not: 'DEMO' } } }),
            this.prisma.tenant.count({ where: { subscriptionStatus: 'TRIAL' } }),
            this.prisma.tenant.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
            (this.prisma as any).systemInvoice.count({ where: { status: 'PENDING' } }),
            this.prisma.tenant.aggregate({
                _sum: { monthlyBill: true },
                where: { subscriptionStatus: 'ACTIVE' }
            }),
        ]);

        return {
            totalTenants,
            activePaid,
            trialTenants,
            suspendedTenants,
            pendingInvoices,
            totalMrr: Number(totalMrr._sum.monthlyBill || 0),
        };
    }

    async getPlanDistribution() {
        const plans = await this.prisma.tenant.groupBy({
            by: ['planTier'],
            _count: true,
        });

        return plans.map(p => ({
            plan: p.planTier,
            count: p._count,
            details: getPlanById(p.planTier),
        }));
    }

    // Get all plan tiers for management
    getAllPlans() {
        return Object.values(PLAN_TIERS);
    }

    // ==================== TENANT-FACING ====================

    async getMyInvoices(tenantId: string) {
        return (this.prisma as any).systemInvoice.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    // ==================== CRON: AUTO BILLING & SUSPEND (Daily at 01:00 AM) ====================

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async handleDailyBilling() {
        this.logger.log('🔄 Running daily billing job...');

        // 1. Generate Invoices for Renewals
        const { generated } = await this.generateMonthlyInvoices();
        if (generated > 0) {
            this.logger.log(`✅ Generated ${generated} new invoices.`);
        }

        // 2. Suspend Overdue
        await this.autoSuspendOverdue();
    }

    private async autoSuspendOverdue() {
        this.logger.log('🕵️ Checking for overdue suspensions...');
        const overdueThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days overdue

        const overdueTenants = await this.prisma.tenant.findMany({
            where: {
                subscriptionStatus: 'ACTIVE',
                planTier: { not: 'DEMO' },
                nextBillingDate: { lt: overdueThreshold },
            },
            include: {
                users: {
                    where: { role: 'OWNER' },
                    select: { email: true, name: true },
                    take: 1,
                },
            },
        });

        if (overdueTenants.length === 0) {
            return { suspended: 0, tenants: [] };
        }

        const suspended: string[] = [];
        for (const tenant of overdueTenants) {
            await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: { subscriptionStatus: 'SUSPENDED' },
            });
            suspended.push(tenant.name);
            this.logger.warn(`🚫 Suspended tenant: ${tenant.name} (Overdue > 30 days)`);
        }

        this.logger.log(`⚠️ Suspended ${suspended.length} overdue tenants.`);
        return { suspended: suspended.length, tenants: suspended };
    }
}
