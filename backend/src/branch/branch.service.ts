import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureLimitService } from '../billing/feature-limit.service';
import { Feature } from '../billing/features.enum';

@Injectable()
export class BranchService {
    constructor(
        private prisma: PrismaService,
        private featureLimitService: FeatureLimitService,
    ) { }

    async create(data: any, tenantId: string) {
        // FEATURE GATE: Centralized branch limit check (DB-only, fail-closed)
        await this.featureLimitService.assertCanCreate(tenantId, Feature.BRANCHES);

        const scoped = this.prisma.forTenant(tenantId);
        return scoped.branch.create({
            data,
        });
    }

    async findAll(tenantId: string) {
        if (!tenantId) return []; // Handle Superadmin or specialized cases
        const scoped = this.prisma.forTenant(tenantId);
        return scoped.branch.findMany({
            where: {},
            include: {
                _count: {
                    select: { vehicles: true, users: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        const scoped = this.prisma.forTenant(tenantId);
        const branch = await scoped.branch.findFirst({
            where: { id },
            include: {
                users: {
                    select: { id: true, name: true, role: true, email: true },
                },
            },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        return branch;
    }

    async update(id: string, data: any, tenantId: string) {
        await this.findOne(id, tenantId); // Validate existence + ownership

        // SECURITY: Strip dangerous fields before update
        const safeData = { ...data };
        delete safeData.id;
        delete safeData.tenantId;
        delete safeData.createdAt;
        delete safeData.updatedAt;

        // HARDENED: tenantId auto-injected into where clause
        const scoped = this.prisma.forTenant(tenantId);
        return scoped.branch.update({
            where: { id },
            data: safeData,
        });
    }

    async remove(id: string, tenantId: string) {
        await this.findOne(id, tenantId); // Validate existence + ownership

        // HARDENED: tenantId auto-injected into where clause
        // Previously used this.prisma.branch.delete({ where: { id } }) — no tenant scoping!
        const scoped = this.prisma.forTenant(tenantId);
        return scoped.branch.delete({
            where: { id },
        });
    }
}
