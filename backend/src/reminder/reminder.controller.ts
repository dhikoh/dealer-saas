import {
    Controller,
    Get,
    Query,
} from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

// Protected by global JwtAuthGuard + TenantGuard
@Controller('reminders')
export class ReminderController {
    constructor(private readonly reminderService: ReminderService) { }

    @Get()
    getAllReminders(@ActiveTenant() tenantId: string) {
        return this.reminderService.getAllReminders(tenantId);
    }

    @Get('tax')
    getTaxReminders(
        @ActiveTenant() tenantId: string,
        @Query('days') days?: string,
    ) {
        return this.reminderService.getTaxExpiringVehicles(
            tenantId,
            days ? parseInt(days) : 30,
        );
    }

    @Get('tax/expired')
    getExpiredTax(@ActiveTenant() tenantId: string) {
        return this.reminderService.getExpiredTaxVehicles(tenantId);
    }

    @Get('credit')
    getCreditReminders(
        @ActiveTenant() tenantId: string,
        @Query('days') days?: string,
    ) {
        return this.reminderService.getCreditDueReminders(
            tenantId,
            days ? parseInt(days) : 7,
        );
    }

    @Get('credit/overdue')
    getOverdueCredits(@ActiveTenant() tenantId: string) {
        return this.reminderService.getOverdueCredits(tenantId);
    }
}
