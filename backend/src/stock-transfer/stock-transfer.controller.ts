
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Stock Transfer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock-transfers')
export class StockTransferController {
    constructor(private readonly stockTransferService: StockTransferService) { }

    @Post()
    @ApiOperation({ summary: 'Request a stock transfer' })
    create(@Request() req, @Body() createDto: any) {
        return this.stockTransferService.create(createDto, req.user.tenantId, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'List stock transfers' })
    @ApiQuery({ name: 'status', required: false })
    findAll(
        @Request() req,
        @Query('status') status?: string,
    ) {
        return this.stockTransferService.findAll(req.user.tenantId, status);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get transfer details' })
    findOne(@Request() req, @Param('id') id: string) {
        return this.stockTransferService.findOne(id, req.user.tenantId);
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve a transfer' })
    approve(@Request() req, @Param('id') id: string, @Body('notes') notes?: string) {
        return this.stockTransferService.approve(id, req.user.tenantId, req.user.id, notes);
    }

    @Patch(':id/reject')
    @ApiOperation({ summary: 'Reject a transfer' })
    reject(@Request() req, @Param('id') id: string, @Body('notes') notes?: string) {
        return this.stockTransferService.reject(id, req.user.tenantId, req.user.id, notes);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel a transfer request' })
    cancel(@Request() req, @Param('id') id: string) {
        return this.stockTransferService.cancel(id, req.user.tenantId, req.user.id);
    }
}
