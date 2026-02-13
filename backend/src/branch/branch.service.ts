
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchService {
    constructor(private prisma: PrismaService) { }

    async create(data: any, tenantId: string) {
        return this.prisma.branch.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async findAll(tenantId: string) {
        if (!tenantId) return []; // Handle Superadmin or specialized cases
        return this.prisma.branch.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { vehicles: true, users: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        const branch = await this.prisma.branch.findFirst({
            where: { id, tenantId },
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
        await this.findOne(id, tenantId); // Validate existence

        // SECURITY: Strip dangerous fields before update
        const safeData = { ...data };
        delete safeData.id;
        delete safeData.tenantId;
        delete safeData.createdAt;
        delete safeData.updatedAt;

        return this.prisma.branch.update({
            where: { id },
            data: safeData,
        });
    }

    async remove(id: string, tenantId: string) {
        await this.findOne(id, tenantId); // Validate existence

        // TODO: Add check for active transactions if necessary.
        // Ideally should soft-delete or prevent if related data exists.

        return this.prisma.branch.delete({
            where: { id },
        });
    }
}
