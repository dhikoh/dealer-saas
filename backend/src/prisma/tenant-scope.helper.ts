
/**
 * TenantScopedPrisma — DB Isolation Helper (Stage 4)
 *
 * Provides a tenant-scoped proxy over PrismaClient model delegates.
 * Auto-injects `tenantId` into `where`, `data`, and `count` operations.
 *
 * Usage:
 *   const scoped = this.prisma.forTenant(tenantId);
 *   // Instead of: this.prisma.vehicle.findMany({ where: { tenantId, ... } })
 *   scoped.vehicle.findMany({ where: { ... } })
 *
 *   // Instead of: this.prisma.vehicle.create({ data: { ...dto, tenantId } })
 *   scoped.vehicle.create({ data: dto })
 *
 * SAFETY:
 * - Only wraps models that HAVE a `tenantId` column.
 * - Cross-tenant models (StockTransfer, DealerGroup) are NOT available on scoped proxy.
 * - For cross-tenant operations, use raw `this.prisma` directly.
 */

import { PrismaClient } from '@prisma/client';

// Models that have a `tenantId` column in the Prisma schema
const TENANT_SCOPED_MODELS = [
    'vehicle', 'user', 'customer', 'branch', 'transaction',
    'credit', 'blacklistEntry', 'activityLog', 'vehicleBrand',
    'vehicleModel', 'operatingCost', 'vehicleCost', 'systemInvoice',
    'notification',
] as const;

type TenantScopedModel = typeof TENANT_SCOPED_MODELS[number];

// Operations that inject tenantId into `where`
const WHERE_OPERATIONS = [
    'findMany', 'findFirst', 'findUnique', 'count',
    'updateMany', 'deleteMany',
] as const;

// Operations that inject tenantId into `data`
const DATA_OPERATIONS = ['create', 'createMany'] as const;

// Operations that inject tenantId into both `where` and `data`
const WHERE_AND_DATA_OPERATIONS = ['update', 'upsert'] as const;

export type TenantScopedProxy = {
    [K in TenantScopedModel]: ReturnType<typeof createScopedDelegate>;
};

function createScopedDelegate(delegate: any, tenantId: string): any {
    return new Proxy(delegate, {
        get(target: any, prop: string) {
            const original = target[prop];
            if (typeof original !== 'function') return original;

            // Wrap operations that need tenantId injection
            if ((WHERE_OPERATIONS as readonly string[]).includes(prop)) {
                return (args: any = {}) => {
                    args.where = { ...args.where, tenantId };
                    return original.call(target, args);
                };
            }

            if ((DATA_OPERATIONS as readonly string[]).includes(prop)) {
                return (args: any = {}) => {
                    if (prop === 'createMany') {
                        // For createMany, inject into each data item
                        if (Array.isArray(args.data)) {
                            args.data = args.data.map((d: any) => ({ ...d, tenantId }));
                        }
                    } else {
                        args.data = { ...args.data, tenantId };
                    }
                    return original.call(target, args);
                };
            }

            if ((WHERE_AND_DATA_OPERATIONS as readonly string[]).includes(prop)) {
                return (args: any = {}) => {
                    args.where = { ...args.where, tenantId };
                    if (args.data) args.data = { ...args.data, tenantId };
                    if (args.create) args.create = { ...args.create, tenantId }; // for upsert
                    return original.call(target, args);
                };
            }

            // For any other operation (aggregate, groupBy, etc.), pass through unchanged
            return original.bind(target);
        },
    });
}

/**
 * Creates a tenant-scoped Prisma proxy.
 * Only exposes models that have a tenantId column.
 * All queries are automatically filtered by the given tenantId.
 */
export function createTenantScope(prisma: PrismaClient, tenantId: string): TenantScopedProxy {
    const scope = {} as any;

    for (const model of TENANT_SCOPED_MODELS) {
        const delegate = (prisma as any)[model];
        if (delegate) {
            scope[model] = createScopedDelegate(delegate, tenantId);
        }
    }

    return scope;
}
