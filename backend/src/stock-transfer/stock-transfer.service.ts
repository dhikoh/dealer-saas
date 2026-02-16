import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { sanitizeInput } from '../common/helpers/tenant-security.helper';

@Injectable()
export class StockTransferService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) { }

    async create(data: any, tenantId: string, userId: string) {
        // SECURITY: Strip protected fields from input
        const safeData = sanitizeInput(data);
        const { vehicleId, sourceBranchId, targetBranchId, targetTenantId, type, price, notes } = safeData;

        // Validations
        if (targetTenantId && targetTenantId === tenantId) {
            throw new BadRequestException('Target tenant cannot be the same as source tenant');
        }

        // SECURITY: Validate targetTenantId exists in DB (prevent transfer to phantom tenant)
        if (targetTenantId) {
            const targetTenant = await this.prisma.tenant.findUnique({
                where: { id: targetTenantId },
                select: { id: true },
            });
            if (!targetTenant) {
                throw new BadRequestException('Target tenant does not exist');
            }
        }

        if (type === 'SALE' && (!price || price <= 0)) {
            throw new BadRequestException('Price is required for SALE transfer');
        }

        // Validate Vehicle availability
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId, status: 'AVAILABLE' }
        });

        if (!vehicle) {
            throw new BadRequestException('Vehicle not available for transfer (must be AVAILABLE and owned by you)');
        }

        // Prevent duplicate pending transfers
        const existingTransfer = await this.prisma.stockTransfer.findFirst({
            where: { vehicleId, status: 'PENDING' }
        });

        if (existingTransfer) {
            throw new BadRequestException('Vehicle already has a pending transfer');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Create Transfer
            const transfer = await tx.stockTransfer.create({
                data: {
                    tenantId, // Source
                    targetTenantId, // Target (Optional)
                    vehicleId,
                    sourceBranchId, // Optional
                    targetBranchId, // Optional
                    type: type || 'MUTATION',
                    price: price ? parseFloat(price) : null,
                    requestedById: userId,
                    notes,
                    status: 'PENDING',
                },
            });

            // 2. Lock Vehicle (Set to BOOKED)
            await tx.vehicle.update({
                where: { id: vehicleId },
                data: { status: 'BOOKED' }
            });

            return transfer;
        });

        // Notify target tenant owner about incoming transfer (fire-and-forget)
        if (targetTenantId) {
            try {
                const targetOwner = await this.prisma.user.findFirst({
                    where: { tenantId: targetTenantId, role: 'OWNER' },
                });
                if (targetOwner) {
                    await this.notificationService.createNotification({
                        userId: targetOwner.id,
                        title: 'Transfer Masuk Baru',
                        message: `Permintaan transfer kendaraan dari dealer lain. Silakan cek dan setujui/tolak.`,
                        type: 'STOCK_TRANSFER',
                        link: '/app/inventory?tab=transfers',
                    });
                }
            } catch (e) {
                // Don't fail the transfer if notification fails
            }
        }

        return result;
    }

    async findAll(tenantId: string, status?: string) {
        const where: any = {
            OR: [
                { tenantId }, // Outgoing
                { targetTenantId: tenantId } // Incoming
            ]
        };

        if (status) where.status = status;

        const transfers = await this.prisma.stockTransfer.findMany({
            where,
            include: {
                vehicle: { select: { id: true, make: true, model: true, licensePlate: true, category: true, year: true, color: true } },
                tenant: { select: { id: true, name: true } }, // Source
                targetTenant: { select: { id: true, name: true } }, // Target
                sourceBranch: { select: { id: true, name: true } },
                targetBranch: { select: { id: true, name: true } },
                requestedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Enrich with direction (INCOMING/OUTGOING)
        return transfers.map(t => ({
            ...t,
            direction: t.tenantId === tenantId ? 'OUTGOING' : 'INCOMING'
        }));
    }

    async findOne(id: string, tenantId: string) {
        const transfer = await this.prisma.stockTransfer.findFirst({
            where: {
                id,
                OR: [
                    { tenantId },
                    { targetTenantId: tenantId }
                ]
            },
            include: {
                vehicle: true,
                tenant: true,
                targetTenant: true,
                sourceBranch: true,
                targetBranch: true,
                requestedBy: true,
                approvedBy: true,
            }
        });

        if (!transfer) throw new NotFoundException('Transfer not found');
        return transfer;
    }

    async approve(id: string, tenantId: string, userId: string, notes?: string) {
        const transfer = await this.findOne(id, tenantId);

        // Security: Only Target Tenant can approve Incoming, Only Source can approve Internal (if separate role logic exists, but here let's assume Target must approve cross-tenant)
        if (transfer.targetTenantId && transfer.targetTenantId !== tenantId) {
            throw new BadRequestException('Only the recipient can approve this transfer');
        }

        if (transfer.status !== 'PENDING') {
            throw new BadRequestException('Transfer already processed');
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Update Transfer
            const updatedTransfer = await tx.stockTransfer.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    approvedById: userId,
                    approvedAt: new Date(),
                    notes: notes ? `${transfer.notes || ''}\nApprove Note: ${notes}` : transfer.notes,
                },
            });

            const isCrossTenant = !!transfer.targetTenantId;

            // 2. Financial Logic FIRST (before vehicle ownership changes)
            // Must happen while vehicle still belongs to source tenant
            if (transfer.type === 'SALE' && isCrossTenant && transfer.price) {
                // A. SOURCE TENANT: Record SALE
                let partnerCustomer = await tx.customer.findFirst({
                    where: {
                        tenantId: transfer.tenantId,
                        name: `Dealer: ${transfer.targetTenant?.name || 'Unknown'}`
                    }
                });

                if (!partnerCustomer) {
                    partnerCustomer = await tx.customer.create({
                        data: {
                            tenantId: transfer.tenantId,
                            name: `Dealer: ${transfer.targetTenant?.name || 'Unknown'}`,
                            type: 'DEALER_PARTNER',
                            phone: transfer.targetTenant?.phone || '-',
                            address: transfer.targetTenant?.address || '-',
                        }
                    });
                }

                await tx.transaction.create({
                    data: {
                        tenantId: transfer.tenantId,
                        customerId: partnerCustomer.id,
                        vehicleId: transfer.vehicleId,
                        salesPersonId: transfer.requestedById,
                        type: 'SALE',
                        basePrice: transfer.price,
                        finalPrice: transfer.price,
                        paymentStatus: 'PAID',
                        status: 'COMPLETED',
                        notes: `Sold to Dealer Group Member via Transfer #${id.substring(0, 6)}`
                    }
                });

                // B. TARGET TENANT: Record purchase cost
                await tx.vehicleCost.create({
                    data: {
                        tenantId: transfer.targetTenantId!,
                        vehicleId: transfer.vehicleId,
                        costType: 'PURCHASE',
                        amount: transfer.price,
                        description: `Purchased from ${transfer.tenant.name}`,
                        date: new Date()
                    }
                });
            }

            // 3. Move Vehicle AFTER financial records are created
            const newTenantId = isCrossTenant ? transfer.targetTenantId : transfer.tenantId;
            const newBranchId = transfer.targetBranchId || null;

            const updateData: any = {
                branchId: newBranchId,
                tenantId: newTenantId,
                status: 'AVAILABLE',
            };

            if (transfer.type === 'SALE' && transfer.price && isCrossTenant) {
                updateData.purchasePrice = transfer.price;
            }

            await tx.vehicle.update({
                where: { id: transfer.vehicleId },
                data: updateData,
            });

            return updatedTransfer;
        });

        // Notify requester that transfer was approved (fire-and-forget)
        try {
            await this.notificationService.createNotification({
                userId: transfer.requestedById,
                title: 'Transfer Disetujui ✅',
                message: `Transfer kendaraan Anda telah disetujui oleh dealer tujuan.`,
                type: 'STOCK_TRANSFER',
                link: '/app/inventory?tab=transfers',
            });
        } catch (e) { /* non-blocking */ }
    }

    async reject(id: string, tenantId: string, userId: string, notes?: string) {
        const transfer = await this.findOne(id, tenantId);

        if (transfer.status !== 'PENDING') {
            throw new BadRequestException('Transfer already processed');
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Update Transfer
            const updatedTransfer = await tx.stockTransfer.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    approvedById: userId,
                    approvedAt: new Date(),
                    notes: notes ? `${transfer.notes || ''}\nReject Note: ${notes}` : transfer.notes,
                },
            });

            // 2. Unlock Vehicle (Revert to AVAILABLE)
            await tx.vehicle.update({
                where: { id: transfer.vehicleId },
                data: { status: 'AVAILABLE' }
            });

            return updatedTransfer;
        });

        // Notify requester that transfer was rejected (fire-and-forget)
        try {
            await this.notificationService.createNotification({
                userId: transfer.requestedById,
                title: 'Transfer Ditolak ❌',
                message: `Transfer kendaraan Anda telah ditolak oleh dealer tujuan.`,
                type: 'STOCK_TRANSFER',
                link: '/app/inventory?tab=transfers',
            });
        } catch (e) { /* non-blocking */ }
    }

    async cancel(id: string, tenantId: string, userId: string) {
        const transfer = await this.findOne(id, tenantId);

        if (transfer.status !== 'PENDING') {
            throw new BadRequestException('Cannot cancel processed transfer');
        }

        // Only requester can cancel
        if (transfer.requestedById !== userId) {
            throw new ForbiddenException('Hanya pembuat permintaan yang bisa membatalkan transfer ini');
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Cancel Transfer
            const updatedTransfer = await tx.stockTransfer.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });

            // 2. Unlock Vehicle (Revert to AVAILABLE)
            await tx.vehicle.update({
                where: { id: transfer.vehicleId },
                data: { status: 'AVAILABLE' }
            });

            return updatedTransfer;
        });
    }
}
