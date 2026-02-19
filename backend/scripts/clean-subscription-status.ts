
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env loader
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    console.log('📄 Loading .env from', envPath);
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^"|"$/g, '');
        }
    });
} else {
    console.warn('⚠️ .env not found at', envPath);
}

const prisma = new PrismaClient();

async function main() {
    console.log('🛡️ Starting Subscription Status Cleaning (Safe Mode)...');

    // 1. Map PENDING/EXPIRED to GRACE
    const graceUpdate = await prisma.tenant.updateMany({
        where: {
            subscriptionStatus: {
                in: ['PENDING_PAYMENT', 'PENDING_RENEWAL', 'EXPIRED']
            }
        },
        data: {
            subscriptionStatus: 'GRACE'
        }
    });
    console.log(`✅ Converted to GRACE: ${graceUpdate.count} tenants`);

    // 2. Map Unknown/Invalid to SUSPENDED (Fail Safe)
    // We want to update everything that is NOT in the allowed list 
    // (ACTIVE, TRIAL, GRACE, SUSPENDED, CANCELLED)
    // Note: Since 'GRACE' was just set, it is now valid.
    const suspendedUpdate = await prisma.tenant.updateMany({
        where: {
            subscriptionStatus: {
                notIn: ['ACTIVE', 'TRIAL', 'GRACE', 'SUSPENDED', 'CANCELLED']
            }
        },
        data: {
            subscriptionStatus: 'SUSPENDED'
        }
    });
    console.log(`✅ Converted to SUSPENDED: ${suspendedUpdate.count} tenants`);

    // 3. Verify
    const statusCounts = await prisma.tenant.groupBy({
        by: ['subscriptionStatus'],
        _count: true
    });
    console.log('🔎 Status Counts:', statusCounts);
}

main()
    .catch((e) => {
        console.error('❌ Cleaning Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
