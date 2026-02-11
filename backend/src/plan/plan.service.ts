
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.plan.findMany({
            orderBy: { price: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.plan.findUnique({
            where: { id },
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.plan.findUnique({
            where: { slug },
        });
    }
}
