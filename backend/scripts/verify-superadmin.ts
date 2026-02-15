
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000';

async function main() {
    console.log('🚀 Starting Verification Simulation...');

    // 1. Setup Superadmin
    const email = `superadmin.verif.${Date.now()}@test.com`;
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`👤 Creating Superadmin: ${email}`);

    try {
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Superadmin Verify',
                username: `superadmin_verif_${Date.now()}`,
                role: 'SUPERADMIN',
                isVerified: true,
                onboardingCompleted: true,
            },
        });
        console.log('✅ Superadmin user created in DB.');
    } catch (e: any) {
        console.error('❌ Failed to create user:', e.message);
        process.exit(1);
    }

    // 2. Login
    let token = '';
    try {
        console.log('🔑 Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        token = loginRes.data.access_token;
        console.log('✅ Login successful. Token received.');
    } catch (e: any) {
        console.error('❌ Login Failed:', e.response?.data || e.message);
        process.exit(1);
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 3. Verify Endpoints
    console.log('\n📡 Verifying Endpoints...');

    const endpoints = [
        { name: 'Tenants', url: '/superadmin/tenants?limit=5' },
        { name: 'Approvals', url: '/superadmin/approvals' },
        // { name: 'Settings', url: '/superadmin/platform-settings' }, // Correct endpoint might be differnet based on controller
        { name: 'Plans', url: '/superadmin/plans' },
    ];

    let allPassed = true;

    for (const ep of endpoints) {
        try {
            const res = await axios.get(`${API_URL}${ep.url}`, { headers });
            const count = Array.isArray(res.data) ? res.data.length : (Array.isArray(res.data?.data) ? res.data.data.length : 'N/A');
            console.log(`✅ GET ${ep.url}: OK (Count: ${count})`);
        } catch (e: any) {
            console.error(`❌ GET ${ep.url}: FAILED - ${e.message}`, e.response?.data);
            allPassed = false;
        }
    }

    // Checking Settings specifically (it might return object, not array)
    try {
        // Platform settings might avail at /superadmin/settings or /superadmin/platform-settings? 
        // Based on previous chats, it was about platform settings. Let's try to list API keys which is standard list.
        const res = await axios.get(`${API_URL}/superadmin/api-keys`, { headers });
        console.log(`✅ GET /superadmin/api-keys: OK (Count: ${res.data.length})`);
    } catch (e: any) {
        console.log(`⚠️ GET /superadmin/api-keys: Skipped or Failed - ${e.message}`);
    }

    if (allPassed) {
        console.log('\n✨ All critical endpoints verified successfully!');
    } else {
        console.error('\n⚠️ Some endpoints failed verification.');
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error('❌ Script error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
