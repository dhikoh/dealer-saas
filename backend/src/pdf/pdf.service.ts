import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

import { UploadService } from '../upload/upload.service';

@Injectable()
export class PdfService {
    constructor(
        private prisma: PrismaService,
        private uploadService: UploadService
    ) { }

    // Format currency in Indonesian Rupiah
    private formatCurrency(value: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    // Format date in Indonesian locale
    private formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    /**
     * Helper to draw a professional header
     */
    private drawHeader(doc: any, tenant: any, title: string, subTitle?: string) {
        // Top Bar
        doc.rect(0, 0, 612, 50).fill('#00bfa5'); // 612 is A4 width

        // Company Name
        doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
            .text((tenant?.name || 'OTOHUB').toUpperCase(), 50, 15);

        // Reset for content
        doc.fillColor('#1a1a2e').y = 80;

        // Address Block
        if (tenant?.address) {
            doc.fontSize(9).font('Helvetica').fillColor('#555')
                .text(tenant.address, 50, 60, { width: 300 });
        }
        if (tenant?.phone) {
            doc.fontSize(9).font('Helvetica').fillColor('#555')
                .text(`Telp/WA: ${tenant.phone}`, 50, 75);
        }

        // Title Block (Right Side)
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#00bfa5')
            .text(title.toUpperCase(), 350, 60, { align: 'right', width: 200 });
        if (subTitle) {
            doc.fontSize(9).font('Helvetica').fillColor('#999')
                .text(subTitle, 350, 80, { align: 'right', width: 200 });
        }

        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#eee');
        doc.moveDown();
    }

    /**
     * Generate Internal Vehicle Report PDF
     * Includes: purchase price, all costs, profit margin
     */
    async generateInternalVehicleReport(
        vehicleId: string,
        tenantId: string,
        res: any,
    ) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId },
        }) as any;

        if (!vehicle) {
            throw new Error('Vehicle not found');
        }

        // Get costs if VehicleCost model exists
        let costs: any[] = [];
        try {
            costs = await (this.prisma as any).vehicleCost.findMany({
                where: { vehicleId },
                orderBy: { date: 'desc' },
            });
        } catch (e) {
            // VehicleCost table might not exist yet
            costs = [];
        }

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        // Calculate costs
        const purchasePrice = Number(vehicle.purchasePrice || 0);
        const sellingPrice = Number(vehicle.price || 0);
        const additionalCosts = costs.reduce(
            (sum, cost) => sum + Number(cost.amount),
            0,
        );
        const totalCost = purchasePrice + additionalCosts;
        const profitMargin = sellingPrice - totalCost;
        const profitPercentage = totalCost > 0 ? ((profitMargin / totalCost) * 100).toFixed(1) : '0';

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Vehicle_Internal_${vehicle.licensePlate || vehicle.id}.pdf`,
        );

        doc.pipe(res);

        // Define Watermark Function
        const drawWatermark = () => {
            doc.save();
            doc.rotate(-45, { origin: [300, 400] });
            doc.opacity(0.05); // Lighter opacity for better readability
            doc.fontSize(60).font('Helvetica-Bold').fillColor('red');
            doc.text((tenant?.name || 'CONFIDENTIAL').toUpperCase(), 50, 400, {
                width: 500,
                align: 'center',
            });
            doc.fontSize(20).text('INTERNAL USE ONLY', 50, 480, {
                width: 500,
                align: 'center',
            });
            doc.restore();
        };

        // Add to first page
        drawWatermark();

        // Add to subsequent pages
        doc.on('pageAdded', drawWatermark);

        // === PROFESSIONAL HEADER ===
        this.drawHeader(doc, tenant, 'Laporan Internal', 'DOKUMEN RAHASIA');

        // Draw line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Vehicle Info Section
        doc.fontSize(14).font('Helvetica-Bold').text('INFORMASI KENDARAAN');
        doc.moveDown(0.5);

        const vehicleInfo = [
            ['Merk/Model', `${vehicle.make} ${vehicle.model} ${vehicle.variant || ''}`],
            ['Tahun', vehicle.year?.toString() || '-'],
            ['Warna', vehicle.color || '-'],
            ['No. Plat', vehicle.licensePlate || '-'],
            ['No. Rangka', vehicle.chassisNumber || '-'],
            ['No. Mesin', vehicle.engineNumber || '-'],
            ['No. BPKB', vehicle.bpkbNumber || '-'],
            ['Status', vehicle.status || '-'],
            ['Kondisi', vehicle.condition || '-'],
        ];

        doc.fontSize(10).font('Helvetica');
        vehicleInfo.forEach(([label, value]) => {
            doc.text(`${label}: `, { continued: true }).font('Helvetica-Bold').text(value);
            doc.font('Helvetica');
        });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Financial Summary - INTERNAL ONLY
        doc.fontSize(14).font('Helvetica-Bold').text('RINGKASAN KEUANGAN (INTERNAL)');
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica');
        doc.text(`Harga Beli (Modal): `, { continued: true })
            .font('Helvetica-Bold').text(this.formatCurrency(purchasePrice));
        doc.font('Helvetica');
        doc.text(`Biaya Tambahan: `, { continued: true })
            .font('Helvetica-Bold').text(this.formatCurrency(additionalCosts));
        doc.font('Helvetica');
        doc.text(`Total Cost: `, { continued: true })
            .font('Helvetica-Bold').text(this.formatCurrency(totalCost));
        doc.font('Helvetica');
        doc.text(`Harga Jual: `, { continued: true })
            .font('Helvetica-Bold').text(this.formatCurrency(sellingPrice));
        doc.font('Helvetica');

        // Profit with color indicator
        doc.text(`Profit: `, { continued: true })
            .font('Helvetica-Bold')
            .text(`${this.formatCurrency(profitMargin)} (${profitPercentage}%)`);

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Cost Details
        if (costs.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('RINCIAN BIAYA');
            doc.moveDown(0.5);

            doc.fontSize(10).font('Helvetica');
            costs.forEach((cost) => {
                const costLine = `${cost.costType}: ${cost.description || '-'} - ${this.formatCurrency(Number(cost.amount))} (${this.formatDate(cost.date)})`;
                doc.text(costLine);
            });
        }

        // Check for duplicates
        // ...

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica').fillColor('#999')
            .text(`Dicetak: ${this.formatDate(new Date())} | ${tenant?.name || 'OTOHUB'}`, { align: 'right' });
        doc.text('DOKUMEN INI BERSIFAT RAHASIA — HANYA UNTUK PENGGUNAAN INTERNAL', { align: 'center', fillColor: '#cc0000' });

        doc.end();
    }

    /**
     * Add diagonal watermark to every page
     */
    private addWatermark(doc: any, text: string) {
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);

            doc.save();
            doc.rotate(-45, { origin: [300, 400] });
            doc.opacity(0.1);
            doc.fontSize(60).font('Helvetica-Bold').fillColor('red');
            doc.text(text.toUpperCase(), 50, 400, {
                width: 800,
                align: 'center',
            });
            doc.fontSize(20).text('INTERNAL USE ONLY', 50, 480, {
                width: 800,
                align: 'center',
            });
            doc.restore();
        }
    }

    /**
     * Generate Customer Vehicle Report PDF
     * Only includes: vehicle info and selling price (NO COSTS)
     */
    async generateCustomerVehicleReport(
        vehicleId: string,
        tenantId: string,
        res: any,
    ) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId },
        }) as any;

        if (!vehicle) {
            throw new Error('Vehicle not found');
        }

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        }) as any;

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Vehicle_Info_${vehicle.licensePlate || vehicle.id}.pdf`,
        );

        doc.pipe(res);

        // === PROFESSIONAL HEADER ===
        this.drawHeader(doc, tenant, 'INFORMASI KENDARAAN');

        // Draw decorative line
        // doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // drawHeader already does this
        // doc.moveDown();

        // Vehicle Details - Customer friendly format
        doc.fontSize(12).font('Helvetica-Bold').text('Detail Kendaraan');
        doc.moveDown(0.5);

        const vehicleDetails = [
            ['Merk', vehicle.make || '-'],
            ['Model', `${vehicle.model || ''} ${vehicle.variant || ''}`],
            ['Tahun', vehicle.year?.toString() || '-'],
            ['Warna', vehicle.color || '-'],
            ['Nomor Polisi', vehicle.licensePlate || '-'],
            ['Kategori', vehicle.category === 'CAR' ? 'Mobil' : 'Motor'],
            ['Kondisi', vehicle.condition === 'READY' ? 'Siap Pakai' : (vehicle.condition || '-')],
        ];

        doc.fontSize(11).font('Helvetica');
        vehicleDetails.forEach(([label, value]) => {
            doc.text(`${label}: `, { continued: true })
                .font('Helvetica-Bold').text(value);
            doc.font('Helvetica');
        });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Kelengkapan
        doc.fontSize(12).font('Helvetica-Bold').text('Kelengkapan Dokumen');
        doc.moveDown(0.5);

        const kelengkapan = [
            ['BPKB', vehicle.bpkbAvailable ? 'Ada' : 'Tidak Ada'],
            ['Faktur', vehicle.fakturAvailable ? 'Ada' : 'Tidak Ada'],
            ['Buku Service', vehicle.serviceBook ? 'Ada' : 'Tidak Ada'],
            ['Kunci Cadangan', vehicle.spareKey ? 'Ada' : 'Tidak Ada'],
        ];

        doc.fontSize(10).font('Helvetica');
        kelengkapan.forEach(([label, value]) => {
            doc.text(`${label}: ${value}`);
        });

        if (vehicle.stnkExpiry) {
            doc.moveDown(0.5);
            doc.text(`STNK berlaku s/d: ${this.formatDate(vehicle.stnkExpiry)}`);
        }

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // PRICE - Big and prominent
        doc.fontSize(14).font('Helvetica-Bold').text('HARGA', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(24).font('Helvetica-Bold')
            .text(this.formatCurrency(Number(vehicle.price)), { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica')
            .text('* Harga belum termasuk biaya balik nama dan pajak', { align: 'center' });

        doc.moveDown(2);

        // Contact info
        doc.fontSize(11).font('Helvetica-Bold').text('Hubungi Kami:', { align: 'center' });
        doc.fontSize(10).font('Helvetica')
            .text(tenant?.phone || '', { align: 'center' });

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica')
            .text(`Dokumen dibuat: ${this.formatDate(new Date())}`, { align: 'center' });

        doc.end();
    }

    /**
     * Generate Transaction Invoice PDF
     * Customer-facing invoice for vehicle sale/purchase
     */
    async generateTransactionInvoice(
        transactionId: string,
        tenantId: string,
        res: any,
    ) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id: transactionId, tenantId },
            include: {
                vehicle: true,
                customer: true,
                salesPerson: true,
                credit: true,
            },
        }) as any;

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        }) as any;

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Invoice_${transactionId.slice(0, 8)}.pdf`,
        );

        doc.pipe(res);

        // === PROFESSIONAL HEADER ===
        this.drawHeader(doc, tenant, 'INVOICE', `INV-${transactionId.slice(0, 8).toUpperCase()}`);

        // Invoice number and date
        doc.fontSize(10).font('Helvetica');
        doc.text(`No. Invoice: INV-${transactionId.slice(0, 8).toUpperCase()}`);
        doc.text(`Tanggal: ${this.formatDate(transaction.date)}`);
        doc.text(`Tipe Transaksi: ${transaction.type === 'SALE' ? 'Penjualan' : 'Pembelian'}`);
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // === CUSTOMER INFO ===
        doc.fontSize(12).font('Helvetica-Bold').text('Kepada:');
        doc.fontSize(10).font('Helvetica');
        doc.text(transaction.customer?.name || '-');
        doc.text(transaction.customer?.address || '');
        doc.text(`Telp: ${transaction.customer?.phone || '-'}`);
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // === VEHICLE INFO ===
        doc.fontSize(12).font('Helvetica-Bold').text('Detail Kendaraan:');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        const v = transaction.vehicle;
        const vehicleInfo = [
            ['Merk/Model', `${v?.make || ''} ${v?.model || ''} ${v?.variant || ''}`],
            ['Tahun', v?.year?.toString() || '-'],
            ['Warna', v?.color || '-'],
            ['No. Polisi', v?.licensePlate || '-'],
            ['No. Rangka', v?.chassisNumber || '-'],
            ['No. Mesin', v?.engineNumber || '-'],
        ];

        vehicleInfo.forEach(([label, value]) => {
            doc.text(`${label}: ${value}`);
        });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // === PAYMENT INFO ===
        doc.fontSize(12).font('Helvetica-Bold').text('Pembayaran:');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        doc.text(`Metode: ${transaction.paymentType === 'CASH' ? 'Tunai' : 'Kredit'}`);

        if (transaction.paymentType === 'CREDIT' && transaction.credit) {
            doc.text(`Uang Muka (DP): ${this.formatCurrency(Number(transaction.credit.downPayment))}`);
            doc.text(`Tenor: ${transaction.credit.tenorMonths} bulan`);
            doc.text(`Bunga: ${transaction.credit.interestRate}% / tahun`);
            doc.text(`Cicilan/bulan: ${this.formatCurrency(Number(transaction.credit.monthlyPayment))}`);
        }

        doc.moveDown();

        // === TOTAL ===
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('TOTAL', { align: 'center' });
        doc.fontSize(24).font('Helvetica-Bold')
            .text(this.formatCurrency(Number(transaction.finalPrice)), { align: 'center' });

        doc.moveDown();

        // Status
        const statusText = {
            PENDING: 'Menunggu Pembayaran',
            PAID: 'Lunas',
            CANCELLED: 'Dibatalkan',
        }[transaction.status] || transaction.status;

        doc.fontSize(12).font('Helvetica-Bold')
            .text(`Status: ${statusText}`, { align: 'center' });

        doc.moveDown(2);

        // === FOOTER ===
        doc.fontSize(10).font('Helvetica');
        doc.text(`Sales: ${transaction.salesPerson?.name || '-'}`, { align: 'right' });
        doc.moveDown(2);

        doc.fontSize(8)
            .text('Terima kasih atas kepercayaan Anda', { align: 'center' });
        doc.text(`Dicetak: ${this.formatDate(new Date())}`, { align: 'center' });

        if (transaction.notes) {
            doc.moveDown();
            doc.text(`Catatan: ${transaction.notes}`, { align: 'left' });
        }

        doc.end();
    }

    /**
     * Generate SPK (Surat Pemesanan Kendaraan) PDF
     * Official order confirmation document
     */
    async generateTransactionSPK(
        transactionId: string,
        tenantId: string,
        res: any,
    ) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id: transactionId, tenantId },
            include: {
                vehicle: true,
                customer: true,
                salesPerson: true,
                credit: true,
            },
        }) as any;

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        }) as any;

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=SPK_${transactionId.slice(0, 8)}.pdf`,
        );

        doc.pipe(res);

        // === HEADER ===
        this.drawHeader(doc, tenant, 'SURAT PESANAN', `SPK-${transactionId.slice(0, 8).toUpperCase()}`);

        doc.fontSize(10).font('Helvetica');
        doc.text(`No. SPK: SPK-${transactionId.slice(0, 8).toUpperCase()}`);
        doc.text(`Tanggal: ${this.formatDate(transaction.date)}`);
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // === PIHAK PERTAMA (DEALER) ===
        // Implicitly the header, but strictly speaking usually SPK mentions "Kami yang bertanda tangan dibawah ini..."

        // === PIHAK KEDUA (PEMESAN) ===
        doc.fontSize(12).font('Helvetica-Bold').text('DATA PEMESAN (KONSUMEN)');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Nama: ${transaction.customer?.name || '-'}`);
        doc.text(`Alamat: ${transaction.customer?.address || '-'}`);
        doc.text(`No. Telp/HP: ${transaction.customer?.phone || '-'}`);
        doc.text(`No. KTP: ${transaction.customer?.ktpNumber || '-'}`);
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // === DATA KENDARAAN ===
        doc.fontSize(12).font('Helvetica-Bold').text('DATA KENDARAAN');
        doc.moveDown(0.5);
        const v = transaction.vehicle;
        const vehicleInfo = [
            ['Merk/Type', `${v?.make || ''} ${v?.model || ''} ${v?.variant || ''}`],
            ['Tahun', v?.year?.toString() || '-'],
            ['Warna', v?.color || '-'],
            ['No. Polisi', v?.licensePlate || '-'],
            ['No. Rangka', v?.chassisNumber || '-'],
            ['No. Mesin', v?.engineNumber || '-'],
        ];
        doc.fontSize(10).font('Helvetica');
        vehicleInfo.forEach(([label, value]) => {
            doc.text(`${label}: ${value}`);
        });
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // === RINCIAN PEMBAYARAN ===
        doc.fontSize(12).font('Helvetica-Bold').text('RINCIAN PEMBAYARAN');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        doc.text(`Harga Kesepakatan: ${this.formatCurrency(Number(transaction.finalPrice))}`);
        doc.text(`Metode Pembayaran: ${transaction.paymentType === 'CASH' ? 'TUNAI' : 'KREDIT'}`);

        if (transaction.paymentType === 'CREDIT' && transaction.credit) {
            doc.moveDown(0.5);
            doc.text('Rincian Kredit:', { underline: true });
            doc.text(`- Uang Muka (DP): ${this.formatCurrency(Number(transaction.credit.downPayment))}`);
            doc.text(`- Tenor: ${transaction.credit.tenorMonths} Bulan`);
            doc.text(`- Angsuran: ${this.formatCurrency(Number(transaction.credit.monthlyPayment))} / bulan`);
            if (transaction.credit.leasingCompany) {
                doc.text(`- Leasing: ${transaction.credit.leasingCompany}`);
            }
        }

        doc.moveDown(2);

        // === SIGNATURES ===
        const ySign = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');

        doc.text('Pemesani / Pembeli', 50, ySign, { width: 200, align: 'center' });
        doc.text('Mengetahui Sales', 350, ySign, { width: 200, align: 'center' });

        doc.moveDown(4);

        doc.font('Helvetica');
        doc.text(`( ${transaction.customer?.name || '....................'} )`, 50, doc.y, { width: 200, align: 'center' });
        doc.text(`( ${transaction.salesPerson?.name || '....................'} )`, 350, doc.y - 12, { width: 200, align: 'center' }); // Adjust y - height matches

        // Legal Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#555');
        doc.text('* Barang yang sudah dibeli tidak dapat ditukar/dikembalikan kecuali ada perjanjian khusus.', { align: 'center' });
        doc.text('* SPK ini sah jika ditandatangani kedua belah pihak.', { align: 'center' });

        doc.end();
    }

    /**
     * Generate Sales Report PDF
     * Monthly sales, top brands, revenue, and performance metrics
     */
    async generateSalesReport(
        tenantId: string,
        months: number,
        res: any,
    ) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

        // Fetch all paid sales in period
        const transactions = await this.prisma.transaction.findMany({
            where: {
                tenantId,
                type: 'SALE',
                status: 'PAID',
                date: { gte: startDate },
            },
            include: { vehicle: true, customer: true },
            orderBy: { date: 'desc' },
        });

        // Monthly aggregation
        const monthlyData: Record<string, { count: number; revenue: number }> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            monthlyData[key] = { count: 0, revenue: 0 };
        }

        const brandMap = new Map<string, number>();
        let totalRevenue = 0;

        for (const tx of transactions) {
            const txDate = new Date(tx.date);
            const key = `${monthNames[txDate.getMonth()]} ${txDate.getFullYear()}`;
            if (monthlyData[key]) {
                monthlyData[key].count += 1;
                monthlyData[key].revenue += Number(tx.finalPrice || 0);
            }
            totalRevenue += Number(tx.finalPrice || 0);
            const brand = (tx.vehicle as any)?.make || 'Lainnya';
            brandMap.set(brand, (brandMap.get(brand) || 0) + 1);
        }

        const topBrands = Array.from(brandMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.pdf`,
        );

        doc.pipe(res);

        // === HEADER ===
        this.drawHeader(doc, tenant, 'LAPORAN PENJUALAN', `Periode: ${months} bulan`);

        // === SUMMARY ===
        doc.fontSize(14).font('Helvetica-Bold').text('Ringkasan');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total Transaksi: ${transactions.length} unit`);
        doc.text(`Total Revenue: ${this.formatCurrency(totalRevenue)}`);
        doc.text(`Rata-rata per Transaksi: ${this.formatCurrency(transactions.length > 0 ? totalRevenue / transactions.length : 0)}`);
        doc.moveDown();

        // === MONTHLY TABLE ===
        doc.fontSize(14).font('Helvetica-Bold').text('Penjualan Bulanan');
        doc.moveDown(0.5);

        // Table header
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Bulan', 50, tableTop, { width: 150 });
        doc.text('Unit', 200, tableTop, { width: 100, align: 'center' });
        doc.text('Revenue', 300, tableTop, { width: 200, align: 'right' });
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ddd');

        doc.font('Helvetica').fontSize(10);
        for (const [month, data] of Object.entries(monthlyData)) {
            const y = doc.y + 5;
            doc.text(month, 50, y, { width: 150 });
            doc.text(data.count.toString(), 200, y, { width: 100, align: 'center' });
            doc.text(this.formatCurrency(data.revenue), 300, y, { width: 200, align: 'right' });
            doc.moveDown();
        }

        doc.moveDown();

        // === TOP BRANDS ===
        if (topBrands.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('Merek Terlaris');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica');
            topBrands.forEach(([name, count], i) => {
                doc.text(`${i + 1}. ${name} — ${count} unit`);
            });
            doc.moveDown();
        }

        // === RECENT TRANSACTIONS ===
        const recent = transactions.slice(0, 10);
        if (recent.length > 0) {
            doc.addPage();
            doc.fontSize(14).font('Helvetica-Bold').text('10 Transaksi Terakhir');
            doc.moveDown(0.5);

            const th = doc.y;
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Tanggal', 50, th, { width: 80 });
            doc.text('Kendaraan', 130, th, { width: 180 });
            doc.text('Customer', 310, th, { width: 120 });
            doc.text('Harga', 430, th, { width: 120, align: 'right' });
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ddd');

            doc.font('Helvetica').fontSize(9);
            for (const tx of recent) {
                const y = doc.y + 3;
                const vehicle = tx.vehicle as any;
                doc.text(this.formatDate(tx.date), 50, y, { width: 80 });
                doc.text(
                    `${vehicle?.make || ''} ${vehicle?.model || ''} ${vehicle?.year || ''}`.trim() || '-',
                    130, y, { width: 180 },
                );
                doc.text((tx.customer as any)?.name || '-', 310, y, { width: 120 });
                doc.text(this.formatCurrency(Number(tx.finalPrice || 0)), 430, y, { width: 120, align: 'right' });
                doc.moveDown();
            }
        }

        // === FOOTER ===
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica')
            .text(`Dicetak: ${this.formatDate(new Date())} | ${tenant?.name || 'OTOHUB'}`, { align: 'center' });

        doc.end();
    }

    /**
     * Generate CSV export of sales transactions
     */
    async generateSalesCSV(
        tenantId: string,
        months: number,
        res: any,
    ) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const transactions = await this.prisma.transaction.findMany({
            where: {
                tenantId,
                type: 'SALE',
                status: 'PAID',
                date: { gte: startDate },
            },
            include: { vehicle: true, customer: true, salesPerson: true },
            orderBy: { date: 'desc' },
        });

        // Build CSV
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
        const headers = ['Tanggal', 'Tipe', 'Merek', 'Model', 'Tahun', 'Plat Nomor', 'Customer', 'Sales', 'Metode Bayar', 'Harga Jual', 'Status'];
        const rows = transactions.map(tx => {
            const v = tx.vehicle as any;
            const c = tx.customer as any;
            const s = tx.salesPerson as any;
            return [
                new Date(tx.date).toLocaleDateString('id-ID'),
                tx.type,
                v?.make || '',
                v?.model || '',
                v?.year || '',
                v?.licensePlate || '',
                c?.name || '',
                s?.name || '',
                tx.paymentType,
                Number(tx.finalPrice || 0),
                tx.status,
            ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = BOM + [headers.join(','), ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Penjualan_OTOHUB_${new Date().toISOString().split('T')[0]}.csv`,
        );
        res.send(csvContent);
    }

    /**
     * Generate System Invoice PDF (for billing/subscription invoices)
     * Used by superadmin and tenant for subscription billing
     */
    async generateSystemInvoicePdf(invoiceId: string, res: any) {
        const invoice = await (this.prisma as any).systemInvoice.findUnique({
            where: { id: invoiceId },
            include: { tenant: true },
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`,
        );

        doc.pipe(res);

        // === WATERMARK ===
        if (['PAID', 'REJECTED', 'OVERDUE', 'CANCELLED'].includes(invoice.status)) {
            const watermarkText = invoice.status === 'PAID' ? 'LUNAS' :
                invoice.status === 'REJECTED' ? 'DITOLAK' :
                    invoice.status === 'OVERDUE' ? 'JATUH TEMPO' : 'BATAL';

            const color = invoice.status === 'PAID' ? '#2ecc71' : '#e74c3c';

            doc.save();
            doc.rotate(-45, { origin: [300, 400] });
            doc.opacity(0.15);
            doc.fontSize(80).font('Helvetica-Bold').fillColor(color);
            doc.text(watermarkText, 50, 400, { width: 500, align: 'center' });
            doc.restore();
        }

        // === HEADER ===
        // We use OTOHUB as the issuer
        const issuer = {
            name: 'OTOHUB INDONESIA',
            address: 'Jakarta, Indonesia',
            phone: 'support@otohub.id',
            email: 'billing@otohub.id'
        };
        this.drawHeader(doc, issuer, 'INVOICE', invoice.invoiceNumber);

        // === INVOICE INFO ===
        doc.fontSize(10).font('Helvetica');
        const rightColX = 350;
        const topInfoY = 110;

        doc.text(`No. Invoice`, rightColX, topInfoY);
        doc.font('Helvetica-Bold').text(`: ${invoice.invoiceNumber}`, rightColX + 70, topInfoY);

        doc.font('Helvetica').text(`Tanggal`, rightColX, topInfoY + 15);
        doc.font('Helvetica-Bold').text(`: ${this.formatDate(invoice.date || invoice.createdAt)}`, rightColX + 70, topInfoY + 15);

        doc.font('Helvetica').text(`Jatuh Tempo`, rightColX, topInfoY + 30);
        doc.fillColor(invoice.status === 'OVERDUE' ? 'red' : 'black')
            .font('Helvetica-Bold').text(`: ${this.formatDate(invoice.dueDate)}`, rightColX + 70, topInfoY + 30);
        doc.fillColor('black'); // Reset

        // === BILL TO ===
        doc.y = topInfoY;
        doc.fontSize(12).font('Helvetica-Bold').text('DITAGIHKAN KEPADA:');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(invoice.tenant?.name || '-');
        if (invoice.tenant?.address) doc.text(invoice.tenant.address);
        if (invoice.tenant?.phone) doc.text(`Telp: ${invoice.tenant.phone}`);
        if (invoice.tenant?.email) doc.text(`Email: ${invoice.tenant.email}`);

        doc.moveDown(2);
        const tableTop = doc.y;

        // === ITEMS TABLE ===
        // Header
        doc.rect(50, tableTop, 512, 25).fill('#f4f4f4');
        doc.fillColor('#333');
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('No', 60, tableTop + 7, { width: 30 });
        doc.text('Deskripsi', 100, tableTop + 7, { width: 300 });
        doc.text('Jumlah', 410, tableTop + 7, { width: 140, align: 'right' });

        // Rows
        let items: any[] = [];
        try {
            items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : (invoice.items || []);
        } catch (e) {
            items = [{ description: 'Biaya Langganan OTOHUB', amount: invoice.amount }];
        }

        let y = tableTop + 35;
        doc.font('Helvetica').fontSize(10);

        items.forEach((item: any, i: number) => {
            doc.text(`${i + 1}`, 60, y, { width: 30 });
            doc.text(item.description || '-', 100, y, { width: 300 });
            doc.text(this.formatCurrency(Number(item.amount || 0)), 410, y, { width: 140, align: 'right' });
            y += 20;
        });

        // Line
        doc.moveTo(50, y).lineTo(562, y).stroke('#ddd');
        y += 10;

        // === TOTAL ===
        const totalY = y;
        doc.fontSize(12).font('Helvetica-Bold').text('TOTAL TAGIHAN', 300, totalY, { width: 100, align: 'right' });
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#00bfa5')
            .text(this.formatCurrency(Number(invoice.amount)), 410, totalY - 2, { width: 140, align: 'right' });

        doc.fillColor('black'); // Reset
        doc.moveDown(4);

        // === TERBILANG ===
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#555');
        doc.text(`Terbilang: # ${this.terbilang(Number(invoice.amount))} Rupiah #`, 50, totalY + 30);

        // === STATUS BADGE ===
        const statusMap: Record<string, string> = {
            'PENDING': 'MENUNGGU PEMBAYARAN',
            'VERIFYING': 'SEDANG DIVERIFIKASI',
            'PAID': 'LUNAS',
            'REJECTED': 'DITOLAK / DATA TIDAK VALID',
            'OVERDUE': 'JATUH TEMPO',
            'CANCELLED': 'DIBATALKAN'
        };

        const statusLabel = statusMap[invoice.status] || invoice.status;

        doc.moveDown(3);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('Status Pembayaran:');
        doc.fontSize(12).font('Helvetica-Bold').fillColor(
            invoice.status === 'PAID' ? '#2ecc71' :
                invoice.status === 'PENDING' ? '#f1c40f' :
                    invoice.status === 'VERIFYING' ? '#3498db' : '#e74c3c'
        ).text(statusLabel);

        // === PAYMENT INSTRUCTIONS (If Pending) ===
        if (invoice.status === 'PENDING' || invoice.status === 'OVERDUE') {
            doc.moveDown(2);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('Instruksi Pembayaran:');
            doc.fontSize(10).font('Helvetica').text('Silakan transfer ke rekening berikut:');
            doc.moveDown(0.5);
            doc.rect(50, doc.y, 250, 60).stroke('#ddd');
            doc.moveDown(0.5);
            const bankY = doc.y;
            doc.text('Bank BCA', 65, bankY);
            doc.font('Helvetica-Bold').fontSize(12).text('123 456 7890', 65, bankY + 15);
            doc.font('Helvetica').fontSize(9).text('a.n. PT OTOHUB INDONESIA', 65, bankY + 32);
        }

        // === FOOTER ===
        const bottomY = 750;
        doc.fontSize(8).font('Helvetica').fillColor('#999');
        doc.text('Invoice ini sah dan diproses oleh komputer.', 50, bottomY, { align: 'center', width: 512 });
        doc.text(`Dicetak pada: ${this.formatDate(new Date())}`, 50, bottomY + 12, { align: 'center', width: 512 });

        // === ATTACHMENT: PAYMENT PROOF ===
        if (invoice.paymentProof) {
            doc.addPage();
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#333').text('LAMPIRAN: BUKTI PEMBAYARAN', { align: 'center' });
            doc.moveDown(2);

            try {
                // Resolve file path using UploadService
                const imagePath = this.uploadService.getFilePath(invoice.paymentProof);

                // Embed image centered
                doc.image(imagePath, {
                    fit: [500, 600],
                    align: 'center',
                    valign: 'center'
                });
            } catch (err) {
                doc.fontSize(12).fillColor('red').text('Gagal memuat gambar bukti pembayaran.', { align: 'center' });
                console.error(`Error loading payment proof for PDF: ${err.message}`);
            }
        }

        doc.end();
    }
    /**
     * Helper: Convert number to text (Terbilang)
     */
    private terbilang(nominal: number): string {
        const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
        let kalimat = '';

        if (nominal < 12) {
            kalimat = bilangan[nominal];
        } else if (nominal < 20) {
            kalimat = this.terbilang(nominal - 10) + ' Belas';
        } else if (nominal < 100) {
            kalimat = this.terbilang(Math.floor(nominal / 10)) + ' Puluh ' + this.terbilang(nominal % 10);
        } else if (nominal < 200) {
            kalimat = 'Seratus ' + this.terbilang(nominal - 100);
        } else if (nominal < 1000) {
            kalimat = this.terbilang(Math.floor(nominal / 100)) + ' Ratus ' + this.terbilang(nominal % 100);
        } else if (nominal < 2000) {
            kalimat = 'Seribu ' + this.terbilang(nominal - 1000);
        } else if (nominal < 1000000) {
            kalimat = this.terbilang(Math.floor(nominal / 1000)) + ' Ribu ' + this.terbilang(nominal % 1000);
        } else if (nominal < 1000000000) {
            kalimat = this.terbilang(Math.floor(nominal / 1000000)) + ' Juta ' + this.terbilang(nominal % 1000000);
        } else if (nominal < 1000000000000) {
            kalimat = this.terbilang(Math.floor(nominal / 1000000000)) + ' Milyar ' + this.terbilang(nominal % 1000000000);
        }

        return kalimat.trim();
    }

    /**
     * Generate Transaction Receipt (Kwitansi) PDF
     * Official proof of payment
     */
    async generateTransactionReceipt(
        transactionId: string,
        tenantId: string,
        res: any,
    ) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id: transactionId, tenantId },
            include: {
                vehicle: true,
                customer: true,
                salesPerson: true,
                credit: true,
                payments: { orderBy: { date: 'desc' } } // Get payments
            },
        }) as any;

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        }) as any;

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Kwitansi_${transactionId.slice(0, 8)}.pdf`,
        );

        doc.pipe(res);

        // === HEADER ===
        this.drawHeader(doc, tenant, 'KWITANSI', `KWT-${transactionId.slice(0, 8).toUpperCase()}`);

        doc.fontSize(10).font('Helvetica');
        doc.text(`No: KWT-${transactionId.slice(0, 8).toUpperCase()}`);
        doc.text(`Tanggal: ${this.formatDate(new Date())}`);
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke({ width: 2 });
        doc.moveDown(2);

        // Decide Amount & Description based on context
        let amount = Number(transaction.finalPrice);
        let description = `Pelunasan pembelian unit ${transaction.vehicle.make} ${transaction.vehicle.model}`;

        // If Credit with DP
        if (transaction.paymentType === 'CREDIT' && transaction.credit) {
            amount = Number(transaction.credit.downPayment);
            description = `Pembayaran Uang Muka (DP) ${transaction.vehicle.make} ${transaction.vehicle.model}`;
        }

        const terbilangText = this.terbilang(amount) + ' Rupiah';

        // === CONTENT ===
        const startX = 50;
        let currentY = doc.y;

        // Rows config
        const rowGap = 25;
        const labelWidth = 120;
        const valueWidth = 380;

        // Helper to draw row
        const drawRow = (label: string, value: string, isMultiLine = false) => {
            doc.fontSize(12).font('Helvetica-Bold').text(label, startX, currentY);
            doc.font('Helvetica').text(':', startX + labelWidth - 10, currentY);

            // Draw Dots background if needed, or just text? 
            // Let's use a nice box background for value
            if (isMultiLine) {
                doc.rect(startX + labelWidth, currentY - 5, valueWidth, 40).fillAndStroke('#f9f9f9', '#eee');
                doc.fillColor('#333').text(value, startX + labelWidth + 10, currentY, { width: valueWidth - 20 });
                currentY += 45;
            } else {
                doc.rect(startX + labelWidth, currentY - 5, valueWidth, 20).fillAndStroke('#f9f9f9', '#eee');
                doc.fillColor('#333').text(value, startX + labelWidth + 10, currentY);
                currentY += rowGap;
            }
            doc.fillColor('#000'); // Reset
        };

        drawRow('Telah terima dari', transaction.customer?.name || '-');
        drawRow('Uang Sejumlah', `# ${terbilangText} #`, true); // Highlight terbilang
        drawRow('Guna Pembayaran', description, true);

        doc.moveDown(2);
        currentY += 20;

        // === AMOUNT BOX ===
        doc.rect(50, currentY, 200, 40).stroke(); // Box
        doc.fontSize(16).font('Helvetica-Bold')
            .text(this.formatCurrency(amount), 60, currentY + 12);

        // === SIGNATURE ===
        doc.fontSize(10).font('Helvetica');
        doc.text(`${(tenant.address || 'Kota').split(',')[0]}, ${this.formatDate(new Date())}`, 350, currentY, { align: 'center', width: 200 });
        doc.text('Yang Menerima,', 350, currentY + 15, { align: 'center', width: 200 });

        doc.moveDown(4);
        const signY = doc.y + 40;
        doc.fontSize(10).font('Helvetica-Bold').text(`( ${transaction.salesPerson?.name || 'Admin'} )`, 350, signY, { align: 'center', width: 200 });

        // Footer note
        doc.text('', 50, signY + 30); // Move cursor down
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#555');
        doc.text('Kwitansi ini merupakan alat bukti pembayaran yang sah.', { align: 'center' });

        doc.end();
    }
}
