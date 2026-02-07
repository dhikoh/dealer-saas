import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    // ==================== PUBLIC (Authorized Users) ====================

    @Get('plans')
    getAllPlans() {
        return this.billingService.getAllPlans();
    }

    @Get('status/:tenantId')
    @UseGuards(JwtAuthGuard)
    async getSubscriptionStatus(@Param('tenantId') tenantId: string) {
        return this.billingService.checkSubscriptionStatus(tenantId);
    }

    // ==================== SUPERADMIN ONLY ====================

    @Get('admin/stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async getBillingStats() {
        return this.billingService.getBillingStats();
    }

    @Get('admin/distribution')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async getPlanDistribution() {
        return this.billingService.getPlanDistribution();
    }

    @Post('admin/generate-invoices')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async generateMonthlyInvoices() {
        return this.billingService.generateMonthlyInvoices();
    }

    @Patch('admin/invoice/:invoiceId/verify')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async verifyPayment(
        @Param('invoiceId') invoiceId: string,
        @Body() body: { approved: boolean; verifiedBy: string }
    ) {
        return this.billingService.verifyPayment(invoiceId, body.approved, body.verifiedBy);
    }

    @Patch('admin/tenant/:tenantId/upgrade')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async upgradePlan(
        @Param('tenantId') tenantId: string,
        @Body('planId') planId: string
    ) {
        return this.billingService.upgradePlan(tenantId, planId);
    }

    @Patch('admin/tenant/:tenantId/downgrade')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async downgradePlan(
        @Param('tenantId') tenantId: string,
        @Body('planId') planId: string
    ) {
        return this.billingService.downgradePlan(tenantId, planId);
    }

    @Get('admin/expired-trials')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPERADMIN')
    async getExpiredTrials() {
        return this.billingService.getExpiredTrials();
    }
}
