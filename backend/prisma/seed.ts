
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Seeding...');

    // 1. Seed Plans
    const plans = [
        {
            name: 'Basic',
            slug: 'basic',
            price: 299000,
            currency: 'IDR',
            description: 'Untuk dealer kecil yang baru merintis.',
            maxVehicles: 50,
            maxUsers: 3,
            maxBranches: 1,
            canCreateGroup: false,
            maxGroupMembers: 0,
            features: {
                maxVehicles: 50,
                maxUsers: 3,
                maxCustomers: 100,
                maxBranches: 1,
                pdfExport: true,
                internalReports: true,
                blacklistAccess: false,
                reminderNotifications: true,
                multiLanguage: true,
                prioritySupport: false,
                apiAccess: false,
                customBranding: false,
                advancedAnalytics: false,
                dataExport: false,
                whatsappIntegration: false,
            },
        },
        {
            name: 'Pro',
            slug: 'pro',
            price: 599000,
            currency: 'IDR',
            description: 'Terbaik untuk dealer yang sedang berkembang.',
            maxVehicles: 200,
            maxUsers: 10,
            maxBranches: 3,
            canCreateGroup: false,
            maxGroupMembers: 0,
            features: {
                maxVehicles: 200,
                maxUsers: 10,
                maxCustomers: 500,
                maxBranches: 3,
                pdfExport: true,
                internalReports: true,
                blacklistAccess: true,
                reminderNotifications: true,
                multiLanguage: true,
                prioritySupport: true,
                apiAccess: false,
                customBranding: true,
                advancedAnalytics: true,
                dataExport: true,
                whatsappIntegration: true,
            },
        },
        {
            name: 'Enterprise',
            slug: 'enterprise',
            price: 1499000,
            currency: 'IDR',
            description: 'Solusi lengkap untuk dealer group & korporasi.',
            maxVehicles: -1, // Unlimited
            maxUsers: -1,
            maxBranches: -1,
            canCreateGroup: true,
            maxGroupMembers: 10,
            features: {
                maxVehicles: -1,
                maxUsers: -1,
                maxCustomers: -1,
                maxBranches: -1,
                pdfExport: true,
                internalReports: true,
                blacklistAccess: true,
                reminderNotifications: true,
                multiLanguage: true,
                prioritySupport: true,
                apiAccess: true,
                customBranding: true,
                advancedAnalytics: true,
                dataExport: true,
                whatsappIntegration: true,
            },
        },
    ];

    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { slug: plan.slug },
            update: plan,
            create: plan,
        });
        console.log(`  ✅ Plan Upserted: ${plan.name}`);
    }

    // 2. Seed Landing Page Content
    const defaultContent = {
        hero: {
            title: 'Kelola Bisnis Mobil Bekas Anda',
            subtitle: 'Platform SaaS all-in-one untuk dealer mobil bekas. Inventaris, transaksi, customer, laporan keuangan — semua dalam satu dashboard modern.',
            ctaText: 'Mulai Gratis',
            ctaLink: '/auth?mode=register',
            bgImage: '/images/hero-bg.jpg', // Placeholder
        },
        features: [
            {
                icon: 'Car',
                title: 'Manajemen Inventaris',
                description: 'Kelola stok kendaraan dengan foto, spesifikasi, kondisi, dan harga. Dilengkapi filter dan pencarian cepat.',
            },
            {
                icon: 'Users',
                title: 'Database Customer',
                description: 'Simpan data pelanggan, riwayat pembelian, dan follow-up otomatis untuk repeat customer.',
            },
            {
                icon: 'BarChart3',
                title: 'Laporan & Statistik',
                description: 'Dashboard real-time untuk penjualan, revenue, dan performa bisnis Anda.',
            },
            {
                icon: 'Shield',
                title: 'Multi-User & Role',
                description: 'Tambahkan tim sales dengan akses berbeda. Owner dan Staff memiliki permission terpisah.',
            },
            {
                icon: 'Zap',
                title: 'Simulasi Kredit',
                description: 'Hitung angsuran untuk berbagai tenor dan DP. Bagikan ke customer dalam hitungan detik.',
            },
            {
                icon: 'Globe',
                title: 'Multi-Cabang & Group',
                description: 'Kelola beberapa cabang dealer dalam satu akun. Laporan terpisah per cabang atau gabungan (Enterprise).',
                badge: 'PRO',
            },
        ],
        pricing: [], // Will fetch from Plan table
        faq: [
            {
                question: 'Apakah ada biaya tersembunyi?',
                answer: 'Tidak ada. Harga yang Anda lihat adalah harga yang Anda bayar. Pajak sudah termasuk.',
            },
            {
                question: 'Bisakah saya upgrade paker kapan saja?',
                answer: 'Ya, Anda bisa upgrade kapan saja melalui menu Billing di dashboard.',
            },
        ],
        footer: {
            copyright: '© 2026 OTOHUB. All rights reserved.',
            links: [
                { label: 'Kebijakan Privasi', url: '#' },
                { label: 'Syarat & Ketentuan', url: '#' },
                { label: 'Bantuan', url: '#' },
            ],
            socials: [
                { platform: 'Instagram', url: '#' },
                { platform: 'Facebook', url: '#' },
            ],
        },
    };

    await prisma.landingPageContent.upsert({
        where: { id: 'default' },
        update: defaultContent,
        create: {
            id: 'default',
            ...defaultContent,
        },
    });
    console.log('  ✅ Landing Page Content Upserted');

    console.log('🌱 Seeding Completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
