
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionStateService, AccessLevel } from '../billing/subscription-state.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * SubscriptionGuard - Enforces billing/subscription status (GLOBAL)
 * 
 * Purpose: Prevents access for suspended/cancelled tenants while allowing
 * payment-related actions to restore service.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
    private readonly logger = new Logger(SubscriptionGuard.name);

    // Routes allowed even when suspended/grace (to allow payment)
    private readonly WHITELISTED_PATHS = [
        '/billing',
        '/invoice',
    ];

    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
        private subscriptionStateService: SubscriptionStateService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Skip @Public() routes
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // 2. Skip if no user (should be handled by JwtAuthGuard)
        if (!user) return true;

        // 3. Skip for SUPERADMIN
        if (user.role === 'SUPERADMIN') return true;

        // 4. Skip if no tenantId (e.g. initial onboarding)
        if (!user.tenantId) return true;

        // 5. Check if accessing Whitelisted Routes (Billing/Payment)
        // We allow access to billing routes so they can pay invoices
        const path = request.path || request.url;
        const isWhitelisted = this.WHITELISTED_PATHS.some(p => path.includes(p));

        if (isWhitelisted) {
            return true;
        }

        // 6. Fetch Tenant Status
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: { subscriptionStatus: true, suspensionType: true, name: true }
        });

        if (!tenant) {
            throw new ForbiddenException('Tenant not found');
        }

        // 7. Resolve Access Level via Service
        const accessLevel = this.subscriptionStateService.resolveAccess(tenant.subscriptionStatus, tenant.suspensionType);

        // 8. Enforce Access Policy
        if (accessLevel === AccessLevel.BLOCK) {
            this.logger.warn(`Blocked access for ${tenant.subscriptionStatus} tenant: ${user.tenantId}`);
            throw new ForbiddenException(`Access denied. Tenant status: ${tenant.subscriptionStatus}`);
        }

        if (accessLevel === AccessLevel.READ_ONLY) {
            // Allow only GET requests for Read-Only mode
            if (request.method !== 'GET') {
                this.logger.warn(`Blocked WRITE access for ${tenant.subscriptionStatus} tenant: ${user.tenantId}`);
                throw new ForbiddenException(`Account is in ${tenant.subscriptionStatus} state. Payment required to perform actions.`);
            }
        }

        return true;
    }
}
