import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPlanById, PLAN_TIERS, PlanTier } from '../config/plan-tiers.config';

@Injectable()
export class SuperadminService {
    constructor(private prisma: PrismaService) { }

    // ==================== DASHBOARD STATS ====================

    async getStats() {
        const [
            totalTenants,
            activeTenants,
            trialTenants,
            suspendedTenants,
            totalRevenue,
            pendingInvoices,
            recentActivity
        ] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE' } }),
            this.prisma.tenant.count({ where: { subscriptionStatus: 'TRIAL' } }),
            this.prisma.tenant.count({ where: { subscriptionStatus: 'SUSPENDED' } }),
            this.prisma.tenant.aggregate({
                _sum: { monthlyBill: true },
                where: { subscriptionStatus: 'ACTIVE' },
            }),
            (this.prisma as any).systemInvoice.count({
                where: { status: 'PENDING' },
            }),
            this.getRecentActivity(5),
        ]);

        // Calculate churn rate (simplified: suspended / total)
        const churnRate = totalTenants > 0
            ? ((suspendedTenants / totalTenants) * 100).toFixed(2)
            : '0';

        return {
            totalTenants,
            activeTenants,
            trialTenants,
            suspendedTenants,
            totalMrr: Number(totalRevenue._sum.monthlyBill || 0),
            pendingInvoices,
            churnRate: parseFloat(churnRate),
            recentActivity,
        };
    }

    // ==================== TENANT MANAGEMENT ====================

    async getTenants(filters?: { status?: string; planTier?: string; search?: string }) {
        const where: any = { deletedAt: null };

        if (filters?.status) {
            where.subscriptionStatus = filters.status;
        }
        if (filters?.planTier) {
            where.planTier = filters.planTier;
        }
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { email: { contains: filters.search } },
            ];
        }

        const tenants = await this.prisma.tenant.findMany({
            where,
            include: {
                _count: {
                    select: {
                        users: true,
                        vehicles: true,
                        customers: true,
                        transactions: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return tenants.map(t => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            email: t.email,
            phone: t.phone,
            planTier: t.planTier,
            planDetails: getPlanById(t.planTier),
            subscriptionStatus: t.subscriptionStatus,
            trialEndsAt: t.trialEndsAt,
            subscriptionEndsAt: t.subscriptionEndsAt,
            monthlyBill: Number(t.monthlyBill || 0),
            autoRenew: t.autoRenew,
            usage: {
                users: t._count.users,
                vehicles: t._count.vehicles,
                customers: t._count.customers,
                transactions: t._count.transactions,
            },
            createdAt: t.createdAt,
        }));
    }

    async getTenantById(id: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                users: {
                    select: { id: true, name: true, email: true, role: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: {
                        users: true,
                        vehicles: true,
                        customers: true,
                        transactions: true,
                        branches: true,
                    },
                },
            },
        });

        if (!tenant) return null;

        // Get recent invoices
        const invoices = await (this.prisma as any).systemInvoice.findMany({
            where: { tenantId: id },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        const plan = getPlanById(tenant.planTier);

        return {
            ...tenant,
            monthlyBill: Number(tenant.monthlyBill || 0),
            planDetails: plan,
            usage: {
                users: tenant._count.users,
                vehicles: tenant._count.vehicles,
                customers: tenant._count.customers,
                transactions: tenant._count.transactions,
                branches: tenant._count.branches,
            },
            limits: plan ? {
                usersLimit: plan.features.maxUsers,
                vehiclesLimit: plan.features.maxVehicles,
                customersLimit: plan.features.maxCustomers,
            } : null,
            recentInvoices: invoices,
        };
    }

    async updateTenant(id: string, data: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    }) {
        return this.prisma.tenant.update({
            where: { id },
            data,
        });
    }

    async updateTenantStatus(id: string, status: string) {
        return this.prisma.tenant.update({
            where: { id },
            data: { subscriptionStatus: status },
        });
    }

    async suspendTenant(id: string, reason?: string, adminId?: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: { subscriptionStatus: 'SUSPENDED' },
        });

        // Log activity
        if (adminId) {
            await this.logActivity({
                userId: adminId,
                action: 'TENANT_SUSPEND',
                entityType: 'TENANT',
                entityId: id,
                entityName: tenant.name,
                details: reason ? JSON.stringify({ reason }) : undefined,
            });
        }

        return tenant;
    }

    async activateTenant(id: string, adminId?: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: { subscriptionStatus: 'ACTIVE' },
        });

        if (adminId) {
            await this.logActivity({
                userId: adminId,
                action: 'TENANT_ACTIVATE',
                entityType: 'TENANT',
                entityId: id,
                entityName: tenant.name,
            });
        }

        return tenant;
    }

    async upgradeTenantPlan(id: string, newPlanTier: string, adminId?: string) {
        const plan = getPlanById(newPlanTier);
        if (!plan) throw new Error('Invalid plan tier');

        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: {
                planTier: newPlanTier,
                monthlyBill: plan.price,
                subscriptionStatus: 'ACTIVE',
            },
        });

        if (adminId) {
            await this.logActivity({
                userId: adminId,
                action: 'TENANT_UPGRADE',
                entityType: 'TENANT',
                entityId: id,
                entityName: tenant.name,
                details: JSON.stringify({ newPlan: newPlanTier }),
            });
        }

        return tenant;
    }

    // ==================== SOFT DELETE TENANT ====================

    async softDeleteTenant(id: string, adminId?: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) throw new NotFoundException('Tenant not found');
        if (tenant.deletedAt) throw new BadRequestException('Tenant already deleted');

        const updated = await this.prisma.tenant.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                subscriptionStatus: 'CANCELLED',
            },
        });

        if (adminId) {
            await this.logActivity({
                userId: adminId,
                action: 'TENANT_DELETE',
                entityType: 'TENANT',
                entityId: id,
                entityName: tenant.name,
            });
        }

        return updated;
    }

    // ==================== PLAN TIERS ====================

    getPlans() {
        return Object.values(PLAN_TIERS);
    }

    updatePlan(planId: string, data: Partial<PlanTier>) {
        const plan = PLAN_TIERS[planId];
        if (!plan) throw new NotFoundException('Plan not found');

        // Update in-memory config
        if (data.price !== undefined) plan.price = data.price;
        if (data.priceLabel !== undefined) plan.priceLabel = data.priceLabel;
        if (data.name !== undefined) plan.name = data.name;
        if (data.description !== undefined) plan.description = data.description;
        if (data.descriptionId !== undefined) plan.descriptionId = data.descriptionId;
        if (data.trialDays !== undefined) plan.trialDays = data.trialDays;
        if (data.yearlyDiscount !== undefined) plan.yearlyDiscount = data.yearlyDiscount;
        if (data.features) {
            plan.features = { ...plan.features, ...data.features };
        }

        return plan;
    }

    // ==================== INVOICES ====================

    async getInvoices(filters?: { status?: string; tenantId?: string }) {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.tenantId) {
            where.tenantId = filters.tenantId;
        }

        return (this.prisma as any).systemInvoice.findMany({
            where,
            include: { tenant: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async verifyInvoice(invoiceId: string, approved: boolean, adminId?: string, adminEmail?: string) {
        const newStatus = approved ? 'PAID' : 'CANCELLED';

        const invoice = await (this.prisma as any).systemInvoice.update({
            where: { id: invoiceId },
            data: { status: newStatus },
            include: { tenant: { select: { name: true, id: true } } },
        });

        // If approved, activate tenant subscription
        if (approved) {
            await this.prisma.tenant.update({
                where: { id: invoice.tenantId },
                data: {
                    subscriptionStatus: 'ACTIVE',
                    subscriptionStartedAt: new Date(),
                    subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });
        }

        // Log activity
        if (adminId) {
            await this.logActivity({
                userId: adminId,
                userEmail: adminEmail,
                action: approved ? 'INVOICE_APPROVE' : 'INVOICE_REJECT',
                entityType: 'INVOICE',
                entityId: invoiceId,
                entityName: invoice.invoiceNumber,
                details: JSON.stringify({ tenantId: invoice.tenantId, tenantName: invoice.tenant.name }),
            });
        }

        return invoice;
    }

    // ==================== CREATE INVOICE ====================

    async createInvoice(data: {
        tenantId: string;
        amount: number;
        dueDate: string;
        items?: string;
    }, adminId?: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: data.tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        // Auto-generate invoice number: INV-YYYY-NNN
        const year = new Date().getFullYear();
        const count = await (this.prisma as any).systemInvoice.count({
            where: {
                invoiceNumber: { startsWith: `INV-${year}` },
            },
        });
        const invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

        const invoice = await (this.prisma as any).systemInvoice.create({
            data: {
                tenantId: data.tenantId,
                invoiceNumber,
                amount: data.amount,
                dueDate: new Date(data.dueDate),
                status: 'PENDING',
                items: data.items,
            },
            include: { tenant: { select: { name: true, email: true } } },
        });

        if (adminId) {
            await this.logActivity({
                userId: adminId,
                action: 'INVOICE_CREATE',
                entityType: 'INVOICE',
                entityId: invoice.id,
                entityName: invoiceNumber,
                details: JSON.stringify({ tenantId: data.tenantId, tenantName: tenant.name, amount: data.amount }),
            });
        }

        return invoice;
    }

    // ==================== ACTIVITY LOG ====================

    async logActivity(data: {
        userId: string;
        userEmail?: string;
        action: string;
        entityType?: string;
        entityId?: string;
        entityName?: string;
        details?: string;
        ipAddress?: string;
    }) {
        return (this.prisma as any).adminActivityLog.create({
            data,
        });
    }

    async getRecentActivity(limit: number = 20) {
        return (this.prisma as any).adminActivityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getActivityByUser(userId: string) {
        return (this.prisma as any).adminActivityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    // ==================== ANALYTICS ====================

    async getPlanDistribution() {
        const plans = await this.prisma.tenant.groupBy({
            by: ['planTier'],
            _count: true,
        });

        return plans.map(p => ({
            plan: p.planTier,
            count: p._count,
            details: getPlanById(p.planTier),
        }));
    }

    async getMonthlyRevenue(months: number = 6) {
        // Simplified: return current MRR for each month (mock for now)
        // In production, this would aggregate from payment history
        const mrr = await this.prisma.tenant.aggregate({
            _sum: { monthlyBill: true },
            where: { subscriptionStatus: 'ACTIVE' },
        });

        const currentMrr = Number(mrr._sum.monthlyBill || 0);

        // Generate historical data (simplified)
        const data: { month: string; year: number; revenue: number }[] = [];
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            data.push({
                month: date.toLocaleString('id-ID', { month: 'short' }),
                year: date.getFullYear(),
                revenue: Math.floor(currentMrr * (0.8 + Math.random() * 0.4)), // Simulate variation
            });
        }

        return data;
    }

    // ==================== MARKETPLACE API ====================
    // API untuk aggregasi semua kendaraan dari semua tenant (untuk marketplace)

    async getMarketplaceVehicles(options: {
        page: number;
        limit: number;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        make?: string;
        location?: string;
        status?: string;
    }) {
        const { page, limit, category, minPrice, maxPrice, make, location, status } = options;
        const skip = (page - 1) * limit;

        const where: any = {
            status: status || 'AVAILABLE',
            tenant: {
                subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] }, // Hanya tenant aktif
            },
        };

        if (category) where.category = category;
        if (make) where.make = { contains: make, mode: 'insensitive' };
        if (minPrice) where.price = { ...where.price, gte: minPrice };
        if (maxPrice) where.price = { ...where.price, lte: maxPrice };
        if (location) {
            where.tenant = {
                ...where.tenant,
                address: { contains: location, mode: 'insensitive' },
            };
        }

        const [vehicles, total] = await Promise.all([
            this.prisma.vehicle.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            address: true,
                            phone: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.vehicle.count({ where }),
        ]);

        return {
            data: vehicles.map(v => ({
                id: v.id,
                category: v.category,
                make: v.make,
                model: v.model,
                variant: v.variant,
                year: v.year,
                color: v.color,
                price: Number(v.price),
                status: v.status,
                condition: v.condition,
                licensePlate: v.licensePlate,
                images: v.images,
                specs: v.specs,
                // Dealer/Showroom info
                dealer: {
                    id: v.tenant.id,
                    name: v.tenant.name,
                    slug: v.tenant.slug,
                    address: v.tenant.address,
                    phone: v.tenant.phone,
                    email: v.tenant.email,
                },
                createdAt: v.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getMarketplaceVehicleDetail(vehicleId: string) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                status: 'AVAILABLE',
                tenant: {
                    subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] },
                },
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        address: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });

        if (!vehicle) {
            return null;
        }

        return {
            id: vehicle.id,
            category: vehicle.category,
            make: vehicle.make,
            model: vehicle.model,
            variant: vehicle.variant,
            year: vehicle.year,
            color: vehicle.color,
            price: Number(vehicle.price),
            status: vehicle.status,
            condition: vehicle.condition,
            licensePlate: vehicle.licensePlate,
            images: vehicle.images,
            specs: vehicle.specs,
            stnkExpiry: vehicle.stnkExpiry,
            bpkbAvailable: vehicle.bpkbAvailable,
            dealer: {
                id: vehicle.tenant.id,
                name: vehicle.tenant.name,
                slug: vehicle.tenant.slug,
                address: vehicle.tenant.address,
                phone: vehicle.tenant.phone,
                email: vehicle.tenant.email,
            },
            createdAt: vehicle.createdAt,
        };
    }


    async getMarketplaceDealers(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options;
        const skip = (page - 1) * limit;

        const where: any = {
            subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] },
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [dealers, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    address: true,
                    phone: true,
                    email: true,
                    createdAt: true,
                    _count: {
                        select: {
                            vehicles: {
                                where: { status: 'AVAILABLE' },
                            },
                        },
                    },
                },
            }),
            this.prisma.tenant.count({ where }),
        ]);

        return {
            data: dealers.map(d => ({
                id: d.id,
                name: d.name,
                slug: d.slug,
                address: d.address,
                phone: d.phone,
                email: d.email,
                vehicleCount: d._count.vehicles,
                createdAt: d.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getMarketplaceStats() {
        const [
            totalVehicles,
            totalDealers,
            vehiclesByCategory,
            priceRange,
        ] = await Promise.all([
            this.prisma.vehicle.count({
                where: {
                    status: 'AVAILABLE',
                    tenant: { subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] } },
                },
            }),
            this.prisma.tenant.count({
                where: { subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] } },
            }),
            this.prisma.vehicle.groupBy({
                by: ['category'],
                where: {
                    status: 'AVAILABLE',
                    tenant: { subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] } },
                },
                _count: { id: true },
            }),
            this.prisma.vehicle.aggregate({
                where: {
                    status: 'AVAILABLE',
                    tenant: { subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] } },
                },
                _min: { price: true },
                _max: { price: true },
                _avg: { price: true },
            }),
        ]);

        return {
            totalVehicles,
            totalDealers,
            vehiclesByCategory: vehiclesByCategory.map(c => ({
                category: c.category,
                count: c._count.id,
            })),
            priceRange: {
                min: Number(priceRange._min.price || 0),
                max: Number(priceRange._max.price || 0),
                avg: Number(priceRange._avg.price || 0),
            },
        };
    }
}

