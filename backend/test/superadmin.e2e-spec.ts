
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module'; // Adjust path if needed
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('SuperadminController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaClient;
    let authToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        prisma = new PrismaClient();
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    it('1. Ensure Superadmin user exists', async () => {
        const email = 'superadmin@otohub.id';
        const password = 'superadmin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (!existingUser) {
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'Super Admin',
                    username: 'superadmin',
                    role: 'SUPERADMIN',
                    isVerified: true,
                    onboardingCompleted: true,
                },
            });
        } else {
            // Ensure role is correct
            await prisma.user.update({
                where: { email },
                data: { role: 'SUPERADMIN' }
            });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        expect(user).toBeDefined();
        expect(user?.email).toBe(email);
    });

    it('2. Should login and retrieve JWT token', async () => {
        const email = 'superadmin@otohub.id';
        const password = 'superadmin123';

        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password })
            .expect(200);

        expect(response.body).toHaveProperty('access_token');
        authToken = response.body.access_token;
    });

    it('3. GET /superadmin/tenants (Should return list of tenants)', async () => {
        const response = await request(app.getHttpServer())
            .get('/superadmin/tenants')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        // OR if paginated: expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('4. GET /superadmin/approvals (Should return list of approvals)', async () => {
        const response = await request(app.getHttpServer())
            .get('/superadmin/approvals')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    it('5. GET /superadmin/plans (Should return list of plans)', async () => {
        const response = await request(app.getHttpServer())
            .get('/superadmin/plans')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    // Add more tests as needed for POST/PUT scenarios
});
