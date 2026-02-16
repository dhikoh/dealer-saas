import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { Roles } from '../auth/roles.decorator';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

@Roles('OWNER')
@Controller('reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Get('profit-loss')
    async getProfitLoss(
        @ActiveTenant() tenantId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate
            ? new Date(startDate)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate
            ? new Date(endDate)
            : new Date();

        return this.reportService.getProfitLossReport(tenantId, start, end);
    }

    @Get('monthly-summary')
    async getMonthlySummary(
        @ActiveTenant() tenantId: string,
        @Query('months') months?: string,
    ) {
        return this.reportService.getMonthlySummary(
            tenantId,
            months ? parseInt(months) : 12,
        );
    }

    @Get('inventory')
    async getInventorySummary(@ActiveTenant() tenantId: string) {
        return this.reportService.getInventorySummary(tenantId);
    }
}
