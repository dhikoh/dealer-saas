import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const plans = [
        {
            name: 'Basic',
            slug: 'basic',
            price: 0,
            maxVehicles: 50,
            maxUsers: 3,
            maxBranches: 1,
            maxCustomers: 200,      // Typed column (canonical)
            maxGroupMembers: 0,
            canCreateGroup: false,
            features: { api: false, support: 'basic' }, // UI metadata only
        },
        {
            name: 'Pro',
            slug: 'pro',
            price: 500000,
            maxVehicles: 200,
            maxUsers: 10,
            maxBranches: 5,
            maxCustomers: 1000,     // Typed column (canonical)
            maxGroupMembers: 0,
            canCreateGroup: false,
            features: { api: true, support: 'priority' },
        },
        {
            name: 'Enterprise',
            slug: 'enterprise',
            price: 2000000,
            maxVehicles: -1,
            maxUsers: -1,
            maxBranches: -1,
            maxCustomers: -1,       // Unlimited
            maxGroupMembers: -1,
            canCreateGroup: true,
            features: { api: true, support: 'dedicated' },
        },
    ];

    console.log('Seeding Plans (idempotent)...');

    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { slug: plan.slug },
            create: plan,
            update: {
                // Only update limit columns
                maxVehicles: plan.maxVehicles,
                maxUsers: plan.maxUsers,
                maxBranches: plan.maxBranches,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore — maxCustomers column added in migration 20260219090000; client regenerated in Docker
                maxCustomers: plan.maxCustomers,
                maxGroupMembers: plan.maxGroupMembers,
                canCreateGroup: plan.canCreateGroup,
                features: plan.features,
            },
        });
        console.log(`  ✓ ${plan.name} (slug: ${plan.slug}) upserted.`);
    }

    console.log('Done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
