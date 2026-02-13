import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { AddPaymentDto } from './dto/add-payment.dto';

@Controller('credit')
export class CreditController {
    constructor(private readonly creditService: CreditService) { }

    // ==================== SIMULATION ====================

    @Get('simulate')
    simulate(
        @Query('price') price: string,
        @Query('dp') dp: string,
        @Query('rate') rate: string,
        @Query('tenor') tenor: string,
    ) {
        return this.creditService.simulateCredit({
            vehiclePrice: parseFloat(price),
            downPayment: parseFloat(dp),
            interestRatePerYear: parseFloat(rate),
            tenorMonths: parseInt(tenor),
        });
    }

    @Get('simulate/table')
    simulateTable(
        @Query('price') price: string,
        @Query('dp') dp: string,
        @Query('rate') rate: string,
    ) {
        return this.creditService.generateSimulationTable(
            parseFloat(price),
            parseFloat(dp),
            parseFloat(rate),
        );
    }

    // ==================== CREDIT MANAGEMENT ====================

    @Get()
    findAll(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.creditService.findAllByTenant(req.user.tenantId);
    }

    @Get('overdue')
    getOverdue(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.creditService.getOverdueCredits(req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.creditService.findOne(id, req.user.tenantId);
    }

    @Post()
    create(@Body() data: CreateCreditDto, @Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.creditService.create(data.transactionId, data, req.user.tenantId);
    }

    @Post(':id/payments')
    addPayment(
        @Param('id') creditId: string,
        @Body() data: AddPaymentDto,
        @Request() req,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.creditService.addPayment(
            creditId,
            req.user.tenantId,
            data.month,
            data.amount,
            new Date(data.paidAt),
            data.status,
        );
    }
}
