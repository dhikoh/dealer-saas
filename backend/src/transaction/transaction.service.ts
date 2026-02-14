```typescript
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { Prisma } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class TransactionService {
    private readonly logger = new Logger(TransactionService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) { }

    /**
     * Generate invoice number: INV-YYYYMM-NNN
     */
    private async generateInvoiceNumber(tenantId: string, type: string): Promise<string> {
        const now = new Date();
        const yearMonth = `${ now.getFullYear() }${ String(now.getMonth() + 1).padStart(2, '0') } `;
        const prefix = type === 'SALE' ? 'INV' : 'PUR';

        // Count existing transactions this month for this tenant
        const count = await this.prisma.transaction.count({
            where: {
                tenantId,
                date: {
                    gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
                },
            },
        });

        const seq = String(count + 1).padStart(3, '0');
        return `${ prefix } -${ yearMonth } -${ seq } `;
    }

    async findAll(tenantId: string, filters?: { type?: string; status?: string; startDate?: Date; endDate?: Date }) {
        const where: any = { tenantId, deletedAt: null };

        if (filters?.type) where.type = filters.type;
        if (filters?.status) where.status = filters.status;
        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = filters.startDate;
            if (filters.endDate) where.date.lte = filters.endDate;
        }

        return this.prisma.transaction.findMany({
            where,
            include: {
                vehicle: {
                    select: { id: true, make: true, model: true, licensePlate: true, images: true },
                },
                customer: {
                    select: { id: true, name: true, phone: true },
                },
                salesPerson: {
                    select: { id: true, name: true },
                },
                credit: true,
            },
            orderBy: { date: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                vehicle: true,
                customer: true,
                salesPerson: { select: { id: true, name: true, email: true } },
                credit: { include: { payments: true } },
                payments: true,
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transaksi tidak ditemukan');
        }

        return transaction;
    }

    async getStats(tenantId: string) {
        const [totalSales, totalPurchases, pendingCount, completedThisMonth] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: { tenantId, type: 'SALE', status: 'PAID' },
                _sum: { finalPrice: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: { tenantId, type: 'PURCHASE', status: 'PAID' },
                _sum: { finalPrice: true },
                _count: true,
            }),
            this.prisma.transaction.count({
                where: { tenantId, status: 'PENDING' },
            }),
            this.prisma.transaction.count({
                where: {
                    tenantId,
                    status: 'PAID',
                    date: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
        ]);

        return {
            totalSalesAmount: totalSales._sum.finalPrice || 0,
            totalSalesCount: totalSales._count,
            totalPurchaseAmount: totalPurchases._sum.finalPrice || 0,
            totalPurchaseCount: totalPurchases._count,
            pendingCount,
            completedThisMonth,
        };
    }

    async create(tenantId: string, salesPersonId: string, data: {
        type: string;
        vehicleId: string;
        customerId: string;
        paymentType: string;
        finalPrice: number;
        notes?: string;
        // Payment Details (New)
        paymentMethod?: string; // CASH, TRANSFER, etc.
        referenceNumber?: string;
        // Credit fields if paymentType is CREDIT
        creditData?: {
            creditType: string;
            leasingCompany?: string;
            downPayment: number;
            interestRate: number;
            tenorMonths: number;
        };
    }) {
        // Validate vehicle belongs to tenant
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: data.vehicleId, tenantId },
        });
        if (!vehicle) {
            throw new BadRequestException('Kendaraan tidak ditemukan');
        }

        // VALIDATION: Vehicle must be AVAILABLE
        if (vehicle.status !== 'AVAILABLE') {
            throw new BadRequestException(`Kendaraan tidak tersedia untuk dijual(Status: ${ vehicle.status })`);
        }

        // Validate customer belongs to tenant
        const customer = await this.prisma.customer.findFirst({
            where: { id: data.customerId, tenantId },
        });
        if (!customer) {
            throw new BadRequestException('Customer tidak ditemukan');
        }

        // Get Tenant Settings (Tax)
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { taxPercentage: true }
        });
        const taxRate = Number(tenant?.taxPercentage || 0) / 100;


        // VALIDATION: Documents required for SALE
        if (data.type === 'SALE') {
            if (!vehicle.stnkImage) {
                throw new BadRequestException(
                    'Foto STNK wajib diunggah sebelum kendaraan dapat dijual'
                );
            }
            if (!vehicle.ktpOwnerImage) {
                throw new BadRequestException(
                    'Foto KTP pemilik/atas nama BPKB wajib diunggah sebelum kendaraan dapat dijual'
                );
            }
        }

        // Generate Invoice Number
        const invoiceNumber = await this.generateInvoiceNumber(tenantId, data.type);

        // Calculate Tax & Base Price (Assuming Inclusive)
        // Final = Base + (Base * Tax) = Base * (1 + Tax)
        // Base = Final / (1 + Tax)
        const finalPrice = Number(data.finalPrice);
        const basePrice = finalPrice / (1 + taxRate);
        const taxAmount = finalPrice - basePrice;


        // Use Interactive Transaction to ensure atomicity
        const result = await this.prisma.$transaction(async (tx) => {
            // Determine Statuses based on Payment Type
            let paymentStatus = 'UNPAID';
            let transactionStatus = 'PENDING';

            if (data.paymentType === 'CASH') {
                paymentStatus = 'PAID';
                transactionStatus = 'COMPLETED'; // Cash = Done
            } else if (data.paymentType === 'CREDIT') {
                if (data.creditData?.creditType === 'LEASING') {
                    // Leasing pays dealer full (minus admin fees usually, but for simplicity: PAID)
                    paymentStatus = 'PAID';
                    transactionStatus = 'COMPLETED';
                } else {
                    // Dealer Credit
                    paymentStatus = 'PARTIAL'; // Only DP
                    transactionStatus = 'PENDING'; // Ongoing installments
                }
            }


            // 1. Create Transaction
            const transaction = await tx.transaction.create({
                data: {
                    tenantId,
                    invoiceNumber,
                    vehicleId: data.vehicleId,
                    customerId: data.customerId,
                    salesPersonId,
                    type: data.type,
                    paymentType: data.paymentType,
                    finalPrice: new Prisma.Decimal(finalPrice),
                    basePrice: new Prisma.Decimal(basePrice),
                    taxPercentage: new Prisma.Decimal(tenant?.taxPercentage || 0),
                    taxAmount: new Prisma.Decimal(taxAmount),
                    paymentStatus,
                    status: transactionStatus,
                    notes: data.notes,
                    date: new Date(),
                },
                include: {
                    vehicle: { select: { id: true, make: true, model: true } },
                    customer: { select: { id: true, name: true } },
                },
            });

            // 2. Create Initial Payment (CASH or DP)
            // Determine initial payment amount
            let initialPaymentAmount = 0;
            if (data.paymentType === 'CASH') {
                initialPaymentAmount = finalPrice;
            } else if (data.paymentType === 'CREDIT' && data.creditData) {
                initialPaymentAmount = data.creditData.downPayment;
            }

            // Create Payment Record if amount > 0
            if (initialPaymentAmount > 0) {
                await tx.transactionPayment.create({
                    data: {
                        transactionId: transaction.id,
                        amount: new Decimal(initialPaymentAmount),
                        method: data.paymentMethod || 'CASH', // Default to CASH if not specified
                        referenceNumber: data.referenceNumber,
                        note: data.paymentType === 'CREDIT' ? 'Down Payment (DP)' : 'Full Payment',
                        date: new Date(),
                    }
                });
            }

            // 3. Create Credit Record (if applicable)
            if (data.paymentType === 'CREDIT' && data.creditData) {
                const cd = data.creditData;
                const totalCredit = finalPrice - cd.downPayment;
                const years = cd.tenorMonths / 12;
                const totalInterest = totalCredit * (cd.interestRate / 100) * years;
                const monthlyPayment = (totalCredit + totalInterest) / cd.tenorMonths;

                await tx.credit.create({
                    data: {
                        transactionId: transaction.id,
                        creditType: cd.creditType,
                        leasingCompany: cd.leasingCompany,
                        downPayment: new Decimal(cd.downPayment),
                        totalAmount: new Decimal(totalCredit),
                        interestRate: new Decimal(cd.interestRate),
                        tenorMonths: cd.tenorMonths,
                        monthlyPayment: new Decimal(monthlyPayment),
                        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                        status: 'ACTIVE',
                    },
                });
            }

            // 4. Update Vehicle Status
            if (data.type === 'SALE') {
                if (transactionStatus === 'COMPLETED') {
                    await tx.vehicle.update({
                        where: { id: data.vehicleId },
                        data: { status: 'SOLD' },
                    });
                } else {
                    await tx.vehicle.update({
                        where: { id: data.vehicleId },
                        data: { status: 'BOOKED' },
                    });
                }
            }

            return transaction;
        });

        // M2: Notify tenant owner about new transaction (fire-and-forget)
        try {
            const owner = await this.prisma.user.findFirst({
                where: { tenantId, role: 'OWNER' },
            });
            if (owner && owner.id !== salesPersonId) {
                await this.notificationService.createNotification({
                    userId: owner.id,
                    title: data.type === 'SALE' ? 'Penjualan Baru 🎉' : 'Pembelian Baru',
                    message: `Transaksi ${ data.type === 'SALE' ? 'penjualan' : 'pembelian' } baru telah dibuat.`,
                    type: 'TRANSACTION',
                    link: '/app/transactions',
                });
            }
        } catch (e) { /* non-blocking */ }

        return result;
    }

    async updateStatus(id: string, tenantId: string, status: string) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, tenantId },
        });

        if (!transaction) {
            throw new NotFoundException('Transaksi tidak ditemukan');
        }

        const updated = await this.prisma.transaction.update({
            where: { id },
            data: { status },
        });

        // If marked as PAID/COMPLETED and it's a sale, mark vehicle as SOLD
        if ((status === 'PAID' || status === 'COMPLETED') && transaction.type === 'SALE') {
            await this.prisma.vehicle.update({
                where: { id: transaction.vehicleId },
                data: { status: 'SOLD' },
            });
        }

        // If cancelled, revert vehicle to AVAILABLE only for SALE type
        // (PURCHASE cancellation doesn't change vehicle status — it was never BOOKED)
        if (status === 'CANCELLED' && transaction.type === 'SALE') {
            await this.prisma.vehicle.update({
                where: { id: transaction.vehicleId },
                data: { status: 'AVAILABLE' },
            });
        }

        return updated;
    }

    async delete(id: string, tenantId: string) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, tenantId, deletedAt: null },
        });

        if (!transaction) {
            throw new NotFoundException('Transaksi tidak ditemukan');
        }

        // Soft delete: set deletedAt timestamp
        await this.prisma.transaction.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        // Revert vehicle status
        await this.prisma.vehicle.update({
            where: { id: transaction.vehicleId },
            data: { status: 'AVAILABLE' },
        });

        return { success: true };
    }

    async getMonthlySales(tenantId: string, months: number = 6) {
        const results: { month: string; count: number; revenue: number }[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const monthData = await this.prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'SALE',
                    status: { in: ['PAID', 'COMPLETED'] },
                    date: { gte: startDate, lte: endDate },
                },
                _sum: { finalPrice: true },
                _count: true,
            });

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            results.push({
                month: monthNames[startDate.getMonth()],
                count: monthData._count,
                revenue: Number(monthData._sum.finalPrice || 0),
            });
        }

        return results;
    }

    // ==================== PDF GENERATION ====================
    // NOTE (L2): PDF generation has been consolidated into PdfService.
    // Use PdfService.generateTransactionInvoice() and PdfService.generateTransactionReceipt()
    // instead of duplicating PDF logic here.
    // See: src/pdf/pdf.service.ts
}
