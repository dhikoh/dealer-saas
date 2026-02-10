import { Controller, Get, Query, Request } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Get('profit-loss')
    async getProfitLoss(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate
            ? new Date(startDate)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate
            ? new Date(endDate)
            : new Date();

        return this.reportService.getProfitLossReport(req.user.tenantId, start, end);
    }

    @Get('monthly-summary')
    async getMonthlySummary(
        @Request() req,
        @Query('months') months?: string,
    ) {
        return this.reportService.getMonthlySummary(
            req.user.tenantId,
            months ? parseInt(months) : 12,
        );
    }

    @Get('inventory')
    async getInventorySummary(@Request() req) {
        return this.reportService.getInventorySummary(req.user.tenantId);
    }
}
