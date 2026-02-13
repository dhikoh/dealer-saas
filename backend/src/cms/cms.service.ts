
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
    constructor(private prisma: PrismaService) { }

    async getPublicContent() {
        const content = await this.prisma.landingPageContent.findUnique({
            where: { id: 'default' },
        });

        // Return default empty content if no record exists
        return content || {
            id: 'default',
            hero: { title: '', subtitle: '', ctaText: '', ctaLink: '', bgImage: '' },
            features: [],
            pricing: [],
            faq: [],
            footer: { socialLinks: [], contactInfo: { email: '', phone: '', address: '' } },
        };
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
