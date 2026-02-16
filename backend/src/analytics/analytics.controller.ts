import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    getDashboardStats(@ActiveTenant() tenantId: string) {
        return this.analyticsService.getDashboardStats(tenantId);
    }

    @Get('top-brands')
    getTopBrands(@ActiveTenant() tenantId: string, @Query('months') months?: string) {
        return this.analyticsService.getTopSellingBrands(
            tenantId,
            months ? parseInt(months) : 6,
        );
    }

    @Get('revenue-breakdown')
    getRevenueBreakdown(@ActiveTenant() tenantId: string, @Query('months') months?: string) {
        return this.analyticsService.getRevenueByCategory(
            tenantId,
            months ? parseInt(months) : 6,
        );
    }

    @Get('performance')
    getPerformance(@ActiveTenant() tenantId: string) {
        return this.analyticsService.getPerformanceMetrics(tenantId);
    }

    @Get('monthly-sales')
    getMonthlySales(@ActiveTenant() tenantId: string, @Query('months') months?: string) {
        return this.analyticsService.getMonthlySales(
            tenantId,
            months ? parseInt(months) : 6,
        );
    }

    @Get('group/stock')
    getGroupAnalytics(@ActiveTenant() tenantId: string) {
        return this.analyticsService.getGroupAnalytics(tenantId);
    }
}
