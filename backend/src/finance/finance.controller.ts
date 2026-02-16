import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';
import { CreateCostDto, UpdateCostDto } from './dto/finance.dto';

// Protected by global JwtAuthGuard + TenantGuard
@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    // GET /finance/costs — list operating costs
    @Get('costs')
    findAllCosts(
        @ActiveTenant() tenantId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('category') category?: string,
    ) {
        return this.financeService.findAllCosts(tenantId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            category,
        });
    }

    // POST /finance/costs — create operating cost
    @Post('costs')
    createCost(
        @ActiveTenant() tenantId: string,
        @Body() data: CreateCostDto,
    ) {
        return this.financeService.createCost(tenantId, data);
    }

    // PUT /finance/costs/:id — update operating cost
    @Put('costs/:id')
    updateCost(
        @ActiveTenant() tenantId: string,
        @Param('id') id: string,
        @Body() data: UpdateCostDto,
    ) {
        return this.financeService.updateCost(id, tenantId, data);
    }

    // DELETE /finance/costs/:id — delete operating cost
    @Delete('costs/:id')
    deleteCost(
        @ActiveTenant() tenantId: string,
        @Param('id') id: string,
    ) {
        return this.financeService.deleteCost(id, tenantId);
    }

    // GET /finance/summary — cost summary by category
    @Get('summary')
    getCostSummary(
        @ActiveTenant() tenantId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate
            ? new Date(startDate)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();
        return this.financeService.getCostSummary(tenantId, start, end);
    }
}
