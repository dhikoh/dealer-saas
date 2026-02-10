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
            tenantId: null,
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

    // ==================== TENANT 1: JAYA MOTOR BANDUNG (PRO) ====================
    const tenant1 = await prisma.tenant.upsert({
        where: { slug: 'jaya-motor-bandung' },
        update: {
            monthlyBill: 2500000,
            subscriptionStatus: 'ACTIVE',
            planTier: 'PRO',
        },
        create: {
            name: 'Jaya Motor Bandung',
            slug: 'jaya-motor-bandung',
            planTier: 'PRO',
            subscriptionStatus: 'ACTIVE',
            monthlyBill: 2500000,
            address: 'Jl. Soekarno-Hatta No. 456, Bandung, Jawa Barat 40286',
            phone: '02287654321',
            email: 'jayamotor@otohub.id',
            autoRenew: true,
            subscriptionStartedAt: new Date('2025-12-01'),
            subscriptionEndsAt: new Date('2026-03-01'),
            nextBillingDate: new Date('2026-03-01'),
        }
    });

    const jayaPassword = await bcrypt.hash('jaya123', 10);
    await prisma.user.upsert({
        where: { email: 'jayamotor@otohub.id' },
        update: { password: jayaPassword },
        create: {
            email: 'jayamotor@otohub.id',
            username: 'jayamotor',
            password: jayaPassword,
            name: 'Budi Santoso',
            role: 'OWNER',
            tenantId: tenant1.id,
            phone: '081234500001',
            address: 'Jl. Pasteur No. 10, Bandung',
            language: 'id',
            isVerified: true,
            onboardingCompleted: true,
            birthDate: new Date('1985-03-15'),
        }
    });

    // Invoice for Jaya Motor (PAID)
    await (prisma as any).systemInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-001' },
        update: {},
        create: {
            tenantId: tenant1.id,
            invoiceNumber: 'INV-2026-001',
            amount: 2500000,
            date: new Date('2026-01-01'),
            dueDate: new Date('2026-01-15'),
            status: 'PAID',
            items: JSON.stringify([
                { description: 'Langganan Plan PRO - Januari 2026', amount: 2500000 }
            ]),
        }
    });

    // Invoice for Jaya Motor (PENDING - Feb)
    await (prisma as any).systemInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-004' },
        update: {},
        create: {
            tenantId: tenant1.id,
            invoiceNumber: 'INV-2026-004',
            amount: 2500000,
            date: new Date('2026-02-01'),
            dueDate: new Date('2026-02-15'),
            status: 'PENDING',
            items: JSON.stringify([
                { description: 'Langganan Plan PRO - Februari 2026', amount: 2500000 }
            ]),
        }
    });

    console.log('✅ Tenant 1: Jaya Motor Bandung (PRO)');
    console.log('   Owner   : jayamotor@otohub.id / jaya123');

    // ==================== TENANT 2: BERKAH AUTO JAKARTA (BASIC) ====================
    const tenant2 = await prisma.tenant.upsert({
        where: { slug: 'berkah-auto-jakarta' },
        update: {
            monthlyBill: 750000,
            subscriptionStatus: 'ACTIVE',
            planTier: 'BASIC',
        },
        create: {
            name: 'Berkah Auto Jakarta',
            slug: 'berkah-auto-jakarta',
            planTier: 'BASIC',
            subscriptionStatus: 'ACTIVE',
            monthlyBill: 750000,
            address: 'Jl. Fatmawati Raya No. 78, Jakarta Selatan 12150',
            phone: '02198765432',
            email: 'berkah@otohub.id',
            autoRenew: true,
            subscriptionStartedAt: new Date('2025-11-15'),
            subscriptionEndsAt: new Date('2026-02-15'),
            nextBillingDate: new Date('2026-02-15'),
        }
    });

    const berkahPassword = await bcrypt.hash('berkah123', 10);
    await prisma.user.upsert({
        where: { email: 'berkah@otohub.id' },
        update: { password: berkahPassword },
        create: {
            email: 'berkah@otohub.id',
            username: 'berkahauto',
            password: berkahPassword,
            name: 'Ahmad Fauzi',
            role: 'OWNER',
            tenantId: tenant2.id,
            phone: '081234500002',
            address: 'Jl. Kebayoran Baru No. 5, Jakarta Selatan',
            language: 'id',
            isVerified: true,
            onboardingCompleted: true,
            birthDate: new Date('1990-07-22'),
        }
    });

    // Invoice for Berkah Auto (PAID)
    await (prisma as any).systemInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-002' },
        update: {},
        create: {
            tenantId: tenant2.id,
            invoiceNumber: 'INV-2026-002',
            amount: 750000,
            date: new Date('2025-12-15'),
            dueDate: new Date('2025-12-30'),
            status: 'PAID',
            items: JSON.stringify([
                { description: 'Langganan Plan BASIC - Desember 2025', amount: 750000 }
            ]),
        }
    });

    // Invoice for Berkah Auto (VERIFYING - upload proof)
    await (prisma as any).systemInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-005' },
        update: {},
        create: {
            tenantId: tenant2.id,
            invoiceNumber: 'INV-2026-005',
            amount: 750000,
            date: new Date('2026-01-15'),
            dueDate: new Date('2026-01-30'),
            status: 'VERIFYING',
            items: JSON.stringify([
                { description: 'Langganan Plan BASIC - Januari 2026', amount: 750000 }
            ]),
        }
    });

    console.log('✅ Tenant 2: Berkah Auto Jakarta (BASIC)');
    console.log('   Owner   : berkah@otohub.id / berkah123');

    // ==================== TENANT 3: SINAR REJEKI MOTOR (DEMO/TRIAL) ====================
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);

    const tenant3 = await prisma.tenant.upsert({
        where: { slug: 'sinar-rejeki-motor' },
        update: {
            subscriptionStatus: 'TRIAL',
            planTier: 'DEMO',
        },
        create: {
            name: 'Sinar Rejeki Motor',
            slug: 'sinar-rejeki-motor',
            planTier: 'DEMO',
            subscriptionStatus: 'TRIAL',
            monthlyBill: 0,
            address: 'Jl. Raya Darmo No. 123, Surabaya, Jawa Timur 60241',
            phone: '03112345678',
            email: 'sinarrejeki@otohub.id',
            autoRenew: false,
            trialEndsAt: trialEnd,
            subscriptionStartedAt: trialStart,
        }
    });

    const sinarPassword = await bcrypt.hash('sinar123', 10);
    await prisma.user.upsert({
        where: { email: 'sinarrejeki@otohub.id' },
        update: { password: sinarPassword },
        create: {
            email: 'sinarrejeki@otohub.id',
            username: 'sinarrejeki',
            password: sinarPassword,
            name: 'Eko Prasetyo',
            role: 'OWNER',
            tenantId: tenant3.id,
            phone: '081234500003',
            address: 'Jl. Tunjungan No. 45, Surabaya',
            language: 'id',
            isVerified: true,
            onboardingCompleted: true,
            birthDate: new Date('1988-11-05'),
        }
    });

    console.log('✅ Tenant 3: Sinar Rejeki Motor (DEMO/TRIAL)');
    console.log('   Owner   : sinarrejeki@otohub.id / sinar123');

    // ==================== DEMO TENANT (existing) ====================
    const demoTenant = await prisma.tenant.upsert({
        where: { slug: 'demo-dealer' },
        update: {},
        create: {
            name: 'Demo Dealer',
            slug: 'demo-dealer',
            planTier: 'PRO',
            subscriptionStatus: 'ACTIVE',
            monthlyBill: 2500000,
            address: 'Jl. Demo No. 123, Jakarta',
            phone: '02100000000',
            email: 'demo@otohub.id',
            subscriptionStartedAt: new Date('2025-10-01'),
            subscriptionEndsAt: new Date('2026-04-01'),
            nextBillingDate: new Date('2026-04-01'),
        }
    });

    const demoPassword = await bcrypt.hash('demo123', 10);
    await prisma.user.upsert({
        where: { email: 'demo@otohub.id' },
        update: { password: demoPassword },
        create: {
            email: 'demo@otohub.id',
            username: 'demo',
            password: demoPassword,
            name: 'Demo Owner',
            role: 'OWNER',
            tenantId: demoTenant.id,
            phone: '081234567890',
            language: 'id',
            isVerified: true,
            onboardingCompleted: true
        }
    });

    // Invoice for Demo (PAID)
    await (prisma as any).systemInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-003' },
        update: {},
        create: {
            tenantId: demoTenant.id,
            invoiceNumber: 'INV-2026-003',
            amount: 2500000,
            date: new Date('2026-01-01'),
            dueDate: new Date('2026-01-15'),
            status: 'PAID',
            items: JSON.stringify([
                { description: 'Langganan Plan PRO - Januari 2026', amount: 2500000 }
            ]),
        }
    });

    console.log('✅ Demo Tenant: demo@otohub.id / demo123');

    // ==================== ACTIVITY LOGS ====================
    await (prisma as any).adminActivityLog.createMany({
        data: [
            {
                userId: superadmin.id,
                userEmail: 'superadmin@otohub.id',
                action: 'TENANT_CREATE',
                entityType: 'TENANT',
                entityId: tenant1.id,
                entityName: 'Jaya Motor Bandung',
            },
            {
                userId: superadmin.id,
                userEmail: 'superadmin@otohub.id',
                action: 'INVOICE_CREATE',
                entityType: 'INVOICE',
                entityName: 'INV-2026-001',
                details: JSON.stringify({ tenantName: 'Jaya Motor Bandung', amount: 2500000 }),
            },
            {
                userId: superadmin.id,
                userEmail: 'superadmin@otohub.id',
                action: 'INVOICE_APPROVE',
                entityType: 'INVOICE',
                entityName: 'INV-2026-001',
            },
        ],
        skipDuplicates: true,
    });

    console.log('✅ Activity logs created');
    console.log('');
    console.log('🚀 Seeding complete!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Superadmin : superadmin@otohub.id / superadmin123');
    console.log('   Demo Owner : demo@otohub.id / demo123');
    console.log('   Jaya Motor : jayamotor@otohub.id / jaya123');
    console.log('   Berkah Auto: berkah@otohub.id / berkah123');
    console.log('   Sinar Rejeki: sinarrejeki@otohub.id / sinar123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
