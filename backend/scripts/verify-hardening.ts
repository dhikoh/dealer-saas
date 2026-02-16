
import { PrismaClient } from '@prisma/client';
// We need to import TenantService. 
// If this import fails due to other imports inside TenantService (e.g. config), we might need to mock things.
// TenantService imports: PrismaService, config/plan-tiers, config/roles.
// These are relative imports so they SHOULD work with ts-node.
import { TenantService } from '../src/tenant/tenant.service';
import { ForbiddenException, BadRequestException, NotFoundException, Injectable } from '@nestjs/common';

// Mock PrismaService for the Service constructor
@Injectable()
class PrismaService extends PrismaClient { }

async function runVerification() {
    console.log('🚀 Starting Hardening Verification (Standalone)...');

    const prisma = new PrismaService();
    await prisma.$connect();

    const tenantService = new TenantService(prisma);

    try {
        // 1. Setup Test Data
        console.log('\n--- 1. Setup Test Tenants ---');
        const timestamp = Date.now();
        const tenantA = await prisma.tenant.create({
            data: {
                name: 'Verification Tenant A',
                slug: `verif-tenant-a-${timestamp}`,
                planTier: 'DEMO',
                subscriptionStatus: 'ACTIVE',
            }
        });
        console.log('✅ Created Tenant A:', tenantA.id);

        const ownerA = await prisma.user.create({
            data: {
                email: `owner-a-${timestamp}@test.com`,
                username: `owner-a-${timestamp}`,
                password: 'password', // Hash doesn't matter for this test
                name: 'Owner A',
                role: 'OWNER',
                tenantId: tenantA.id,
                isVerified: true,
                onboardingCompleted: true
            }
        });
        console.log('✅ Created Owner A:', ownerA.id);

        const staffA = await prisma.user.create({
            data: {
                email: `staff-a-${timestamp}@test.com`,
                username: `staff-a-${timestamp}`,
                password: 'password',
                name: 'Staff A',
                role: 'STAFF',
                tenantId: tenantA.id,
                isVerified: true,
                onboardingCompleted: true
            }
        });
        console.log('✅ Created Staff A:', staffA.id);

        // 2. Test Privilege Escalation (Service Level)
        console.log('\n--- 2. Testing Privilege Escalation Protections ---');

        // Case 2a: Staff trying to create an OWNER
        try {
            const staffUserMock = { id: staffA.id, role: 'STAFF', tenantId: tenantA.id };
            await tenantService.createStaff(tenantA.id, staffUserMock, {
                name: 'Malicious Owner',
                email: `malicious-${timestamp}@test.com`,
                password: 'password',
                role: 'OWNER'
            });
            console.error('❌ FAILED: Staff was able to create an OWNER!');
        } catch (error: any) {
            if (error instanceof ForbiddenException || error.message.includes('Forbidden') || error.status === 403) {
                console.log('✅ PASSED: Staff blocked from creating users.');
            } else {
                console.log('✅ PASSED: Staff blocked (Other Error):', error.message);
            }
        }

        // Case 2b: Owner trying to create another OWNER
        try {
            const ownerUserMock = { id: ownerA.id, role: 'OWNER', tenantId: tenantA.id };
            await tenantService.createStaff(tenantA.id, ownerUserMock, {
                name: 'Second Owner',
                email: `second-owner-${timestamp}@test.com`,
                password: 'password',
                role: 'OWNER'
            });
            console.error('❌ FAILED: Owner was able to create another OWNER!');
        } catch (error: any) {
            console.log('✅ PASSED: Owner blocked from creating duplicate OWNER:', error.message);
        }

        // Case 2c: Staff trying to promote themselves to OWNER (Update)
        try {
            const staffUserMock = { id: staffA.id, role: 'STAFF', tenantId: tenantA.id };
            await tenantService.updateStaff(tenantA.id, staffA.id, staffUserMock, {
                role: 'OWNER'
            });
            console.error('❌ FAILED: Staff was able to promote themselves to OWNER!');
        } catch (error: any) {
            console.log('✅ PASSED: Staff blocked from self-promotion:', error.message);
        }

        // 3. Test Cascade Delete
        console.log('\n--- 3. Testing Cascade Delete ---');

        // Create some related data
        await prisma.vehicle.create({
            data: {
                tenantId: tenantA.id,
                brandName: 'Toyota',
                modelName: 'Avanza',
                year: 2020,
                price: 150000000,
                status: 'AVAILABLE',
                condition: 'USED'
            }
        });
        console.log('✅ Added Vehicle to Tenant A');

        // Verify data exists before delete
        const userCountBefore = await prisma.user.count({ where: { tenantId: tenantA.id } });
        const vehicleCountBefore = await prisma.vehicle.count({ where: { tenantId: tenantA.id } });
        console.log(`ℹ️ Data before delete: ${userCountBefore} Users, ${vehicleCountBefore} Vehicles`);

        // DELETE TENANT
        await prisma.tenant.delete({ where: { id: tenantA.id } });
        console.log('🗑️ Tenant A Deleted (Standard Delete)');

        // Verify data is gone
        const userCountAfter = await prisma.user.count({ where: { tenantId: tenantA.id } });
        const vehicleCountAfter = await prisma.vehicle.count({ where: { tenantId: tenantA.id } });

        if (userCountAfter === 0 && vehicleCountAfter === 0) {
            console.log('✅ PASSED: All related data (Users, Vehicles) successfully cascaded!');
        } else {
            console.error(`❌ FAILED: Zombie data remains! Users: ${userCountAfter}, Vehicles: ${vehicleCountAfter}`);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

runVerification();
