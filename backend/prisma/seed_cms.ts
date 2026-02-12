import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding CMS Content...');

    const defaultContent = {
        id: 'default',
        hero: {
            title: "Kelola Dealer Mobil & Motor Bekas Anda",
            subtitle: "Solusi lengkap pencatatan stok, penjualan, dan laporan keuangan dalam satu aplikasi.",
            ctaText: "Mulai Gratis Sekarang",
            ctaLink: "/auth?mode=register",
            bgImage: "/assets/hero-bg.jpg"
        },
        features: [
            {
                icon: "Car",
                title: "Manajemen Stok",
                description: "Catat detail kendaraan, foto, dan status availability dengan mudah."
            },
            {
                icon: "BarChart3",
                title: "Laporan Keuangan",
                description: "Otomatisasi laporan laba rugi dan arus kas harian."
            },
            {
                icon: "Users",
                title: "Manajemen Pelanggan",
                description: "Simpan database pelanggan dan riwayat transaksi mereka."
            }
        ],
        pricing: [],
        faq: [
            {
                question: "Apakah ada biaya bulanan?",
                answer: "Kami menawarkan paket gratis dan berbayar sesuai kebutuhan dealer Anda."
            },
            {
                question: "Bisakah saya membatalkan kapan saja?",
                answer: "Ya, Anda bisa berhenti berlangganan kapan saja tanpa denda."
            }
        ],
        footer: {
            copyright: "© 2024 OTOHUB. All rights reserved.",
            links: [
                { label: "Tentang Kami", url: "/about" },
                { label: "Syarat & Ketentuan", url: "/terms" }
            ],
            socials: []
        }
    };

    await prisma.landingPageContent.upsert({
        where: { id: 'default' },
        update: defaultContent,
        create: defaultContent,
    });

    console.log('✅ CMS Content Seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
