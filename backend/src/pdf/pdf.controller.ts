import {
    Controller,
    Get,
    Param,
    Request,
    Res,
} from '@nestjs/common';
import { PdfService } from './pdf.service';

// Protected by global JwtAuthGuard
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
        @Request() req: any,
        @Res() res: any,
    ) {
        return this.pdfService.generateInternalVehicleReport(
            vehicleId,
            req.user.tenantId,
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
        @Request() req: any,
        @Res() res: any,
    ) {
        return this.pdfService.generateCustomerVehicleReport(
            vehicleId,
            req.user.tenantId,
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
        @Request() req: any,
        @Res() res: any,
    ) {
        return this.pdfService.generateTransactionInvoice(
            transactionId,
            req.user.tenantId,
            res,
        );
    }
}

