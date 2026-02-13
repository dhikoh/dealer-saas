import {
    Controller,
    Get,
    Request,
    Query,
    ForbiddenException,
} from '@nestjs/common';
import { ReminderService } from './reminder.service';

// Protected by global JwtAuthGuard
@Controller('reminders')
export class ReminderController {
    constructor(private readonly reminderService: ReminderService) { }

    @Get()
    getAllReminders(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.reminderService.getAllReminders(req.user.tenantId);
    }

    @Get('tax')
    getTaxReminders(
        @Request() req,
        @Query('days') days?: string,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.reminderService.getTaxExpiringVehicles(
            req.user.tenantId,
            days ? parseInt(days) : 30,
        );
    }

    @Get('tax/expired')
    getExpiredTax(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.reminderService.getExpiredTaxVehicles(req.user.tenantId);
    }

    @Get('credit')
    getCreditReminders(
        @Request() req,
        @Query('days') days?: string,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.reminderService.getCreditDueReminders(
            req.user.tenantId,
            days ? parseInt(days) : 7,
        );
    }

    @Get('credit/overdue')
    getOverdueCredits(@Request() req) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.reminderService.getOverdueCredits(req.user.tenantId);
    }
}
