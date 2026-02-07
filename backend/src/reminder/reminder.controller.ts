import {
    Controller,
    Get,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class ReminderController {
    constructor(private readonly reminderService: ReminderService) { }

    @Get()
    getAllReminders(@Request() req) {
        return this.reminderService.getAllReminders(req.user.tenantId);
    }

    @Get('tax')
    getTaxReminders(
        @Request() req,
        @Query('days') days?: string,
    ) {
        return this.reminderService.getTaxExpiringVehicles(
            req.user.tenantId,
            days ? parseInt(days) : 30,
        );
    }

    @Get('tax/expired')
    getExpiredTax(@Request() req) {
        return this.reminderService.getExpiredTaxVehicles(req.user.tenantId);
    }

    @Get('credit')
    getCreditReminders(
        @Request() req,
        @Query('days') days?: string,
    ) {
        return this.reminderService.getCreditDueReminders(
            req.user.tenantId,
            days ? parseInt(days) : 7,
        );
    }

    @Get('credit/overdue')
    getOverdueCredits(@Request() req) {
        return this.reminderService.getOverdueCredits(req.user.tenantId);
    }
}
