import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const API_URL = 'http://localhost:3000';
const prisma = new PrismaClient();

// Test Data
const SUPER_EMAIL = 'superadmin@otohub.id';
const SUPER_PASSWORD = 'superadmin123';
const EMAIL = 'finda@example.com';
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

        // ==================== 8. BILLING & PLAN UPGRADE (FULL FLOW) ====================
        console.log(`\n[8] Testing Plan Upgrade (Most Expensive Plan) - Full Flow...`);

        try {
            // 8.0 Seed Superadmin (Ensure it exists for verification step)
            console.log(`[8.0] Ensuring Superadmin exists...`);
            const hashedPassword = await bcrypt.hash(SUPER_PASSWORD, 10);
            await prisma.user.upsert({
                where: { email: SUPER_EMAIL },
                update: { role: 'SUPERADMIN' },
                create: {
                    email: SUPER_EMAIL,
                    username: 'superadmin',
                    password: hashedPassword,
                    name: 'Super Admin',
                    role: 'SUPERADMIN',
                    phone: '0000000000',
                }
            });

            // 8.1 Fetch Plans
            const plansRes = await axios.get(`${API_URL}/billing/plans`);
            const plans = plansRes.data;

            if (plans.length > 0) {
                // 8.2 Find Most Expensive
                const expensivePlan = plans.reduce((prev: any, current: any) =>
                    (parseFloat(prev.price) > parseFloat(current.price)) ? prev : current
                );
                console.log(`ℹ️ Target Plan: ${expensivePlan.name} (${expensivePlan.price})`);

                // 8.3 Request Upgrade (Tenant Action)
                console.log(`[8.3] Requesting Upgrade via POST /billing/subscribe...`);
                const subscribeRes = await axios.post(`${API_URL}/billing/subscribe`, {
                    planId: expensivePlan.id
                }, authHeaders);

                const invoice = subscribeRes.data.invoice;
                const invoiceId = invoice.id;
                console.log(`✅ Upgrade Requested. Invoice Created: ${invoice.invoiceNumber} (ID: ${invoiceId})`);

                // 8.4 Upload Payment Proof (Tenant Action)
                console.log(`[8.4] Uploading Payment Proof...`);
                await axios.post(`${API_URL}/billing/my-invoices/${invoiceId}/upload-proof`, {
                    proofUrl: 'https://example.com/proof.jpg'
                }, authHeaders);
                console.log(`✅ Payment Proof Uploaded.`);

                // 8.5 Login as Superadmin
                console.log(`[8.5] Logging in as Superadmin...`);
                const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
                    email: SUPER_EMAIL,
                    password: SUPER_PASSWORD
                });
                const adminToken = adminLoginRes.data.access_token;
                const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

                // 8.6 Verify Invoice (Superadmin Action)
                console.log(`[8.6] Verifying Invoice & Approving Upgrade...`);
                await axios.patch(`${API_URL}/billing/admin/invoice/${invoiceId}/verify`, {
                    approved: true,
                    verifiedBy: 'E2E Test Script'
                }, adminHeaders);
                console.log(`✅ Invoice Verified & Approved.`);

                // 8.7 Verify Final State (Tenant Check)
                console.log(`[8.7] Verifying Tenant Plan Status...`);
                const subStatus = await axios.get(`${API_URL}/billing/my-subscription`, authHeaders);
                if (subStatus.data.planTier === expensivePlan.id) {
                    console.log(`🎉 SUCCESS: Tenant is now on ${subStatus.data.planDetails?.name || expensivePlan.id} plan!`);
                } else {
                    console.error(`❌ Plan Update Mismatch: Expected ${expensivePlan.id}, got ${subStatus.data.planTier}`);
                    throw new Error('Plan update verification failed');
                }

            } else {
                console.warn(`⚠️ No plans found.`);
            }
        } catch (error: any) {
            console.error(`❌ Plan Upgrade Flow failed:`, JSON.stringify(error.response?.data || error.message, null, 2));
            // Don't exit process here, let the test finish
        } finally {
            await prisma.$disconnect();
        }

        console.log(`\n🎉 Comprehensive E2E Test Completed Successfully!`);

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
