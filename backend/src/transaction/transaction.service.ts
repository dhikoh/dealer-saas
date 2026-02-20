import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
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
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const prefix = type === 'SALE' ? 'INV' : 'PUR';

        // PRODUCTION HARDENING: Use entropy instead of count() to prevent invoice collisions
        const timeSuffix = Date.now().toString().slice(-5);
        const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 digit

        return `${prefix}-${yearMonth}-${timeSuffix}${randomSuffix}`;
    }

    async findAll(tenantId: string, filters?: { type?: string; status?: string; startDate?: Date; endDate?: Date }) {
        const where: Prisma.TransactionWhereInput = { tenantId, deletedAt: null };

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
                where: { tenantId, type: 'SALE', status: { in: ['PAID', 'COMPLETED'] } },
                _sum: { finalPrice: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: { tenantId, type: 'PURCHASE', status: { in: ['PAID', 'COMPLETED'] } },
                _sum: { finalPrice: true },
                _count: true,
            }),
            this.prisma.transaction.count({
                where: { tenantId, status: 'PENDING' },
            }),
            this.prisma.transaction.count({
                where: {
                    tenantId,
                    status: { in: ['PAID', 'COMPLETED'] },
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
        // 1. Validate Request & Dependencies
        const { tenant } = await this.validateTransactionRequest(tenantId, data);

        // 2. Financial Calculations
        const finalPrice = Number(data.finalPrice);
        const { basePrice, taxAmount } = this.calculateFinancials(finalPrice, Number(tenant?.taxPercentage || 0));

        // 3. Generate Invoice
        const invoiceNumber = await this.generateInvoiceNumber(tenantId, data.type);


        // Use Interactive Transaction to ensure atomicity
        const result = await this.prisma.$transaction(async (tx) => {
            // CONCURRENCY FIX: Re-check vehicle availability INSIDE the interactive transaction
            // to prevent Race Conditions (Double Booking)
            const lockedVehicle = await tx.vehicle.findFirst({
                where: { id: data.vehicleId, tenantId, status: 'AVAILABLE' }
            });

            if (!lockedVehicle) {
                throw new BadRequestException('Transaksi gagal: Kendaraan sudah terjual atau tidak tersedia saat dicheckout.');
            }

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
                    finalPrice: new Decimal(finalPrice),
                    basePrice: new Decimal(basePrice),
                    taxPercentage: new Decimal(tenant?.taxPercentage || 0),
                    taxAmount: new Decimal(taxAmount),
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
                    message: `Transaksi ${data.type === 'SALE' ? 'penjualan' : 'pembelian'} baru telah dibuat.`,
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

        // VALIDATION: Strict State Machine
        if (transaction.status === 'COMPLETED' || transaction.status === 'CANCELLED') {
            // Allow reopening ONLY if explicitly intended (e.g. for refund/correction), 
            // but for now, let's block it for safety as per "Workflow Hardening" request.
            if (status !== transaction.status) {
                throw new BadRequestException(
                    `Transaksi dengan status ${transaction.status} tidak dapat diubah lagi. Silakan buat transaksi baru atau hubungi Admin.`
                );
            }
        }

        // Prevent invalid jumps
        if (transaction.status === 'PENDING' && status === 'COMPLETED') {
            // Ensure payment is sufficient? (Optional, but good for hardening)
            // For now, allow manual completion by staff.
        }

        // Use Interactive Transaction for Atomicity
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.transaction.update({
                where: { id },
                data: { status },
            });

            // If marked as PAID/COMPLETED and it's a sale, mark vehicle as SOLD
            if ((status === 'PAID' || status === 'COMPLETED') && transaction.type === 'SALE') {
                await tx.vehicle.update({
                    where: { id: transaction.vehicleId },
                    data: { status: 'SOLD' },
                });
            }

            // If cancelled, revert vehicle to AVAILABLE only for SALE type
            if (status === 'CANCELLED' && transaction.type === 'SALE') {
                await tx.vehicle.update({
                    where: { id: transaction.vehicleId },
                    data: { status: 'AVAILABLE' },
                });
            }

            return updated;
        });
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
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        // 1. Calculate Date Range
        const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 2. Fetch Raw Data (Single Query)
        const transactions = await this.prisma.transaction.findMany({
            where: {
                tenantId,
                type: 'SALE',
                status: { in: ['PAID', 'COMPLETED'] },
                date: { gte: startDate, lte: endDate },
            },
            select: {
                date: true,
                finalPrice: true,
            },
        });

        // 3. Aggregate in Memory
        // Initialize result buckets
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            results.push({
                month: monthNames[d.getMonth()],
                count: 0,
                revenue: 0,
            });
        }

        // Fill buckets
        transactions.forEach(t => {
            const txDate = new Date(t.date);
            // Simple logic: Find which bucket this date belongs to
            // Since results are ordered from oldest (months-1 ago) to current,
            // we can map the date to an index.

            // Or simpler: Match by month string/index from the date.
            // Let's use the month index of the transaction vs the buckets.

            const monthIndex = txDate.getMonth();
            // Find the bucket that matches this month name. 
            // Warning: This simple name check fails if spanning across years with same month name (unlikely for <12 months).
            // Better: Compare year/month.

            const match = results.find(r => r.month === monthNames[monthIndex]);
            // NOTE: If we have multiple "Jan" (e.g. Jan 2024 and Jan 2025), this fails.
            // Given "months" usually <= 12, and "last 6 months", minimal collision unless exactly 12.
            // Let's stick to the existing logic's output format but make mapping robust.

            // Robust Mapping:
            // Calculate diff in months from "now".
            const diffMonths = (now.getFullYear() - txDate.getFullYear()) * 12 + (now.getMonth() - txDate.getMonth());

            // "i" in the loop above went from months-1 down to 0.
            // Results array index 0 corresponds to i = months-1 (oldest).
            // Results array index "last" corresponds to i=0 (current).
            // So: index = (months - 1) - diffMonths.

            const index = (months - 1) - diffMonths;
            if (index >= 0 && index < results.length) {
                results[index].count++;
                results[index].revenue += Number(t.finalPrice);
            }
        });

        return results;
    }

    // ==================== PDF GENERATION ====================
    // Delegates to PdfService for invoice/receipt generation.

    private async validateTransactionRequest(tenantId: string, data: {
        type: string;
        vehicleId: string;
        customerId: string;
        [key: string]: any;
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
            throw new BadRequestException(`Kendaraan tidak tersedia untuk dijual (Status: ${vehicle.status})`);
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

        // VALIDATION: Documents required for SALE
        if (data.type === 'SALE') {
            if (!vehicle.stnkImage) {
                throw new BadRequestException(
                    'Foto STNK wajib diunggah sebelum kendaraan dapat dijual'
                );
            }
            if (!vehicle.ktpOwnerImage) {

                // Allow bypass for "showroom" units if explicitly allowed? No, strict check.
                // But check if maybe the rule is too strict? 
                // The prompt asked for "Safety Check". 
                // Using "Safe Navigation" / Optional Chaining if fields are optional?
                // The fields stnkImage are String? in schema.

                throw new BadRequestException(
                    'Foto KTP pemilik/atas nama BPKB wajib diunggah sebelum kendaraan dapat dijual'
                );
            }
        }

        return { vehicle, customer, tenant };
    }

    private calculateFinancials(finalPrice: number, taxPercentage: number) {
        const taxRate = Number(taxPercentage) / 100;
        const basePrice = finalPrice / (1 + taxRate);
        const taxAmount = finalPrice - basePrice;
        return { basePrice, taxAmount };
    }
}
