import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
    constructor(private prisma: PrismaService) { }

    async exportVehiclesCsv(tenantId: string): Promise<string> {
        const vehicles = await this.prisma.vehicle.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });

        const headers = [
            'No', 'Kategori', 'Merek', 'Model', 'Varian', 'Tahun', 'Warna',
            'Harga Beli', 'Harga Jual', 'Status', 'Kondisi', 'Plat Nomor',
            'No. Mesin', 'No. Rangka', 'No. BPKB', 'STNK Expired', 'Tanggal Input',
        ];

        const rows = vehicles.map((v, i) => [
            i + 1,
            v.category,
            v.make,
            v.model,
            v.variant || '',
            v.year,
            v.color,
            v.purchasePrice?.toString() || '',
            v.price.toString(),
            v.status,
            v.condition,
            v.licensePlate || '',
            v.engineNumber || '',
            v.chassisNumber || '',
            v.bpkbNumber || '',
            v.stnkExpiry ? new Date(v.stnkExpiry).toLocaleDateString('id-ID') : '',
            new Date(v.createdAt).toLocaleDateString('id-ID'),
        ]);

        return this.toCsv(headers, rows);
    }

    async exportCustomersCsv(tenantId: string): Promise<string> {
        const customers = await this.prisma.customer.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });

        const headers = ['No', 'KTP', 'Nama', 'Telepon', 'Email', 'Alamat', 'Tanggal Daftar'];

        const rows = customers.map((c, i) => [
            i + 1,
            c.ktpNumber,
            c.name,
            c.phone,
            c.email || '',
            c.address || '',
            new Date(c.createdAt).toLocaleDateString('id-ID'),
        ]);

        return this.toCsv(headers, rows);
    }

    async exportTransactionsCsv(tenantId: string): Promise<string> {
        const transactions = await this.prisma.transaction.findMany({
            where: { tenantId },
            include: {
                vehicle: { select: { make: true, model: true, licensePlate: true } },
                customer: { select: { name: true, phone: true } },
                salesPerson: { select: { name: true } },
            },
            orderBy: { date: 'desc' },
        });

        const headers = [
            'No', 'Tanggal', 'Tipe', 'Pembayaran', 'Kendaraan', 'Plat', 'Pelanggan',
            'No. Telepon', 'Sales', 'Harga Final', 'Status', 'Catatan',
        ];

        const rows = transactions.map((t, i) => [
            i + 1,
            new Date(t.date).toLocaleDateString('id-ID'),
            t.type === 'SALE' ? 'Penjualan' : 'Pembelian',
            t.paymentType === 'CASH' ? 'Tunai' : 'Kredit',
            `${t.vehicle.make} ${t.vehicle.model}`,
            t.vehicle.licensePlate || '',
            t.customer.name,
            t.customer.phone,
            t.salesPerson.name,
            t.finalPrice.toString(),
            t.status,
            t.notes || '',
        ]);

        return this.toCsv(headers, rows);
    }

    private toCsv(headers: string[], rows: (string | number)[][]): string {
        const escape = (val: string | number) => {
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const headerLine = headers.map(escape).join(',');
        const dataLines = rows.map(row => row.map(escape).join(','));
        // BOM for Excel UTF-8 detection
        return '\uFEFF' + [headerLine, ...dataLines].join('\n');
    }
}
