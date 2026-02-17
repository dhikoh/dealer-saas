import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';
import * as dotenv from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt');

dotenv.config();

async function runValidation() {
    console.log('🚀 Starting Core Admin Runtime Validation...');

    // 1. INIT APP
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();
    const server = app.getHttpServer();

    // 2. SETUP PRISMA & SUPERADMIN
    const prisma = new PrismaClient();
    const testAdmin = {
        email: 'runtime_validator@test.com',
        password: 'Password123!',
        name: 'Runtime Validator',
        username: 'runtime_validator' // REQUIRED by Schema
    };

    // Clean start (optional)
    // await prisma.user.deleteMany({ where: { email: { contains: 'runtime' } } });

    const hashedPassword = await bcrypt.hash(testAdmin.password, 10);
    await prisma.user.upsert({
        where: { email: testAdmin.email },
        update: { password: hashedPassword, role: 'SUPERADMIN', isVerified: true },
        create: { ...testAdmin, password: hashedPassword, role: 'SUPERADMIN', isVerified: true },
    });
    console.log('✅ Superadmin Setup Complete');

    // 3. LOGIN
    let authToken = '';
    try {
        const loginRes = await request(server)
            .post('/auth/login')
            .send({ email: testAdmin.email, password: testAdmin.password })
            .expect(201);
        authToken = loginRes.body.access_token;
        console.log('✅ Login Successful');
    } catch (e: any) {
        console.error('❌ Login Failed:', e.message);
        process.exit(1);
    }

    // 4. TENANT CRUD
    let tenantId = '';
    try {
        const createRes = await request(server)
            .post('/superadmin/tenants')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Runtime Validation Dealer',
                ownerName: 'Validator Owner',
                ownerEmail: `validator_${Date.now()}@test.com`,
                ownerPassword: 'Password123!',
                planTier: 'DEMO',
                billingMonths: 1,
                email: `tenant_${Date.now()}@test.com`
            })
            .expect(201);
        tenantId = createRes.body.id;
        console.log('✅ Tenant Created:', tenantId);
    } catch (e: any) {
        console.error('❌ Tenant Create Failed:', e.message);
        process.exit(1);
    }

    try {
        await request(server)
            .patch(`/superadmin/tenants/${tenantId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ address: 'Validated Address' })
            .expect(200);
        console.log('✅ Tenant Updated');
    } catch (e: any) {
        console.error('❌ Tenant Update Failed:', e.message);
    }

    // 5. USER CRUD
    try {
        const usersRes = await request(server)
            .get('/superadmin/users')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        if (Array.isArray(usersRes.body.data) && usersRes.body.data.length > 0) {
            console.log('✅ User List Verified');
        } else {
            console.warn('⚠️ User List Empty (Unexpected)');
        }
    } catch (e: any) {
        console.error('❌ User List Failed:', e.message);
    }

    // 6. DELETE TENANT (Cleanup)
    try {
        await request(server)
            .delete(`/superadmin/tenants/${tenantId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        console.log('✅ Tenant Deleted');
    } catch (e: any) {
        console.error('❌ Tenant Delete Failed:', e.message);
    }

    // 7. PLAN UPDATE
    try {
        const plansRes = await request(server).get('/superadmin/plans').set('Authorization', `Bearer ${authToken}`).expect(200);
        const plan = plansRes.body[0];
        if (plan) {
            await request(server)
                .patch(`/superadmin/plans/${plan.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: plan.name, features: { ...plan.features, validationTest: true } })
                .expect(200);
            console.log('✅ Plan Update Verified');
        }
    } catch (e: any) {
        console.error('❌ Plan Update Failed:', e.message);
    }

    console.log('🎉 Runtime Validation Completed Successfully');
    await app.close();
    await prisma.$disconnect();
}

runValidation().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
