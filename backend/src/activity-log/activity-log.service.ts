import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
    private readonly logger = new Logger(ActivityLogService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Log an activity for a tenant user.
     * This is designed to be fire-and-forget — errors are caught and logged, not thrown.
     */
    async log(params: {
        tenantId: string;
        userId: string;
        userEmail: string;
        action: string;
        entityType?: string;
        entityId?: string;
        entityName?: string;
        details?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
    }) {
        try {
            await this.prisma.activityLog.create({
                data: {
                    tenantId: params.tenantId,
                    userId: params.userId,
                    userEmail: params.userEmail,
                    action: params.action,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    entityName: params.entityName,
                    details: params.details ? JSON.stringify(params.details) : null,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                },
            });
        } catch (error) {
            // Fire-and-forget: don't break main flow if logging fails
            this.logger.error(`Failed to log activity: ${error.message}`, error.stack);
        }
    }

    /**
     * Get activity logs for a tenant with pagination and filters
     */
    async findAll(tenantId: string, params?: {
        page?: number;
        limit?: number;
        action?: string;
        userId?: string;
    }) {
        const page = params?.page || 1;
        const limit = params?.limit || 50;
        const skip = (page - 1) * limit;

        const where: any = { tenantId };
        if (params?.action) where.action = params.action;
        if (params?.userId) where.userId = params.userId;

        const [logs, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: { name: true, email: true },
                    },
                },
            }),
            this.prisma.activityLog.count({ where }),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
