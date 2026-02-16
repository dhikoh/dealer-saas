import { Controller, Get, Query } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActiveTenant } from '../common/decorators/active-tenant.decorator';

// Protected by global JwtAuthGuard + TenantGuard
@Controller('activity-logs')
export class ActivityLogController {
    constructor(private readonly activityLogService: ActivityLogService) { }

    @Get()
    findAll(
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Query('action') action: string,
        @Query('userId') userId: string,
        @ActiveTenant() tenantId: string,
    ) {
        return this.activityLogService.findAll(tenantId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            action: action || undefined,
            userId: userId || undefined,
        });
    }
}
