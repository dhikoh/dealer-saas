
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PLAN_TIERS, getPlanById, canUpgrade, canDowngrade } from '../config/plan-tiers.config';
import { SubscriptionStateService } from './subscription-state.service';

/** Default billing periods (fallback if PlatformSetting not configured) */
const DEFAULT_BILLING_PERIODS = [
    { months: 1, discountPercent: 0, label: '1 Bulan' },
    { months: 6, discountPercent: 10, label: '6 Bulan' },
    { months: 12, discountPercent: 20, label: '12 Bulan' },
];

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private subscriptionStateService: SubscriptionStateService
    ) { }

    // ==================== BILLING PERIODS ====================

    /**
     * Get available billing periods (with discounts).
     * Reads from PlatformSetting 'billing_periods', falls back to defaults.
     */
    async getBillingPeriods() {
        try {
            const setting = await this.prisma.platformSetting.findUnique({
                where: { key: 'billing_periods' },
            });
            if (setting?.value) {
                const parsed = JSON.parse(setting.value);
                // Accept both formats: bare array [...] or wrapped { periods: [...] }
                const periods = Array.isArray(parsed)
                    ? parsed
                    : (parsed?.periods && Array.isArray(parsed.periods) ? parsed.periods : null);
                if (periods && periods.length > 0) {
                    return periods;
                }
            }
        } catch (e) {
            this.logger.warn('Failed to parse billing_periods setting, using defaults');
        }
        return DEFAULT_BILLING_PERIODS;
    }

    // ==================== SUBSCRIPTION STATUS ====================

    async checkSubscriptionStatus(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { plan: true },
        });

        if (!tenant) throw new BadRequestException('Tenant not found');

        const now = new Date();
        let status: string = tenant.subscriptionStatus;
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

        // Use DB plan data (superadmin-managed) with fallback to hardcoded config
        const planDetails = tenant.plan
            ? this.formatDbPlan(tenant.plan)
            : getPlanById(tenant.planTier);

        return {
            planTier: tenant.planTier,
            planDetails,
            subscriptionStatus: status,
            trialEndsAt: tenant.trialEndsAt,
            trialDaysRemaining: daysRemaining,
            subscriptionEndsAt: tenant.subscriptionEndsAt,
            autoRenew: tenant.autoRenew,
            monthlyBill: Number(tenant.monthlyBill || 0),
        };
    }

    // ==================== PLAN MANAGEMENT ====================

    /**
     * Upgrade Plan — SINGLE SOURCE OF TRUTH for both tenant-facing and admin-facing upgrade.
     * 
     * @param tenantId - tenant to upgrade
     * @param newPlanId - target plan slug (e.g. 'PRO')
     * @param months - billing period (1, 6, 12). Default 1.
     */
    async upgradePlan(tenantId: string, newPlanId: string, months: number = 1) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { plan: true },
        });
        if (!tenant) throw new BadRequestException('Tenant not found');

        if (!canUpgrade(tenant.planTier, newPlanId)) {
            throw new BadRequestException(`Tidak dapat upgrade dari ${tenant.planTier} ke ${newPlanId}`);
        }

        // === DUPLICATE INVOICE GUARD ===
        const activeInvoice = await this.prisma.systemInvoice.findFirst({
            where: {
                tenantId,
                status: { in: ['PENDING', 'VERIFYING'] },
            },
        });
        if (activeInvoice) {
            throw new BadRequestException(
                `Anda masih memiliki invoice aktif (#${activeInvoice.invoiceNumber}). Tunggu verifikasi atau hubungi admin untuk membatalkan.`
            );
        }

        // === GET PLAN PRICE (DB first, fallback to config) ===
        const dbPlan = await this.prisma.plan.findFirst({
            where: { slug: { equals: newPlanId, mode: 'insensitive' } },
        });
        const planPrice = dbPlan ? Number(dbPlan.price) : (getPlanById(newPlanId)?.price ?? 0);
        const planName = dbPlan ? dbPlan.name : (getPlanById(newPlanId)?.name ?? newPlanId);

        if (planPrice <= 0) {
            throw new BadRequestException('Harga paket tidak valid');
        }

        // === BILLING PERIOD DISCOUNT ===
        const periods = await this.getBillingPeriods();
        const selectedPeriod = periods.find((p: any) => p.months === months);
        const discountPercent = selectedPeriod?.discountPercent ?? 0;
        const totalBeforeDiscount = planPrice * months;
        const discountAmount = Math.round(totalBeforeDiscount * discountPercent / 100);
        const totalAfterDiscount = totalBeforeDiscount - discountAmount;

        const now = new Date();
        const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days to pay

        // === GENERATE INVOICE ===
        const invoiceNumber = await this.generateInvoiceNumber();
        const invoice = await this.prisma.systemInvoice.create({
            data: {
                tenantId,
                invoiceNumber,
                amount: totalAfterDiscount,
                status: 'PENDING',
                dueDate,
                items: JSON.stringify({
                    type: 'UPGRADE',
                    fromPlan: tenant.planTier,
                    toPlan: newPlanId,
                    months,
                    monthlyPrice: planPrice,
                    discountPercent,
                    totalBeforeDiscount,
                    discountAmount,
                    totalAfterDiscount,
                    description: months > 1
                        ? `Upgrade ke ${planName} (${months} bulan, diskon ${discountPercent}%)`
                        : `Upgrade ke ${planName}`,
                }),
            },
        });

        // DON'T change planTier yet — wait for payment verification
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                monthlyBill: planPrice,
                scheduledDeletionAt: null,
            },
        });

        // Switch to GRACE (Read-Only) until payment
        await this.subscriptionStateService.transition(
            tenantId,
            'GRACE',
            `Upgrade requested to ${planName} (${months} bulan)`,
            'BILLING',
            invoice.id
        );

        return {
            success: true,
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                amount: totalAfterDiscount,
                dueDate: invoice.dueDate,
                plan: planName,
                months,
                discountPercent,
                totalBeforeDiscount,
                discountAmount,
            },
            message: months > 1
                ? `Invoice untuk upgrade ke ${planName} (${months} bulan, diskon ${discountPercent}%) telah dibuat.`
                : `Invoice untuk upgrade ke ${planName} telah dibuat. Silakan lakukan pembayaran.`,
        };
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
                monthlyBill: newPlan.price,
            },
        });

        return { success: true, message: `Downgrade to ${newPlan.name} will take effect at end of billing period` };
    }

    // ==================== PAYMENT PROOF UPLOAD ====================

    async uploadPaymentProof(invoiceId: string, tenantId: string, proofUrl: string) {
        const invoice = await this.prisma.systemInvoice.findUnique({
            where: { id: invoiceId },
            include: { tenant: true },
        });

        if (!invoice) throw new BadRequestException('Invoice not found');
        if (invoice.tenantId !== tenantId) throw new BadRequestException('Access denied');
        if (invoice.status !== 'PENDING' && invoice.status !== 'REJECTED') {
            throw new BadRequestException('Invoice sudah diproses atau sedang di-verifikasi. Tidak bisa upload ulang.');
        }

        const updated = await this.prisma.systemInvoice.update({
            where: { id: invoiceId },
            data: {
                status: 'VERIFYING',
                paymentProof: proofUrl,
            },
        });

        // Notify all Superadmins
        const superadmins = await this.prisma.user.findMany({
            where: { role: 'SUPERADMIN' },
        });

        for (const admin of superadmins) {
            await this.notificationService.createNotification({
                userId: admin.id,
                title: 'Bukti Pembayaran Baru 💸',
                message: `Tenant ${invoice.tenant?.name} upload bukti untuk Invoice #${invoice.invoiceNumber}.`,
                type: 'info',
                link: '/superadmin/invoices',
            });
        }

        return updated;
    }

    // ==================== VERIFY PAYMENT (Single Source of Truth) ====================

    /**
     * Verify/Reject a payment. Called by SuperadminService (which handles activity logging).
     * This method handles: invoice status, plan upgrade, subscription dates, notifications.
     */
    async verifyPayment(invoiceId: string, approved: boolean, verifiedBy?: string) {
        const invoice = await this.prisma.systemInvoice.findUnique({
            where: { id: invoiceId },
            include: { tenant: true },
        });

        if (!invoice) throw new BadRequestException('Invoice not found');
        if (invoice.status === 'PAID') {
            throw new BadRequestException('Invoice sudah disetujui sebelumnya');
        }
        if (invoice.status === 'CANCELLED') {
            throw new BadRequestException('Invoice sudah dibatalkan');
        }

        // Find Tenant Owner for notification
        const owner = await this.prisma.user.findFirst({
            where: { tenantId: invoice.tenantId, role: 'OWNER' },
        });

        if (approved) {
            // === APPROVE PAYMENT ===
            await this.prisma.systemInvoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID' },
            });

            // Parse items for plan upgrade + billing period info
            let toPlan: string | null = null;
            let months = 1;
            try {
                const items = JSON.parse(invoice.items || '{}');
                toPlan = items.toPlan || (Array.isArray(items) ? items[0]?.toPlan : null);
                months = items.months || 1;
            } catch { /* ignore parse errors */ }

            // Calculate subscription duration based on months purchased
            const now = new Date();
            const durationMs = months * 30 * 24 * 60 * 60 * 1000;
            const subscriptionEndsAt = new Date(now.getTime() + durationMs);

            // 1. Update Plan + Subscription Dates
            await this.prisma.tenant.update({
                where: { id: invoice.tenantId },
                data: {
                    ...(toPlan ? { planTier: toPlan } : {}),
                    subscriptionStartedAt: now,
                    subscriptionEndsAt,
                    nextBillingDate: subscriptionEndsAt, // Critical: cron reads this
                    scheduledDeletionAt: null,
                },
            });

            // 2. Strict State Transition
            await this.subscriptionStateService.transition(
                invoice.tenantId,
                'ACTIVE',
                `Payment verified for Invoice #${invoice.invoiceNumber} (${months} bulan)`,
                'SUPERADMIN',
                invoiceId
            );

            // 3. Notify Owner
            if (owner) {
                const periodText = months > 1 ? ` untuk ${months} bulan` : '';
                await this.notificationService.createNotification({
                    userId: owner.id,
                    title: 'Pembayaran Diterima ✅',
                    message: `Pembayaran untuk Invoice #${invoice.invoiceNumber}${periodText} telah diverifikasi. Langganan Anda aktif kembali.`,
                    type: 'success',
                    link: '/app/billing',
                });
            }

            return { success: true, message: `Payment verified and subscription activated for ${months} month(s)` };
        } else {
            // === REJECT PAYMENT (use REJECTED, not CANCELLED) ===
            await this.prisma.systemInvoice.update({
                where: { id: invoiceId },
                data: { status: 'REJECTED' },
            });

            // Notify Owner
            if (owner) {
                await this.notificationService.createNotification({
                    userId: owner.id,
                    title: 'Pembayaran Ditolak ❌',
                    message: `Pembayaran untuk Invoice #${invoice.invoiceNumber} ditolak. Silakan upload bukti yang valid.`,
                    type: 'error',
                    link: '/app/billing',
                });
            }

            return { success: true, message: 'Payment rejected — tenant can re-upload proof' };
        }
    }

    // ==================== INVOICE GENERATION ====================

    /**
     * Generate a unique invoice number: INV-YYYY-XXXX
     */
    private async generateInvoiceNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.prisma.systemInvoice.count({
            where: { invoiceNumber: { startsWith: `INV-${year}` } },
        });
        return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    async generateInvoice(tenantId: string, amount: number, description: string, months: number = 1) {
        const invoiceNumber = await this.generateInvoiceNumber();
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days to pay

        const invoice = await this.prisma.systemInvoice.create({
            data: {
                tenantId,
                invoiceNumber,
                amount,
                dueDate,
                status: 'PENDING',
                items: JSON.stringify([{ description, amount, months }]),
            },
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
            },
            include: { plan: true }, // Use DB Plan for price
        });

        const results: { tenantId: string; invoiceId: string }[] = [];
        for (const tenant of tenants) {
            // Use DB Plan price if available, fallback to hardcoded config
            const price = tenant.plan ? Number(tenant.plan.price) : (getPlanById(tenant.planTier)?.price ?? 0);
            const planName = tenant.plan ? tenant.plan.name : (getPlanById(tenant.planTier)?.name ?? tenant.planTier);

            if (price > 0) {
                const invoice = await this.generateInvoice(
                    tenant.id,
                    price,
                    `Langganan bulanan - ${planName}`,
                    1
                );
                results.push({ tenantId: tenant.id, invoiceId: invoice.id });

                // Notify tenant owner
                const owner = await this.prisma.user.findFirst({
                    where: { tenantId: tenant.id, role: 'OWNER' },
                });
                if (owner) {
                    await this.notificationService.createNotification({
                        userId: owner.id,
                        title: 'Invoice Baru 📄',
                        message: `Invoice langganan bulanan #${invoice.invoiceNumber} telah dibuat. Silakan lakukan pembayaran.`,
                        type: 'info',
                        link: '/app/billing',
                    });
                }
            }
        }

        return { generated: results.length, invoices: results };
    }

    // ==================== TRIAL MANAGEMENT ====================

    async startTrial(tenantId: string) {
        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                planTier: 'DEMO',
                trialEndsAt,
            },
        });

        await this.subscriptionStateService.transition(
            tenantId,
            'TRIAL',
            'Trial Started',
            'SYSTEM'
        );

        return { success: true, trialEndsAt };
    }

    async getExpiredTrials() {
        const now = new Date();
        return this.prisma.tenant.findMany({
            where: {
                planTier: 'DEMO',
                trialEndsAt: { lt: now },
                subscriptionStatus: { not: 'CANCELLED' },
            },
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
            this.prisma.systemInvoice.count({ where: { status: 'PENDING' } }),
            this.prisma.tenant.aggregate({
                _sum: { monthlyBill: true },
                where: { subscriptionStatus: 'ACTIVE' },
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

    // Get all plan tiers from DB (synced with superadmin edits)
    async getAllPlans() {
        const dbPlans = await this.prisma.plan.findMany({ orderBy: { price: 'asc' } });

        // If DB has plans, use them (superadmin-managed)
        if (dbPlans.length > 0) {
            return dbPlans.map(p => this.formatDbPlan(p));
        }

        // Fallback to hardcoded config if DB is empty
        return Object.values(PLAN_TIERS);
    }

    /**
     * Format a DB Plan record into the shape expected by frontend.
     */
    private formatDbPlan(p: any) {
        const feat = typeof p.features === 'object' && p.features !== null
            ? p.features as Record<string, any> : {};
        return {
            id: p.slug.toUpperCase(),
            name: p.name,
            description: p.description,
            descriptionId: feat.descriptionId || p.description,
            price: Number(p.price),
            priceLabel: feat.priceLabel || `Rp ${Number(p.price).toLocaleString('id-ID')}`,
            billingCycle: feat.billingCycle || (Number(p.price) > 0 ? 'monthly' : null),
            trialDays: feat.trialDays || 0,
            features: {
                maxVehicles: p.maxVehicles,
                maxUsers: p.maxUsers,
                maxCustomers: p.maxCustomers ?? feat.maxCustomers ?? 0,
                maxBranches: p.maxBranches,
                pdfExport: feat.pdfExport ?? false,
                internalReports: feat.internalReports ?? false,
                blacklistAccess: feat.blacklistAccess ?? false,
                reminderNotifications: feat.reminderNotifications ?? false,
                multiLanguage: feat.multiLanguage ?? false,
                prioritySupport: feat.prioritySupport ?? false,
                apiAccess: feat.apiAccess ?? false,
                customBranding: feat.customBranding ?? false,
                advancedAnalytics: feat.advancedAnalytics ?? false,
                dataExport: feat.dataExport ?? false,
                whatsappIntegration: feat.whatsappIntegration ?? false,
            },
            badge: feat.badge || p.slug,
            badgeColor: feat.badgeColor || 'gray',
            recommended: feat.recommended || false,
            yearlyDiscount: feat.yearlyDiscount || 0,
        };
    }

    // ==================== TENANT-FACING ====================

    async getMyInvoices(tenantId: string) {
        return this.prisma.systemInvoice.findMany({
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
            await this.subscriptionStateService.transition(
                tenant.id,
                'SUSPENDED',
                'Overdue > 30 days',
                'SYSTEM',
                undefined,
                'SOFT'
            );

            suspended.push(tenant.name);
            this.logger.warn(`🚫 Suspended tenant: ${tenant.name} (Overdue > 30 days)`);
        }

        this.logger.log(`⚠️ Suspended ${suspended.length} overdue tenants.`);
        return { suspended: suspended.length, tenants: suspended };
    }
}
