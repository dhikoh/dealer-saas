import { Controller, Get, Request, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { ExportService } from './export.service';
import type { Response } from 'express';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Roles('OWNER')
@Controller('export')
export class ExportController {
    constructor(private readonly exportService: ExportService) { }

    @Get('vehicles')
    async exportVehicles(@Request() req, @Res() res: Response) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        const csv = await this.exportService.exportVehiclesCsv(req.user.tenantId);
        const filename = `kendaraan_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }

    @Get('customers')
    async exportCustomers(@Request() req, @Res() res: Response) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        const csv = await this.exportService.exportCustomersCsv(req.user.tenantId);
        const filename = `pelanggan_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }

    @Get('transactions')
    async exportTransactions(@Request() req, @Res() res: Response) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        const csv = await this.exportService.exportTransactionsCsv(req.user.tenantId);
        const filename = `transaksi_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }

    // ==================== ADMIN EXPORT ====================

    @Get('admin/tenants')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async exportTenants(@Res() res: Response) {
        const csv = await this.exportService.exportTenantsCsv();
        const filename = `tenants_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }

    @Get('admin/invoices')
    @UseGuards(RolesGuard)
    @Roles('SUPERADMIN')
    async exportInvoices(@Res() res: Response) {
        const csv = await this.exportService.exportInvoicesCsv();
        const filename = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }
}
