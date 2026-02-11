
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
    constructor(private prisma: PrismaService) { }

    async getPublicContent() {
        return this.prisma.landingPageContent.findUnique({
            where: { id: 'default' },
        });
    }

    async updateContent(data: any) {
        return this.prisma.landingPageContent.upsert({
            where: { id: 'default' },
            update: data,
            create: {
                id: 'default',
                ...data,
            },
        });
    }
}
