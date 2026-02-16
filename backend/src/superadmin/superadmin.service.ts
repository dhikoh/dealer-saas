import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPlanById, PLAN_TIERS, PlanTier } from '../config/plan-tiers.config';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { CreateInvoiceDto } from './dto/invoice.dto';

@Injectable()
export class SuperadminService {
    private readonly logger = new Logger(SuperadminService.name);

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
            this.prisma.systemInvoice.count({
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

        // 1. Fetch Tenants
        const tenants = await this.prisma.tenant.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        if (tenants.length === 0) return [];

        const tenantIds = tenants.map(t => t.id);

        // 2. Fetch Active Counts using GroupBy (Performance Optimized)
        const [userCounts, vehicleCounts, customerCounts, transactionCounts] = await Promise.all([
            this.prisma.user.groupBy({
                by: ['tenantId'],
                where: { tenantId: { in: tenantIds }, deletedAt: null },
                _count: { id: true },
            }),
            this.prisma.vehicle.groupBy({
                by: ['tenantId'],
                where: { tenantId: { in: tenantIds }, deletedAt: null },
                _count: { id: true },
            }),
            this.prisma.customer.groupBy({
                by: ['tenantId'],
                where: { tenantId: { in: tenantIds }, deletedAt: null },
                _count: { id: true },
            }),
            this.prisma.transaction.groupBy({
                by: ['tenantId'],
                where: { tenantId: { in: tenantIds }, deletedAt: null },
                _count: { id: true },
            }),
        ]);

        // Helper to get count
        const getCount = (arr: any[], tenantId: string) =>
            arr.find(x => x.tenantId === tenantId)?._count.id || 0;

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
                users: getCount(userCounts, t.id),
                vehicles: getCount(vehicleCounts, t.id),
                customers: getCount(customerCounts, t.id),
                transactions: getCount(transactionCounts, t.id),
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
                    where: { deletedAt: null }, // Only active users in detailed view
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!tenant) return null;

        // Get recent invoices
        const invoices = await this.prisma.systemInvoice.findMany({
            where: { tenantId: id },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // Get exact active counts
        const [usersCount, vehiclesCount, customersCount, transactionsCount, branchesCount] = await Promise.all([
            this.prisma.user.count({ where: { tenantId: id, deletedAt: null } }),
            this.prisma.vehicle.count({ where: { tenantId: id, deletedAt: null } }),
            this.prisma.customer.count({ where: { tenantId: id, deletedAt: null } }),
            this.prisma.transaction.count({ where: { tenantId: id, deletedAt: null } }),
            this.prisma.branch.count({ where: { tenantId: id } }), // Branch usually doesn't have soft delete yet, but if it does, add it
        ]);

        const plan = getPlanById(tenant.planTier);

        return {
            ...tenant,
            monthlyBill: Number(tenant.monthlyBill || 0),
            planDetails: plan,
            usage: {
                users: usersCount,
                vehicles: vehiclesCount,
                customers: customersCount,
                transactions: transactionsCount,
                branches: branchesCount,
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

    // ==================== ALL USERS MANAGEMENT ====================

    async getAllUsers(filters: { search?: string; role?: string; page: number; limit: number; status?: string; hasTenant?: boolean }) {
        const { search, role, page, limit, status, hasTenant } = filters;
        const skip = (page - 1) * limit;
        const where: any = {
            role: { not: 'SUPERADMIN' } // Exclude Superadmin
        };

        // Status Filter
        if (status === 'active') {
            where.deletedAt = null;
        } else if (status === 'deleted') {
            where.deletedAt = { not: null };
        }
        // If status is 'all' or undefined, we fetch everything (including deleted)

        // Tenant Filter (Ghost vs Tenant)
        if (hasTenant === true) {
            where.tenantId = { not: null };
        } else if (hasTenant === false) {
            where.tenantId = null;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.role = role;
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: {
                    tenant: { select: { name: true, slug: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                username: u.username,
                role: u.role,
                phone: u.phone,
                tenantName: u.tenant?.name || 'N/A',
                tenantId: u.tenantId,
                isVerified: u.isVerified,
                deletedAt: u.deletedAt, // Return deletedAt status
                createdAt: u.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async deleteAnyUser(userId: string, adminId: string, adminEmail: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Prevent deleting yourself
        if (user.id === adminId) {
            throw new BadRequestException('Cannot delete your own account');
        }

        // SAFETY CHECK: Business Data Dependencies
        const [transactionCount, stockTransferCount, groupOwnerCount] = await Promise.all([
            this.prisma.transaction.count({ where: { salesPersonId: userId } }),
            this.prisma.stockTransfer.count({
                where: { OR: [{ requestedById: userId }, { approvedById: userId }] }
            }),
            this.prisma.dealerGroup.count({ where: { ownerId: userId } })
        ]);

        if (transactionCount > 0 || stockTransferCount > 0 || groupOwnerCount > 0) {
            throw new BadRequestException(
                `User tidak dapat dihapus permanen karena memiliki data terkait (${transactionCount} transaksi, ${stockTransferCount} transfer stock). Lakukan Soft Delete atau hapus data terkait terlebih dahulu.`
            );
        }

        // Hard delete user
        try {
            await this.prisma.$transaction(async (tx) => {
                // Delete related data first
                await tx.refreshToken.deleteMany({ where: { userId } });
                await tx.notification.deleteMany({ where: { userId } });
                await tx.activityLog.deleteMany({ where: { userId } });

                // Finally delete user
                await tx.user.delete({ where: { id: userId } });
            });

            await this.logActivity({
                userId: adminId,
                userEmail: adminEmail,
                action: 'USER_DELETE_FORCE',
                entityType: 'USER',
                entityId: userId,
                entityName: user.name || user.email,
                details: JSON.stringify({ email: user.email, role: user.role }),
            });

            return { success: true, message: 'User deleted successfully' };
        } catch (error: any) {
            throw new BadRequestException(`Failed to delete user: ${error.message}`);
        }
    }

    // ==================== SOFT DELETE TENANT ====================

    async hardDeleteTenant(id: string, adminId?: string) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        try {
            // Log before deletion
            if (adminId) {
                await this.logActivity({
                    userId: adminId,
                    action: 'TENANT_DELETE',
                    entityType: 'TENANT',
                    entityId: id,
                    entityName: tenant.name,
                });
            }

            // Hard delete tenant. 
            // Prisma will now automatically CASCADE delete all related records 
            // (Users, Vehicles, Transactions, etc.) thanks to schema.prisma config.
            await this.prisma.tenant.delete({ where: { id } });

            return { success: true, message: `Tenant "${tenant.name}" dan seluruh data terkait berhasil dihapus permanen.` };
        } catch (error: any) {
            const meta = error.meta ? JSON.stringify(error.meta) : '';
            throw new BadRequestException(
                `Gagal menghapus tenant: ${error.message} ${meta}`
            );
        }
    }

    // ==================== PLAN TIERS ====================

    async getPlans() {
        // Fetch plans from DB, fall back to in-memory config
        const dbPlans = await this.prisma.plan.findMany({ orderBy: { createdAt: 'asc' } });
        if (dbPlans.length > 0) {
            return dbPlans.map(p => ({
                id: p.slug.toUpperCase(),
                name: p.name,
                slug: p.slug,
                dbId: p.id,
                price: Number(p.price),
                currency: p.currency,
                description: p.description,
                features: {
                    maxVehicles: p.maxVehicles,
                    maxUsers: p.maxUsers,
                    maxBranches: p.maxBranches,
                    canCreateGroup: p.canCreateGroup,
                    maxGroupMembers: p.maxGroupMembers,
                    ...(typeof p.features === 'object' && p.features !== null ? p.features as Record<string, any> : {}),
                },
            }));
        }
        return Object.values(PLAN_TIERS);
    }

    async updatePlan(planId: string, data: Partial<PlanTier>) {
        // Try to find plan in DB by slug (planId is slug like 'DEMO', 'BASIC', etc.)
        const dbPlan = await this.prisma.plan.findFirst({
            where: { slug: { equals: planId, mode: 'insensitive' } },
        });

        if (dbPlan) {
            // Persist to database
            const updateData: any = {};
            if (data.name !== undefined) updateData.name = data.name;
            if (data.price !== undefined) updateData.price = data.price;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.features) {
                // Merge top-level feature limits
                if (data.features.maxVehicles !== undefined) updateData.maxVehicles = data.features.maxVehicles;
                if (data.features.maxUsers !== undefined) updateData.maxUsers = data.features.maxUsers;
                if (data.features.maxBranches !== undefined) updateData.maxBranches = data.features.maxBranches;
                if ((data.features as any).canCreateGroup !== undefined) updateData.canCreateGroup = (data.features as any).canCreateGroup;
                if ((data.features as any).maxGroupMembers !== undefined) updateData.maxGroupMembers = (data.features as any).maxGroupMembers;
                // Store extra feature flags in JSON
                const existingFeatures = typeof dbPlan.features === 'object' && dbPlan.features !== null ? dbPlan.features : {};
                updateData.features = { ...existingFeatures, ...data.features };
            }

            const updated = await this.prisma.plan.update({
                where: { id: dbPlan.id },
                data: updateData,
            });

            return updated;
        }

        // Fallback: update in-memory config (legacy)
        const plan = PLAN_TIERS[planId];
        if (!plan) throw new NotFoundException('Plan not found');

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

        return this.prisma.systemInvoice.findMany({
            where,
            include: { tenant: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async verifyInvoice(invoiceId: string, approved: boolean, adminId?: string, adminEmail?: string) {
        // SECURITY: Prevent double-approval / double-rejection
        const existingInvoice = await this.prisma.systemInvoice.findUnique({
            where: { id: invoiceId },
        });
        if (!existingInvoice) throw new NotFoundException('Invoice not found');
        if (existingInvoice.status === 'PAID') {
            throw new BadRequestException('Invoice sudah disetujui sebelumnya');
        }
        if (existingInvoice.status === 'CANCELLED') {
            throw new BadRequestException('Invoice sudah dibatalkan sebelumnya');
        }

        const newStatus = approved ? 'PAID' : 'CANCELLED';

        const invoice = await this.prisma.systemInvoice.update({
            where: { id: invoiceId },
            data: { status: newStatus },
            include: { tenant: { select: { name: true, id: true } } },
        });

        // If approved, activate tenant subscription
        if (approved) {
            // Parse items to check for plan upgrade info
            let toPlan: string | null = null;
            try {
                const items = JSON.parse(invoice.items || '{}');
                // items can be { toPlan: 'PRO' } or [{ toPlan: 'PRO' }]
                toPlan = items.toPlan || (Array.isArray(items) ? items[0]?.toPlan : null);
            } catch { /* ignore parse errors */ }

            await this.prisma.tenant.update({
                where: { id: invoice.tenantId },
                data: {
                    ...(toPlan ? { planTier: toPlan } : {}),
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
        const count = await this.prisma.systemInvoice.count({
            where: {
                invoiceNumber: { startsWith: `INV-${year}` },
            },
        });
        const invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

        const invoice = await this.prisma.systemInvoice.create({
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
        let userEmail = data.userEmail;
        if (!userEmail) {
            const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
            userEmail = user?.email || 'unknown@system.com';
        }

        return this.prisma.adminActivityLog.create({
            data: {
                userId: data.userId,
                userEmail: userEmail,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                entityName: data.entityName,
                details: data.details,
                ipAddress: data.ipAddress,
            },
        });
    }

    async getRecentActivity(limit: number = 20) {
        return this.prisma.adminActivityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getActivityByUser(userId: string) {
        return this.prisma.adminActivityLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async getActivityLog(filters?: { action?: string; page?: number; limit?: number }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const skip = (page - 1) * limit;
        const where: any = {};
        if (filters?.action) where.action = filters.action;

        const [data, total] = await Promise.all([
            this.prisma.adminActivityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.adminActivityLog.count({ where }),
        ]);

        // ENRICH LOGS WITH USER DETAILS
        // Since AdminActivityLog doesn't have a relation to User, we fetch manually
        const userIds = [...new Set(data.map((log: any) => log.userId))].filter(Boolean);

        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds as string[] } },
            select: { id: true, name: true, email: true, role: true },
        });

        const userMap = new Map(users.map(u => [u.id, u]));

        const enrichedData = data.map((log: any) => {
            const user = userMap.get(log.userId);
            return {
                ...log,
                user: user || {
                    name: 'Unknown User',
                    email: log.userEmail || 'N/A',
                    role: 'UNKNOWN',
                },
            };
        });

        return { data: enrichedData, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    // ==================== DIRECT PLAN CHANGE (No Invoice) ====================

    async directPlanChange(tenantId: string, data: {
        planTier: string;
        billingMonths: number;
    }, adminId: string) {
        const plan = getPlanById(data.planTier);
        if (!plan) throw new NotFoundException('Plan not found');

        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException('Tenant not found');

        const now = new Date();
        const endsAt = new Date(now.getTime() + data.billingMonths * 30 * 24 * 60 * 60 * 1000);

        const updated = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                planTier: data.planTier,
                monthlyBill: plan.price,
                subscriptionStatus: 'ACTIVE',
                subscriptionStartedAt: now,
                subscriptionEndsAt: endsAt,
                nextBillingDate: endsAt,
                trialEndsAt: null,
            },
        });

        await this.logActivity({
            userId: adminId,
            action: 'DIRECT_PLAN_CHANGE',
            entityType: 'TENANT',
            entityId: tenantId,
            entityName: updated.name,
            details: JSON.stringify({
                planTier: data.planTier,
                billingMonths: data.billingMonths,
                endsAt: endsAt.toISOString(),
                monthlyBill: plan.price,
            }),
        });

        // Send notification to tenant owner
        const owner = await this.prisma.user.findFirst({
            where: { tenantId, role: 'OWNER' },
        });
        if (owner) {
            await this.prisma.notification.create({
                data: {
                    userId: owner.id,
                    title: 'Plan berhasil diubah',
                    message: `Plan Anda telah diubah ke ${plan.name} untuk ${data.billingMonths} bulan.`,
                    type: 'success',
                    link: '/app/billing',
                },
            });
        }

        return updated;
    }

    // ==================== CREATE TENANT ====================

    async createTenant(data: {
        name: string;
        email: string;
        phone?: string;
        address?: string;
        planTier: string;
        billingMonths: number;
        ownerName: string;
        ownerEmail: string;
        ownerPassword: string;
    }, adminId: string) {
        const plan = getPlanById(data.planTier);
        if (!plan) throw new BadRequestException('Invalid plan tier');

        // Check if owner email already exists
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.ownerEmail } });
        if (existingUser) throw new BadRequestException('Email owner sudah terdaftar');

        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existingSlug = await this.prisma.tenant.findUnique({ where: { slug } });
        const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

        const now = new Date();
        const endsAt = data.planTier === 'DEMO'
            ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
            : new Date(now.getTime() + data.billingMonths * 30 * 24 * 60 * 60 * 1000);

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(data.ownerPassword, 10);

        const tenant = await this.prisma.tenant.create({
            data: {
                name: data.name,
                slug: finalSlug,
                email: data.email,
                phone: data.phone,
                address: data.address,
                planTier: data.planTier,
                subscriptionStatus: data.planTier === 'DEMO' ? 'TRIAL' : 'ACTIVE',
                monthlyBill: plan.price,
                subscriptionStartedAt: now,
                subscriptionEndsAt: endsAt,
                nextBillingDate: data.planTier === 'DEMO' ? null : endsAt,
                trialEndsAt: data.planTier === 'DEMO' ? endsAt : null,
            },
        });

        const owner = await this.prisma.user.create({
            data: {
                email: data.ownerEmail,
                username: data.ownerEmail.split('@')[0],
                password: hashedPassword,
                name: data.ownerName,
                role: 'OWNER',
                tenantId: tenant.id,
                phone: data.phone,
                isVerified: true,
                onboardingCompleted: true,
                language: 'id',
            },
        });

        await this.logActivity({
            userId: adminId,
            action: 'TENANT_CREATE',
            entityType: 'TENANT',
            entityId: tenant.id,
            entityName: tenant.name,
            details: JSON.stringify({ ownerEmail: data.ownerEmail, plan: data.planTier }),
        });

        return { tenant, owner: { id: owner.id, email: owner.email, name: owner.name } };
    }

    // ==================== ADMIN STAFF MANAGEMENT ====================

    async getAdminStaff() {
        return this.prisma.user.findMany({
            where: { role: { in: ['SUPERADMIN', 'ADMIN_STAFF'] }, tenantId: null },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createAdminStaff(data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
    }, adminId: string) {
        const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw new BadRequestException('Email sudah terdaftar');

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const staff = await this.prisma.user.create({
            data: {
                email: data.email,
                username: data.email.split('@')[0],
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: 'ADMIN_STAFF',
                tenantId: null,
                isVerified: true,
                onboardingCompleted: true,
                language: 'id',
            },
            select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
        });

        await this.logActivity({
            userId: adminId,
            action: 'ADMIN_STAFF_CREATE',
            entityType: 'USER',
            entityId: staff.id,
            entityName: staff.name,
        });

        return staff;
    }

    async deleteAdminStaff(staffId: string, adminId: string) {
        const staff = await this.prisma.user.findUnique({ where: { id: staffId } });
        if (!staff) throw new NotFoundException('Staff not found');
        if (staff.role === 'SUPERADMIN') throw new BadRequestException('Cannot delete superadmin');

        await this.prisma.user.delete({ where: { id: staffId } });

        await this.logActivity({
            userId: adminId,
            action: 'ADMIN_STAFF_DELETE',
            entityType: 'USER',
            entityId: staffId,
            entityName: staff.name,
        });

        return { message: 'Staff deleted' };
    }

    // ==================== APPROVAL REQUESTS ====================

    async getApprovalRequests(status?: string) {
        const where: any = {};
        if (status) where.status = status;

        const requests = await this.prisma.adminApprovalRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        // Enrich with requester info
        const enriched = await Promise.all(requests.map(async (r: any) => {
            const requester = await this.prisma.user.findUnique({
                where: { id: r.requestedById },
                select: { name: true, email: true },
            });
            const approver = r.approvedById ? await this.prisma.user.findUnique({
                where: { id: r.approvedById },
                select: { name: true, email: true },
            }) : null;
            return { ...r, requester, approver };
        }));

        return enriched;
    }

    async createApprovalRequest(data: {
        type: string;
        payload: string;
    }, requestedById: string) {
        const request = await this.prisma.adminApprovalRequest.create({
            data: {
                type: data.type,
                payload: data.payload,
                requestedById,
                status: 'PENDING',
            },
        });

        // Notify all superadmins
        const superadmins = await this.prisma.user.findMany({
            where: { role: 'SUPERADMIN' },
        });
        for (const sa of superadmins) {
            await this.prisma.notification.create({
                data: {
                    userId: sa.id,
                    title: 'Approval Request Baru',
                    message: `Staff mengajukan ${data.type}. Perlu persetujuan Anda.`,
                    type: 'warning',
                    link: '/superadmin/approvals',
                },
            });
        }

        return request;
    }

    async processApprovalRequest(requestId: string, approved: boolean, adminId: string, note?: string) {
        const request = await this.prisma.adminApprovalRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) throw new NotFoundException('Request not found');
        if (request.status !== 'PENDING') throw new BadRequestException('Request already processed');

        const updated = await this.prisma.adminApprovalRequest.update({
            where: { id: requestId },
            data: {
                status: approved ? 'APPROVED' : 'REJECTED',
                approvedById: adminId,
                note,
            },
        });

        // If approved, execute the action
        if (approved) {
            const payload = JSON.parse(request.payload);
            switch (request.type) {
                case 'PLAN_CHANGE':
                    await this.directPlanChange(payload.tenantId, {
                        planTier: payload.planTier,
                        billingMonths: payload.billingMonths || 1,
                    }, adminId);
                    break;
                case 'BILLING_EXTEND':
                    await this.directPlanChange(payload.tenantId, {
                        planTier: payload.planTier || 'BASIC',
                        billingMonths: payload.billingMonths,
                    }, adminId);
                    break;
                case 'INVOICE_ACTION':
                    if (payload.action === 'APPROVE') {
                        await this.verifyInvoice(payload.invoiceId, true, adminId);
                    }
                    break;
            }
        }

        // Notify the requester
        await this.prisma.notification.create({
            data: {
                userId: request.requestedById,
                title: approved ? 'Request Disetujui' : 'Request Ditolak',
                message: note || (approved ? 'Permintaan Anda telah disetujui.' : 'Permintaan Anda ditolak.'),
                type: approved ? 'success' : 'error',
                link: '/superadmin/approvals',
            },
        });

        await this.logActivity({
            userId: adminId,
            action: approved ? 'APPROVAL_APPROVE' : 'APPROVAL_REJECT',
            entityType: 'APPROVAL',
            entityId: requestId,
            details: JSON.stringify({ type: request.type, note }),
        });

        return updated;
    }

    // ==================== API KEYS ====================

    async getApiKeys() {
        return this.prisma.apiKey.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                prefix: true,
                scopes: true,
                lastUsed: true,
                createdAt: true,
                expiresAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async generateApiKey(name: string, scopes?: string[]) {
        const crypto = require('crypto');
        const bcrypt = require('bcrypt');
        const rawKey = `oh_live_${crypto.randomBytes(24).toString('hex')}`;
        const keyHash = await bcrypt.hash(rawKey, 10);
        const prefix = rawKey.substring(0, 16);

        await this.prisma.apiKey.create({
            data: {
                name,
                keyHash,
                prefix,
                scopes: scopes ? JSON.stringify(scopes) : null,
            },
        });

        // Return the raw key ONCE (cannot be retrieved later)
        return { key: rawKey, prefix, name };
    }

    async revokeApiKey(keyId: string) {
        await this.prisma.apiKey.update({
            where: { id: keyId },
            data: { active: false },
        });
        return { message: 'API key revoked' };
    }

    // ==================== PLATFORM SETTINGS ====================

    async getPlatformSetting(key: string) {
        const setting = await this.prisma.platformSetting.findUnique({
            where: { key },
        });
        if (!setting) return { key, value: null };
        try {
            return { key: setting.key, value: JSON.parse(setting.value) };
        } catch {
            return { key: setting.key, value: setting.value };
        }
    }

    async updatePlatformSetting(key: string, value: any) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        const setting = await this.prisma.platformSetting.upsert({
            where: { key },
            update: { value: stringValue },
            create: { key, value: stringValue },
        });
        return { key: setting.key, value: JSON.parse(setting.value) };
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
    // Logic moved to PublicService to avoid duplication
    // and allow consumption by both Superadmin and Public APIs
}

