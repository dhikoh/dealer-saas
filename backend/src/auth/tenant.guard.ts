import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * TenantGuard - Enforces strict tenant isolation
 * 
 * Security principle: The user's tenantId from JWT is the TRUSTED source.
 * The X-Tenant-ID header is only used for SUPERADMIN cross-tenant operations.
 * 
 * Rules:
 * - SUPERADMIN: Can access any tenant via X-Tenant-ID header
 * - Regular users: ALWAYS use their JWT tenantId, reject mismatched headers
 */
@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const headerTenantId = request.headers['x-tenant-id'];

        // No user = let other guards handle (probably @Public route)
        if (!user) {
            return true;
        }

        // SUPERADMIN: Can access any tenant
        if (user.role === 'SUPERADMIN') {
            // For SUPERADMIN, use header tenantId if provided, otherwise null
            request.tenantId = headerTenantId || null;
            return true;
        }

        // Regular users MUST have a tenantId from their JWT
        if (!user.tenantId) {
            throw new ForbiddenException('Access denied: No tenant associated with this user');
        }

        // SECURITY: If client sends a different X-Tenant-ID header, reject immediately
        if (headerTenantId && headerTenantId !== user.tenantId) {
            throw new ForbiddenException('Access denied: Tenant mismatch');
        }

        // ALWAYS use the user's tenantId from JWT (trusted source)
        request.tenantId = user.tenantId;

        return true;
    }
}

