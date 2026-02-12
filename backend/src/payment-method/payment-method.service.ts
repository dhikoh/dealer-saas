import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentMethodService {
    private readonly logger = new Logger(PaymentMethodService.name);

    constructor(private prisma: PrismaService) { }

    // ==================== PUBLIC / TENANT ====================

    async getActiveMethods() {
        return this.prisma.adminPaymentMethod.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
        });
    }

    // ==================== SUPERADMIN ====================

    async getAllMethods() {
        return this.prisma.adminPaymentMethod.findMany({
            orderBy: { createdAt: 'asc' }
        });
    }

    async createMethod(data: any) {
        return this.prisma.adminPaymentMethod.create({
            data: {
                provider: data.provider,
                accountName: data.accountName,
                accountNumber: data.accountNumber,
                description: data.description,
                logo: data.logo,
                instructions: data.instructions ? JSON.stringify(data.instructions) : null,
            }
        });
    }

    async updateMethod(id: string, data: any) {
        return this.prisma.adminPaymentMethod.update({
            where: { id },
            data: {
                ...data,
                instructions: data.instructions ? JSON.stringify(data.instructions) : undefined
            }
        });
    }

    async deleteMethod(id: string) {
        return this.prisma.adminPaymentMethod.delete({
            where: { id }
        });
    }

    async toggleActive(id: string, isActive: boolean) {
        return this.prisma.adminPaymentMethod.update({
            where: { id },
            data: { isActive }
        });
    }
}
