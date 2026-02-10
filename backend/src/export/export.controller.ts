import { Controller, Get, Request, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import type { Response } from 'express';
import { Roles } from '../auth/roles.decorator';

@Roles('OWNER')
@Controller('export')
export class ExportController {
    constructor(private readonly exportService: ExportService) { }

    @Get('vehicles')
    async exportVehicles(@Request() req, @Res() res: Response) {
        const csv = await this.exportService.exportVehiclesCsv(req.user.tenantId);
        const filename = `kendaraan_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }

    @Get('customers')
    async exportCustomers(@Request() req, @Res() res: Response) {
        const csv = await this.exportService.exportCustomersCsv(req.user.tenantId);
        const filename = `pelanggan_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }

    @Get('transactions')
    async exportTransactions(@Request() req, @Res() res: Response) {
        const csv = await this.exportService.exportTransactionsCsv(req.user.tenantId);
        const filename = `transaksi_${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }
}
