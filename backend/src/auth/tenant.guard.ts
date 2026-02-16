import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * TenantGuard - Enforces strict tenant isolation (GLOBAL)
 * 
 * Security principle: The user's tenantId from JWT is the TRUSTED source.
 * The X-Tenant-ID header is only used for SUPERADMIN cross-tenant operations.
 * 
 * Execution order (registered in app.module.ts):
 *   1. JwtAuthGuard    → authenticates user
 *   2. UserStateGuard  → checks email verified + onboarding
 *   3. TenantGuard     → enforces tenant isolation (this guard)
 * 
 * Rules:
 * - @Public() routes: Skip entirely (no user context available)
 * - SUPERADMIN: Can access any tenant via X-Tenant-ID header
 * - Regular users: ALWAYS use their JWT tenantId, reject mismatched headers
 */
@Injectable()
export class TenantGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 1. Skip @Public() routes — no user context available
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // 2. No user = let other guards handle (shouldn't happen after JwtAuthGuard)
        if (!user) {
            return true;
        }

        const headerTenantId = request.headers['x-tenant-id'];

        // 3. SUPERADMIN: Can access any tenant
        if (user.role === 'SUPERADMIN') {
            // For SUPERADMIN, use header tenantId if provided, otherwise null
            request.tenantId = headerTenantId || null;
            return true;
        }

        // 4. Regular users MUST have a tenantId from their JWT
        if (!user.tenantId) {
            throw new ForbiddenException('Access denied: No tenant associated with this user');
        }

        // 5. SECURITY: If client sends a different X-Tenant-ID header, reject immediately
        if (headerTenantId && headerTenantId !== user.tenantId) {
            throw new ForbiddenException('Access denied: Tenant mismatch');
        }

        // 6. ALWAYS use the user's tenantId from JWT (trusted source)
        request.tenantId = user.tenantId;

        return true;
    }
}
