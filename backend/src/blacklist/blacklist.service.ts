import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlacklistService {
    constructor(private prisma: PrismaService) { }

    // ==================== TENANT-SPECIFIC CRUD ====================

    async findAllByTenant(tenantId: string) {
        return this.prisma.blacklistEntry.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(tenantId: string, data: {
        ktpNumber: string;
        customerName: string;
        customerAddress?: string;
        reason: string;
    }) {
        return this.prisma.blacklistEntry.create({
            data: {
                tenantId,
                ktpNumber: data.ktpNumber,
                customerName: data.customerName,
                customerAddress: data.customerAddress,
                reason: data.reason,
            },
        });
    }

    async delete(ktpNumber: string, tenantId: string) {
        return this.prisma.blacklistEntry.delete({
            where: {
                ktpNumber_tenantId: {
                    ktpNumber,
                    tenantId,
                },
            },
        });
    }

    // ==================== CROSS-TENANT CHECK (For all dealers) ====================

    async checkBlacklist(ktpNumber: string) {
        const entries = await this.prisma.blacklistEntry.findMany({
            where: { ktpNumber },
            include: {
                tenant: {
                    select: {
                        name: true,
                        address: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (entries.length === 0) {
            return {
                isBlacklisted: false,
                customerName: null,
                customerAddress: null,
                entries: [],
            };
        }

        // Get customer info from first entry
        const firstEntry = entries[0];

        return {
            isBlacklisted: true,
            customerName: firstEntry.customerName,
            customerAddress: firstEntry.customerAddress,
            entries: entries.map(entry => ({
                dealerName: entry.tenant.name,
                dealerAddress: entry.tenant.address,
                reason: entry.reason,
                createdAt: entry.createdAt,
            })),
        };
    }

    // Get count of blacklist entries for a KTP
    async getBlacklistCount(ktpNumber: string) {
        return this.prisma.blacklistEntry.count({
            where: { ktpNumber },
        });
    }
}
