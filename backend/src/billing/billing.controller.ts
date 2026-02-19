import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, ForbiddenException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BillingService } from './billing.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';
import { VerifyPaymentDto } from './dto/billing.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Multer storage config for payment proofs
const proofStorage = diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const destPath = join(uploadDir, 'payments');
        if (!existsSync(destPath)) {
            mkdirSync(destPath, { recursive: true });
        }
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `proof-${uniqueSuffix}${ext}`);
    },
});

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

    @Public()
    @Get('periods')
    getBillingPeriods() {
        return this.billingService.getBillingPeriods();
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
        @Body() body: VerifyPaymentDto
    ) {
        return this.billingService.verifyPayment(invoiceId, body.approved, body.verifiedBy);
    }

    @Patch('admin/tenant/:tenantId/upgrade')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async upgradePlan(
        @Param('tenantId') tenantId: string,
        @Body('planId') planId: string,
        @Body('months') months?: number
    ) {
        return this.billingService.upgradePlan(tenantId, planId, months || 1);
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
    async getMySubscription(@ActiveTenant() tenantId: string) {
        return this.billingService.checkSubscriptionStatus(tenantId);
    }

    @Get('my-invoices')
    async getMyInvoices(@ActiveTenant() tenantId: string) {
        return this.billingService.getMyInvoices(tenantId);
    }

    /**
     * Upload payment proof (accepts file via FormData).
     * Content-Type: multipart/form-data, field name: 'proof'
     */
    @Post('my-invoices/:id/upload-proof')
    @UseInterceptors(FileInterceptor('proof', {
        storage: proofStorage,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        fileFilter: (req, file, cb) => {
            const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.'), false);
            }
        },
    }))
    async uploadPaymentProof(
        @Param('id') invoiceId: string,
        @UploadedFile() file: Express.Multer.File,
        @ActiveTenant() tenantId: string,
    ) {
        if (!file) {
            throw new BadRequestException('File bukti pembayaran wajib diupload');
        }

        // Generate accessible URL for the uploaded file
        const proofUrl = `/uploads/payments/${file.filename}`;
        return this.billingService.uploadPaymentProof(invoiceId, tenantId, proofUrl);
    }

    @Post('subscribe')
    async subscribeToPlan(
        @Body('planId') planId: string,
        @Body('months') months: number,
        @ActiveTenant() tenantId: string,
    ) {
        return this.billingService.upgradePlan(tenantId, planId, months || 1);
    }
}
