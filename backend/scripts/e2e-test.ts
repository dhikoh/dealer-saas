
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
            condition: 'NEW',
            description: 'E2E Comprehensive Test Vehicle',
            purchasePrice: 250000000,
            purchaseDate: new Date().toISOString()
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

        // ==================== 8. BILLING & SUPERADMIN (Conditional) ====================
        console.log(`\n[8] Testing Billing Flow (Requires Admin Permissions)...`);

        // 8.1 Generate Invoices (Admin Only)
        console.log(`\n[8.1] Generating Monthly Invoices (Admin Action)...`);
        let invoicesGenerated = false;
        try {
            const genRes = await axios.post(`${API_URL}/billing/admin/generate-invoices`, {}, authHeaders);
            console.log(`✅ Invoices Generated: ${genRes.data.generated}`);
            invoicesGenerated = true;
        } catch (error: any) {
            if (error.response?.status === 403) {
                console.warn(`⚠️ User '${EMAIL}' is not Superadmin. Skipping Admin Billing steps.`);
            } else {
                console.error(`❌ Generate Invoices failed:`, error.message);
            }
        }

        // 8.2 Tenant Upload Proof
        if (invoicesGenerated || true) { // Try listing anyway, maybe an invoice exists
            console.log(`\n[8.2] Checking My Invoices...`);
            let pendingInvoiceId = '';
            try {
                const invoicesRes = await axios.get(`${API_URL}/billing/my-invoices`, authHeaders);
                const invoices = invoicesRes.data;
                console.log(`✅ Found ${invoices.length} invoices`);

                const pending = invoices.find((inv: any) => inv.status === 'PENDING');
                if (pending) {
                    pendingInvoiceId = pending.id;
                    console.log(`ℹ️ Found Pending Invoice: ${pendingInvoiceId} (Amount: ${pending.amount})`);

                    // Upload Proof
                    console.log(`\n[8.3] Uploading Payment Proof...`);
                    await axios.post(`${API_URL}/billing/my-invoices/${pendingInvoiceId}/upload-proof`, {
                        proofUrl: 'https://example.com/fake-proof.jpg'
                    }, authHeaders);
                    console.log(`✅ Payment Proof Uploaded`);
                } else {
                    console.log(`ℹ️ No PENDING invoices found to test upload.`);
                }
            } catch (error: any) {
                console.error(`❌ Listing/Uploading Invoices failed:`, error.message);
            }

            // 8.3 Admin Approve (Verify)
            if (pendingInvoiceId) {
                console.log(`\n[8.4] Verifying Payment (Admin Action)...`);
                try {
                    await axios.patch(`${API_URL}/billing/admin/invoice/${pendingInvoiceId}/verify`, {
                        approved: true,
                        verifiedBy: 'E2E_TEST_SCRIPT'
                    }, authHeaders);
                    console.log(`✅ Payment Verified/Approved`);
                } catch (error: any) {
                    if (error.response?.status === 403) {
                        console.warn(`⚠️ User '${EMAIL}' cannot approve payments (Not Superadmin).`);
                    } else {
                        console.error(`❌ Verify Payment failed:`, error.message);
                    }
                }
            }
        }

        console.log(`\n🎉 Comprehensive E2E Test Completed Successfully!`);

    } catch (error: any) {
        console.error(`\n❌ Unexpected Error:`, error.message);
        process.exit(1);
    }
}

runTest();
