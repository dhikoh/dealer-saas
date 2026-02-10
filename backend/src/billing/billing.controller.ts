import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

// Protected by global JwtAuthGuard (except @Public routes)
@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    // ==================== PUBLIC ====================

    @Public()
    @Get('plans')
    getAllPlans() {
        return this.billingService.getAllPlans();
    }

    // ==================== AUTHORIZED USERS ====================

    @Get('status/:tenantId')
    async getSubscriptionStatus(@Param('tenantId') tenantId: string, @Request() req) {
        // SECURITY: Validate that user can access this tenant's billing
        if (req.user.role !== 'SUPERADMIN' && req.user.tenantId !== tenantId) {
            throw new ForbiddenException('Access denied: Cannot view billing for other tenants');
        }
        return this.billingService.checkSubscriptionStatus(tenantId);
    }

    // ==================== SUPERADMIN ONLY ====================

    @Get('admin/stats')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async getBillingStats() {
        return this.billingService.getBillingStats();
    }

    @Get('admin/distribution')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async getPlanDistribution() {
        return this.billingService.getPlanDistribution();
    }

    @Post('admin/generate-invoices')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async generateMonthlyInvoices() {
        return this.billingService.generateMonthlyInvoices();
    }

    @Patch('admin/invoice/:invoiceId/verify')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async verifyPayment(
        @Param('invoiceId') invoiceId: string,
        @Body() body: { approved: boolean; verifiedBy: string }
    ) {
        return this.billingService.verifyPayment(invoiceId, body.approved, body.verifiedBy);
    }

    @Patch('admin/tenant/:tenantId/upgrade')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async upgradePlan(
        @Param('tenantId') tenantId: string,
        @Body('planId') planId: string
    ) {
        return this.billingService.upgradePlan(tenantId, planId);
    }

    @Patch('admin/tenant/:tenantId/downgrade')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async downgradePlan(
        @Param('tenantId') tenantId: string,
        @Body('planId') planId: string
    ) {
        return this.billingService.downgradePlan(tenantId, planId);
    }

    @Get('admin/expired-trials')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async getExpiredTrials() {
        return this.billingService.getExpiredTrials();
    }

    // ==================== TENANT-FACING ENDPOINTS ====================

    @Get('my-subscription')
    async getMySubscription(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.billingService.checkSubscriptionStatus(req.user.tenantId);
    }

    @Get('my-invoices')
    async getMyInvoices(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.billingService.getMyInvoices(req.user.tenantId);
    }

    @Post('my-invoices/:id/upload-proof')
    async uploadPaymentProof(
        @Param('id') invoiceId: string,
        @Body() body: { proofUrl: string },
        @Request() req
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.billingService.uploadPaymentProof(invoiceId, req.user.tenantId, body.proofUrl);
    }
}

