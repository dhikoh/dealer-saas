
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureLimitService } from '../billing/feature-limit.service';
import { Feature } from '../billing/features.enum';

@Injectable()
export class DealerGroupService {
    private readonly logger = new Logger(DealerGroupService.name);

    constructor(
        private prisma: PrismaService,
        private featureLimitService: FeatureLimitService,
    ) { }

    async createGroup(userId: string, name: string) {
        // userId comes from JWT — safe to use findUnique
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { tenantId: true },
        });

        if (!user?.tenantId) {
            throw new BadRequestException('User has no associated tenant');
        }

        // FEATURE GATE: Centralized boolean feature check (DB-only, fail-closed)
        await this.featureLimitService.assertFeatureEnabled(user.tenantId, Feature.DEALER_GROUP);

        const code = this.generateInviteCode(name);

        return this.prisma.dealerGroup.create({
            data: {
                name,
                code,
                ownerId: userId,
            },
        });
    }

    async joinGroup(tenantId: string, code: string) {
        // code is a public invite code — findUnique on unique field is safe (no IDOR: code is not an ID)
        const group = await this.prisma.dealerGroup.findUnique({ where: { code } });
        if (!group) throw new NotFoundException('Invalid invite code');

        // tenantId from JWT — safe
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');
        if (tenant.dealerGroupId) throw new BadRequestException('You are already in a dealer group');

        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: { dealerGroupId: group.id },
        });
    }

    async getMyGroup(userId: string) {
        try {
            // userId from JWT — safe to use findUnique (ownerId is @unique in schema)
            const groupOwned = await this.prisma.dealerGroup.findUnique({
                where: { ownerId: userId },
                include: {
                    members: {
                        include: {
                            plan: true,
                            _count: { select: { vehicles: true } },
                            transactions: {
                                where: { status: 'PAID', type: 'SALE' },
                                select: { finalPrice: true }
                            }
                        }
                    },
                    owner: { include: { tenant: true } }
                },
            });

            if (groupOwned) {
                return {
                    role: 'OWNER',
                    group: {
                        id: groupOwned.id,
                        name: groupOwned.name,
                        code: groupOwned.code,
                        adminTenant: groupOwned.owner?.tenant || null,
                        members: groupOwned.members.map(m => {
                            const transactions = m.transactions || [];
                            const revenue = transactions.reduce((acc, tx) => {
                                const price = tx.finalPrice ? Number(tx.finalPrice) : 0;
                                return acc + (isNaN(price) ? 0 : price);
                            }, 0);

                            const txCount = transactions.length;
                            const planName = m.plan?.name || m.planTier || 'Unknown';
                            const vehicleCount = m._count?.vehicles || 0;

                            return {
                                id: m.id,
                                name: m.name,
                                email: m.email,
                                phone: m.phone,
                                subscriptionStatus: m.subscriptionStatus,
                                nextBillingDate: m.nextBillingDate,
                                planName: planName,
                                stats: {
                                    vehicles: vehicleCount,
                                    transactions: txCount,
                                    revenue: revenue
                                }
                            };
                        })
                    }
                };
            }

            // userId from JWT — safe
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    tenant: {
                        include: {
                            dealerGroup: {
                                include: { owner: { include: { tenant: true } } }
                            }
                        }
                    }
                },
            });

            if (user?.tenant?.dealerGroup) {
                const grp = user.tenant.dealerGroup;
                return {
                    role: 'MEMBER',
                    group: {
                        id: grp.id,
                        name: grp.name,
                        code: grp.code,
                        adminTenant: grp.owner?.tenant || null
                    }
                };
            }

            return null;
        } catch (error) {
            this.logger.error('Error in getMyGroup', error instanceof Error ? error.stack : error);
            return null;
        }
    }

    async leaveGroup(tenantId: string, userId: string) {
        // tenantId from JWT — safe
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { dealerGroup: true },
        });

        if (!tenant || !tenant.dealerGroupId) {
            throw new BadRequestException('Anda tidak tergabung dalam grup dealer manapun');
        }

        // FIX: DealerGroup.ownerId stores userId (not tenantId).
        // Must compare with userId from JWT to correctly identify group owners.
        const ownedGroup = await this.prisma.dealerGroup.findFirst({
            where: { ownerId: userId },
        });
        if (ownedGroup && ownedGroup.id === tenant.dealerGroupId) {
            throw new BadRequestException('Pemilik grup tidak bisa meninggalkan grup. Hapus grup atau transfer kepemilikan terlebih dahulu.');
        }

        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: { dealerGroupId: null },
        });
    }

    async removeMember(ownerId: string, memberTenantId: string) {
        // ownerId is userId from JWT — safe (ownerId is @unique in schema)
        const group = await this.prisma.dealerGroup.findUnique({
            where: { ownerId },
            include: { members: true }
        });

        if (!group) throw new BadRequestException('Group not found or access denied');

        const isMember = group.members.some(m => m.id === memberTenantId);
        if (!isMember) throw new NotFoundException('Tenant is not a member of this group');

        return this.prisma.tenant.update({
            where: { id: memberTenantId },
            data: { dealerGroupId: null }
        });
    }

    private generateInviteCode(name: string): string {
        const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'GRP');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}-${random}`;
    }
}
