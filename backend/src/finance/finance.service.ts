import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    // ==================== OPERATING COST CRUD ====================

    async findAllCosts(tenantId: string, filters?: {
        startDate?: Date;
        endDate?: Date;
        category?: string;
    }) {
        const where: any = { tenantId };

        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = filters.startDate;
            if (filters.endDate) where.date.lte = filters.endDate;
        }

        if (filters?.category) {
            where.category = filters.category;
        }

        return this.prisma.operatingCost.findMany({
            where,
            orderBy: { date: 'desc' },
        });
    }

    async createCost(tenantId: string, data: {
        name: string;
        amount: number;
        category: string;
        date: string | Date;
        note?: string;
        proofImage?: string;
    }) {
        return this.prisma.operatingCost.create({
            data: {
                tenantId,
                name: data.name,
                amount: new Decimal(data.amount),
                category: data.category,
                date: new Date(data.date),
                note: data.note,
                proofImage: data.proofImage,
            },
        });
    }

    async updateCost(id: string, tenantId: string, data: any) {
        // Verify ownership
        const cost = await this.prisma.operatingCost.findFirst({
            where: { id, tenantId },
        });
        if (!cost) throw new NotFoundException('Biaya tidak ditemukan');

        const updateData = { ...data };
        if (updateData.amount) updateData.amount = new Decimal(updateData.amount);
        if (updateData.date) updateData.date = new Date(updateData.date);

        return this.prisma.operatingCost.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteCost(id: string, tenantId: string) {
        // Verify ownership
        const cost = await this.prisma.operatingCost.findFirst({
            where: { id, tenantId },
        });
        if (!cost) throw new NotFoundException('Biaya tidak ditemukan');

        return this.prisma.operatingCost.delete({
            where: { id },
        });
    }

    async getCostSummary(tenantId: string, startDate: Date, endDate: Date) {
        const costs = await this.prisma.operatingCost.groupBy({
            by: ['category'],
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true },
        });

        const total = costs.reduce((acc, curr) => acc + Number(curr._sum.amount || 0), 0);

        return {
            total,
            breakdown: costs.map(c => ({
                category: c.category,
                amount: Number(c._sum.amount || 0),
            })),
        };
    }
}
