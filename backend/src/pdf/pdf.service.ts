import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
    constructor(private prisma: PrismaService) { }

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
        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Vehicle_Internal_${vehicle.licensePlate || vehicle.id}.pdf`,
        );

        doc.pipe(res);

        doc.pipe(res);

        // Define Watermark Function
        const drawWatermark = () => {
            doc.save();
            doc.rotate(-45, { origin: [300, 400] });
            doc.opacity(0.1);
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

        // Header
        doc.fontSize(20).font('Helvetica-Bold').fillColor('black').opacity(1).text('LAPORAN INTERNAL KENDARAAN', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(tenant?.name || 'Dealer', { align: 'center' });
        doc.moveDown();

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
        doc.fontSize(8).font('Helvetica')
            .text(`Dicetak: ${this.formatDate(new Date())}`, { align: 'right' });
        doc.text('DOKUMEN INI BERSIFAT RAHASIA - HANYA UNTUK PENGGUNAAN INTERNAL', { align: 'center' });

        // Add Watermark
        this.addWatermark(doc, tenant?.name || 'CONFIDENTIAL');

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

        // Header with dealer branding
        doc.fontSize(22).font('Helvetica-Bold').text(tenant?.name || 'Auto Dealer', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').text(tenant?.address || '', { align: 'center' });
        doc.moveDown(1.5);

        // Title
        doc.fontSize(16).font('Helvetica-Bold').text('INFORMASI KENDARAAN', { align: 'center' });
        doc.moveDown();

        // Draw decorative line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

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

        // === HEADER ===
        doc.fontSize(20).font('Helvetica-Bold')
            .text(tenant?.name || 'Auto Dealer', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica')
            .text(tenant?.address || '', { align: 'center' });
        if (tenant?.phone) {
            doc.text(`Telp: ${tenant.phone}`, { align: 'center' });
        }
        doc.moveDown();

        // === INVOICE TITLE ===
        doc.fontSize(18).font('Helvetica-Bold')
            .text('INVOICE', { align: 'center' });
        doc.moveDown(0.5);

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
        doc.fontSize(20).font('Helvetica-Bold')
            .text(tenant?.name || 'OTOHUB', { align: 'center' });
        doc.fontSize(12).font('Helvetica')
            .text('LAPORAN PENJUALAN', { align: 'center' });
        doc.fontSize(10)
            .text(`Periode: ${months} bulan terakhir (${this.formatDate(startDate)} - ${this.formatDate(now)})`, { align: 'center' });
        doc.moveDown();

        // Divider
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#00bfa5');
        doc.moveDown();

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
}

