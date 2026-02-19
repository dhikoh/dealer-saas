import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Feature } from './features.enum';
import { Plan } from '@prisma/client';

@Injectable()
export class FeatureLimitService {
    private readonly logger = new Logger(FeatureLimitService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Assert that a tenant can create a resource protected by a feature flag/limit.
     * STRICT: DB-Only Source of Truth. Fails closed if Plan is missing.
     */
    async assertCanCreate(tenantId: string, feature: Feature): Promise<void> {
        const limit = await this.getLimit(tenantId, feature);

        // Unlimited
        if (limit === -1) return;

        const count = await this.getCurrentCount(tenantId, feature);

        if (count >= limit) {
            // Fetch plan name for nice error message
            const planName = await this.getPlanName(tenantId);
            throw new BadRequestException(
                `Batas tercapai untuk ${feature}. Limit: ${limit} (Paket: ${planName}). Upgrade paket Anda.`
            );
        }
    }

    /**
     * Assert a boolean feature is enabled (e.g. DEALER_GROUP)
     */
    async assertFeatureEnabled(tenantId: string, feature: Feature): Promise<void> {
        const plan = await this.resolveTenantPlan(tenantId);

        if (!plan) {
            this.logger.error(`No Plan found for tenant ${tenantId}. Feature ${feature} DENIED.`);
            throw new BadRequestException('Akses ditolak. Paket langganan tidak ditemukan.');
        }

        // Logic for Boolean flags (Dealer Group, API, etc)
        let isEnabled = false;

        // 1. Check Columns
        if (feature === Feature.DEALER_GROUP) {
            isEnabled = plan.canCreateGroup;
        }
        // 2. Check JSON Features
        else {
            const features = plan.features as any;
            if (features && features[feature.toLowerCase()] === true) {
                isEnabled = true;
            }
        }

        if (!isEnabled) {
            throw new BadRequestException(`Fitur ${feature} tidak tersedia di paket ${plan.name}. Upgrade ke Enterprise.`);
        }
    }

    private async getLimit(tenantId: string, feature: Feature): Promise<number> {
        const plan = await this.resolveTenantPlan(tenantId);

        // FAIL CLOSED
        if (!plan) {
            this.logger.error(`Feature Limit Check FAILED: No Plan for tenant ${tenantId}. Defaulting to 0.`);
            return 0;
        }

        // Map Feature to Column
        switch (feature) {
            case Feature.VEHICLES: return plan.maxVehicles;
            case Feature.USERS: return plan.maxUsers;
            case Feature.BRANCHES: return plan.maxBranches;
            case Feature.CUSTOMERS:
                // JSON Feature Check
                return (plan.features as any)?.maxCustomers ?? 0;
            case Feature.DEALER_GROUP:
                return plan.maxGroupMembers;
            default: return 0;
        }
    }

    // Resolves the DB Plan record either by direct relation or slug fallback
    private async resolveTenantPlan(tenantId: string): Promise<Plan | null> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { plan: true }
        });
        if (!tenant) return null;

        // 1. Priority: Direct Link (The Destination)
        if (tenant.plan) return tenant.plan;

        // 2. Transitional: Legacy Bridge (Slug Search)
        if (tenant.planTier) {
            const slug = tenant.planTier.toLowerCase();

            // WARN: Transitional usage
            this.logger.warn(`Tenant ${tenantId} is using Legacy Plan Bridge (Slug: ${slug}). Please migrate to planId.`);

            const plan = await this.prisma.plan.findUnique({ where: { slug } });
            if (plan) return plan;
        }

        // 3. Fallback: None (Fail Closed)
        return null;
    }

    private async getCurrentCount(tenantId: string, feature: Feature): Promise<number> {
        switch (feature) {
            case Feature.VEHICLES:
                return this.prisma.vehicle.count({ where: { tenantId, deletedAt: null } });
            case Feature.USERS:
                return this.prisma.user.count({ where: { tenantId } });
            case Feature.BRANCHES:
                return this.prisma.branch.count({ where: { tenantId } });
            case Feature.CUSTOMERS:
                return this.prisma.customer.count({ where: { tenantId, deletedAt: null } });
            case Feature.DEALER_GROUP:
                // Count members in own group
                // Logic: Find group owned by user (need userId? or derive from tenant?) 
                // DealerGroupService logic would be better here, or simplified:
                // For limits, we usually count items. Dealer Group creation is a boolean flag, 
                // but 'maxGroupMembers' is a limit.
                // Impl TBD depending on usage.
                return 0;
            default: return 0;
        }
    }

    private async getPlanName(tenantId: string): Promise<string> {
        const plan = await this.resolveTenantPlan(tenantId);
        return plan?.name || 'Unknown';
    }
}
