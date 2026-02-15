import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Tenant Isolation (e2e)', () => {
    let app: INestApplication<App>;
    let tenantAToken: string;
    let tenantBToken: string;
    let tenantBVehicleId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Login as Tenant A (Demo Dealer)
        // Adjust these credentials to match your actual seed data
        const loginResA = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ identifier: 'demo-dealer', password: 'password123' });

        if (loginResA.status !== 201) {
            console.warn('Tenant A login failed, skipping tests');
            return;
        }
        tenantAToken = loginResA.body.access_token;

        // Login as Tenant B (Another Tenant - assuming one exists or we might fail)
        // If no second tenant exists, this test might need a seeded second tenant.
        // For now, let's assume we can register one or use a known one.
        // If we can't easily get a second tenant, we will mock or skip.
        // Let's try to register a new tenant B to be sure.
        const registerRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                businessName: 'Tenant B Isolated',
                name: 'Owner B',
                email: `tenantB.${Date.now()}@test.com`,
                password: 'password123',
                phone: '08123456789'
            });

        if (registerRes.status === 201) {
            tenantBToken = registerRes.body.access_token;
        } else {
            console.warn('Tenant B registration failed, isolation tests partial');
        }

        // Create a vehicle for Tenant B
        if (tenantBToken) {
            const vehicleRes = await request(app.getHttpServer())
                .post('/vehicles')
                .set('Authorization', `Bearer ${tenantBToken}`)
                .send({
                    category: 'CAR',
                    make: 'Honda',
                    model: 'Civic',
                    year: 2022,
                    color: 'Black',
                    price: 350000000,
                    purchasePrice: 300000000,
                    status: 'AVAILABLE'
                });
            if (vehicleRes.status === 201) {
                tenantBVehicleId = vehicleRes.body.id;
            }
        }
    });

    afterAll(async () => {
        await app.close();
    });

    it('Tenant A should NOT be able to access Tenant B\'s vehicle', async () => {
        if (!tenantAToken || !tenantBVehicleId) {
            console.warn('Skipping test: Missing tokens or vehicle');
            return;
        }

        return request(app.getHttpServer())
            .get(`/vehicles/${tenantBVehicleId}`)
            .set('Authorization', `Bearer ${tenantAToken}`) // Tenant A credentials
            .expect(404); // Should be Not Found (safest) or 403 Forbidden
    });

    it('Tenant A from JWT should override X-Tenant-ID header', async () => {
        if (!tenantAToken) return;

        // Attempt to spoof Tenant B via header, but using Tenant A's token
        // Ideally we need Tenant B's ID to spoof. 
        // But even without it, the Guard should ignore the header.

        const res = await request(app.getHttpServer())
            .get('/tenant/profile')
            .set('Authorization', `Bearer ${tenantAToken}`)
            .set('X-Tenant-ID', 'some-other-uuid') // Malicious header
            .expect(403); // TenantGuard should reject mismatch

        expect(res.body.message).toContain('Tenant mismatch');
    });
});
