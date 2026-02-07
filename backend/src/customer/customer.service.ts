import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPlanById } from '../config/plan-tiers.config';

@Injectable()
export class CustomerService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string, search?: string) {
        return this.prisma.customer.findMany({
            where: {
                tenantId,
                ...(search && {
                    OR: [
                        { name: { contains: search } },
                        { phone: { contains: search } },
                        { email: { contains: search } },
                    ],
                }),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                transactions: {
                    include: { vehicle: true },
                    take: 5,
                },
            },
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.customer.findFirst({
            where: { id, tenantId },
            include: {
                transactions: {
                    include: { vehicle: true, credit: true },
                },
            },
        });
    }

    async create(tenantId: string, data: any) {
        // Check plan limit
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { _count: { select: { customers: true } } },
        });

        if (tenant) {
            const plan = getPlanById(tenant.planTier);
            if (plan && plan.features.maxCustomers !== -1) {
                if (tenant._count.customers >= plan.features.maxCustomers) {
                    throw new BadRequestException(
                        `Batas customer tercapai (${plan.features.maxCustomers} customer). Upgrade plan untuk menambah lebih banyak.`
                    );
                }
            }
        }

        return this.prisma.customer.create({
            data: { ...data, tenantId },
        });
    }

    async update(id: string, tenantId: string, data: any) {
        return this.prisma.customer.update({
            where: { id },
            data,
        });
    }

    async delete(id: string, tenantId: string) {
        return this.prisma.customer.delete({
            where: { id },
        });
    }

    // Get document completion status
    async getDocumentStatus(id: string, tenantId: string) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, tenantId },
        });

        if (!customer) return null;

        return {
            ktp: { required: true, completed: !!customer.ktpImage },
            kk: { required: false, completed: !!customer.kkImage },
            homeProof: { required: false, completed: !!customer.homeProofImage },
            salarySlip: { required: false, completed: !!customer.salarySlipImage },
            bankStatement: { required: false, completed: !!customer.bankStatementImage },
            businessLicense: { required: false, completed: !!customer.businessLicenseImage },
        };
    }
}
