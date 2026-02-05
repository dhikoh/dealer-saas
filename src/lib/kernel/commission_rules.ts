/**
 * LOGIC KERNEL - Commission Rules
 * 
 * Aturan perhitungan komisi sales.
 * 
 * @module kernel/commission_rules
 */

export type PaymentMethod = 'cash' | 'credit';

export interface CommissionConfig {
    basePercentage: number;
    bonusPercentage: number;
    minAmount: number;
    maxAmount: number;
}

/**
 * Konfigurasi komisi berdasarkan metode pembayaran
 */
export function getCommissionConfig(paymentMethod: PaymentMethod): CommissionConfig {
    if (paymentMethod === 'cash') {
        return {
            basePercentage: 1.0, // 1% dari harga jual
            bonusPercentage: 0.5, // Bonus jika target tercapai
            minAmount: 100000,
            maxAmount: 5000000
        };
    } else {
        // Credit biasanya komisi lebih rendah karena ada komisi dari leasing
        return {
            basePercentage: 0.5,
            bonusPercentage: 0.25,
            minAmount: 50000,
            maxAmount: 3000000
        };
    }
}

/**
 * Menghitung komisi sales
 */
export function calculateCommission(
    sellingPrice: number,
    paymentMethod: PaymentMethod,
    isTargetMet: boolean = false
): number {
    const config = getCommissionConfig(paymentMethod);

    let percentage = config.basePercentage;
    if (isTargetMet) {
        percentage += config.bonusPercentage;
    }

    let commission = sellingPrice * (percentage / 100);

    // Apply min/max limits
    commission = Math.max(config.minAmount, commission);
    commission = Math.min(config.maxAmount, commission);

    return Math.round(commission);
}

/**
 * Menghitung komisi dengan margin profit
 * Komisi berdasarkan keuntungan, bukan harga jual
 */
export function calculateCommissionFromProfit(
    sellingPrice: number,
    purchasePrice: number,
    commissionPercentage: number = 10 // Default 10% dari profit
): number {
    const profit = sellingPrice - purchasePrice;

    if (profit <= 0) {
        return 0;
    }

    return Math.round(profit * (commissionPercentage / 100));
}

/**
 * Struktur komisi bertingkat (tiered)
 */
export interface TieredCommission {
    threshold: number;
    percentage: number;
}

export const DEFAULT_COMMISSION_TIERS: TieredCommission[] = [
    { threshold: 50000000, percentage: 1.0 },   // Di bawah 50 juta: 1%
    { threshold: 100000000, percentage: 1.25 }, // 50-100 juta: 1.25%
    { threshold: 200000000, percentage: 1.5 },  // 100-200 juta: 1.5%
    { threshold: Infinity, percentage: 2.0 }    // Di atas 200 juta: 2%
];

export function calculateTieredCommission(
    sellingPrice: number,
    tiers: TieredCommission[] = DEFAULT_COMMISSION_TIERS
): number {
    const tier = tiers.find(t => sellingPrice <= t.threshold);
    const percentage = tier?.percentage || 1.0;

    return Math.round(sellingPrice * (percentage / 100));
}
