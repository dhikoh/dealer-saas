import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Tenant E2E Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Clear all cookies and storage before each test to ensure a clean slate
        await page.context().clearCookies();
        await page.evaluate(() => window.localStorage.clear());
        await page.evaluate(() => window.sessionStorage.clear());
    });

    test('Complete flow: Login -> Add Customer -> Add Vehicle -> Sale Transaction', async ({ page }) => {
        const username = 'dhiko';
        const password = 'passwordBismillah@2017';

        // Use a static random string to make entities unique per test run
        const uniqueId = new Date().getTime().toString().slice(-6);
        const testCustomerName = `E2E Customer ${uniqueId}`;
        const testLicensePlate = `B ${uniqueId} E2E`;

        test.setTimeout(120000); // 2 minutes just in case

        // ----------------------------------------------------------------------
        // 1. AUTHENTICATION FLOW
        // ----------------------------------------------------------------------
        await test.step('Login as Tenant', async () => {
            // Go to root, it should redirect to /auth/login or we go directly there
            await page.goto('/auth/login', { waitUntil: 'networkidle' });

            // Fill in credentials
            await page.fill('input[type="email"], input[name="email"], input[placeholder*="Email"]', username);
            await page.fill('input[type="password"]', password);

            // Click login submit
            await page.click('button[type="submit"]');

            // Assert successful login by waiting for dashboard to load
            await expect(page).toHaveURL(/.*\/app|.*\/app\/dashboard/, { timeout: 15000 });

            // Check for KPI cards
            await expect(page.locator('text=Total Stok')).toBeVisible({ timeout: 10000 });
        });

        // ----------------------------------------------------------------------
        // 2. CUSTOMER MANAGEMENT FLOW
        // ----------------------------------------------------------------------
        await test.step('Create Customer & Upload ID', async () => {
            await page.click('a[href="/app/customers"]');
            await expect(page).toHaveURL(/.*\/app\/customers/);
            await page.waitForLoadState('networkidle');

            // Click Add Customer
            await page.click('text="Tambah Pelanggan"');

            // Verify Add Customer Form is open
            await expect(page.locator('text="Tambah Pelanggan Baru"')).toBeVisible();

            // Fill Customer Details
            await page.fill('input[placeholder="Contoh: Budi Santoso"]', testCustomerName);
            await page.fill('input[placeholder="Contoh: 08123456789"]', `0811${uniqueId}`);
            await page.fill('input[placeholder="Contoh: 3201..."]', `3201${uniqueId}0001`);
            await page.fill('textarea[placeholder="Alamat lengkap"]', `Jl. Testing E2E No. ${uniqueId}`);

            // Simulate KTP Image attach (need a dummy file)
            // Assuming we will place a dummy 'ktp.jpg' in the tests folder
            const dummyImagePath = path.join(__dirname, 'dummy-ktp.jpg');

            // Note: File inputs might be hidden, so we need to setInputFiles properly. 
            // We search for an input type=file, usually the first one is the KTP upload.
            const fileInput = page.locator('input[type="file"]').first();
            await fileInput.setInputFiles(dummyImagePath);

            // Wait for upload preview/success (Depends on your app's behavior, might just show the image immediately)
            await page.waitForTimeout(1000); // Let the state update

            // Save Customer
            await page.click('button:has-text("Simpan"):visible');

            // Wait for success toast
            await expect(page.locator('text="berhasil" i')).toBeVisible({ timeout: 10000 });

            // Assert Customer is in the list
            await page.fill('input[placeholder*="Cari"]', testCustomerName);
            await expect(page.locator(`text=${testCustomerName}`)).toBeVisible();
        });

        // ----------------------------------------------------------------------
        // 3. INVENTORY MANAGEMENT FLOW
        // ----------------------------------------------------------------------
        await test.step('Create New Vehicle', async () => {
            await page.click('a[href="/app/inventory"]');
            await expect(page).toHaveURL(/.*\/app\/inventory/);
            await page.waitForLoadState('networkidle');

            // Click Add Vehicle
            await page.click('text="Tambah Kendaraan"');
            await expect(page).toHaveURL(/.*\/app\/inventory\/new/);

            // Select Vehicle Type
            await page.click('text="Mobil"');

            // Wait for master data to load (brands/models)
            await page.waitForLoadState('networkidle');

            // Fill basic generic inputs
            await page.fill('input[placeholder="Contoh: 2023"]', '2023');
            await page.fill('input[placeholder="Contoh: Hitam"]', 'Hitam');
            await page.fill('input[placeholder="Contoh: B 1234 ABC"]', testLicensePlate);

            // Prices
            await page.fill('input[placeholder="Modal pembelian unit"]', '100000'); // 100,000
            await page.fill('input[placeholder="Harga jual yang ditawarkan"]', '150000'); // 150,000

            // Select dropdowns (Since they might be custom selects, click the select then the option)
            // Example: Status
            const selects = await page.locator('select').all();
            if (selects.length > 0) {
                // Try to set values on native selects if they exist
                await selects[0].selectOption({ label: 'Tersedia' }).catch(() => { });
                await selects[1].selectOption({ label: 'Siap Jual' }).catch(() => { });
            }

            // Save Vehicle
            await page.click('button:has-text("Simpan Kendaraan")');

            // Validation: Expect to be redirected back to inventory or see success toast
            await expect(page.locator('text="berhasil" i')).toBeVisible({ timeout: 15000 });
            await expect(page).toHaveURL(/.*\/app\/inventory/);

            // Assert Vehicle is in the list
            await page.fill('input[placeholder*="Cari"]', testLicensePlate);
            await expect(page.locator(`text=${testLicensePlate}`)).toBeVisible();
        });

        // ----------------------------------------------------------------------
        // 4. TRANSACTION FLOW
        // ----------------------------------------------------------------------
        await test.step('Create Sale Transaction', async () => {
            await page.click('a[href="/app/transactions"]');
            await expect(page).toHaveURL(/.*\/app\/transactions/);
            await page.waitForLoadState('networkidle');

            // Create Transaction
            await page.click('text="Buat Transaksi"');
            await expect(page.locator('text="Buat Transaksi Baru"')).toBeVisible();

            // Select Customer
            await page.click('text="Pilih Pelanggan"');
            await page.fill('input[placeholder*="Cari pelanggan"]', testCustomerName);
            await page.click(`text=${testCustomerName}`);

            // Select Vehicle
            await page.click('text="Pilih Kendaraan"');
            await page.fill('input[placeholder*="Cari"]', testLicensePlate);
            await page.click(`text=${testLicensePlate}`);

            // Fill Amount
            await page.fill('input[placeholder="0"]', '150000');

            // Select Status
            await page.selectOption('select', { label: 'Selesai' });

            // Save
            await page.click('button:has-text("Simpan Transaksi")');

            // Validation
            await expect(page.locator('text="berhasil" i')).toBeVisible({ timeout: 10000 });
            await expect(page.locator('text="Buat Transaksi Baru"')).toBeHidden();
        });

    });

});
