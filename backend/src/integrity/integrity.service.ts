
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

export interface DiagnosticResult {
    name: string;
    severity: 'INFO' | 'WARN' | 'CRITICAL';
    count: number;
    details: Record<string, unknown>[];
}

@Injectable()
export class IntegrityService {
    private readonly logger = new Logger(IntegrityService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Runs daily at 03:00 AM (after Billing@01:00 and Cleanup@02:00)
     * Performs 5 read-only health checks and logs structured results.
     */
    @Cron('0 3 * * *')
    async runDiagnostics(): Promise<DiagnosticResult[]> {
        this.logger.log('🩺 Running integrity diagnostics...');
        const results: DiagnosticResult[] = [];

        const checks = [
            () => this.checkOrphanVehicles(),
            () => this.checkOrphanUsers(),
            () => this.checkZombieSessions(),
            () => this.checkOverLimitTenants(),
            () => this.checkPlanlessTenants(),
        ];

        for (const check of checks) {
            try {
                const result = await check();
                results.push(result);

                if (result.count > 0) {
                    const logFn = result.severity === 'CRITICAL'
                        ? this.logger.error.bind(this.logger)
                        : result.severity === 'WARN'
                            ? this.logger.warn.bind(this.logger)
                            : this.logger.log.bind(this.logger);

                    logFn(`[${result.severity}] ${result.name}: ${result.count} issue(s) found`);
                    logFn(JSON.stringify(result.details.slice(0, 5), null, 2));
                } else {
                    this.logger.log(`✅ ${result.name}: OK`);
                }
            } catch (error) {
                this.logger.error(`❌ Check failed: ${error.message}`);
                results.push({
                    name: 'UNKNOWN',
                    severity: 'CRITICAL',
                    count: -1,
                    details: [{ error: error.message }],
                });
            }
        }

        this.logger.log(`🩺 Diagnostics complete. ${results.filter(r => r.count > 0).length}/${results.length} checks flagged.`);
        return results;
    }

    // ============ CHECK 1: Orphan Vehicles ============
    // Vehicles whose tenantId points to a soft-deleted tenant
    private async checkOrphanVehicles(): Promise<DiagnosticResult> {
        const orphans = await this.prisma.vehicle.findMany({
            where: {
                tenant: {
                    deletedAt: { not: null },
                },
            },
            select: {
                id: true,
                make: true,
                model: true,
                tenantId: true,
            },
            take: 20,
        });

        return {
            name: 'Orphan Vehicles',
            severity: orphans.length > 0 ? 'WARN' : 'INFO',
            count: orphans.length,
            details: orphans.map(v => ({
                vehicleId: v.id,
                make: v.make,
                model: v.model,
                tenantId: v.tenantId,
            })),
        };
    }

    // ============ CHECK 2: Orphan Users ============
    // Users whose tenantId points to a soft-deleted tenant
    private async checkOrphanUsers(): Promise<DiagnosticResult> {
        const orphans = await this.prisma.user.findMany({
            where: {
                tenantId: { not: null },
                tenant: {
                    deletedAt: { not: null },
                },
            },
            select: {
                id: true,
                email: true,
                tenantId: true,
            },
            take: 20,
        });

        return {
            name: 'Orphan Users',
            severity: orphans.length > 0 ? 'WARN' : 'INFO',
            count: orphans.length,
            details: orphans.map(u => ({
                userId: u.id,
                email: u.email,
                tenantId: u.tenantId,
            })),
        };
    }

    // ============ CHECK 3: Zombie Sessions ============
    // Users with active refresh tokens AFTER their tenant was suspended/cancelled
    // Uses RefreshToken.createdAt as proxy for "last login" since User has no lastLoginAt field
    private async checkZombieSessions(): Promise<DiagnosticResult> {
        const zombieTokens = await this.prisma.refreshToken.findMany({
            where: {
                user: {
                    tenant: {
                        subscriptionStatus: { in: ['SUSPENDED', 'CANCELLED'] },
                        subscriptionEndsAt: { not: null },
                    },
                },
            },
            select: {
                id: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                subscriptionStatus: true,
                                subscriptionEndsAt: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Filter: only tokens created AFTER subscription expired
        const actual = zombieTokens.filter(t =>
            t.user.tenant?.subscriptionEndsAt &&
            t.createdAt > t.user.tenant.subscriptionEndsAt
        );

        return {
            name: 'Zombie Sessions',
            severity: actual.length > 0 ? 'CRITICAL' : 'INFO',
            count: actual.length,
            details: actual.map(t => ({
                tokenId: t.id,
                tokenCreatedAt: t.createdAt.toISOString(),
                userId: t.user.id,
                email: t.user.email,
                tenantId: t.user.tenant?.id,
                tenantName: t.user.tenant?.name,
                status: t.user.tenant?.subscriptionStatus,
                expiredAt: t.user.tenant?.subscriptionEndsAt?.toISOString(),
            })),
        };
    }

    // ============ CHECK 4: Over-Limit Tenants ============
    // Tenants with more resources than their plan allows
    private async checkOverLimitTenants(): Promise<DiagnosticResult> {
        const tenants = await this.prisma.tenant.findMany({
            where: {
                deletedAt: null,
                planId: { not: null },
            },
            include: {
                plan: {
                    select: {
                        maxVehicles: true,
                        maxUsers: true,
                        maxBranches: true,
                        maxCustomers: true,
                    },
                },
                _count: {
                    select: {
                        vehicles: true,
                        users: true,
                        branches: true,
                        customers: true,
                    },
                },
            },
        });

        const overLimit = tenants.filter(t => {
            if (!t.plan) return false;
            const p = t.plan;
            const c = t._count;
            return (
                (p.maxVehicles !== -1 && c.vehicles > p.maxVehicles) ||
                (p.maxUsers !== -1 && c.users > p.maxUsers) ||
                (p.maxBranches !== -1 && c.branches > p.maxBranches) ||
                (p.maxCustomers !== -1 && c.customers > p.maxCustomers)
            );
        });

        return {
            name: 'Over-Limit Tenants',
            severity: overLimit.length > 0 ? 'INFO' : 'INFO',
            count: overLimit.length,
            details: overLimit.slice(0, 10).map(t => ({
                tenantId: t.id,
                tenantName: t.name,
                limits: t.plan,
                actual: t._count,
            })),
        };
    }

    // ============ CHECK 5: Planless Tenants ============
    // Active tenants with no plan assigned
    private async checkPlanlessTenants(): Promise<DiagnosticResult> {
        const planless = await this.prisma.tenant.findMany({
            where: {
                deletedAt: null,
                planId: null,
            },
            select: {
                id: true,
                name: true,
                subscriptionStatus: true,
                createdAt: true,
            },
            take: 20,
        });

        return {
            name: 'Planless Tenants',
            severity: planless.length > 0 ? 'WARN' : 'INFO',
            count: planless.length,
            details: planless.map(t => ({
                tenantId: t.id,
                tenantName: t.name,
                status: t.subscriptionStatus,
                createdAt: t.createdAt.toISOString(),
            })),
        };
    }
}
