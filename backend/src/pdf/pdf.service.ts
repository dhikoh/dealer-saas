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
}
