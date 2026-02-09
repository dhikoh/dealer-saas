import { Controller, Get, Post, Patch, Param, Query, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';

// Protected by global JwtAuthGuard
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    // Get all notifications for the current user
    @Get()
    async getNotifications(
        @Request() req: any,
        @Query('limit') limit?: string
    ) {
        const notifications = await this.notificationService.getNotifications(
            req.user.sub,
            limit ? parseInt(limit) : 20
        );
        const unreadCount = await this.notificationService.getUnreadCount(req.user.sub);

        return {
            notifications,
            unreadCount,
        };
    }

    // Get unread count only
    @Get('unread-count')
    async getUnreadCount(@Request() req: any) {
        const count = await this.notificationService.getUnreadCount(req.user.sub);
        return { unreadCount: count };
    }

    // Mark single notification as read
    @Patch(':id/read')
    async markAsRead(
        @Request() req: any,
        @Param('id') notificationId: string
    ) {
        await this.notificationService.markAsRead(req.user.sub, notificationId);
        return { success: true };
    }

    // Mark all notifications as read
    @Post('mark-all-read')
    async markAllAsRead(@Request() req: any) {
        await this.notificationService.markAllAsRead(req.user.sub);
        return { success: true };
    }
}
