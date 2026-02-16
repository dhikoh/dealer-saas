
import { Controller, Get, Post, Body, Patch, Param, Request, Query } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

@ApiTags('Stock Transfer')
@ApiBearerAuth()
@Controller('stock-transfers')
export class StockTransferController {
    constructor(private readonly stockTransferService: StockTransferService) { }

    @Post()
    @ApiOperation({ summary: 'Request a stock transfer' })
    create(@Request() req, @Body() createDto: CreateStockTransferDto, @ActiveTenant() tenantId: string) {
        return this.stockTransferService.create(createDto, tenantId, req.user.userId);
    }

    @Get()
    @ApiOperation({ summary: 'List stock transfers' })
    @ApiQuery({ name: 'status', required: false })
    findAll(
        @ActiveTenant() tenantId: string,
        @Query('status') status?: string,
    ) {
        return this.stockTransferService.findAll(tenantId, status);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get transfer details' })
    findOne(@ActiveTenant() tenantId: string, @Param('id') id: string) {
        return this.stockTransferService.findOne(id, tenantId);
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve a transfer' })
    approve(@Request() req, @Param('id') id: string, @ActiveTenant() tenantId: string, @Body('notes') notes?: string) {
        return this.stockTransferService.approve(id, tenantId, req.user.userId, notes);
    }

    @Patch(':id/reject')
    @ApiOperation({ summary: 'Reject a transfer' })
    reject(@Request() req, @Param('id') id: string, @ActiveTenant() tenantId: string, @Body('notes') notes?: string) {
        return this.stockTransferService.reject(id, tenantId, req.user.userId, notes);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel a transfer request' })
    cancel(@Request() req, @Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.stockTransferService.cancel(id, tenantId, req.user.userId);
    }
}
