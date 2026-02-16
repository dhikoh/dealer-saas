import {
    Controller,
    Get,
    Param,
    Query,
    Res,
} from '@nestjs/common';
import { PdfService } from './pdf.service';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

// Protected by global JwtAuthGuard + TenantGuard
@Controller('pdf')
export class PdfController {
    constructor(private readonly pdfService: PdfService) { }

    /**
     * Generate Internal Vehicle Report PDF
     * Includes costs, profit margin - for dealer internal use only
     */
    @Get('vehicle/:vehicleId/internal')
    async getInternalReport(
        @Param('vehicleId') vehicleId: string,
        @ActiveTenant() tenantId: string,
        @Res() res: any,
    ) {
        return this.pdfService.generateInternalVehicleReport(
            vehicleId,
            tenantId,
            res,
        );
    }

    /**
     * Generate Customer Vehicle Report PDF
     * Only shows vehicle info and selling price (no costs)
     */
    @Get('vehicle/:vehicleId/customer')
    async getCustomerReport(
        @Param('vehicleId') vehicleId: string,
        @ActiveTenant() tenantId: string,
        @Res() res: any,
    ) {
        return this.pdfService.generateCustomerVehicleReport(
            vehicleId,
            tenantId,
            res,
        );
    }

    /**
     * Generate Transaction Invoice PDF
     * Customer-facing invoice for vehicle transaction
     */
    @Get('transaction/:transactionId/invoice')
    async getTransactionInvoice(
        @Param('transactionId') transactionId: string,
        @ActiveTenant() tenantId: string,
        @Res() res: any,
    ) {
        return this.pdfService.generateTransactionInvoice(
            transactionId,
            tenantId,
            res,
        );
    }

    /**
     * Generate Transaction SPK PDF
     */
    @Get('transaction/:transactionId/spk')
    async getTransactionSPK(
        @Param('transactionId') transactionId: string,
        @ActiveTenant() tenantId: string,
        @Res() res: any,
    ) {
        return this.pdfService.generateTransactionSPK(
            transactionId,
            tenantId,
            res,
        );
    }

    /**
     * Generate Transaction Receipt (Kwitansi) PDF
     */
    @Get('transaction/:transactionId/receipt')
    async getTransactionReceipt(
        @Param('transactionId') transactionId: string,
        @ActiveTenant() tenantId: string,
        @Res() res: any,
    ) {
        return this.pdfService.generateTransactionReceipt(
            transactionId,
            tenantId,
            res,
        );
    }

    /**
     * Generate Sales Report PDF
     * Monthly summary with top brands and recent transactions
     */
    @Get('reports/sales')
    async getSalesReport(
        @ActiveTenant() tenantId: string,
        @Res() res: any,
        @Query('months') months?: string,
    ) {
        return this.pdfService.generateSalesReport(
            tenantId,
            months ? parseInt(months) : 6,
            res,
        );
    }

    /**
     * Export Sales Data as CSV
     * Excel-compatible CSV with UTF-8 BOM
     */
    @Get('export/sales-csv')
    async exportSalesCSV(
        @ActiveTenant() tenantId: string,
        @Res() res: any,
        @Query('months') months?: string,
    ) {
        return this.pdfService.generateSalesCSV(
            tenantId,
            months ? parseInt(months) : 6,
            res,
        );
    }

    /**
     * Generate System Invoice PDF (subscription billing)
     * Accessible by tenants and superadmins
     */
    @Get('invoice/:invoiceId')
    async getSystemInvoicePdf(
        @Param('invoiceId') invoiceId: string,
        @Res() res: any,
    ) {
        return this.pdfService.generateSystemInvoicePdf(invoiceId, res);
    }
}
