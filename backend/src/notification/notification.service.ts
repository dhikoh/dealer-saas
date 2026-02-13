import { Injectable, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
    constructor(
        private prisma: PrismaService,
        @Optional() @Inject(NotificationGateway) private gateway?: NotificationGateway,
    ) { }

    // Get notifications for a user
    async getNotifications(userId: string, limit: number = 20) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // Get unread count
    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: { userId, read: false },
        });
    }

    // Mark notification as read
    async markAsRead(userId: string, notificationId: string) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { read: true },
        });
    }

    // Mark all as read
    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    }

    // Create notification (for internal use) + push via WebSocket
    async createNotification(data: {
        userId: string;
        title: string;
        message: string;
        type: string;
        link?: string;
    }) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                link: data.link,
                read: false,
            },
        });

        // Push real-time via WebSocket (if gateway is available and user is connected)
        if (this.gateway) {
            try {
                this.gateway.sendToUser(data.userId, {
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    link: notification.link ?? undefined,
                    createdAt: notification.createdAt,
                });
            } catch {
                // Silently ignore WebSocket push failures — DB record still created
            }
        }

        return notification;
    }


    // Delete old notifications (cleanup)
    async deleteOldNotifications(userId: string, daysOld: number = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        return this.prisma.notification.deleteMany({
            where: {
                userId,
                createdAt: { lt: cutoffDate },
                read: true,
            },
        });
    }
}

