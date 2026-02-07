import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const headerTenantId = request.headers['x-tenant-id'];

        // Skip for SUPERADMIN - they can access any tenant
        if (user?.role === 'SUPERADMIN') {
            return true;
        }

        // For regular users, ensure tenant isolation
        if (user?.tenantId && headerTenantId) {
            if (user.tenantId !== headerTenantId) {
                throw new ForbiddenException('Access denied: Tenant mismatch');
            }
        }

        // If user has tenantId, attach it to request for convenience
        if (user?.tenantId) {
            request.tenantId = user.tenantId;
        }

        return true;
    }
}
