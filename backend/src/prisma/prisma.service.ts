import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createTenantScope, TenantScopedProxy } from './tenant-scope.helper';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Returns a tenant-scoped Prisma proxy.
   * All queries on returned models auto-inject `where: { tenantId }`.
   * 
   * Usage:
   *   const scoped = this.prisma.forTenant(tenantId);
   *   scoped.vehicle.findMany({ where: { status: 'AVAILABLE' } });
   *   // → automatically adds tenantId to where clause
   * 
   * For cross-tenant or admin operations, use `this.prisma` directly.
   */
  forTenant(tenantId: string): TenantScopedProxy {
    return createTenantScope(this, tenantId);
  }
}
