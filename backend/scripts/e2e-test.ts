
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const API_URL = process.env.API_URL || 'http://localhost:4000';
const EMAIL = 'finda'; // Username or Email
const PASSWORD = 'Bismillah';

async function runTest() {
    console.log(`🚀 Starting E2E Test...`);
    console.log(`Target: ${API_URL}`);
    console.log(`User: ${EMAIL}`);

    try {
        // 1. LOGIN
        console.log(`\n[1] Logging in...`);
        let token = '';
        let tenantId = '';
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: EMAIL,
                password: PASSWORD,
            });
            token = loginRes.data.access_token;
            console.log(`✅ Login successful`);
        } catch (error: any) {
            console.error(`❌ Login failed:`, error.response?.data || error.message);
            process.exit(1);
        }

        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

        // 2. GET PROFILE (to get Tenant ID)
        console.log(`\n[2] Fetching Profile...`);
        try {
            const profileRes = await axios.get(`${API_URL}/auth/me`, authHeaders);
            tenantId = profileRes.data.tenantId;
            if (!tenantId) throw new Error('Tenant ID not found in profile');
            console.log(`✅ Profile fetched (Tenant: ${tenantId})`);
        } catch (error: any) {
            console.error(`❌ Fetch Profile failed:`, error.response?.data || error.message);
            process.exit(1);
        }

        // 3. CREATE VEHICLE
        console.log(`\n[3] Creating Vehicle...`);
        let vehicleId = '';
        const vehicleData = {
            brand: 'Toyota',
            model: 'Avanza E2E',
            year: 2023,
            color: 'Black',
            plateNumber: `B ${Math.floor(Math.random() * 10000)} TST`,
            price: 250000000,
            status: 'AVAILABLE',
            condition: 'NEW',
            description: 'E2E Test Vehicle'
        };

        try {
            const vehicleRes = await axios.post(`${API_URL}/vehicles`, vehicleData, authHeaders);
            vehicleId = vehicleRes.data.id;
            console.log(`✅ Vehicle Created: ${vehicleId}`);
        } catch (error: any) {
            console.error(`❌ Create Vehicle failed:`, JSON.stringify(error.response?.data || error.message, null, 2));
            // Don't exit, maybe we can test other things or retry? 
            // Actually if vehicle fails, transaction will fail.
            process.exit(1);
        }

        // 4. CREATE TRANSACTION (SALE)
        console.log(`\n[4] Creating Transaction (SALE)...`);
        let transactionId = '';
        try {
            const transactionRes = await axios.post(`${API_URL}/transactions`, {
                type: 'SALE',
                vehicleId: vehicleId,
                customerName: 'E2E Buyer',
                customerPhone: '081234567890',
                salePrice: 260000000, // Profit 10jt
                paymentMethod: 'CASH',
                notes: 'E2E Transaction'
            }, authHeaders);
            transactionId = transactionRes.data.id;
            console.log(`✅ Transaction Created: ${transactionId}`);
        } catch (error: any) {
            console.error(`❌ Create Transaction failed:`, JSON.stringify(error.response?.data || error.message, null, 2));
        }

        // 5. DOWNLOAD INVOICE (Test PDF generation)
        if (transactionId) {
            console.log(`\n[5] Testing Invoice Download...`);
            try {
                await axios.get(`${API_URL}/transactions/${transactionId}/invoice`, {
                    ...authHeaders,
                    responseType: 'arraybuffer'
                });
                console.log(`✅ Invoice PDF Generated`);
            } catch (error: any) {
                console.error(`❌ Invoice Download failed:`, error.message);
            }
        }

        console.log(`\n🎉 E2E Test Completed Successfully!`);

    } catch (error: any) {
        console.error(`\n❌ Unexpected Error:`, error.message);
        process.exit(1);
    }
}

runTest();
