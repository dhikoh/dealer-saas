import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

@Controller('transactions')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    @Get()
    findAll(
        @ActiveTenant() tenantId: string,
        @Query('type') type?: string,
        @Query('status') status?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.transactionService.findAll(tenantId, {
            type,
            status,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get('stats')
    getStats(@ActiveTenant() tenantId: string) {
        return this.transactionService.getStats(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.transactionService.findOne(id, tenantId);
    }

    @Post()
    create(@Body() data: CreateTransactionDto, @Request() req, @ActiveTenant() tenantId: string) {
        return this.transactionService.create(tenantId, req.user.sub, data);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() body: UpdateStatusDto,
        @ActiveTenant() tenantId: string,
    ) {
        return this.transactionService.updateStatus(id, tenantId, body.status);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.transactionService.delete(id, tenantId);
    }

    @Get('reports/monthly')
    getMonthlySales(@ActiveTenant() tenantId: string, @Query('months') months?: string) {
        return this.transactionService.getMonthlySales(
            tenantId,
            months ? parseInt(months) : 6,
        );
    }
}
