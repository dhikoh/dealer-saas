import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('Using database:', process.env.DATABASE_URL);
    console.log('Clearing mock data...');

    await prisma.activityLog.deleteMany({});
    await prisma.systemInvoice.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.creditPayment.deleteMany({});
    await prisma.credit.deleteMany({});

    await prisma.$executeRaw`DELETE FROM "vehicle_costs"`;
    await prisma.$executeRaw`DELETE FROM "vehicle_images"`;
    await prisma.vehicle.deleteMany({});

    await prisma.$executeRaw`DELETE FROM "blacklist_entries"`;
    await prisma.customer.deleteMany({});

    console.log('Mock data deleted successfully.');
}

main()
    .catch(e => {
        console.error('Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
