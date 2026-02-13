import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ==================== 1. SEED PLANS ====================
    const plans = [
        {
            id: 'plan-demo',
            name: 'Demo',
            slug: 'demo',
            description: 'Gratis 14 hari untuk mencoba semua fitur dasar',
            price: 0,
            currency: 'IDR',
            maxVehicles: 10,
            maxUsers: 2,
            maxBranches: 1,
            canCreateGroup: false,
            maxGroupMembers: 0,
            features: {
                maxVehicles: 10,
                maxUsers: 2,
                multiLanguage: false,
                blacklistAccess: false,
                whatsappIntegration: false,
                prioritySupport: false,
            },
        },
        {
            id: 'plan-pro',
            name: 'Professional',
            slug: 'pro',
            description: 'Untuk dealer skala menengah dengan fitur lengkap',
            price: 199000,
            currency: 'IDR',
            maxVehicles: 100,
            maxUsers: 10,
            maxBranches: 3,
            canCreateGroup: false,
            maxGroupMembers: 0,
            features: {
                maxVehicles: 100,
                maxUsers: 10,
                multiLanguage: true,
                blacklistAccess: true,
                whatsappIntegration: true,
                prioritySupport: false,
            },
        },
        {
            id: 'plan-enterprise',
            name: 'Enterprise',
            slug: 'enterprise',
            description: 'Solusi lengkap untuk jaringan dealer besar',
            price: 499000,
            currency: 'IDR',
            maxVehicles: -1, // Unlimited
            maxUsers: -1,     // Unlimited
            maxBranches: 10,
            canCreateGroup: true,
            maxGroupMembers: 50,
            features: {
                maxVehicles: -1,
                maxUsers: -1,
                multiLanguage: true,
                blacklistAccess: true,
                whatsappIntegration: true,
                prioritySupport: true,
            },
        },
    ];

    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { slug: plan.slug },
            update: {
                name: plan.name,
                description: plan.description,
                price: plan.price,
                currency: plan.currency,
                maxVehicles: plan.maxVehicles,
                maxUsers: plan.maxUsers,
                maxBranches: plan.maxBranches,
                canCreateGroup: plan.canCreateGroup,
                maxGroupMembers: plan.maxGroupMembers,
                features: plan.features,
            },
            create: plan,
        });
        console.log(`  ✅ Plan "${plan.name}" seeded`);
    }

    // ==================== 2. SEED LANDING PAGE CONTENT ====================
    await prisma.landingPageContent.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            hero: {
                title: 'Kelola Dealer Mobil Bekas Anda dengan Mudah',
                subtitle:
                    'Platform SaaS all-in-one untuk manajemen inventaris, transaksi, kredit, dan pelanggan dealer kendaraan bekas.',
                ctaText: 'Mulai Gratis',
                ctaLink: '/auth?mode=register',
                bgImage: '',
            },
            features: [
                {
                    icon: 'Car',
                    title: 'Manajemen Inventaris',
                    description:
                        'Kelola stok kendaraan dengan foto, dokumen, dan riwayat biaya lengkap.',
                },
                {
                    icon: 'BarChart3',
                    title: 'Dashboard Analytics',
                    description:
                        'Pantau penjualan, profit, dan performa bisnis secara real-time.',
                    badge: 'POPULER',
                },
                {
                    icon: 'Users',
                    title: 'CRM Pelanggan',
                    description:
                        'Kelola data pelanggan, lead, dan pipeline penjualan dalam satu tempat.',
                },
                {
                    icon: 'Shield',
                    title: 'Blacklist Nasional',
                    description:
                        'Cek riwayat pelanggan bermasalah lintas dealer untuk keamanan transaksi.',
                },
                {
                    icon: 'Zap',
                    title: 'Kredit & Cicilan',
                    description:
                        'Kelola kredit internal dan leasing dengan tracking pembayaran otomatis.',
                },
                {
                    icon: 'Globe',
                    title: 'Multi Cabang & Grup',
                    description:
                        'Jalankan bisnis multi-cabang dan jaringan dealer dari satu platform.',
                    badge: 'ENTERPRISE',
                },
            ],
            pricing: [],
            faq: [
                {
                    question: 'Apakah OTOHUB gratis?',
                    answer:
                        'Ya, kami menyediakan paket Demo gratis selama 14 hari tanpa kartu kredit. Anda bisa mencoba semua fitur dasar.',
                },
                {
                    question: 'Berapa banyak kendaraan yang bisa saya kelola?',
                    answer:
                        'Tergantung paket Anda. Paket Demo mendukung 10 kendaraan, Pro 100 kendaraan, dan Enterprise unlimited.',
                },
                {
                    question: 'Apakah data saya aman?',
                    answer:
                        'Tentu. Kami menggunakan enkripsi SSL, isolasi tenant, dan backup data berkala untuk keamanan maksimal.',
                },
                {
                    question: 'Bisakah saya menggunakan OTOHUB dari HP?',
                    answer:
                        'Ya, OTOHUB didesain responsive dan bisa diakses dari browser HP manapun. Kami juga menyediakan aplikasi mobile (coming soon).',
                },
                {
                    question: 'Bagaimana cara upgrade paket?',
                    answer:
                        'Anda bisa upgrade kapan saja dari menu Billing di dashboard. Perubahan berlaku langsung tanpa downtime.',
                },
            ],
            footer: {
                copyright: '© 2026 OTOHUB. All rights reserved.',
                links: [
                    { label: 'Syarat & Ketentuan', url: '#' },
                    { label: 'Kebijakan Privasi', url: '#' },
                    { label: 'Hubungi Kami', url: 'mailto:support@modula.click' },
                ],
                socials: [
                    { platform: 'whatsapp', url: 'https://wa.me/6281234567890' },
                    { platform: 'instagram', url: 'https://instagram.com/otohub' },
                ],
            },
        },
    });
    console.log('  ✅ Landing Page Content seeded');

    console.log('🌱 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
