
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
        // Validate and whitelist allowed fields to prevent injection
        const allowedFields = ['hero', 'features', 'pricing', 'faq', 'footer', 'testimonials', 'partners'];
        const sanitizedData: Record<string, any> = {};
        for (const key of allowedFields) {
            if (data[key] !== undefined) {
                sanitizedData[key] = data[key];
            }
        }

        if (Object.keys(sanitizedData).length === 0) {
            throw new Error('No valid content fields provided');
        }

        return this.prisma.landingPageContent.upsert({
            where: { id: 'default' },
            update: sanitizedData,
            create: {
                id: 'default',
                hero: {},
                features: [],
                pricing: [],
                faq: [],
                footer: {},
                ...sanitizedData,
            } as any,
        });
    }
}
