import { Controller, Get, Query, Request, ForbiddenException } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';

// Protected by global JwtAuthGuard
@Controller('activity-logs')
export class ActivityLogController {
    constructor(private readonly activityLogService: ActivityLogService) { }

    @Get()
    findAll(
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Query('action') action: string,
        @Query('userId') userId: string,
        @Request() req,
    ) {
        if (!req.user.tenantId) throw new ForbiddenException('No tenant associated');
        return this.activityLogService.findAll(req.user.tenantId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            action: action || undefined,
            userId: userId || undefined,
        });
    }
}
