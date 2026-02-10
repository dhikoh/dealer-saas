import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DealerGroupService {
    constructor(private prisma: PrismaService) { }

    async createGroup(tenantId: string, name: string) {
        // Check if tenant is already in a group
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { dealerGroup: true },
        });

        if (!tenant) throw new NotFoundException('Tenant not found');

        if (tenant.dealerGroupId) {
            throw new BadRequestException('You are already in a dealer group');
        }

        // Generate unique 6-digit code
        let code = '';
        let isUnique = false;
        while (!isUnique) {
            code = Math.random().toString(36).substring(2, 8).toUpperCase(); // e.g., "AB12CD"
            const existing = await this.prisma.dealerGroup.findUnique({ where: { code } });
            if (!existing) isUnique = true;
        }

        // Create Group and assign Admin
        const group = await this.prisma.dealerGroup.create({
            data: {
                name,
                code,
                adminTenantId: tenantId,
                members: {
                    connect: { id: tenantId }, // Admin is also a member
                },
            },
        });

        return group;
    }

    async joinGroup(tenantId: string, code: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) throw new NotFoundException('Tenant not found');

        if (tenant.dealerGroupId) {
            throw new BadRequestException('You are already in a dealer group');
        }

        const group = await this.prisma.dealerGroup.findUnique({
            where: { code },
        });

        if (!group) {
            throw new NotFoundException('Group not found or invalid code');
        }

        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { dealerGroupId: group.id },
        });

        return { message: 'Successfully joined group', group };
    }

    async getMyGroup(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                dealerGroup: {
                    include: {
                        members: {
                            select: { id: true, name: true, phone: true, address: true },
                        },
                        adminTenant: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        if (!tenant) throw new NotFoundException('Tenant not found');

        if (!tenant.dealerGroupId) {
            return null;
        }

        return tenant.dealerGroup;
    }

    async leaveGroup(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { dealerGroup: true },
        });

        if (!tenant) throw new NotFoundException('Tenant not found');

        if (!tenant.dealerGroupId) {
            throw new BadRequestException('You are not in a group');
        }

        const group = tenant.dealerGroup;
        if (!group) {
            throw new BadRequestException('Group data not found');
        }

        // If Admin leaves, dissolve the group? Or assign new admin?
        // Current Logic: Admin cannot leave unless they delete the group (or simple leave = group dissolves for MVP)
        if (group.adminTenantId === tenantId) {
            // Option: Dissolve Group
            await this.prisma.tenant.updateMany({
                where: { dealerGroupId: group.id },
                data: { dealerGroupId: null },
            });
            await this.prisma.dealerGroup.delete({
                where: { id: group.id },
            });
            return { message: 'Group dissolved because Admin left' };
        } else {
            // Normal member leave
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: { dealerGroupId: null },
            });
            return { message: 'Left group successfully' };
        }
    }
}
