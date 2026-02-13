import { Controller, Get, Query, Request, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    getDashboardStats(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.analyticsService.getDashboardStats(req.user.tenantId);
    }

    @Get('top-brands')
    getTopBrands(@Request() req, @Query('months') months?: string) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.analyticsService.getTopSellingBrands(
            req.user.tenantId,
            months ? parseInt(months) : 6,
        );
    }

    @Get('revenue-breakdown')
    getRevenueBreakdown(@Request() req, @Query('months') months?: string) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.analyticsService.getRevenueByCategory(
            req.user.tenantId,
            months ? parseInt(months) : 6,
        );
    }

    @Get('performance')
    getPerformance(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.analyticsService.getPerformanceMetrics(req.user.tenantId);
    }

    @Get('monthly-sales')
    getMonthlySales(@Request() req, @Query('months') months?: string) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.analyticsService.getMonthlySales(
            req.user.tenantId,
            months ? parseInt(months) : 6,
        );
    }

    @Get('group/stock')
    getGroupAnalytics(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.analyticsService.getGroupAnalytics(req.user.tenantId);
    }
}
