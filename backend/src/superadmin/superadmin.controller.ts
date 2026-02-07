import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class SuperadminController {
    constructor(private readonly superadminService: SuperadminService) { }

    // ==================== DASHBOARD ====================

    @Get('stats')
    async getStats() {
        return this.superadminService.getStats();
    }

    @Get('analytics/plan-distribution')
    async getPlanDistribution() {
        return this.superadminService.getPlanDistribution();
    }

    @Get('analytics/revenue')
    async getMonthlyRevenue(@Query('months') months?: string) {
        return this.superadminService.getMonthlyRevenue(months ? parseInt(months) : 6);
    }

    // ==================== TENANTS ====================

    @Get('tenants')
    async getTenants(
        @Query('status') status?: string,
        @Query('planTier') planTier?: string,
        @Query('search') search?: string,
    ) {
        return this.superadminService.getTenants({ status, planTier, search });
    }

    @Get('tenants/:id')
    async getTenantById(@Param('id') id: string) {
        return this.superadminService.getTenantById(id);
    }

    @Patch('tenants/:id')
    async updateTenant(
        @Param('id') id: string,
        @Body() data: { name?: string; email?: string; phone?: string; address?: string }
    ) {
        return this.superadminService.updateTenant(id, data);
    }

    @Patch('tenants/:id/status')
    async updateTenantStatus(
        @Param('id') id: string,
        @Body('status') status: string
    ) {
        return this.superadminService.updateTenantStatus(id, status);
    }

    @Post('tenants/:id/suspend')
    async suspendTenant(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @Request() req: any
    ) {
        return this.superadminService.suspendTenant(id, reason, req.user.userId);
    }

    @Post('tenants/:id/activate')
    async activateTenant(
        @Param('id') id: string,
        @Request() req: any
    ) {
        return this.superadminService.activateTenant(id, req.user.userId);
    }

    @Patch('tenants/:id/upgrade')
    async upgradeTenantPlan(
        @Param('id') id: string,
        @Body('planTier') planTier: string,
        @Request() req: any
    ) {
        return this.superadminService.upgradeTenantPlan(id, planTier, req.user.userId);
    }

    // ==================== INVOICES ====================

    @Get('invoices')
    async getInvoices(
        @Query('status') status?: string,
        @Query('tenantId') tenantId?: string,
    ) {
        return this.superadminService.getInvoices({ status, tenantId });
    }

    @Post('invoices/:id/verify')
    async verifyInvoice(
        @Param('id') id: string,
        @Body('approved') approved: boolean,
        @Request() req: any
    ) {
        return this.superadminService.verifyInvoice(id, approved, req.user.userId, req.user.email);
    }

    // ==================== ACTIVITY LOG ====================

    @Get('activity')
    async getRecentActivity(@Query('limit') limit?: string) {
        return this.superadminService.getRecentActivity(limit ? parseInt(limit) : 20);
    }

    @Get('activity/user/:userId')
    async getActivityByUser(@Param('userId') userId: string) {
        return this.superadminService.getActivityByUser(userId);
    }

    // ==================== MARKETPLACE API ====================
    // Public API untuk menampilkan semua kendaraan dari semua tenant

    @Get('marketplace/vehicles')
    async getMarketplaceVehicles(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('make') make?: string,
        @Query('location') location?: string,
        @Query('status') status?: string,
    ) {
        return this.superadminService.getMarketplaceVehicles({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            category,
            minPrice: minPrice ? parseInt(minPrice) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
            make,
            location,
            status: status || 'AVAILABLE',
        });
    }

    @Get('marketplace/vehicles/:id')
    async getMarketplaceVehicleDetail(@Param('id') id: string) {
        return this.superadminService.getMarketplaceVehicleDetail(id);
    }

    @Get('marketplace/dealers')
    async getMarketplaceDealers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.superadminService.getMarketplaceDealers({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            search,
        });
    }

    @Get('marketplace/stats')
    async getMarketplaceStats() {
        return this.superadminService.getMarketplaceStats();
    }
}

