import { hash } from "bcryptjs";
import prisma from "../src/lib/prisma";

async function main() {
    console.log("🌱 Seeding database...");

    // Create Super Admin
    const superAdminPassword = await hash("admin123", 12);
    const superAdmin = await prisma.user.upsert({
        where: { email: "admin@showroom.com" },
        update: {},
        create: {
            email: "admin@showroom.com",
            name: "Super Admin",
            password: superAdminPassword,
            role: "super_admin",
            isActive: true,
        },
    });
    console.log("✅ Super Admin created:", superAdmin.email);

    // Create Demo Tenant
    const demoTenant = await prisma.tenant.upsert({
        where: { slug: "demo-dealer" },
        update: {},
        create: {
            name: "Demo Dealer Motor",
            slug: "demo-dealer",
            address: "Jl. Contoh No. 123, Jakarta",
            phone: "021-12345678",
            email: "info@demo-dealer.com",
            subscription: "pro",
            isActive: true,
        },
    });
    console.log("✅ Demo Tenant created:", demoTenant.name);

    // Create Demo Owner
    const ownerPassword = await hash("owner123", 12);
    const demoOwner = await prisma.user.upsert({
        where: { email: "owner@demo-dealer.com" },
        update: {},
        create: {
            email: "owner@demo-dealer.com",
            name: "Budi Owner",
            password: ownerPassword,
            role: "owner",
            tenantId: demoTenant.id,
            isActive: true,
        },
    });
    console.log("✅ Demo Owner created:", demoOwner.email);

    // Create Demo Sales
    const salesPassword = await hash("sales123", 12);
    const demoSales = await prisma.user.upsert({
        where: { email: "sales@demo-dealer.com" },
        update: {},
        create: {
            email: "sales@demo-dealer.com",
            name: "Andi Sales",
            password: salesPassword,
            role: "sales",
            tenantId: demoTenant.id,
            isActive: true,
        },
    });
    console.log("✅ Demo Sales created:", demoSales.email);

    // Create Demo Finance
    const financePassword = await hash("finance123", 12);
    const demoFinance = await prisma.user.upsert({
        where: { email: "finance@demo-dealer.com" },
        update: {},
        create: {
            email: "finance@demo-dealer.com",
            name: "Dewi Finance",
            password: financePassword,
            role: "finance",
            tenantId: demoTenant.id,
            isActive: true,
        },
    });
    console.log("✅ Demo Finance created:", demoFinance.email);

    // Create Global Vehicle Brands
    const brands = [
        { name: "Honda", scope: "global" },
        { name: "Yamaha", scope: "global" },
        { name: "Suzuki", scope: "global" },
        { name: "Kawasaki", scope: "global" },
        { name: "TVS", scope: "global" },
        { name: "Vespa", scope: "global" },
        { name: "Toyota", scope: "global" },
        { name: "Daihatsu", scope: "global" },
        { name: "Mitsubishi", scope: "global" },
    ];

    for (const brand of brands) {
        const existing = await prisma.vehicleBrand.findFirst({
            where: { name: brand.name, scope: "global" },
        });
        if (!existing) {
            await prisma.vehicleBrand.create({ data: brand });
        }
    }
    console.log("✅ Vehicle Brands seeded");

    // Find Honda and Yamaha for models
    const honda = await prisma.vehicleBrand.findFirst({ where: { name: "Honda" } });
    const yamaha = await prisma.vehicleBrand.findFirst({ where: { name: "Yamaha" } });

    if (honda) {
        // Honda Models
        const hondaModels = [
            { brandId: honda.id, name: "Beat", category: "motor", scope: "global" },
            { brandId: honda.id, name: "Vario 125", category: "motor", scope: "global" },
            { brandId: honda.id, name: "Vario 160", category: "motor", scope: "global" },
            { brandId: honda.id, name: "PCX 160", category: "motor", scope: "global" },
            { brandId: honda.id, name: "Scoopy", category: "motor", scope: "global" },
            { brandId: honda.id, name: "ADV 160", category: "motor", scope: "global" },
        ];

        for (const model of hondaModels) {
            const existing = await prisma.vehicleModel.findFirst({
                where: { brandId: model.brandId, name: model.name },
            });
            if (!existing) {
                const created = await prisma.vehicleModel.create({ data: model });

                // Add variants
                await prisma.vehicleVariant.createMany({
                    data: [
                        { modelId: created.id, name: "CBS", engineCc: 110, transmission: "cvt", fuelType: "bensin", scope: "global" },
                        { modelId: created.id, name: "CBS-ISS", engineCc: 110, transmission: "cvt", fuelType: "bensin", scope: "global" },
                    ],
                    skipDuplicates: true,
                });
            }
        }
        console.log("✅ Honda Models & Variants seeded");
    }

    if (yamaha) {
        // Yamaha Models
        const yamahaModels = [
            { brandId: yamaha.id, name: "NMAX", category: "motor", scope: "global" },
            { brandId: yamaha.id, name: "Aerox 155", category: "motor", scope: "global" },
            { brandId: yamaha.id, name: "Mio M3", category: "motor", scope: "global" },
            { brandId: yamaha.id, name: "Fazzio", category: "motor", scope: "global" },
            { brandId: yamaha.id, name: "Lexi", category: "motor", scope: "global" },
        ];

        for (const model of yamahaModels) {
            const existing = await prisma.vehicleModel.findFirst({
                where: { brandId: model.brandId, name: model.name },
            });
            if (!existing) {
                const created = await prisma.vehicleModel.create({ data: model });

                // Add variants
                await prisma.vehicleVariant.createMany({
                    data: [
                        { modelId: created.id, name: "Standard", engineCc: 155, transmission: "cvt", fuelType: "bensin", scope: "global" },
                        { modelId: created.id, name: "Connected", engineCc: 155, transmission: "cvt", fuelType: "bensin", scope: "global" },
                    ],
                    skipDuplicates: true,
                });
            }
        }
        console.log("✅ Yamaha Models & Variants seeded");
    }

    // Create Leasing Partners
    const leasingPartners = [
        { tenantId: demoTenant.id, name: "FIF Group", code: "FIF", phone: "021-1500920" },
        { tenantId: demoTenant.id, name: "Adira Finance", code: "ADIRA", phone: "021-1500511" },
        { tenantId: demoTenant.id, name: "WOM Finance", code: "WOM", phone: "021-1500366" },
        { tenantId: demoTenant.id, name: "BAF (Bussan Auto Finance)", code: "BAF", phone: "021-29619000" },
    ];

    for (const partner of leasingPartners) {
        const existing = await prisma.leasingPartner.findFirst({
            where: { tenantId: partner.tenantId, code: partner.code },
        });
        if (!existing) {
            const created = await prisma.leasingPartner.create({ data: partner });

            // Create leasing rates
            const rates = [
                { leasingPartnerId: created.id, tenor: 12, interestRate: 14, vehicleCategory: "motor", vehicleCondition: "baru", minDp: 10, maxDp: 50, adminFee: 500000 },
                { leasingPartnerId: created.id, tenor: 18, interestRate: 15, vehicleCategory: "motor", vehicleCondition: "baru", minDp: 10, maxDp: 50, adminFee: 500000 },
                { leasingPartnerId: created.id, tenor: 24, interestRate: 16, vehicleCategory: "motor", vehicleCondition: "baru", minDp: 10, maxDp: 50, adminFee: 500000 },
                { leasingPartnerId: created.id, tenor: 30, interestRate: 17, vehicleCategory: "motor", vehicleCondition: "baru", minDp: 10, maxDp: 50, adminFee: 500000 },
                { leasingPartnerId: created.id, tenor: 36, interestRate: 18, vehicleCategory: "motor", vehicleCondition: "baru", minDp: 10, maxDp: 50, adminFee: 500000 },
                { leasingPartnerId: created.id, tenor: 12, interestRate: 18, vehicleCategory: "motor", vehicleCondition: "bekas", minDp: 20, maxDp: 50, adminFee: 750000 },
                { leasingPartnerId: created.id, tenor: 18, interestRate: 20, vehicleCategory: "motor", vehicleCondition: "bekas", minDp: 20, maxDp: 50, adminFee: 750000 },
                { leasingPartnerId: created.id, tenor: 24, interestRate: 22, vehicleCategory: "motor", vehicleCondition: "bekas", minDp: 20, maxDp: 50, adminFee: 750000 },
            ];

            await prisma.leasingRate.createMany({ data: rates, skipDuplicates: true });
        }
    }
    console.log("✅ Leasing Partners & Rates seeded");

    // Create Demo Customers
    const customers = [
        { tenantId: demoTenant.id, name: "Budi Santoso", phone: "081234567890", email: "budi@email.com", address: "Jl. Merdeka No. 1, Jakarta", source: "walk-in" },
        { tenantId: demoTenant.id, name: "Siti Rahayu", phone: "082345678901", email: "siti@email.com", address: "Jl. Sudirman No. 2, Jakarta", source: "referral" },
        { tenantId: demoTenant.id, name: "Ahmad Wijaya", phone: "083456789012", address: "Jl. Gatot Subroto No. 3, Jakarta", source: "online" },
    ];

    for (const customer of customers) {
        const existing = await prisma.customer.findFirst({
            where: { tenantId: customer.tenantId, phone: customer.phone },
        });
        if (!existing) {
            await prisma.customer.create({ data: customer });
        }
    }
    console.log("✅ Demo Customers seeded");

    console.log("");
    console.log("🎉 Database seeding completed!");
    console.log("");
    console.log("📝 Login Credentials:");
    console.log("   Super Admin: admin@showroom.com / admin123");
    console.log("   Owner:       owner@demo-dealer.com / owner123");
    console.log("   Sales:       sales@demo-dealer.com / sales123");
    console.log("   Finance:     finance@demo-dealer.com / finance123");
    console.log("");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
