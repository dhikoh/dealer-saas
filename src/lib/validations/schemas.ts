import { z } from "zod";

// ==========================================
// USER SCHEMAS
// ==========================================

export const loginSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter")
});

export const registerSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"]
});

export const userSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter").optional(),
    phone: z.string().optional(),
    role: z.enum(["owner", "sales", "finance", "staff"]),
    isActive: z.boolean().default(true)
});

// ==========================================
// TENANT SCHEMAS
// ==========================================

export const tenantSchema = z.object({
    name: z.string().min(2, "Nama dealer minimal 2 karakter"),
    slug: z.string().min(2, "Slug minimal 2 karakter").regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email tidak valid").optional().or(z.literal("")),
    website: z.string().url("URL tidak valid").optional().or(z.literal("")),
    subscription: z.enum(["trial", "basic", "pro", "enterprise"]).default("trial"),
    isActive: z.boolean().default(true)
});

// ==========================================
// VEHICLE SCHEMAS
// ==========================================

export const vehicleBrandSchema = z.object({
    name: z.string().min(1, "Nama brand harus diisi"),
    logoUrl: z.string().url().optional().or(z.literal("")),
    scope: z.enum(["global", "tenant"]).default("tenant"),
    isActive: z.boolean().default(true)
});

export const vehicleModelSchema = z.object({
    brandId: z.string().min(1, "Brand harus dipilih"),
    name: z.string().min(1, "Nama model harus diisi"),
    category: z.enum(["motor", "mobil"]),
    scope: z.enum(["global", "tenant"]).default("tenant"),
    isActive: z.boolean().default(true)
});

export const vehicleVariantSchema = z.object({
    modelId: z.string().min(1, "Model harus dipilih"),
    name: z.string().min(1, "Nama varian harus diisi"),
    engineCc: z.number().int().positive().optional(),
    transmission: z.enum(["manual", "automatic", "cvt"]).optional(),
    fuelType: z.enum(["bensin", "diesel", "listrik", "hybrid"]).optional(),
    scope: z.enum(["global", "tenant"]).default("tenant"),
    isActive: z.boolean().default(true)
});

export const vehicleSchema = z.object({
    variantId: z.string().min(1, "Varian harus dipilih"),
    stockCode: z.string().optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    color: z.string().min(1, "Warna harus diisi"),
    condition: z.enum(["baru", "bekas"]),
    vinNumber: z.string().optional(),
    engineNumber: z.string().optional(),
    plateNumber: z.string().optional(),
    purchasePrice: z.number().positive().optional(),
    sellingPrice: z.number().positive("Harga jual harus lebih dari 0"),
    status: z.enum(["available", "reserved", "sold"]).default("available"),
    notes: z.string().optional()
});

export const vehicleLegalSchema = z.object({
    vehicleId: z.string().min(1),
    stnkNumber: z.string().optional(),
    stnkExpiry: z.string().datetime().optional().or(z.literal("")),
    stnkName: z.string().optional(),
    bpkbNumber: z.string().optional(),
    bpkbStatus: z.enum(["ada", "proses", "hilang", "kosong"]).optional(),
    bpkbName: z.string().optional(),
    taxExpiry: z.string().datetime().optional().or(z.literal("")),
    legalStatus: z.enum(["lengkap", "tidak_lengkap", "proses"]).default("lengkap"),
    notes: z.string().optional()
});

export const vehicleConditionSchema = z.object({
    vehicleId: z.string().min(1),
    mileage: z.number().int().min(0).optional(),
    engineCondition: z.enum(["baik", "cukup", "kurang"]).optional(),
    bodyCondition: z.enum(["baik", "cukup", "kurang"]).optional(),
    interiorCondition: z.enum(["baik", "cukup", "kurang"]).optional(),
    electricalCondition: z.enum(["baik", "cukup", "kurang"]).optional(),
    tireCondition: z.enum(["baik", "cukup", "kurang"]).optional(),
    serviceHistory: z.boolean().default(false),
    repairNotes: z.string().optional(),
    grade: z.enum(["A", "B", "C", "D"]).optional()
});

// ==========================================
// CUSTOMER SCHEMAS
// ==========================================

export const customerSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
    email: z.string().email("Email tidak valid").optional().or(z.literal("")),
    address: z.string().optional(),
    nik: z.string().length(16, "NIK harus 16 digit").optional().or(z.literal("")),
    birthDate: z.string().datetime().optional().or(z.literal("")),
    gender: z.enum(["L", "P"]).optional(),
    job: z.string().optional(),
    source: z.string().optional(),
    notes: z.string().optional()
});

// ==========================================
// SALES DRAFT SCHEMAS
// ==========================================

export const salesDraftSchema = z.object({
    customerId: z.string().min(1, "Customer harus dipilih"),
    vehicleId: z.string().min(1, "Kendaraan harus dipilih"),
    notes: z.string().optional(),
    validUntil: z.string().datetime().optional(),
    pricing: z.object({
        paymentMethod: z.enum(["cash", "credit"]),
        vehiclePrice: z.number().positive(),
        discount: z.number().min(0).optional(),
        downPayment: z.number().min(0).optional(),
        tenor: z.number().int().positive().optional(),
        interestRate: z.number().min(0).optional(),
        monthlyPayment: z.number().positive().optional(),
        adminFee: z.number().min(0).optional(),
        insuranceFee: z.number().min(0).optional(),
        totalAmount: z.number().positive(),
        leasingPartnerId: z.string().optional()
    }).optional()
});

export const salesDraftPricingSchema = z.object({
    salesDraftId: z.string().min(1),
    paymentType: z.enum(["cash", "credit"]),
    vehiclePrice: z.number().positive("Harga harus lebih dari 0"),
    discount: z.number().min(0).optional(),
    netPrice: z.number().positive(),
    downPayment: z.number().min(0).optional(),
    tenor: z.number().int().positive().optional(),
    leasingPartnerId: z.string().optional(),
    interestRate: z.number().min(0).max(100).optional(),
    monthlyPayment: z.number().positive().optional(),
    totalCredit: z.number().positive().optional(),
    adminFee: z.number().min(0).optional(),
    insuranceFee: z.number().min(0).optional(),
    otherFees: z.number().min(0).optional(),
    notes: z.string().optional()
});

// ==========================================
// LEASING SCHEMAS
// ==========================================

export const leasingPartnerSchema = z.object({
    name: z.string().min(2, "Nama leasing minimal 2 karakter"),
    code: z.string().min(2, "Kode minimal 2 karakter").toUpperCase(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    picName: z.string().optional(),
    picPhone: z.string().optional(),
    isActive: z.boolean().default(true)
});

export const leasingRateSchema = z.object({
    leasingPartnerId: z.string().min(1),
    tenor: z.number().int().positive(),
    interestRate: z.number().min(0).max(100),
    vehicleCategory: z.enum(["motor", "mobil"]),
    vehicleCondition: z.enum(["baru", "bekas"]),
    minDp: z.number().min(0).max(100).optional(),
    maxDp: z.number().min(0).max(100).optional(),
    adminFee: z.number().min(0).optional(),
    insuranceRate: z.number().min(0).max(100).optional(),
    isActive: z.boolean().default(true)
});

// ==========================================
// CREDIT SIMULATION SCHEMA
// ==========================================

export const creditSimulationSchema = z.object({
    vehiclePrice: z.number().positive("Harga kendaraan harus lebih dari 0"),
    downPayment: z.number().min(0, "DP tidak boleh negatif"),
    tenor: z.number().int().positive("Tenor harus lebih dari 0"),
    interestRate: z.number().min(0).max(100, "Rate harus antara 0-100"),
    adminFee: z.number().min(0).optional(),
    insuranceFee: z.number().min(0).optional()
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type TenantInput = z.infer<typeof tenantSchema>;
export type VehicleBrandInput = z.infer<typeof vehicleBrandSchema>;
export type VehicleModelInput = z.infer<typeof vehicleModelSchema>;
export type VehicleVariantInput = z.infer<typeof vehicleVariantSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type VehicleLegalInput = z.infer<typeof vehicleLegalSchema>;
export type VehicleConditionInput = z.infer<typeof vehicleConditionSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type SalesDraftInput = z.infer<typeof salesDraftSchema>;
export type SalesDraftPricingInput = z.infer<typeof salesDraftPricingSchema>;
export type LeasingPartnerInput = z.infer<typeof leasingPartnerSchema>;
export type LeasingRateInput = z.infer<typeof leasingRateSchema>;
export type CreditSimulationInput = z.infer<typeof creditSimulationSchema>;
