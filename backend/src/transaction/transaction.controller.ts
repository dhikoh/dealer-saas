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

@Controller('transactions')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    @Get()
    findAll(
        @Request() req,
        @Query('type') type?: string,
        @Query('status') status?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.transactionService.findAll(req.user.tenantId, {
            type,
            status,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get('stats')
    getStats(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.transactionService.getStats(req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.transactionService.findOne(id, req.user.tenantId);
    }

    @Post()
    create(@Body() data: CreateTransactionDto, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.transactionService.create(req.user.tenantId, req.user.sub, data);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() body: UpdateStatusDto,
        @Request() req,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.transactionService.updateStatus(id, req.user.tenantId, body.status);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.transactionService.delete(id, req.user.tenantId);
    }

    @Get('reports/monthly')
    getMonthlySales(@Request() req, @Query('months') months?: string) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.transactionService.getMonthlySales(
            req.user.tenantId,
            months ? parseInt(months) : 6,
        );
    }
}
