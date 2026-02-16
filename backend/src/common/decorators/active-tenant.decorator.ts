import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * @ActiveTenant Decorator
 * 
 * Safely extracts `tenantId` from the request. 
 * This MUST be used in controllers to ensure we never trust client-provided tenantId.
 * 
 * Usage:
 * @Get()
 * findAll(@ActiveTenant() tenantId: string) { ... }
 */
export const ActiveTenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        // 1. Basic Safety Check
        if (!user) {
            throw new ForbiddenException('User context not found. Ensure JwtAuthGuard is used.');
        }

        // 2. Strict Tenant Presence Check
        // Note: SUPERADMIN might not have a tenantId, but for tenant-scoped endpoints, this is required.
        // If an endpoint is shared (Superadmin + Tenant), the guard logic usually handles injection.
        // This decorator enforces "If you call this, you MUST have a target tenant".
        if (!request.tenantId) {
            throw new ForbiddenException('No active tenant found for this request.');
        }

        return request.tenantId;
    },
);
