import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, ForbiddenException } from '@nestjs/common';
import { FinanceService } from './finance.service';

// Protected by global JwtAuthGuard
@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    // GET /finance/costs — list operating costs
    @Get('costs')
    async findAllCosts(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('category') category?: string,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.financeService.findAllCosts(req.user.tenantId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            category,
        });
    }

    // POST /finance/costs — create operating cost
    @Post('costs')
    async createCost(
        @Request() req: any,
        @Body() data: {
            name: string;
            amount: number;
            category: string;
            date: string;
            note?: string;
            proofImage?: string;
        },
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.financeService.createCost(req.user.tenantId, data);
    }

    // PUT /finance/costs/:id — update operating cost
    @Put('costs/:id')
    async updateCost(
        @Request() req: any,
        @Param('id') id: string,
        @Body() data: any,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.financeService.updateCost(id, req.user.tenantId, data);
    }

    // DELETE /finance/costs/:id — delete operating cost
    @Delete('costs/:id')
    async deleteCost(
        @Request() req: any,
        @Param('id') id: string,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.financeService.deleteCost(id, req.user.tenantId);
    }

    // GET /finance/summary — cost summary by category
    @Get('summary')
    async getCostSummary(
        @Request() req: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        const start = startDate
            ? new Date(startDate)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();
        return this.financeService.getCostSummary(req.user.tenantId, start, end);
    }
}
