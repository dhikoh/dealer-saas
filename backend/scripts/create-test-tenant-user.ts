
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Creating Test Tenant & User...');

    const email = `test.tenant.${Date.now()}@example.com`;
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Test Tenant Pagination',
            slug: `test-tenant-${Date.now()}`,
            address: '123 Test St',
            phone: '08123456789',
            planTier: 'plan-pro',
        },
    });
    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

    // 2. Create User
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: 'Test User',
            username: `testuser_${Date.now()}`,
            role: 'OWNER',
            tenantId: tenant.id,
            isVerified: true,
            onboardingCompleted: true,
        },
    });
    console.log(`✅ User created: ${user.email} (${user.id})`);
    console.log(`🔑 Password: ${password}`);

    // 3. Create Dummy Vehicles
    console.log('🚗 Creating Dummy Vehicles...');
    const vehiclesData = Array.from({ length: 15 }).map((_, i) => ({
        tenantId: tenant.id,
        category: 'CAR',
        make: 'Toyota',
        model: 'Avanza',
        year: 2020 + i,
        color: 'Black',
        price: 100000000 + (i * 1000000),
        status: 'AVAILABLE',
        condition: 'READY',
    }));

    await prisma.vehicle.createMany({
        data: vehiclesData,
    });
    console.log(`✅ ${vehiclesData.length} dummy vehicles created.`);

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
