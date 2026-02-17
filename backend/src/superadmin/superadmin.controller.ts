import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, ValidationPipe, UsePipes } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { PublicService } from '../public/public.service';

import {
    CreateTenantDto, UpdateTenantDto, UpdateTenantStatusDto, SuspendTenantDto,
    UpgradeTenantPlanDto, DirectPlanChangeDto
} from './dto/tenant.dto';
import { CreateAdminStaffDto } from './dto/user.dto';
import { CreateInvoiceDto, VerifyInvoiceDto } from './dto/invoice.dto';
import { CreateApprovalRequestDto, ProcessApprovalRequestDto } from './dto/approval.dto';
import { GenerateApiKeyDto } from './dto/api-key.dto';
import { UpdatePlatformSettingDto } from './dto/platform-setting.dto';
import { UpdatePlanDto } from '../plan/dto/update-plan.dto';



@Controller('superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'ADMIN_STAFF')
export class SuperadminController {
    constructor(
        private readonly superadminService: SuperadminService,
        private readonly publicService: PublicService
    ) { }

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

    @Post('tenants')
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async createTenant(
        @Body() data: CreateTenantDto,
        @Request() req: any
    ) {
        return this.superadminService.createTenant(data, req.user.userId);
    }

    @Patch('tenants/:id')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async updateTenant(
        @Param('id') id: string,
        @Body() data: UpdateTenantDto
    ) {
        return this.superadminService.updateTenant(id, data);
    }

    @Patch('tenants/:id/status')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async updateTenantStatus(
        @Param('id') id: string,
        @Body() dto: UpdateTenantStatusDto
    ) {
        return this.superadminService.updateTenantStatus(id, dto.status);
    }

    @Post('tenants/:id/suspend')
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async suspendTenant(
        @Param('id') id: string,
        @Body() dto: SuspendTenantDto,
        @Request() req: any
    ) {
        return this.superadminService.suspendTenant(id, dto.reason, req.user.userId);
    }

    @Post('tenants/:id/activate')
    @Roles('SUPERADMIN')
    async activateTenant(
        @Param('id') id: string,
        @Request() req: any
    ) {
        return this.superadminService.activateTenant(id, req.user.userId);
    }

    @Patch('tenants/:id/upgrade')
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async upgradeTenantPlan(
        @Param('id') id: string,
        @Body() dto: UpgradeTenantPlanDto,
        @Request() req: any
    ) {
        return this.superadminService.upgradeTenantPlan(id, dto.planTier, req.user.userId);
    }

    @Patch('tenants/:id/plan-direct')
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async directPlanChange(
        @Param('id') id: string,
        @Body() data: DirectPlanChangeDto,
        @Request() req: any
    ) {
        return this.superadminService.directPlanChange(id, data, req.user.userId);
    }

    @Delete('tenants/:id')
    @Roles('SUPERADMIN')
    async deleteTenant(
        @Param('id') id: string,
        @Request() req: any
    ) {
        return this.superadminService.hardDeleteTenant(id, req.user.userId);
    }

    // ==================== ALL USERS MANAGEMENT ====================

    @Get('users')
    async getAllUsers(
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('hasTenant') hasTenant?: string,
    ) {
        return this.superadminService.getAllUsers({
            search,
            role,
            status,
            hasTenant: hasTenant === 'true' ? true : hasTenant === 'false' ? false : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }

    @Delete('users/:id')
    @Roles('SUPERADMIN')
    async deleteAnyUser(
        @Param('id') id: string,
        @Request() req: any
    ) {
        return this.superadminService.deleteAnyUser(id, req.user.userId, req.user.email);
    }

    // ==================== PLAN TIERS ====================

    @Get('plans')
    async getPlans() {
        return this.superadminService.getPlans();
    }

    @Patch('plans/:planId')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async updatePlan(
        @Param('planId') planId: string,
        @Body() data: UpdatePlanDto
    ) {
        return this.superadminService.updatePlan(planId, data as any);
    }

    // ==================== INVOICES ====================

    @Get('invoices')
    async getInvoices(
        @Query('status') status?: string,
        @Query('tenantId') tenantId?: string,
    ) {
        return this.superadminService.getInvoices({ status, tenantId });
    }

    @Post('invoices')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async createInvoice(
        @Body() data: CreateInvoiceDto,
        @Request() req: any
    ) {
        return this.superadminService.createInvoice(data, req.user.userId);
    }

    @Post('invoices/:id/verify')
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async verifyInvoice(
        @Param('id') id: string,
        @Body() dto: VerifyInvoiceDto,
        @Request() req: any
    ) {
        return this.superadminService.verifyInvoice(id, dto.approved, req.user.userId, req.user.email);
    }

    // ==================== ADMIN STAFF ====================

    @Get('staff')
    async getAdminStaff() {
        return this.superadminService.getAdminStaff();
    }

    @Post('staff')
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async createAdminStaff(
        @Body() data: CreateAdminStaffDto,
        @Request() req: any
    ) {
        return this.superadminService.createAdminStaff(data, req.user.userId);
    }

    @Delete('staff/:id')
    @Roles('SUPERADMIN')
    async deleteAdminStaff(
        @Param('id') id: string,
        @Request() req: any
    ) {
        return this.superadminService.deleteAdminStaff(id, req.user.userId);
    }

    // ==================== APPROVAL REQUESTS ====================

    @Get('approvals')
    async getApprovalRequests(@Query('status') status?: string) {
        return this.superadminService.getApprovalRequests(status);
    }

    @Post('approvals')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async createApprovalRequest(
        @Body() data: CreateApprovalRequestDto,
        @Request() req: any
    ) {
        return this.superadminService.createApprovalRequest(data, req.user.userId);
    }

    @Patch('approvals/:id')
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async processApprovalRequest(
        @Param('id') id: string,
        @Body() data: ProcessApprovalRequestDto,
        @Request() req: any
    ) {
        return this.superadminService.processApprovalRequest(id, data.approved, req.user.userId, data.note);
    }

    // ==================== API KEYS ====================

    @Get('api-keys')
    async getApiKeys() {
        return this.superadminService.getApiKeys();
    }

    @Post('api-keys')
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async generateApiKey(
        @Body() data: GenerateApiKeyDto
    ) {
        return this.superadminService.generateApiKey(data.name, data.scopes);
    }

    @Delete('api-keys/:id')
    @Roles('SUPERADMIN')
    async revokeApiKey(@Param('id') id: string) {
        return this.superadminService.revokeApiKey(id);
    }

    // ==================== PLATFORM SETTINGS ====================

    @Get('platform-settings/:key')
    async getPlatformSetting(@Param('key') key: string) {
        return this.superadminService.getPlatformSetting(key);
    }

    @Patch('platform-settings/:key')
    @Roles('SUPERADMIN')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async updatePlatformSetting(
        @Param('key') key: string,
        @Body() dto: UpdatePlatformSettingDto
    ) {
        return this.superadminService.updatePlatformSetting(key, dto.value);
    }

    // ==================== ACTIVITY LOG ====================

    @Get('activity')
    async getRecentActivity(@Query('limit') limit?: string) {
        return this.superadminService.getRecentActivity(limit ? parseInt(limit) : 20);
    }

    @Get('activity/full')
    async getActivityLog(
        @Query('action') action?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.superadminService.getActivityLog({
            action,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
    }

    @Get('activity/user/:userId')
    async getActivityByUser(@Param('userId') userId: string) {
        return this.superadminService.getActivityByUser(userId);
    }

    // ==================== MARKETPLACE API ====================

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
        return this.publicService.getMarketplaceVehicles({
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
        return this.publicService.getMarketplaceVehicleDetail(id);
    }

    @Get('marketplace/dealers')
    async getMarketplaceDealers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.publicService.getMarketplaceDealers({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            search,
        });
    }

    @Get('marketplace/stats')
    async getMarketplaceStats() {
        return this.publicService.getMarketplaceStats();
    }

    // ==================== CMS / LANDING PAGE ====================

    @Patch('cms')
    @Roles('SUPERADMIN')
    async updateCms(@Body() data: any) {
        return this.superadminService.updateLandingContent(data);
    }
}
