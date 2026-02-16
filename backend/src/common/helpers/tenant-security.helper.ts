import { ForbiddenException } from '@nestjs/common';

/**
 * TENANT SECURITY UTILITIES
 * 
 * Centralized helpers for multi-tenant security enforcement.
 * These work at RUNTIME (not just TypeScript compile-time).
 */

/**
 * Extract and validate tenantId from the authenticated user.
 * 
 * - Regular users: returns their JWT tenantId
 * - SUPERADMIN: returns overrideTenantId if provided, otherwise null
 * - Throws ForbiddenException if a non-SUPERADMIN user has no tenantId
 * 
 * @param user - The authenticated user from JWT (req.user)
 * @param overrideTenantId - Optional tenant override (only for SUPERADMIN)
 */
export function getTenantId(
    user: { role: string; tenantId?: string },
    overrideTenantId?: string,
): string {
    if (user.role === 'SUPERADMIN') {
        // SUPERADMIN can operate on any tenant
        return overrideTenantId || user.tenantId || '';
    }

    if (!user.tenantId) {
        throw new ForbiddenException('Access denied: No tenant associated with this user');
    }

    return user.tenantId;
}

/**
 * List of fields that must NEVER be accepted from client input.
 * These are system-managed fields that could be exploited for:
 * - Tenant ID injection (cross-tenant access)
 * - ID manipulation (IDOR)
 * - Timestamp forgery
 */
const PROTECTED_FIELDS = ['id', 'tenantId', 'createdAt', 'updatedAt', 'deletedAt'] as const;

/**
 * Strip all protected/system fields from user input at RUNTIME.
 * 
 * This is the critical defense against tenantId injection attacks.
 * TypeScript's Omit<> only works at compile time — a malicious client
 * can still send { tenantId: "other-tenant" } in the JSON body.
 * 
 * Usage:
 *   const safeData = sanitizeInput(req.body);
 *   await prisma.vehicle.create({ data: { ...safeData, tenantId } });
 * 
 * @param data - Raw input from request body
 * @returns Cleaned data without protected fields
 */
export function sanitizeInput<T extends Record<string, any>>(data: T): Omit<T, typeof PROTECTED_FIELDS[number]> {
    const sanitized = { ...data };
    for (const field of PROTECTED_FIELDS) {
        delete sanitized[field];
    }
    return sanitized;
}
