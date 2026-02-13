
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DealerGroupService {
    constructor(private prisma: PrismaService) { }

    async createGroup(userId: string, name: string) {
        // 1. Check if user is Enterprise Plan
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: { include: { plan: true } } },
        });

        if (!user?.tenant?.plan?.canCreateGroup) {
            throw new BadRequestException('Upgrade to Enterprise plan to create a Dealer Group');
        }

        // 2. Generate Invite Code
        const code = this.generateInviteCode(name);

        // 3. Create Group
        return this.prisma.dealerGroup.create({
            data: {
                name,
                code,
                ownerId: userId,
            },
        });
    }

    async joinGroup(tenantId: string, code: string) {
        const group = await this.prisma.dealerGroup.findUnique({ where: { code } });
        if (!group) throw new NotFoundException('Invalid invite code');

        // Check if already in a group
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
            // Check if user is owner
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

            // Check if user is member
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
            console.error('Error in getMyGroup:', error);
            // Return null instead of crashing, allowing frontend to proceed
            // or rethrow if strictly needed, but 500 is bad UX.
            // Letting it return null means "No Group" which is safe fallback.
            return null;
        }
    }

    async leaveGroup(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { dealerGroup: true },
        });

        if (!tenant || !tenant.dealerGroupId) {
            throw new BadRequestException('Anda tidak tergabung dalam grup dealer manapun');
        }

        // Check if tenant is the group owner — owners cannot leave, they must transfer or delete
        const ownedGroup = await this.prisma.dealerGroup.findFirst({
            where: { ownerId: tenantId },
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
        const group = await this.prisma.dealerGroup.findUnique({
            where: { ownerId },
            include: { members: true }
        });

        if (!group) throw new BadRequestException('Group not found or access denied');

        // Verify member belongs to group
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
