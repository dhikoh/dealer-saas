import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class TransactionService {
    private readonly logger = new Logger(TransactionService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Generate invoice number: INV-YYYYMM-NNN
     */
    private async generateInvoiceNumber(tenantId: string, type: string): Promise<string> {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
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
        return `${prefix}-${yearMonth}-${seq}`;
    }

    async findAll(tenantId: string, filters?: { type?: string; status?: string; startDate?: Date; endDate?: Date }) {
        const where: any = { tenantId };

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
            where: { id, tenantId },
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
        return this.prisma.$transaction(async (tx) => {
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
            where: { id, tenantId },
        });

        if (!transaction) {
            throw new NotFoundException('Transaksi tidak ditemukan');
        }

        // Delete associated credit first if exists
        await this.prisma.credit.deleteMany({
            where: { transactionId: id },
        });

        // Delete transaction
        await this.prisma.transaction.delete({
            where: { id },
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

    async generateInvoicePdf(transactionId: string, tenantId: string): Promise<Buffer> {
        const tx = await this.prisma.transaction.findFirst({
            where: { id: transactionId, tenantId },
            include: {
                tenant: true,
                customer: true,
                vehicle: true,
                salesPerson: true,
            },
        });

        if (!tx) throw new NotFoundException('Transaksi tidak ditemukan');

        const PDFDocument = require('pdfkit');

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // --- HEADER ---
            doc.fontSize(24).text('INVOICE', { align: 'right' });
            doc.fontSize(10).text(`NO: ${tx.invoiceNumber || tx.id.slice(0, 8)}`, { align: 'right' });
            doc.text(`TANGGAL: ${new Date(tx.date).toLocaleDateString('id-ID')}`, { align: 'right' });

            // Dealer Info
            doc.moveDown();
            doc.fontSize(14).text(tx.tenant.name, 50, 50);
            doc.fontSize(10)
                .text(tx.tenant.address || 'Alamat Dealer', 50, 70, { width: 200 })
                .text(`Telp: ${tx.tenant.phone || '-'}`, 50, 85);

            doc.moveDown(4);

            // --- CUSTOMER INFO ---
            const customerY = 150;
            doc.fontSize(12).font('Helvetica-Bold').text('TAGIHAN KEPADA:', 50, customerY);
            doc.font('Helvetica').fontSize(10)
                .text(tx.customer.name, 50, customerY + 20)
                .text(tx.customer.phone, 50, customerY + 35)
                .text(tx.customer.address || '', 50, customerY + 50);

            // --- ITEM TABLE ---
            const tableTop = 250;

            // Header
            doc.font('Helvetica-Bold');
            doc.text('KETERANGAN', 50, tableTop);
            doc.text('HARGA UTAMA', 350, tableTop, { width: 90, align: 'right' });
            doc.text('TOTAL', 450, tableTop, { width: 90, align: 'right' });
            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Row 1: Vehicle
            const itemY = tableTop + 25;
            doc.font('Helvetica');
            doc.text(`${tx.vehicle.make} ${tx.vehicle.model} ${tx.vehicle.year}`, 50, itemY);
            doc.text(`Nopol: ${tx.vehicle.licensePlate || '-'}`, 50, itemY + 15, { color: 'gray', size: 8 });
            doc.fillColor('black').fontSize(10);

            doc.text(Number(tx.basePrice).toLocaleString('id-ID'), 350, itemY, { width: 90, align: 'right' });
            doc.text(Number(tx.basePrice).toLocaleString('id-ID'), 450, itemY, { width: 90, align: 'right' });

            // Row 2: Tax (if any)
            let currentY = itemY + 40;
            if (Number(tx.taxAmount) > 0) {
                doc.text(`PPN (${tx.taxPercentage}%)`, 50, currentY);
                doc.text(Number(tx.taxAmount).toLocaleString('id-ID'), 450, currentY, { width: 90, align: 'right' });
                currentY += 20;
            }

            doc.moveTo(350, currentY).lineTo(550, currentY).stroke();
            currentY += 10;

            // Total
            doc.font('Helvetica-Bold').fontSize(12);
            doc.text('TOTAL TAGIHAN:', 300, currentY, { align: 'right', width: 140 });
            doc.text(`Rp ${Number(tx.finalPrice).toLocaleString('id-ID')}`, 450, currentY, { width: 90, align: 'right' });

            // --- FOOTER ---
            const footerY = 700;
            doc.fontSize(10).font('Helvetica').text('Pembayaran dapat ditransfer ke:', 50, footerY);
            doc.font('Helvetica-Bold').text('BCA 1234567890 a.n PT OTOHUB', 50, footerY + 15);

            doc.text('(TERIMAKASIH ATAS KEPERCAYAAN ANDA)', 50, footerY + 100, { align: 'center', width: 500 });

            doc.end();
        });
    }

    async generateReceiptPdf(transactionId: string, tenantId: string): Promise<Buffer> {
        // Kuitansi logic (similar structure, simpler content)
        const tx = await this.prisma.transaction.findFirst({
            where: { id: transactionId, tenantId },
            include: { tenant: true, customer: true, vehicle: true },
        });
        if (!tx) throw new NotFoundException('Transaksi tidak ditemukan');

        const PDFDocument = require('pdfkit');

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A5', layout: 'landscape' }); // Kuitansi usually small
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Title
            doc.fontSize(20).font('Helvetica-Bold').text('KUITANSI PEMBAYARAN', { align: 'center' });
            doc.moveDown();

            // Content
            const startX = 50;
            let y = 100;

            doc.fontSize(12).font('Helvetica');
            doc.text(`No: ${tx.invoiceNumber || '-'}/REC`, 400, 50);

            doc.font('Helvetica').text('Telah terima dari:', startX, y);
            doc.font('Helvetica-Bold').text(tx.customer.name, startX + 100, y);
            y += 25;

            doc.font('Helvetica').text('Untuk Pembayaran:', startX, y);
            doc.text(`Pembelian Unit ${tx.vehicle.make} ${tx.vehicle.model} (${tx.vehicle.licensePlate || 'Unit Baru'})`, startX + 100, y, { width: 350 });
            y += 40;

            doc.font('Helvetica').text('Terbilang:', startX, y);
            doc.font('Helvetica-Bold').text(`# Rp ${Number(tx.finalPrice).toLocaleString('id-ID')} #`, startX + 100, y);

            // Signature
            doc.fontSize(10).font('Helvetica').text(`${tx.tenant.address?.split(',')[0] || 'Jakarta'}, ${new Date().toLocaleDateString('id-ID')}`, 400, 300);
            doc.text('Hormat Kami,', 400, 315);
            doc.font('Helvetica-Bold').text(tx.tenant.name, 400, 370);

            doc.end();
        });
    }
}
