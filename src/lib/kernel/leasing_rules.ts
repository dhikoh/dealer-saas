/**
 * LOGIC KERNEL - Leasing Rules
 * 
 * Single Source of Truth untuk aturan leasing dan kredit.
 * Semua validasi dan penentuan rate HARUS melalui modul ini.
 * 
 * @module kernel/leasing_rules
 */

export type VehicleCategory = 'motor' | 'mobil';
export type VehicleCondition = 'baru' | 'bekas';

export interface LeasingRateConfig {
    tenor: number;
    interestRate: number;
    minDpPercentage: number;
    maxDpPercentage: number;
    adminFee: number;
    insuranceRate: number;
}

/**
 * Tenor yang tersedia berdasarkan kategori dan kondisi kendaraan
 */
export function getAvailableTenors(
    category: VehicleCategory,
    condition: VehicleCondition
): number[] {
    if (category === 'motor') {
        if (condition === 'baru') {
            return [12, 18, 24, 30, 36];
        } else {
            return [12, 18, 24]; // Bekas tenor lebih pendek
        }
    } else {
        // Mobil
        if (condition === 'baru') {
            return [12, 24, 36, 48, 60];
        } else {
            return [12, 24, 36, 48]; // Bekas tenor lebih pendek
        }
    }
}

/**
 * Mendapatkan batas DP berdasarkan kategori dan kondisi
 */
export function getDpLimits(
    category: VehicleCategory,
    condition: VehicleCondition
): { min: number; max: number } {
    if (category === 'motor') {
        if (condition === 'baru') {
            return { min: 10, max: 50 };
        } else {
            return { min: 20, max: 50 }; // Bekas DP minimal lebih tinggi
        }
    } else {
        // Mobil
        if (condition === 'baru') {
            return { min: 15, max: 50 };
        } else {
            return { min: 25, max: 50 };
        }
    }
}

/**
 * Default interest rates jika tidak ada data dari leasing partner
 * Rate dalam persen flat per tahun
 */
export function getDefaultInterestRate(
    category: VehicleCategory,
    condition: VehicleCondition,
    tenor: number
): number {
    const baseRates: Record<VehicleCategory, Record<VehicleCondition, number>> = {
        motor: {
            baru: 15, // 15% flat per tahun
            bekas: 18
        },
        mobil: {
            baru: 12,
            bekas: 15
        }
    };

    const baseRate = baseRates[category][condition];

    // Tambah premium untuk tenor panjang
    const tenorPremium = Math.floor(tenor / 12) * 0.5;

    return baseRate + tenorPremium;
}

/**
 * Menghitung admin fee default berdasarkan harga kendaraan
 */
export function calculateDefaultAdminFee(
    vehiclePrice: number,
    category: VehicleCategory
): number {
    if (category === 'motor') {
        // Motor: admin fee tetap
        if (vehiclePrice < 20000000) return 500000;
        if (vehiclePrice < 50000000) return 750000;
        return 1000000;
    } else {
        // Mobil: berdasarkan persentase, minimum 1 juta
        const fee = vehiclePrice * 0.01; // 1%
        return Math.max(1000000, Math.round(fee / 100000) * 100000);
    }
}

/**
 * Menghitung insurance fee default
 * Rate dalam persen dari harga kendaraan per tahun
 */
export function calculateDefaultInsuranceFee(
    vehiclePrice: number,
    category: VehicleCategory,
    condition: VehicleCondition,
    tenorMonths: number
): number {
    const annualRates: Record<VehicleCategory, Record<VehicleCondition, number>> = {
        motor: {
            baru: 2.5, // 2.5% per tahun
            bekas: 3.0
        },
        mobil: {
            baru: 2.8,
            bekas: 3.5
        }
    };

    const annualRate = annualRates[category][condition];
    const years = tenorMonths / 12;

    // Premi total untuk seluruh masa kredit
    const totalPremium = vehiclePrice * (annualRate / 100) * years;

    return Math.round(totalPremium / 100000) * 100000;
}

/**
 * Validasi apakah kombinasi tenor, DP, dan rate valid
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateCreditApplication(
    vehiclePrice: number,
    downPayment: number,
    tenor: number,
    category: VehicleCategory,
    condition: VehicleCondition
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validasi tenor
    const availableTenors = getAvailableTenors(category, condition);
    if (!availableTenors.includes(tenor)) {
        errors.push(`Tenor ${tenor} bulan tidak tersedia untuk ${category} ${condition}`);
    }

    // Validasi DP
    const dpLimits = getDpLimits(category, condition);
    const dpPercentage = (downPayment / vehiclePrice) * 100;

    if (dpPercentage < dpLimits.min) {
        errors.push(`DP minimal ${dpLimits.min}% untuk ${category} ${condition}`);
    }

    if (dpPercentage > dpLimits.max) {
        warnings.push(`DP ${dpPercentage.toFixed(1)}% melebihi batas umum ${dpLimits.max}%`);
    }

    // Validasi harga minimum
    const minPrices: Record<VehicleCategory, number> = {
        motor: 5000000,
        mobil: 50000000
    };

    if (vehiclePrice < minPrices[category]) {
        errors.push(`Harga ${category} minimal Rp ${minPrices[category].toLocaleString('id-ID')}`);
    }

    // Warning untuk tenor panjang
    if (tenor > 36 && category === 'motor') {
        warnings.push('Tenor > 36 bulan untuk motor tidak umum');
    }

    if (tenor > 48 && condition === 'bekas') {
        warnings.push('Tenor > 48 bulan untuk kendaraan bekas berisiko tinggi');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Mendapatkan konfigurasi lengkap untuk simulasi kredit
 */
export function getCreditConfig(
    vehiclePrice: number,
    category: VehicleCategory,
    condition: VehicleCondition,
    tenor: number
): LeasingRateConfig {
    const dpLimits = getDpLimits(category, condition);

    return {
        tenor,
        interestRate: getDefaultInterestRate(category, condition, tenor),
        minDpPercentage: dpLimits.min,
        maxDpPercentage: dpLimits.max,
        adminFee: calculateDefaultAdminFee(vehiclePrice, category),
        insuranceRate: category === 'motor'
            ? (condition === 'baru' ? 2.5 : 3.0)
            : (condition === 'baru' ? 2.8 : 3.5)
    };
}
