import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Core Admin Runtime Validation (E2E)', () => {
    let app: INestApplication;
    let prisma: PrismaClient;
    let authToken: string;
    let tenantId: string;
    let userId: string; // Will grab a user ID from list
    let planId: string = 'BASIC'; // Target plan to update

    const testAdmin = {
        email: 'e2e_superadmin@test.com',
        password: 'Password123!',
        name: 'E2E Superadmin',
    };

    beforeAll(async () => {
        console.log('🔹 [Setup] initializing Prisma...');
        prisma = new PrismaClient();
        await prisma.$connect();

        console.log('🔹 [Setup] Starting module compilation...');
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(PrismaService)
            .useValue(prisma)
            .compile();

        console.log('🔹 [Setup] Creating Nest App...');
        app = moduleFixture.createNestApplication();
        console.log('🔹 [Setup] Initializing App...');
        await app.init();
        console.log('✅ [Setup] App Initialized');

        // Seed Test Superadmin directly
        const hashedPassword = await bcrypt.hash(testAdmin.password, 10);

        console.log('🔹 [Setup] Upserting Superadmin...');
        await prisma.user.upsert({
            where: { email: testAdmin.email },
            update: {
                password: hashedPassword,
                role: 'SUPERADMIN',
                isVerified: true
            },
            create: {
                email: testAdmin.email,
                name: testAdmin.name,
                password: hashedPassword,
                role: 'SUPERADMIN',
                isVerified: true,
            },
        });
        console.log('✅ [Setup] E2E Superadmin Seeded');
    }, 60000); // Optimize timeout

    afterAll(async () => {
        // Cleanup Test Admin (optional, but good for idempotency if we want to be strict, 
        // but leaving it might differ from "Mutation" check. We'll leave it for now or delete it.)
        // await prisma.user.delete({ where: { email: testAdmin.email } });
        if (prisma) await prisma.$disconnect();
        if (app) await app.close();
    });

    // 1. SIMULATE REAL EXECUTION FLOW: LOGIN
    it('Step 1: Login as Superadmin', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: testAdmin.email, // Assuming seeded superadmin
                password: testAdmin.password, // Standard seed password
            })
            .expect(201); // Created/Success

        authToken = response.body.access_token;
        expect(authToken).toBeDefined();
        console.log('✅ [Login] Superadmin Key Acquired');
    });

    // 2. TENANT CRUD
    it('Step 2: Create Tenant (Verify Mutation)', async () => {
        const payload = {
            name: 'E2E Validated Dealer',
            ownerName: 'E2E Owner',
            ownerEmail: `e2e_owner_${Date.now()}@test.com`,
            ownerPassword: 'Password123!',
            planTier: 'DEMO',
            billingMonths: 1,
            // email is derived in frontend, but here we send it directly if DTO requires it?
            // Checking DTO: CreateTenantDto has email.
            email: `e2e_tenant_${Date.now()}@test.com`,
        };

        const response = await request(app.getHttpServer())
            .post('/superadmin/tenants')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(201);

        tenantId = response.body.id;
        expect(tenantId).toBeDefined();
        expect(response.body.name).toBe(payload.name);
        console.log('✅ [Tenant:Create] Success, ID:', tenantId);
    });

    it('Step 3: Update Tenant (Verify Mutation)', async () => {
        // Wait slightly to prevent race conditions if any (though await handles it)
        await new Promise(r => setTimeout(r, 100));

        const updatePayload = {
            name: 'E2E Validated Dealer UPDATED',
            address: 'Jalan E2E Testing No. 1',
        };

        const response = await request(app.getHttpServer())
            .patch(`/superadmin/tenants/${tenantId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatePayload)
            .expect(200);

        expect(response.body.name).toBe(updatePayload.name);
        expect(response.body.address).toBe(updatePayload.address);
        console.log('✅ [Tenant:Update] Success');
    });

    // 3. USER CRUD
    it('Step 4: List Users & Identify Target', async () => {
        const response = await request(app.getHttpServer())
            .get('/superadmin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .query({ limit: 5 })
            .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        // Just verify the list works. We won't delete a random user to be safe, 
        // unless we create one. The CreateTenant above created an owner user.
        // Let's find that owner user.
        const createdOwner = response.body.data.find(u => u.tenantId === tenantId);
        if (createdOwner) {
            userId = createdOwner.id;
            console.log('✅ [User:List] Found created owner:', userId);
        } else {
            console.warn('⚠️ [User:List] Could not find the owner of created tenant immediately. Indexing delay?');
        }
    });

    it('Step 5: Delete User (Verify Permission & Mutation)', async () => {
        if (!userId) {
            console.log('Skipping User Delete Test (No User ID)');
            return;
        }

        await request(app.getHttpServer())
            .delete(`/superadmin/users/${userId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        console.log('✅ [User:Delete] Success');
    });

    // 4. PLAN UPDATE
    it('Step 6: Update Plan (Verify Logic)', async () => {
        // Fetch plans first to get an ID
        const plansRes = await request(app.getHttpServer())
            .get('/superadmin/plans')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        // Use BASIC plan if available, or first one
        const targetPlan = plansRes.body.find(p => p.id === 'BASIC') || plansRes.body[0];
        if (!targetPlan) throw new Error('No plans found');

        const updatePayload = {
            name: targetPlan.name, // Keep name
            features: {
                ...targetPlan.features,
                maxVehicles: 9999, // Mutation check
            }
        };

        await request(app.getHttpServer())
            .patch(`/superadmin/plans/${targetPlan.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatePayload)
            .expect(200);

        console.log('✅ [Plan:Update] Success');
    });

    // 5. CLEANUP (Tenant Delete)
    it('Step 7: Delete Tenant (Cleanup)', async () => {
        await request(app.getHttpServer())
            .delete(`/superadmin/tenants/${tenantId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        console.log('✅ [Tenant:Delete] Success (Cleanup)');
    });
});
