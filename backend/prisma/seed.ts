import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ==================== SUPERADMIN (No Tenant) ====================
    const superadminPassword = await bcrypt.hash('superadmin123', 10);

    const superadmin = await prisma.user.upsert({
        where: { email: 'superadmin@otohub.id' },
        update: {
            password: superadminPassword
        },
        create: {
            email: 'superadmin@otohub.id',
            username: 'superadmin',
            password: superadminPassword,
            name: 'Super Administrator',
            role: 'SUPERADMIN',
            tenantId: null, // No tenant for superadmin
            phone: '08000000001',
            language: 'id',
            isVerified: true,
            onboardingCompleted: true
        }
    });

    console.log('✅ Superadmin created:');
    console.log('   Email   : superadmin@otohub.id');
    console.log('   Password: superadmin123');
    console.log('');

    // ==================== DEMO TENANT ====================
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'demo-dealer' },
        update: {},
        create: {
            name: 'Demo Dealer',
            slug: 'demo-dealer',
            planTier: 'PRO',
            subscriptionStatus: 'ACTIVE',
            monthlyBill: 2500000, // Rp 2.5 juta
            address: 'Jl. Demo No. 123, Jakarta'
        }
    });

    // ==================== DEMO OWNER ====================
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@otohub.id' },
        update: {
            password: hashedPassword
        },
        create: {
            email: 'demo@otohub.id',
            username: 'demo',
            password: hashedPassword,
            name: 'Demo Owner',
            role: 'OWNER',
            tenantId: tenant.id,
            phone: '081234567890',
            language: 'id',
            isVerified: true,
            onboardingCompleted: true
        }
    });

    console.log('✅ Demo Owner created:');
    console.log('   Email   : demo@otohub.id');
    console.log('   Password: demo123');
    console.log('');

    // ==================== ADDITIONAL SAMPLE TENANTS FOR SUPERADMIN VIEW ====================
    const tenants = [
        { name: 'Mitra Tani Sejahtera', slug: 'mitra-tani-123', planTier: 'ENTERPRISE', monthlyBill: 5000000, status: 'ACTIVE' },
        { name: 'Peternakan Sapi Jaya', slug: 'sapi-jaya-456', planTier: 'PRO', monthlyBill: 2500000, status: 'ACTIVE' },
        { name: 'GreenHouse Lembang', slug: 'greenhouse-789', planTier: 'BASIC', monthlyBill: 750000, status: 'ACTIVE' },
    ];

    for (const t of tenants) {
        await prisma.tenant.upsert({
            where: { slug: t.slug },
            update: { monthlyBill: t.monthlyBill },
            create: {
                name: t.name,
                slug: t.slug,
                planTier: t.planTier,
                subscriptionStatus: t.status,
                monthlyBill: t.monthlyBill,
                address: 'Sample Address'
            }
        });
    }

    console.log('✅ Sample tenants created for Superadmin view');
    console.log('');
    console.log('🚀 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
