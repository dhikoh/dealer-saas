import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPlanById } from '../config/plan-tiers.config';

@Injectable()
export class VehicleService {
    constructor(private prisma: PrismaService) { }

    // ==================== VEHICLE CRUD ====================

    async findAll(tenantId: string, filters?: {
        category?: string;
        status?: string;
        condition?: string;
        branchId?: string;
    }) {
        return this.prisma.vehicle.findMany({
            where: {
                tenantId,
                ...(filters?.category && { category: filters.category }),
                ...(filters?.status && { status: filters.status }),
                ...(filters?.condition && { condition: filters.condition }),
                ...(filters?.branchId && { branchId: filters.branchId }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.vehicle.findFirst({
            where: { id, tenantId },
        });
    }

    async create(tenantId: string, data: any) {
        // Check plan limit
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { _count: { select: { vehicles: true } } },
        });

        if (tenant) {
            const plan = getPlanById(tenant.planTier);
            if (plan && plan.features.maxVehicles !== -1) {
                if (tenant._count.vehicles >= plan.features.maxVehicles) {
                    throw new BadRequestException(
                        `Batas kendaraan tercapai (${plan.features.maxVehicles} kendaraan). Upgrade plan untuk menambah lebih banyak.`
                    );
                }
            }
        }

        return this.prisma.vehicle.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async update(id: string, tenantId: string, data: any) {
        return this.prisma.vehicle.update({
            where: { id },
            data,
        });
    }

    async delete(id: string, tenantId: string) {
        return this.prisma.vehicle.delete({
            where: { id },
        });
    }

    // ==================== MASTER DATA (Brands & Models) ====================

    async findAllBrands(tenantId: string, category?: string) {
        return this.prisma.vehicleBrand.findMany({
            where: {
                tenantId,
                ...(category && { category }),
            },
            include: { models: true },
            orderBy: { name: 'asc' },
        });
    }

    async createBrand(tenantId: string, name: string, category: string) {
        return this.prisma.vehicleBrand.upsert({
            where: {
                tenantId_name_category: { tenantId, name, category },
            },
            update: {},
            create: { tenantId, name, category },
        });
    }

    async createModel(brandId: string, name: string, variants?: string) {
        return this.prisma.vehicleModel.upsert({
            where: {
                brandId_name: { brandId, name },
            },
            update: { variants },
            create: { brandId, name, variants },
        });
    }

    // ==================== STATS ====================

    async getStats(tenantId: string) {
        const [total, available, sold, repair] = await Promise.all([
            this.prisma.vehicle.count({ where: { tenantId } }),
            this.prisma.vehicle.count({ where: { tenantId, status: 'AVAILABLE' } }),
            this.prisma.vehicle.count({ where: { tenantId, status: 'SOLD' } }),
            this.prisma.vehicle.count({ where: { tenantId, condition: 'REPAIR' } }),
        ]);

        return { total, available, sold, repair };
    }

    // ==================== VEHICLE COST TRACKING ====================

    async getCosts(vehicleId: string) {
        return this.prisma.vehicleCost.findMany({
            where: { vehicleId },
            orderBy: { date: 'desc' },
        });
    }

    async addCost(vehicleId: string, data: {
        costType: string;
        amount: number;
        description?: string;
        date: Date;
        receiptImage?: string;
    }) {
        return this.prisma.vehicleCost.create({
            data: {
                vehicleId,
                costType: data.costType,
                amount: data.amount,
                description: data.description,
                date: data.date,
                receiptImage: data.receiptImage,
            },
        });
    }

    async deleteCost(costId: string) {
        return this.prisma.vehicleCost.delete({
            where: { id: costId },
        });
    }

    // Get vehicle with full cost breakdown and profit calculation
    async getVehicleWithCosts(vehicleId: string, tenantId: string) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId },
        }) as any;

        if (!vehicle) return null;

        // Manually fetch costs to be safe against stale client
        let costs = [];
        try {
            costs = await (this.prisma as any).vehicleCost.findMany({
                where: { vehicleId },
                orderBy: { date: 'desc' },
            });
        } catch (e) {
            costs = [];
        }

        vehicle.costs = costs;

        // Calculate totals
        const purchasePrice = Number(vehicle.purchasePrice || 0);
        const sellingPrice = Number(vehicle.price || 0);
        const additionalCosts = vehicle.costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
        const totalCost = purchasePrice + additionalCosts;
        const profitMargin = sellingPrice - totalCost;

        return {
            ...vehicle,
            costSummary: {
                purchasePrice,
                additionalCosts,
                totalCost,
                sellingPrice,
                profitMargin,
                profitPercentage: totalCost > 0 ? ((profitMargin / totalCost) * 100).toFixed(2) : 0,
            },
        };
    }
}
