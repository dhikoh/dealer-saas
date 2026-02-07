import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { CreditService } from './credit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('credit')
@UseGuards(JwtAuthGuard)
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
        return this.creditService.findAllByTenant(req.user.tenantId);
    }

    @Get('overdue')
    getOverdue(@Request() req) {
        return this.creditService.getOverdueCredits(req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.creditService.findOne(id);
    }

    @Post()
    create(@Body() data: {
        transactionId: string;
        downPayment: number;
        totalAmount: number;
        interestRate: number;
        tenorMonths: number;
        monthlyPayment: number;
    }) {
        return this.creditService.create(data.transactionId, data);
    }

    @Post(':id/payments')
    addPayment(
        @Param('id') creditId: string,
        @Body() data: {
            month: number;
            amount: number;
            paidAt: string;
            status?: string;
        },
    ) {
        return this.creditService.addPayment(
            creditId,
            data.month,
            data.amount,
            new Date(data.paidAt),
            data.status,
        );
    }
}
