
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getPlanById } from '../config/plan-tiers.config';

@Injectable()
export class PublicService {
    constructor(private prisma: PrismaService) { }

    // ==================== MARKETPLACE API ====================

    async getMarketplaceVehicles(options: {
        page: number;
        limit: number;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        make?: string;
        location?: string;
        status?: string;
    }) {
        const { page, limit, category, minPrice, maxPrice, make, location, status } = options;
        const skip = (page - 1) * limit;

        const where: any = {
            status: status || 'AVAILABLE',
            tenant: {
                subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] },
            },
        };

        if (category) where.category = category;
        if (make) where.make = { contains: make, mode: 'insensitive' };
        if (minPrice) where.price = { ...where.price, gte: minPrice };
        if (maxPrice) where.price = { ...where.price, lte: maxPrice };
        if (location) {
            where.tenant = {
                ...where.tenant,
                address: { contains: location, mode: 'insensitive' },
            };
        }

        const [vehicles, total] = await Promise.all([
            this.prisma.vehicle.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            address: true,
                            phone: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.vehicle.count({ where }),
        ]);

        return {
            data: vehicles.map(v => ({
                id: v.id,
                category: v.category,
                make: v.make,
                model: v.model,
                variant: v.variant,
                year: v.year,
                color: v.color,
                price: Number(v.price),
                status: v.status,
                condition: v.condition,
                licensePlate: v.licensePlate, // Maybe hide this for public? User asked for "seluruh data".
                images: v.images,
                specs: v.specs,
                dealer: {
                    id: v.tenant.id,
                    name: v.tenant.name,
                    slug: v.tenant.slug,
                    address: v.tenant.address,
                    phone: v.tenant.phone,
                    email: v.tenant.email,
                },
                createdAt: v.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getMarketplaceVehicleDetail(vehicleId: string) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                status: 'AVAILABLE',
                tenant: {
                    subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] },
                },
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        address: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });

        if (!vehicle) return null;

        return {
            id: vehicle.id,
            category: vehicle.category,
            make: vehicle.make,
            model: vehicle.model,
            variant: vehicle.variant,
            year: vehicle.year,
            color: vehicle.color,
            price: Number(vehicle.price),
            status: vehicle.status,
            condition: vehicle.condition,
            licensePlate: vehicle.licensePlate,
            images: vehicle.images,
            specs: vehicle.specs,
            stnkExpiry: vehicle.stnkExpiry,
            bpkbAvailable: vehicle.bpkbAvailable,
            dealer: {
                id: vehicle.tenant.id,
                name: vehicle.tenant.name,
                slug: vehicle.tenant.slug,
                address: vehicle.tenant.address,
                phone: vehicle.tenant.phone,
                email: vehicle.tenant.email,
            },
            createdAt: vehicle.createdAt,
        };
    }

    async getMarketplaceDealers(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options;
        const skip = (page - 1) * limit;

        const where: any = {
            subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] },
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [dealers, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    address: true,
                    phone: true,
                    email: true,
                    createdAt: true,
                    _count: {
                        select: {
                            vehicles: {
                                where: { status: 'AVAILABLE' },
                            },
                        },
                    },
                },
            }),
            this.prisma.tenant.count({ where }),
        ]);

        return {
            data: dealers.map(d => ({
                id: d.id,
                name: d.name,
                slug: d.slug,
                address: d.address,
                phone: d.phone,
                email: d.email,
                vehicleCount: d._count.vehicles,
                createdAt: d.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ==================== SHARED BLACKLIST API ====================

    async getSharedBlacklist(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { ktpNumber: { contains: search } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [entries, total] = await Promise.all([
            this.prisma.blacklistEntry.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: {
                        select: { name: true, phone: true } // Who reported them
                    }
                }
            }),
            this.prisma.blacklistEntry.count({ where }),
        ]);

        return {
            data: entries.map(e => ({
                id: e.id,
                ktpNumber: e.ktpNumber,
                name: e.customerName, // Anonymize? User asked for "API Customer yang blacklist". Usually shared blacklists show KTP + Name + Reason.
                reason: e.reason,
                reportedBy: e.tenant.name,
                reportedAt: e.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getMarketplaceStats() {
        const [
            totalVehicles,
            totalDealers,
            vehiclesByCategory,
            priceRange,
        ] = await Promise.all([
            this.prisma.vehicle.count({
                where: {
                    status: 'AVAILABLE',
                    tenant: { subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] } },
                },
            }),
            this.prisma.tenant.count({
                where: { subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] } },
            }),
            this.prisma.vehicle.groupBy({
                by: ['category'],
                where: {
                    status: 'AVAILABLE',
                    tenant: { subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] } },
                },
                _count: { id: true },
            }),
            this.prisma.vehicle.aggregate({
                where: {
                    status: 'AVAILABLE',
                    tenant: { subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] } },
                },
                _min: { price: true },
                _max: { price: true },
                _avg: { price: true },
            }),
        ]);

        return {
            totalVehicles,
            totalDealers,
            vehiclesByCategory: vehiclesByCategory.map(c => ({
                category: c.category,
                count: c._count.id,
            })),
            priceRange: {
                min: Number(priceRange._min.price || 0),
                max: Number(priceRange._max.price || 0),
                avg: Number(priceRange._avg.price || 0),
            },
        };
    }

    // ==================== LANDING PAGE CONTENT ====================

    async getLandingContent() {
        const content = await this.prisma.landingPageContent.findUnique({
            where: { id: 'default' },
        });

        if (!content) {
            // Return sensible defaults if no content has been saved yet
            return {
                hero: { title: '', subtitle: '', ctaText: '', ctaLink: '', bgImage: '' },
                features: [],
                pricing: [],
                faq: [],
                footer: { socialLinks: [], contactInfo: { email: '', phone: '', address: '' } },
            };
        }

        return {
            hero: content.hero,
            features: content.features,
            pricing: content.pricing,
            faq: content.faq,
            footer: content.footer,
        };
    }
}
