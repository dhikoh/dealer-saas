import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

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

    // Create notification (for internal use)
    async createNotification(data: {
        userId: string;
        title: string;
        message: string;
        type: string;
        link?: string;
    }) {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                link: data.link,
                read: false,
            },
        });
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

