import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Plans...');

    const plans = [
        {
            name: 'Basic',
            slug: 'basic',
            description: 'Untuk dealer kecil yang baru memulai.',
            price: 500000,
            currency: 'IDR',
            maxVehicles: 20,
            maxUsers: 2,
            maxBranches: 1,
            canCreateGroup: false,
            maxGroupMembers: 0,
            features: {
                api: false,
                support: 'standard',
                whiteLabel: false,
            },
        },
        {
            name: 'Pro',
            slug: 'pro',
            description: 'Untuk dealer berkembang dengan tim sales.',
            price: 1500000,
            currency: 'IDR',
            maxVehicles: 100,
            maxUsers: 5,
            maxBranches: 2,
            canCreateGroup: false,
            maxGroupMembers: 0,
            features: {
                api: true,
                support: 'priority',
                whiteLabel: false,
            },
        },
        {
            name: 'Enterprise',
            slug: 'enterprise',
            description: 'Solusi lengkap untuk grup dealer besar.',
            price: 5000000,
            currency: 'IDR',
            maxVehicles: 9999,
            maxUsers: 50,
            maxBranches: 10,
            canCreateGroup: true,
            maxGroupMembers: 20,
            features: {
                api: true,
                support: 'dedicated',
                whiteLabel: true,
            },
        },
    ];

    for (const plan of plans) {
        const upsertedPlan = await prisma.plan.upsert({
            where: { slug: plan.slug },
            update: plan,
            create: plan,
        });
        console.log(`  Included plan: ${upsertedPlan.name}`);
    }

    console.log('✅ Plans seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
