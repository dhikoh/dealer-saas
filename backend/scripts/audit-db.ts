import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function audit() {
    console.log('🔍 Starting Database Connectivity Audit...');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is not defined in environment');
        return;
    }

    // Mask Password
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
    console.log(`📌 DATABASE_URL: ${maskedUrl}`);

    // Check Host (Local vs Container)
    if (dbUrl.includes('localhost')) {
        console.log('🏠 Target: Localhost');
    } else if (dbUrl.includes('postgres')) {
        console.log('🐳 Target: Docker Container (?)');
    } else {
        console.log('🌐 Target: Remote/Other');
    }

    const prisma = new PrismaClient();
    try {
        console.log('⏳ Attempting to connect...');
        await prisma.$connect();
        console.log('✅ Connection Successful!');

        console.log('⏳ Checking User Count...');
        const userCount = await prisma.user.count();
        console.log(`📊 Total Users: ${userCount}`);

    } catch (e: any) {
        console.error('❌ Connectivity Check Failed:', e.message);
        if (e.code) console.error('   Error Code:', e.code);
    } finally {
        await prisma.$disconnect();
    }
}

audit().catch(console.error);
