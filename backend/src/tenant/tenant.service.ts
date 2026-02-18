import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPlanById, PLAN_TIERS, canUpgrade } from '../config/plan-tiers.config';
import { TENANT_ROLES } from '../config/roles.config';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) { }

  // Get current tenant profile with subscription info
  async getProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            customers: true,
            branches: true,
          },
        },
        plan: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    const plan = getPlanById(tenant.planTier);

    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    if (tenant.subscriptionStatus === 'TRIAL' && tenant.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(tenant.trialEndsAt);
      trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      address: tenant.address,
      phone: tenant.phone,
      email: tenant.email,
      // Subscription info
      planTier: tenant.planTier,
      planDetails: plan,
      subscriptionStatus: tenant.subscriptionStatus,
      trialEndsAt: tenant.trialEndsAt,
      trialDaysRemaining,
      subscriptionEndsAt: tenant.subscriptionEndsAt,
      monthlyBill: Number(tenant.monthlyBill || 0),
      autoRenew: tenant.autoRenew,
      // Usage stats
      usage: {
        users: tenant._count.users,
        vehicles: tenant._count.vehicles,
        customers: tenant._count.customers,
        branches: tenant._count.branches,
      },
      // Limits from plan (Dynamic or Legacy)
      limits: tenant.plan ? {
        maxUsers: tenant.plan.maxUsers,
        maxVehicles: tenant.plan.maxVehicles,
        maxCustomers: (tenant.plan.features as any)?.maxCustomers || 200,
        maxBranches: tenant.plan.maxBranches,
      } : (plan ? {
        maxUsers: plan.features.maxUsers,
        maxVehicles: plan.features.maxVehicles,
        maxCustomers: plan.features.maxCustomers,
        maxBranches: plan.features.maxBranches,
      } : null),
      createdAt: tenant.createdAt,
    };
  }

  // Update tenant profile (company info)
  async updateProfile(tenantId: string, data: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    currency?: string;
  }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        currency: data.currency,
      },
    });
  }

  // Get available plans for upgrade
  async getAvailablePlans(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { planTier: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    const currentPlan = tenant.planTier;
    const plans = Object.values(PLAN_TIERS).map(plan => ({
      ...plan,
      isCurrent: plan.id === currentPlan,
      canUpgrade: canUpgrade(currentPlan, plan.id),
    }));

    return plans;
  }

  // Request upgrade (creates pending invoice)
  async requestUpgrade(tenantId: string, targetPlan: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    const plan = getPlanById(targetPlan);
    if (!plan) {
      throw new BadRequestException('Paket langganan tidak valid');
    }

    if (!canUpgrade(tenant.planTier, targetPlan)) {
      throw new BadRequestException('Tidak dapat upgrade ke paket ini');
    }

    // Generate invoice number
    const invoiceCount = await (this.prisma as any).systemInvoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Create system invoice for upgrade payment
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay

    const invoice = await (this.prisma as any).systemInvoice.create({
      data: {
        tenantId,
        invoiceNumber,
        amount: plan.price,
        dueDate,
        status: 'PENDING',
        items: JSON.stringify({
          type: 'UPGRADE',
          fromPlan: tenant.planTier,
          toPlan: targetPlan,
          description: `Upgrade ke paket ${plan.name}`,
        }),
      },
    });

    // Align with BillingService.upgradePlan — set pending status
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: 'PENDING_PAYMENT',
        scheduledDeletionAt: null,
      },
    });

    return {
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: plan.price,
        dueDate: invoice.dueDate,
        plan: plan.name,
      },
      message: `Invoice untuk upgrade ke ${plan.name} telah dibuat. Silakan lakukan pembayaran.`,
    };
  }

  // Upload payment proof
  async uploadPaymentProof(tenantId: string, invoiceId: string, proofUrl: string) {
    const invoice = await (this.prisma as any).systemInvoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice tidak ditemukan');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice sudah dibayar');
    }

    // Update invoice with proof and set to VERIFYING
    await (this.prisma as any).systemInvoice.update({
      where: { id: invoiceId },
      data: {
        paymentProof: proofUrl,
        status: 'VERIFYING',
      },
    });

    return {
      success: true,
      message: 'Bukti pembayaran berhasil diupload. Menunggu verifikasi admin.',
    };
  }

  // Get tenant's invoices
  async getInvoices(tenantId: string) {
    return (this.prisma as any).systemInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== STAFF MANAGEMENT ====================

  // Get all staff for this tenant
  async getStaff(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create new staff member
  async createStaff(tenantId: string, currentUser: any, data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    branchId?: string;
  }) {
    // PRIVILEGE CHECK
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'MANAGER') {
      throw new ForbiddenException('Hanya Owner dan Manager yang dapat menambahkan staff.');
    }

    // Prevent creating OWNER role (Ownership transfer is a separate process)
    if (data.role === 'OWNER') {
      throw new ForbiddenException('Tidak dapat membuat user dengan role OWNER secara manual.');
    }

    // MANAGER cannot create MANAGER (Only Owner can)
    if (currentUser.role === 'MANAGER' && data.role === 'MANAGER') {
      throw new ForbiddenException('Manager tidak dapat membuat user Manager lain.');
    }

    // Check plan limit
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: { select: { users: true } },
        plan: true
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    let limit = 0;
    if (tenant.plan) {
      limit = tenant.plan.maxUsers;
    } else {
      const legacyPlan = getPlanById(tenant.planTier);
      limit = legacyPlan?.features.maxUsers ?? 0;
    }

    if (limit !== -1 && tenant._count.users >= limit) {
      throw new BadRequestException(
        `Batas user tercapai (${limit} user). Upgrade plan untuk menambah lebih banyak user.`
      );
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    // Validate Role
    if (!TENANT_ROLES.includes(data.role)) {
      throw new BadRequestException('Role tidak valid. Role yang diperbolehkan: ' + TENANT_ROLES.join(', '));
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate username from email
    const username = data.email.split('@')[0].toLowerCase() + '-' + Math.floor(Math.random() * 1000);

    return this.prisma.user.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email.toLowerCase(),
        username,
        password: hashedPassword,
        phone: data.phone,
        role: data.role,
        branchId: data.branchId || null,
        isVerified: true, // Staff created by owner are pre-verified
        onboardingCompleted: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });
  }

  // Update staff member
  async updateStaff(tenantId: string, staffId: string, currentUser: any, data: {
    name?: string;
    phone?: string;
    role?: string;
    branchId?: string | null;
  }) {
    // PRIVILEGE CHECK: STAFF cannot access this endpoint
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'MANAGER') {
      throw new ForbiddenException('Hanya Owner dan Manager yang dapat mengelola staff.');
    }

    // Verify staff belongs to tenant
    const targetStaff = await this.prisma.user.findFirst({
      where: { id: staffId, tenantId },
    });

    if (!targetStaff) {
      throw new NotFoundException('Staff tidak ditemukan');
    }

    // PROTECTION: Cannot modify OWNER
    if (targetStaff.role === 'OWNER' && currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Hanya Owner yang dapat mengubah data Owner.');
    }

    // PROTECTION: Manager cannot modify other Managers
    if (currentUser.role === 'MANAGER' && targetStaff.role === 'MANAGER' && targetStaff.id !== currentUser.id) {
      throw new ForbiddenException('Manager tidak dapat mengubah data Manager lain.');
    }

    // Validate New Role
    if (data.role) {
      if (!TENANT_ROLES.includes(data.role)) {
        throw new BadRequestException('Role tidak valid. Role yang diperbolehkan: ' + TENANT_ROLES.join(', '));
      }

      // PREVENT ELEVATION to OWNER
      if (data.role === 'OWNER') {
        throw new ForbiddenException('Tidak dapat mengubah role menjadi OWNER secara manual.');
      }

      // PREVENT ELEVATION by MANAGER
      if (currentUser.role === 'MANAGER' && data.role === 'MANAGER') {
        throw new ForbiddenException('Manager tidak dapat mempromosikan user menjadi Manager.');
      }
    }

    return this.prisma.user.update({
      where: { id: staffId },
      data: {
        name: data.name,
        phone: data.phone,
        role: data.role,
        branchId: data.branchId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });
  }

  // Delete staff member
  async deleteStaff(tenantId: string, staffId: string) {
    // Verify staff belongs to tenant
    const staff = await this.prisma.user.findFirst({
      where: { id: staffId, tenantId },
    });

    if (!staff) {
      throw new NotFoundException('Staff tidak ditemukan');
    }

    // Prevent deleting owner
    if (staff.role === 'OWNER') {
      throw new BadRequestException('Tidak bisa menghapus Owner');
    }

    await this.prisma.user.delete({
      where: { id: staffId },
    });

    return { success: true, message: 'Staff berhasil dihapus' };
  }

  // Assign staff to branch
  async assignBranch(tenantId: string, staffId: string, branchId: string | null) {
    const staff = await this.prisma.user.findFirst({
      where: { id: staffId, tenantId },
    });

    if (!staff) {
      throw new NotFoundException('Staff tidak ditemukan');
    }

    if (branchId) {
      // Verify branch belongs to tenant
      const branch = await this.prisma.branch.findFirst({
        where: { id: branchId, tenantId },
      });

      if (!branch) {
        throw new NotFoundException('Cabang tidak ditemukan');
      }
    }

    return this.prisma.user.update({
      where: { id: staffId },
      data: { branchId },
      select: {
        id: true,
        name: true,
        branchId: true,
        branch: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // ==================== BRANCH MANAGEMENT ====================

  async getBranches(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createBranch(tenantId: string, data: { name: string; address: string; phone?: string }) {
    // Check plan limit
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: { select: { branches: true } },
        plan: true
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    let limit = 0;
    if (tenant.plan) {
      limit = tenant.plan.maxBranches;
    } else {
      const legacyPlan = getPlanById(tenant.planTier);
      limit = legacyPlan?.features.maxBranches ?? 0;
    }

    if (limit !== -1 && tenant._count.branches >= limit) {
      throw new BadRequestException(
        `Batas cabang tercapai (${limit} cabang). Upgrade plan untuk menambah lebih banyak cabang.`
      );
    }

    return this.prisma.branch.create({
      data: {
        tenantId,
        name: data.name,
        address: data.address,
        phone: data.phone,
      },
    });
  }

  async updateBranch(tenantId: string, branchId: string, data: { name?: string; address?: string; phone?: string }) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });

    if (!branch) {
      throw new NotFoundException('Cabang tidak ditemukan');
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
      },
    });
  }

  async deleteBranch(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
      include: { _count: { select: { users: true, vehicles: true } } },
    });

    if (!branch) {
      throw new NotFoundException('Cabang tidak ditemukan');
    }

    // Check if branch has assigned users or vehicles
    if (branch._count.users > 0 || branch._count.vehicles > 0) {
      throw new BadRequestException(
        `Cabang tidak bisa dihapus karena masih memiliki ${branch._count.users} staff dan ${branch._count.vehicles} kendaraan.`
      );
    }

    await this.prisma.branch.delete({
      where: { id: branchId },
    });

    return { success: true };
  }
}
