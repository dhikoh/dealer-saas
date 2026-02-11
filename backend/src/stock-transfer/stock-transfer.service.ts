import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockTransferService {
    constructor(private prisma: PrismaService) { }

    async create(data: any, tenantId: string, userId: string) {
        const { vehicleId, sourceBranchId, targetBranchId, targetTenantId, type, price, notes } = data;

        // Validations
        if (targetTenantId && targetTenantId === tenantId) {
            throw new BadRequestException('Target tenant cannot be the same as source tenant');
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

        return this.prisma.$transaction(async (tx) => {
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

            // 2. Move Vehicle Logic
            const isCrossTenant = !!transfer.targetTenantId;
            const newTenantId = isCrossTenant ? transfer.targetTenantId : transfer.tenantId; // If internal, stays same
            const newBranchId = transfer.targetBranchId || null; // Reset branch if not specified

            const updateData: any = {
                branchId: newBranchId,
                tenantId: newTenantId,
                status: 'AVAILABLE', // Reset status in new place (was BOOKED)
            };

            // If SALE, update purchase price for the new owner
            if (transfer.type === 'SALE' && transfer.price && isCrossTenant) {
                updateData.purchasePrice = transfer.price;
            }

            await tx.vehicle.update({
                where: { id: transfer.vehicleId },
                data: updateData,
            });

            // 3. Financial Logic (If SALE and Cross-Tenant)
            if (transfer.type === 'SALE' && isCrossTenant && transfer.price) {
                // A. SOURCE TENANT: Record SALE
                // We need a customer record for the Target Tenant.
                // Try to find existing "Dealer: TargetName" customer or create one.
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
                        vehicleId: transfer.vehicleId, // It was theirs at time of sale logic, theoretically
                        salesPersonId: transfer.requestedById, // Requester gets credit?
                        type: 'SALE',
                        basePrice: transfer.price,
                        finalPrice: transfer.price,
                        paymentStatus: 'PAID', // Assumed paid or debt? Let's assume PAID/DEBT settled elsewhere for MVP
                        status: 'COMPLETED',
                        notes: `Sold to Dealer Group Member via Transfer #${id.substring(0, 6)}`
                    }
                });

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

            return updatedTransfer;
        });
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
    }

    async cancel(id: string, tenantId: string, userId: string) {
        const transfer = await this.findOne(id, tenantId);

        if (transfer.status !== 'PENDING') {
            throw new BadRequestException('Cannot cancel processed transfer');
        }

        // Only requester or admin can cancel
        if (transfer.requestedById !== userId) {
            // allow if admin? 
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
