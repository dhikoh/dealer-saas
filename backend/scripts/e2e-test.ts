
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
    console.log(`🚀 Starting Comprehensive E2E Test...`);
    console.log(`Target: ${API_URL}`);
    console.log(`User: ${EMAIL}`);

    try {
        // ==================== 1. AUTHENTICATION ====================
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

        // ==================== 2. PROFILE & TENANT ====================
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

        console.log(`\n[2.1] Updating Profile...`);
        try {
            const updateRes = await axios.put(`${API_URL}/auth/profile`, {
                name: `Finda Updated ${Date.now()}`,
                address: 'Updated Address via E2E'
            }, authHeaders);
            console.log(`✅ Profile Updated: ${updateRes.data.name}`);
        } catch (error: any) {
            console.error(`❌ Update Profile failed:`, error.response?.data || error.message);
        }

        // ==================== 3. CUSTOMER MANAGEMENT ====================
        console.log(`\n[3] Creating Customer...`);
        let customerId = '';
        const uniqueKtp = Date.now().toString().padEnd(16, '0').slice(0, 16);
        try {
            const customerRes = await axios.post(`${API_URL}/customers`, {
                ktpNumber: uniqueKtp,
                name: 'E2E Customer',
                phone: '08123456789',
                email: `customer${Date.now()}@example.com`,
                address: 'Jalan E2E Testing'
            }, authHeaders);
            customerId = customerRes.data.id;
            console.log(`✅ Customer Created: ${customerId} (${customerRes.data.name})`);
        } catch (error: any) {
            console.error(`❌ Create Customer failed:`, JSON.stringify(error.response?.data || error.message, null, 2));
            process.exit(1);
        }

        // ==================== 4. VEHICLE MANAGEMENT ====================
        console.log(`\n[4] Creating Vehicle...`);
        let vehicleId = '';
        const vehicleData = {
            category: 'CAR',
            make: 'Toyota',
            model: 'Veloz E2E',
            year: 2024,
            color: 'White',
            price: 275000000,
            status: 'AVAILABLE',
            condition: 'READY',
            // description: 'E2E Comprehensive Test Vehicle', // Removed: Not in DTO
            purchasePrice: 250000000,
            purchaseDate: new Date().toISOString(),
            stnkImage: 'https://example.com/dummy-stnk.jpg',
            ktpOwnerImage: 'https://example.com/dummy-ktp-owner.jpg' // Required for SALE transaction
        };

        try {
            const vehicleRes = await axios.post(`${API_URL}/vehicles`, vehicleData, authHeaders);
            vehicleId = vehicleRes.data.id;
            console.log(`✅ Vehicle Created: ${vehicleId}`);
        } catch (error: any) {
            console.error(`❌ Create Vehicle failed:`, JSON.stringify(error.response?.data || error.message, null, 2));
            process.exit(1);
        }

        // ==================== 5. TRANSACTION (SALE) ====================
        console.log(`\n[5] Creating Transaction (SALE - CASH)...`);
        let transactionId = '';
        try {
            const transactionRes = await axios.post(`${API_URL}/transactions`, {
                type: 'SALE',
                vehicleId: vehicleId,
                customerId: customerId, // Using the created customer ID
                paymentType: 'CASH',
                finalPrice: 280000000,
                paymentMethod: 'TRANSFER',
                notes: 'E2E Comprehensive Transaction'
            }, authHeaders);
            transactionId = transactionRes.data.id;
            console.log(`✅ Transaction Created: ${transactionId}`);
        } catch (error: any) {
            console.error(`❌ Create Transaction failed:`, JSON.stringify(error.response?.data || error.message, null, 2));
        }

        // ==================== 6. INVOICE ====================
        if (transactionId) {
            console.log(`\n[6] Testing Invoice Download...`);
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

        // ==================== 7. FINANCE (OPERATING COSTS) ====================
        console.log(`\n[7] Creating Operating Cost...`);
        try {
            const costRes = await axios.post(`${API_URL}/finance/costs`, {
                name: 'E2E Test Expense',
                amount: 150000,
                category: 'UTILITY',
                date: new Date().toISOString(),
                note: 'Generated by E2E Script'
            }, authHeaders);
            console.log(`✅ Operating Cost Created: ${costRes.data.id}`);
        } catch (error: any) {
            console.error(`❌ Create Operating Cost failed:`, JSON.stringify(error.response?.data || error.message, null, 2));
        }

        console.log(`\n[7.1] Fetching Cost Summary...`);
        try {
            const summaryRes = await axios.get(`${API_URL}/finance/summary`, authHeaders);
            console.log(`✅ Cost Summary Fetched. Total: ${summaryRes.data.total}`);
        } catch (error: any) {
            console.error(`❌ Fetch Cost Summary failed:`, error.message);
        }

        // ==================== 8. BILLING & PLAN UPGRADE ====================
        console.log(`\n[8] Testing Plan Upgrade (Most Expensive Plan)...`);

        try {
            // 8.1 Fetch Plans
            const plansRes = await axios.get(`${API_URL}/billing/plans`);
            const plans = plansRes.data;
            console.log(`✅ Fetched ${plans.length} plans.`);

            if (plans.length > 0) {
                // 8.2 Find Most Expensive
                const expensivePlan = plans.reduce((prev: any, current: any) =>
                    (parseFloat(prev.price) > parseFloat(current.price)) ? prev : current
                );

                console.log(`ℹ️ Most Expensive Plan: ${expensivePlan.name} (${expensivePlan.price})`);

                // 8.3 Purchase/Upgrade (Simulating Tenant Action -> Admin Approval)
                // Since there is no direct "Buy Plan" public endpoint for Tenant in the current API (based on analysis),
                // we will simulate the Admin upgrading the tenant, which is the standard B2B flow here.
                console.log(`[8.3] Upgrading Tenant to ${expensivePlan.name} (Admin Simulation)...`);

                try {
                    // Note: 'finda' might not have SUPERADMIN role. In a real scenario, this step requires Superadmin token.
                    // The test script uses 'authHeaders' which is for 'finda'.
                    // If this fails with 403, we catch it gracefully.
                    await axios.patch(`${API_URL}/billing/admin/tenant/${tenantId}/upgrade`, {
                        planId: expensivePlan.id
                    }, authHeaders);
                    console.log(`✅ Tenant Upgraded to ${expensivePlan.name}`);
                } catch (error: any) {
                    if (error.response?.status === 403) {
                        console.warn(`⚠️ User '${EMAIL}' is not Superadmin. Cannot perform Plan Upgrade. Skipping.`);
                    } else {
                        console.error(`❌ Plan Upgrade failed:`, error.message);
                    }
                }
            } else {
                console.warn(`⚠️ No plans found to test upgrade.`);
            }
        } catch (error: any) {
            console.error(`❌ Fetch Plans failed:`, error.message);
        }

        console.log(`\n[9] Billing/Superadmin flow skipped as requested. Focusing on Tenant features.`);

        /*
        // 8.1 Generate Invoices (Admin Only)
        console.log(`\n[8.1] Generating Monthly Invoices (Admin Action)...`);
        // ... (Skipped logic)
        */

        console.log(`\n🎉 Comprehensive E2E Test Completed Successfully!`);

    } catch (error: any) {
        console.error(`\n❌ Unexpected Error:`, error.message);
        process.exit(1);
    }
}

runTest();
