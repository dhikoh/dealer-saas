import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

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
    findAll(@ActiveTenant() tenantId: string) {
        return this.creditService.findAllByTenant(tenantId);
    }

    @Get('overdue')
    getOverdue(@ActiveTenant() tenantId: string) {
        return this.creditService.getOverdueCredits(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @ActiveTenant() tenantId: string) {
        return this.creditService.findOne(id, tenantId);
    }

    @Post()
    create(@Body() data: CreateCreditDto, @ActiveTenant() tenantId: string) {
        return this.creditService.create(data.transactionId, data, tenantId);
    }

    @Post(':id/payments')
    addPayment(
        @Param('id') creditId: string,
        @Body() data: AddPaymentDto,
        @ActiveTenant() tenantId: string,
    ) {
        return this.creditService.addPayment(
            creditId,
            tenantId,
            data.month,
            data.amount,
            new Date(data.paidAt),
            data.status,
        );
    }
}
