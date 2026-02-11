import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get comprehensive dashboard stats for a tenant
     */
    async getDashboardStats(tenantId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [
            totalVehicles,
            availableVehicles,
            soldThisMonth,
            soldLastMonth,
            revenueThisMonth,
            revenueLastMonth,
            totalCustomers,
            newCustomersThisMonth,
        ] = await Promise.all([
            this.prisma.vehicle.count({ where: { tenantId } }),
            this.prisma.vehicle.count({ where: { tenantId, status: 'AVAILABLE' } }),
            this.prisma.transaction.count({
                where: { tenantId, type: 'SALE', status: 'PAID', date: { gte: startOfMonth } },
            }),
            this.prisma.transaction.count({
                where: {
                    tenantId, type: 'SALE', status: 'PAID',
                    date: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
            }),
            this.prisma.transaction.aggregate({
                where: { tenantId, type: 'SALE', status: 'PAID', date: { gte: startOfMonth } },
                _sum: { finalPrice: true },
            }),
            this.prisma.transaction.aggregate({
                where: {
                    tenantId, type: 'SALE', status: 'PAID',
                    date: { gte: startOfLastMonth, lte: endOfLastMonth },
                },
                _sum: { finalPrice: true },
            }),
            this.prisma.customer.count({ where: { tenantId } }),
            this.prisma.customer.count({
                where: { tenantId, createdAt: { gte: startOfMonth } },
            }),
        ]);

        const currentRevenue = Number(revenueThisMonth._sum.finalPrice || 0);
        const lastRevenue = Number(revenueLastMonth._sum.finalPrice || 0);
        const revenueChange = lastRevenue > 0
            ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
            : 0;
        const salesChange = soldLastMonth > 0
            ? soldThisMonth - soldLastMonth
            : soldThisMonth;

        return {
            totalVehicles,
            availableVehicles,
            soldThisMonth,
            salesChange,
            revenueThisMonth: currentRevenue,
            revenueChange,
            totalCustomers,
            newCustomersThisMonth,
        };
    }

    /**
     * Get top selling vehicle brands
     */
    async getTopSellingBrands(tenantId: string, months: number = 6) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const transactions = await this.prisma.transaction.findMany({
            where: {
                tenantId,
                type: 'SALE',
                status: 'PAID',
                date: { gte: startDate },
            },
            include: { vehicle: true },
        });

        // Group by brand
        const brandMap = new Map<string, { count: number; revenue: number }>();
        for (const tx of transactions) {
            const brand = tx.vehicle?.make || 'Lainnya';
            const existing = brandMap.get(brand) || { count: 0, revenue: 0 };
            existing.count += 1;
            existing.revenue += Number(tx.finalPrice || 0);
            brandMap.set(brand, existing);
        }

        // Sort by count descending and take top 5
        const sorted = Array.from(brandMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([name, data], index) => ({
                rank: index + 1,
                name,
                count: data.count,
                revenue: data.revenue,
            }));

        return sorted;
    }

    /**
     * Get revenue breakdown by vehicle category
     */
    async getRevenueByCategory(tenantId: string, months: number = 6) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const transactions = await this.prisma.transaction.findMany({
            where: {
                tenantId,
                type: 'SALE',
                status: 'PAID',
                date: { gte: startDate },
            },
            include: { vehicle: true },
        });

        const categoryMap = new Map<string, number>();
        let totalRevenue = 0;

        for (const tx of transactions) {
            const category = tx.vehicle?.category || 'OTHER';
            const amount = Number(tx.finalPrice || 0);
            categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
            totalRevenue += amount;
        }

        const categoryNames: Record<string, string> = {
            CAR: 'Mobil',
            MOTORCYCLE: 'Motor',
            TRUCK: 'Truk',
            BUS: 'Bus',
            OTHER: 'Lainnya',
        };

        return Array.from(categoryMap.entries())
            .map(([category, revenue]) => ({
                category,
                name: categoryNames[category] || category,
                revenue,
                percent: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }

    /**
     * Get performance metrics
     */
    async getPerformanceMetrics(tenantId: string) {
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Average days to sell (AVAILABLE -> SOLD)
        const soldVehicles = await this.prisma.vehicle.findMany({
            where: {
                tenantId,
                status: 'SOLD',
                updatedAt: { gte: sixMonthsAgo },
            },
            select: { createdAt: true, updatedAt: true },
        });

        let avgDaysToSell = 0;
        if (soldVehicles.length > 0) {
            const totalDays = soldVehicles.reduce((sum, v) => {
                const days = Math.ceil(
                    (v.updatedAt.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24),
                );
                return sum + days;
            }, 0);
            avgDaysToSell = Math.round(totalDays / soldVehicles.length);
        }

        // Average profit margin
        const soldWithPrices = await this.prisma.vehicle.findMany({
            where: {
                tenantId,
                status: 'SOLD',
                updatedAt: { gte: sixMonthsAgo },
            },
            select: { purchasePrice: true, price: true },
        });

        let avgMargin = 0;
        if (soldWithPrices.length > 0) {
            const margins = soldWithPrices
                .filter(v => v.purchasePrice && v.price)
                .map(v => {
                    const purchase = Number(v.purchasePrice);
                    const sell = Number(v.price);
                    return purchase > 0 ? ((sell - purchase) / purchase) * 100 : 0;
                });
            avgMargin = margins.length > 0
                ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length)
                : 0;
        }

        // Conversion rate (customers who purchased vs total)
        const totalCustomers = await this.prisma.customer.count({ where: { tenantId } });
        const buyingCustomers = await this.prisma.transaction.groupBy({
            by: ['customerId'],
            where: { tenantId, type: 'SALE', status: 'PAID' },
        });
        const conversionRate = totalCustomers > 0
            ? Math.round((buyingCustomers.length / totalCustomers) * 100)
            : 0;

        return {
            avgDaysToSell,
            avgMargin,
            conversionRate,
            totalSold: soldVehicles.length,
        };
    }

    /**
     * Get monthly sales data
     */
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
                    status: 'PAID',
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

    // ==================== DEALER GROUP ANALYTICS ====================

    /**
     * Get aggregated analytics for the entire dealer group
     */
    async getGroupAnalytics(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { dealerGroupId: true }
        });

        if (!tenant?.dealerGroupId) {
            return {
                totalVehicles: 0,
                totalValue: 0,
                topDealers: [],
                categoryBreakdown: []
            };
        }

        const groupId = tenant.dealerGroupId;

        // 1. Total Vehicles & Value
        const aggregate = await this.prisma.vehicle.aggregate({
            where: {
                tenant: { dealerGroupId: groupId },
                status: 'AVAILABLE'
            },
            _count: { id: true },
            _sum: { price: true }
        });

        // 2. Top Dealers by Stock Count
        const vehiclesByDealer = await this.prisma.vehicle.groupBy({
            by: ['tenantId'],
            where: {
                tenant: { dealerGroupId: groupId },
                status: 'AVAILABLE'
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        // Get dealer names
        const dealerIds = vehiclesByDealer.map(v => v.tenantId);
        const dealers = await this.prisma.tenant.findMany({
            where: { id: { in: dealerIds } },
            select: { id: true, name: true }
        });

        const topDealers = vehiclesByDealer.map(item => {
            const dealer = dealers.find(d => d.id === item.tenantId);
            return {
                name: dealer?.name || 'Unknown Dealer',
                count: item._count.id
            };
        });

        // 3. Category Breakdown
        const vehiclesByCategory = await this.prisma.vehicle.groupBy({
            by: ['category'],
            where: {
                tenant: { dealerGroupId: groupId },
                status: 'AVAILABLE'
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
        });

        return {
            totalVehicles: aggregate._count.id || 0,
            totalValue: Number(aggregate._sum.price || 0),
            topDealers,
            categoryBreakdown: vehiclesByCategory.map(v => ({
                category: v.category,
                count: v._count.id
            }))
        };
    }
}
