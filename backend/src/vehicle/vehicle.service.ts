import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { getPlanById } from '../config/plan-tiers.config';

@Injectable()
export class VehicleService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) { }

    // ==================== VEHICLE CRUD ====================

    async findAll(tenantId: string, filters?: {
        category?: string;
        status?: string;
        condition?: string;
        branchId?: string;
    }) {
        return this.prisma.vehicle.findMany({
            where: {
                tenantId,
                ...(filters?.category && { category: filters.category }),
                ...(filters?.status && { status: filters.status }),
                ...(filters?.condition && { condition: filters.condition }),
                ...(filters?.branchId && { branchId: filters.branchId }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.vehicle.findFirst({
            where: { id, tenantId },
        });
    }

    async create(tenantId: string, data: any) {
        // Check plan limit
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { _count: { select: { vehicles: true } } },
        });

        if (tenant) {
            const plan = getPlanById(tenant.planTier);
            if (plan && plan.features.maxVehicles !== -1) {
                if (tenant._count.vehicles >= plan.features.maxVehicles) {
                    throw new BadRequestException(
                        `Batas kendaraan tercapai (${plan.features.maxVehicles} kendaraan). Upgrade plan untuk menambah lebih banyak.`
                    );
                }
            }
        }

        return this.prisma.vehicle.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async update(id: string, tenantId: string, data: any) {
        // SECURITY: Verify ownership before update
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id, tenantId },
        });
        if (!vehicle) {
            throw new NotFoundException('Kendaraan tidak ditemukan');
        }

        // VALIDATION 1: isShowroom=true requires at least 1 photo
        if (data.isShowroom === true) {
            // Check incoming images OR existing images
            const imagesRaw = data.images !== undefined ? data.images : vehicle.images;
            const parsedImages = imagesRaw ? JSON.parse(imagesRaw) : [];

            if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
                // If it's just a status update, we might not want to throw, 
                // BUT the requirement says "Showroom wajib minimal 1 foto".
                // So we force it to false if no photos.
                // OR we throw error. Requirement implies validation/block.
                throw new BadRequestException(
                    'Minimal 1 foto kendaraan diperlukan untuk menampilkannya di Showroom/Website'
                );
            }
        }

        // VALIDATION 2: isOwnerDifferent=true requires bpkbOwnerName
        if (data.isOwnerDifferent === true) {
            const name = data.bpkbOwnerName || vehicle.bpkbOwnerName;
            if (!name || name.trim() === '') {
                throw new BadRequestException(
                    'Nama pemilik pada BPKB wajib diisi jika identitas berbeda dengan pemilik KTP'
                );
            }
        }

        return this.prisma.vehicle.update({
            where: { id },
            data,
        });
    }

    async delete(id: string, tenantId: string) {
        // SECURITY: Verify ownership before delete
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { transactions: true } } },
        });
        if (!vehicle) {
            throw new NotFoundException('Kendaraan tidak ditemukan');
        }
        // Prevent deleting vehicles with existing transactions
        if (vehicle._count.transactions > 0) {
            throw new BadRequestException(
                `Kendaraan ini memiliki ${vehicle._count.transactions} transaksi dan tidak dapat dihapus. Ubah status menjadi SOLD sebagai gantinya.`
            );
        }
        return this.prisma.vehicle.delete({
            where: { id },
        });
    }

    // ==================== MASTER DATA (Brands & Models) ====================

    async findAllBrands(tenantId: string, category?: string) {
        return this.prisma.vehicleBrand.findMany({
            where: {
                tenantId,
                ...(category && { category }),
            },
            include: { models: true },
            orderBy: { name: 'asc' },
        });
    }

    async createBrand(tenantId: string, name: string, category: string) {
        return this.prisma.vehicleBrand.upsert({
            where: {
                tenantId_name_category: { tenantId, name, category },
            },
            update: {},
            create: { tenantId, name, category },
        });
    }

    async createModel(tenantId: string, brandId: string, name: string, variants?: string) {
        // SECURITY: Verify brand belongs to tenant
        const brand = await this.prisma.vehicleBrand.findFirst({
            where: { id: brandId, tenantId },
        });
        if (!brand) {
            throw new NotFoundException('Brand tidak ditemukan');
        }
        return this.prisma.vehicleModel.upsert({
            where: {
                brandId_name: { brandId, name },
            },
            update: { variants },
            create: { brandId, name, variants },
        });
    }

    // ==================== STATS ====================

    async getStats(tenantId: string) {
        const [total, available, sold, repair] = await Promise.all([
            this.prisma.vehicle.count({ where: { tenantId } }),
            this.prisma.vehicle.count({ where: { tenantId, status: 'AVAILABLE' } }),
            this.prisma.vehicle.count({ where: { tenantId, status: 'SOLD' } }),
            this.prisma.vehicle.count({ where: { tenantId, condition: 'REPAIR' } }),
        ]);

        return { total, available, sold, repair };
    }

    // ==================== VEHICLE COST TRACKING ====================

    async getCosts(vehicleId: string, tenantId: string) {
        // SECURITY: Verify vehicle belongs to tenant
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId },
        });
        if (!vehicle) {
            throw new NotFoundException('Kendaraan tidak ditemukan');
        }
        return this.prisma.vehicleCost.findMany({
            where: { vehicleId, tenantId },
            orderBy: { date: 'desc' },
        });
    }

    async addCost(vehicleId: string, tenantId: string, data: {
        costType: string;
        amount: number;
        description?: string;
        date: string | Date;
        receiptImage?: string;
    }) {
        // SECURITY: Verify vehicle belongs to tenant
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId },
        });
        if (!vehicle) {
            throw new NotFoundException('Kendaraan tidak ditemukan');
        }
        return this.prisma.vehicleCost.create({
            data: {
                tenantId,
                vehicleId,
                costType: data.costType,
                amount: data.amount,
                description: data.description,
                date: new Date(data.date),
                receiptImage: data.receiptImage,
            },
        });
    }

    async deleteCost(costId: string, tenantId: string) {
        // SECURITY: Direct tenant check on VehicleCost
        const cost = await this.prisma.vehicleCost.findFirst({
            where: { id: costId, tenantId },
        });
        if (!cost) {
            throw new NotFoundException('Biaya tidak ditemukan');
        }
        return this.prisma.vehicleCost.delete({
            where: { id: costId },
        });
    }

    // Get vehicle with full cost breakdown and profit calculation
    async getVehicleWithCosts(vehicleId: string, tenantId: string) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId },
        }) as any;

        if (!vehicle) return null;

        // Manually fetch costs to be safe against stale client
        let costs = [];
        try {
            costs = await (this.prisma as any).vehicleCost.findMany({
                where: { vehicleId, tenantId },
                orderBy: { date: 'desc' },
            });
        } catch (e) {
            costs = [];
        }

        vehicle.costs = costs;

        // Calculate totals
        const purchasePrice = Number(vehicle.purchasePrice || 0);
        const sellingPrice = Number(vehicle.price || 0);
        const additionalCosts = vehicle.costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
        const totalCost = purchasePrice + additionalCosts;
        const profitMargin = sellingPrice - totalCost;

        return {
            ...vehicle,
            costSummary: {
                purchasePrice,
                additionalCosts,
                totalCost,
                sellingPrice,
                profitMargin,
                profitPercentage: totalCost > 0 ? ((profitMargin / totalCost) * 100).toFixed(2) : 0,
            },
        };
    }
    // ==================== DEALER GROUP FEATURES ====================

    async findGroupStock(tenantId: string, filters?: any) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { dealerGroupId: true }
        });

        if (!tenant?.dealerGroupId) {
            return []; // Not in a group, empty result
        }

        return this.prisma.vehicle.findMany({
            where: {
                tenant: {
                    dealerGroupId: tenant.dealerGroupId,
                    id: { not: tenantId } // Exclude own stock
                },
                status: 'AVAILABLE', // Only show available units
                ...(filters?.category && { category: filters.category }),
            },
            include: {
                tenant: {
                    select: { id: true, name: true, phone: true, address: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async copyVehicle(tenantId: string, sourceVehicleId: string) {
        // 1. Get Requestor & Source
        const requestor = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { dealerGroupId: true, name: true }
        });

        const sourceVehicle = await this.prisma.vehicle.findUnique({
            where: { id: sourceVehicleId },
            include: { tenant: { select: { id: true, dealerGroupId: true, name: true } } }
        });

        if (!sourceVehicle) throw new NotFoundException('Vehicle not found');

        // 2. Validate Group Membership
        if (!requestor?.dealerGroupId || !sourceVehicle.tenant.dealerGroupId || requestor.dealerGroupId !== sourceVehicle.tenant.dealerGroupId) {
            throw new ForbiddenException('Access denied: vehicle is not in your dealer group');
        }

        // 3. Prepare Data for Cloning
        const { id, tenantId: oldTid, createdAt, updatedAt, tenant: _t, ...dataToCopy } = sourceVehicle as any;

        // 4. Create New Vehicle (using existing create method to handle Plan Limits)
        const newVehicle = await this.create(tenantId, {
            ...dataToCopy,
            status: 'AVAILABLE',
            conditionNote: `Copied from ${sourceVehicle.tenant.name} (${sourceVehicle.make} ${sourceVehicle.model})`,
            purchaseDate: new Date(),
        });

        // 5. Notify source dealer's OWNER users about the copy
        try {
            const sourceOwners = await this.prisma.user.findMany({
                where: { tenantId: sourceVehicle.tenant.id, role: 'OWNER' },
                select: { id: true },
            });
            const vehicleLabel = `${sourceVehicle.make} ${sourceVehicle.model} ${sourceVehicle.year}`;
            for (const owner of sourceOwners) {
                await this.notificationService.createNotification({
                    userId: owner.id,
                    title: 'Unit Disalin',
                    message: `${requestor.name} menyalin data kendaraan ${vehicleLabel} dari inventaris Anda.`,
                    type: 'info',
                    link: '/app/inventory',
                });
            }
        } catch {
            // Non-critical: don't fail the copy if notification fails
        }

        return newVehicle;
    }

    // ==================== MASTER DATA SEEDING ====================

    /**
     * Seeds popular Indonesian vehicle brands, models, and variants
     * for a new tenant during onboarding. Uses upsert to avoid duplicates.
     */
    async seedDefaultBrands(tenantId: string) {
        const defaultBrands: { name: string; category: string; models: { name: string; variants?: string }[] }[] = [
            // ── CARS ──
            {
                name: 'Toyota', category: 'CAR', models: [
                    { name: 'Avanza', variants: '1.3 E MT,1.3 E AT,1.5 G MT,1.5 G AT' },
                    { name: 'Innova', variants: 'G MT,G AT,V MT,V AT,Venturer' },
                    { name: 'Innova Zenix', variants: 'G,V,Q,V HEV,Q HEV' },
                    { name: 'Rush', variants: '1.5 S MT,1.5 S AT,1.5 G MT,1.5 G AT,TRD Sportivo' },
                    { name: 'Yaris', variants: 'E CVT,G CVT,TRD Sportivo CVT' },
                    { name: 'Fortuner', variants: '2.4 G MT,2.4 G AT,2.4 VRZ AT,2.8 GR Sport AT' },
                    { name: 'Calya', variants: '1.2 E MT,1.2 E AT,1.2 G MT,1.2 G AT' },
                    { name: 'Raize', variants: '1.0T G CVT,1.0T GR Sport CVT,1.2 G MT' },
                    { name: 'Agya', variants: '1.0 E MT,1.0 E AT,1.2 G MT,1.2 G AT,1.2 GR Sport AT' },
                    { name: 'Veloz', variants: '1.5 MT,1.5 CVT,Q CVT' },
                    { name: 'HiLux', variants: 'Single Cab,Double Cab E,Double Cab G,Double Cab V' },
                ],
            },
            {
                name: 'Honda', category: 'CAR', models: [
                    { name: 'Brio', variants: 'S MT,E MT,E CVT,RS MT,RS CVT' },
                    { name: 'Jazz', variants: 'S MT,S CVT,RS CVT' },
                    { name: 'HR-V', variants: '1.5 S CVT,1.5 E CVT,1.5 Turbo RS' },
                    { name: 'CR-V', variants: '1.5 Turbo,1.5 Turbo Prestige' },
                    { name: 'Civic', variants: '1.5 Turbo,1.5 Turbo RS' },
                    { name: 'City', variants: 'S CVT,E CVT,RS CVT' },
                    { name: 'BR-V', variants: 'S MT,E CVT,Prestige CVT' },
                    { name: 'WR-V', variants: 'E CVT,RS CVT' },
                    { name: 'Mobilio', variants: 'S MT,E MT,E CVT,RS CVT' },
                ],
            },
            {
                name: 'Mitsubishi', category: 'CAR', models: [
                    { name: 'Xpander', variants: 'GLS MT,GLS AT,Exceed MT,Exceed AT,Ultimate AT,Cross AT' },
                    { name: 'Pajero Sport', variants: 'GLX MT,Exceed AT,Dakar AT,Dakar Ultimate AT' },
                    { name: 'L300', variants: 'Pickup,Minibus' },
                    { name: 'Outlander', variants: '2.0 CVT,2.4 CVT,PHEV' },
                    { name: 'Triton', variants: 'Single Cab,Double Cab GLS,Double Cab Exceed,Double Cab Ultimate' },
                ],
            },
            {
                name: 'Suzuki', category: 'CAR', models: [
                    { name: 'Ertiga', variants: 'GA MT,GL MT,GL AT,GX MT,GX AT,Sport AT' },
                    { name: 'XL7', variants: 'Zeta MT,Zeta AT,Alpha MT,Alpha AT,Beta AT' },
                    { name: 'Baleno', variants: 'MT,AT' },
                    { name: 'Swift', variants: 'GS,GX' },
                    { name: 'Jimny', variants: '5MT,4AT' },
                    { name: 'Carry', variants: 'Pickup FD,Pickup WD,Minibus' },
                    { name: 'S-Presso', variants: 'MT,AGS' },
                ],
            },
            {
                name: 'Daihatsu', category: 'CAR', models: [
                    { name: 'Xenia', variants: '1.3 X MT,1.3 X AT,1.5 R MT,1.5 R AT' },
                    { name: 'Terios', variants: 'X MT,X AT,R MT,R AT,R Adventure AT' },
                    { name: 'Ayla', variants: '1.0 D MT,1.0 X MT,1.2 R MT,1.2 R AT' },
                    { name: 'Sigra', variants: '1.0 D MT,1.0 M MT,1.2 X MT,1.2 R MT,1.2 R AT' },
                    { name: 'Rocky', variants: '1.0T MC CVT,1.0T ADS CVT,1.2 X MT' },
                    { name: 'Gran Max', variants: 'Pickup,Minibus' },
                ],
            },
            {
                name: 'Hyundai', category: 'CAR', models: [
                    { name: 'Creta', variants: 'Active IVT,Style IVT,Prime IVT' },
                    { name: 'Stargazer', variants: 'Active IVT,Trend IVT,Prime IVT,X' },
                    { name: 'Ioniq 5', variants: 'Standard,Long Range,N Performance' },
                    { name: 'Santa Fe', variants: '2.5 MPI,2.2 CRDi' },
                ],
            },
            {
                name: 'Nissan', category: 'CAR', models: [
                    { name: 'Livina', variants: 'E MT,E CVT,VE CVT,VL CVT' },
                    { name: 'Kicks', variants: 'e-POWER' },
                    { name: 'Magnite', variants: 'MT,CVT' },
                    { name: 'X-Trail', variants: 'e-POWER' },
                ],
            },
            {
                name: 'Wuling', category: 'CAR', models: [
                    { name: 'Confero', variants: '1.5 C,1.5 L,1.5 S' },
                    { name: 'Almaz', variants: '1.5T Lux CVT,RS Pro,Hybrid' },
                    { name: 'Air EV', variants: 'Standard,Long Range' },
                ],
            },

            // ── MOTORCYCLES ──
            {
                name: 'Honda', category: 'MOTORCYCLE', models: [
                    { name: 'Beat', variants: 'CBS,Street,Deluxe' },
                    { name: 'Vario 125', variants: 'CBS,CBS ISS' },
                    { name: 'Vario 160', variants: 'CBS,ABS' },
                    { name: 'Scoopy', variants: 'Fashion,Sporty,Prestige' },
                    { name: 'PCX 160', variants: 'CBS,ABS' },
                    { name: 'ADV 160', variants: 'CBS,ABS' },
                    { name: 'CBR150R', variants: 'Standard,ABS' },
                    { name: 'CRF150L', variants: 'Standard' },
                    { name: 'CB150R', variants: 'Streetfire' },
                    { name: 'CB150X', variants: 'Standard,ABS' },
                ],
            },
            {
                name: 'Yamaha', category: 'MOTORCYCLE', models: [
                    { name: 'NMAX', variants: '155 Standard,155 Connected,155 ABS' },
                    { name: 'Aerox 155', variants: 'Standard,S,Connected' },
                    { name: 'MX King 155', variants: 'Standard' },
                    { name: 'MT-15', variants: 'Standard,ABS' },
                    { name: 'R15', variants: 'Standard,Connected,M' },
                    { name: 'Mio', variants: 'M3,Gear S' },
                    { name: 'XSR 155', variants: 'Standard' },
                    { name: 'Fazzio', variants: '125 Standard,Hybrid Connected' },
                    { name: 'Filano', variants: 'Standard,ABS' },
                ],
            },
            {
                name: 'Kawasaki', category: 'MOTORCYCLE', models: [
                    { name: 'Ninja 250', variants: 'Standard,ABS,SE' },
                    { name: 'KLX 150', variants: 'Standard,L,BF,BF SE,Supermoto' },
                    { name: 'W175', variants: 'Standard,Cafe,SE' },
                    { name: 'Ninja ZX-25R', variants: 'Standard,SE' },
                ],
            },
            {
                name: 'Suzuki', category: 'MOTORCYCLE', models: [
                    { name: 'Satria F150', variants: 'Standard,Injection' },
                    { name: 'GSX-R150', variants: 'Standard,ABS' },
                    { name: 'Nex II', variants: 'Standard,Cross' },
                    { name: 'Address', variants: 'Standard,Playful' },
                ],
            },
        ];

        for (const brandData of defaultBrands) {
            const brand = await this.prisma.vehicleBrand.upsert({
                where: {
                    tenantId_name_category: {
                        tenantId,
                        name: brandData.name,
                        category: brandData.category,
                    },
                },
                update: {},
                create: {
                    tenantId,
                    name: brandData.name,
                    category: brandData.category,
                },
            });

            for (const modelData of brandData.models) {
                await this.prisma.vehicleModel.upsert({
                    where: {
                        brandId_name: {
                            brandId: brand.id,
                            name: modelData.name,
                        },
                    },
                    update: { variants: modelData.variants ?? null },
                    create: {
                        brandId: brand.id,
                        name: modelData.name,
                        variants: modelData.variants ?? null,
                    },
                });
            }
        }
    }
}
