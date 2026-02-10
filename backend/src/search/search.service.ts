import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
    constructor(private prisma: PrismaService) { }

    async search(tenantId: string, query: string, limit: number = 10) {
        if (!query || query.length < 2) {
            return { vehicles: [], customers: [], transactions: [] };
        }

        const searchTerm = `%${query}%`;

        // Parallel tenant-isolated searches across all entity types
        const [vehicles, customers, transactions] = await Promise.all([
            this.prisma.vehicle.findMany({
                where: {
                    tenantId,
                    OR: [
                        { make: { contains: query, mode: 'insensitive' } },
                        { model: { contains: query, mode: 'insensitive' } },
                        { licensePlate: { contains: query, mode: 'insensitive' } },
                        { color: { contains: query, mode: 'insensitive' } },
                        { variant: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    make: true,
                    model: true,
                    variant: true,
                    year: true,
                    color: true,
                    licensePlate: true,
                    price: true,
                    status: true,
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.customer.findMany({
                where: {
                    tenantId,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { phone: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                        { ktpNumber: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    ktpNumber: true,
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.transaction.findMany({
                where: {
                    tenantId,
                    OR: [
                        { customer: { name: { contains: query, mode: 'insensitive' } } },
                        { vehicle: { make: { contains: query, mode: 'insensitive' } } },
                        { vehicle: { model: { contains: query, mode: 'insensitive' } } },
                    ],
                },
                select: {
                    id: true,
                    type: true,
                    finalPrice: true,
                    status: true,
                    date: true,
                    customer: { select: { name: true } },
                    vehicle: { select: { make: true, model: true } },
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            vehicles: vehicles.map(v => ({
                type: 'vehicle' as const,
                id: v.id,
                title: `${v.make} ${v.model} ${v.variant || ''} ${v.year}`.trim(),
                subtitle: `${v.licensePlate || 'No Plat'} - Rp ${Number(v.price).toLocaleString('id-ID')}`,
                status: v.status,
                href: '/app/inventory',
            })),
            customers: customers.map(c => ({
                type: 'customer' as const,
                id: c.id,
                title: c.name,
                subtitle: c.phone,
                href: '/app/customers',
            })),
            transactions: transactions.map(t => ({
                type: 'transaction' as const,
                id: t.id,
                title: `TRX-${t.id.slice(0, 8).toUpperCase()}`,
                subtitle: `${t.type === 'SALE' ? 'Penjualan' : 'Pembelian'} - Rp ${Number(t.finalPrice).toLocaleString('id-ID')}`,
                status: t.status,
                href: '/app/transactions',
            })),
        };
    }
}
