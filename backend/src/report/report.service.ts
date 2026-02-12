import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
    constructor(private prisma: PrismaService) { }

    /**
     * Laporan laba rugi per periode
     */
    async getProfitLossReport(tenantId: string, startDate: Date, endDate: Date) {
        // Penjualan (SALE) yang PAID
        const sales = await this.prisma.transaction.findMany({
            where: {
                tenantId,
                type: 'SALE',
                status: 'PAID',
                date: { gte: startDate, lte: endDate },
            },
            include: {
                vehicle: { select: { purchasePrice: true } },
            },
        });

        // Pembelian (PURCHASE) yang PAID
        const purchases = await this.prisma.transaction.findMany({
            where: {
                tenantId,
                type: 'PURCHASE',
                status: 'PAID',
                date: { gte: startDate, lte: endDate },
            },
        });

        // Biaya Perbaikan (Vehicle Cost)
        const vehicleCosts = await this.prisma.vehicleCost.findMany({
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
        });

        // Biaya Operasional (Gaji, Listrik, Sewa, dll)
        const operatingCosts = await this.prisma.operatingCost.findMany({
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate }
            }
        });

        // Hitung
        const totalRevenue = sales.reduce((sum, t) => sum + Number(t.finalPrice), 0);
        const totalCostOfGoods = sales.reduce((sum, t) => sum + Number(t.vehicle.purchasePrice || 0), 0);
        const grossProfit = totalRevenue - totalCostOfGoods;

        const totalVehicleCosts = vehicleCosts.reduce((sum, c) => sum + Number(c.amount), 0);
        const totalOperatingCosts = operatingCosts.reduce((sum, c) => sum + Number(c.amount), 0);

        const totalPurchases = purchases.reduce((sum, t) => sum + Number(t.finalPrice), 0);

        const netProfit = grossProfit - totalVehicleCosts - totalOperatingCosts;

        return {
            periode: {
                dari: startDate.toISOString().slice(0, 10),
                sampai: endDate.toISOString().slice(0, 10),
            },
            pendapatan: {
                totalPenjualan: totalRevenue,
                jumlahTransaksiPenjualan: sales.length,
            },
            biaya: {
                hargaPokokPenjualan: totalCostOfGoods,
                biayaPerbaikan: totalVehicleCosts,
                biayaOperasional: totalOperatingCosts, // NEW
                totalPembelianStok: totalPurchases,
            },
            laba: {
                labaKotor: grossProfit, // Revenue - HPP
                labaBersih: netProfit,  // Gross - (Perbaikan + Ops)
                marginLabaKotor: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%',
                marginLabaBersih: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%',
            },
            ringkasan: {
                rataRataHargaJual: sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0,
                rataRataLabaPerUnit: sales.length > 0 ? Math.round(grossProfit / sales.length) : 0,
            },
        };
    }

    /**
     * Ringkasan penjualan per bulan
     */
    async getMonthlySummary(tenantId: string, months: number = 12) {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const results: { bulan: string; penjualan: number; pendapatan: number; pembelian: number }[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const [salesCount, salesRevenue, purchaseCount] = await Promise.all([
                this.prisma.transaction.count({
                    where: { tenantId, type: 'SALE', status: 'PAID', date: { gte: start, lte: end } },
                }),
                this.prisma.transaction.aggregate({
                    where: { tenantId, type: 'SALE', status: 'PAID', date: { gte: start, lte: end } },
                    _sum: { finalPrice: true },
                }),
                this.prisma.transaction.count({
                    where: { tenantId, type: 'PURCHASE', status: 'PAID', date: { gte: start, lte: end } },
                }),
            ]);

            results.push({
                bulan: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
                penjualan: salesCount,
                pendapatan: Number(salesRevenue._sum.finalPrice || 0),
                pembelian: purchaseCount,
            });
        }

        return results;
    }

    /**
     * Stok kendaraan ringkasan
     */
    async getInventorySummary(tenantId: string) {
        const [total, available, booked, sold, byCategory] = await Promise.all([
            this.prisma.vehicle.count({ where: { tenantId } }),
            this.prisma.vehicle.count({ where: { tenantId, status: 'AVAILABLE' } }),
            this.prisma.vehicle.count({ where: { tenantId, status: 'BOOKED' } }),
            this.prisma.vehicle.count({ where: { tenantId, status: 'SOLD' } }),
            this.prisma.vehicle.groupBy({
                by: ['category'],
                where: { tenantId, status: { not: 'SOLD' } },
                _count: { id: true },
                _sum: { price: true },
            }),
        ]);

        const totalStockValue = await this.prisma.vehicle.aggregate({
            where: { tenantId, status: { not: 'SOLD' } },
            _sum: { price: true, purchasePrice: true },
        });

        return {
            total,
            tersedia: available,
            dipesan: booked,
            terjual: sold,
            nilaiStokJual: Number(totalStockValue._sum.price || 0),
            nilaiStokBeli: Number(totalStockValue._sum.purchasePrice || 0),
            perKategori: byCategory.map(c => ({
                kategori: c.category,
                jumlah: c._count.id,
                nilaiJual: Number(c._sum.price || 0),
            })),
        };
    }
}
