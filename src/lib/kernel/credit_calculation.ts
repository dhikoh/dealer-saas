/**
 * LOGIC KERNEL - Credit Calculation
 * 
 * Single Source of Truth untuk semua perhitungan kredit.
 * TIDAK BOLEH ada logic perhitungan di UI atau API lain.
 * 
 * @module kernel/credit_calculation
 */

import { Decimal } from "@prisma/client/runtime/library";

export interface CreditCalculationInput {
    vehiclePrice: number;
    downPayment: number;
    tenor: number; // dalam bulan
    interestRate: number; // flat rate per tahun dalam persen (misal: 15 = 15%)
    adminFee?: number;
    insuranceFee?: number;
}

export interface CreditCalculationResult {
    vehiclePrice: number;
    downPayment: number;
    downPaymentPercentage: number;
    principalAmount: number; // Pokok hutang (harga - DP)
    tenor: number;
    interestRate: number;
    totalInterest: number;
    totalCredit: number; // Pokok + Bunga
    monthlyPayment: number;
    adminFee: number;
    insuranceFee: number;
    totalPayment: number; // DP + Total Credit + Admin + Insurance
}

/**
 * Menghitung cicilan bulanan dengan metode FLAT
 * 
 * Rumus Flat:
 * Bunga Total = (Pokok × Rate × Tenor) / 12
 * Cicilan = (Pokok + Bunga Total) / Tenor
 */
export function calculateMonthlyPaymentFlat(
    principal: number,
    annualInterestRate: number,
    tenorMonths: number
): number {
    if (principal <= 0 || tenorMonths <= 0) return 0;

    // Hitung bunga total
    const totalInterest = (principal * (annualInterestRate / 100) * tenorMonths) / 12;

    // Total yang harus dibayar
    const totalPayment = principal + totalInterest;

    // Cicilan per bulan
    return Math.round(totalPayment / tenorMonths);
}

/**
 * Menghitung cicilan bulanan dengan metode EFEKTIF (Anuitas)
 * 
 * Rumus Anuitas:
 * M = P × [r(1+r)^n] / [(1+r)^n - 1]
 * 
 * Di mana:
 * M = Cicilan bulanan
 * P = Pokok hutang
 * r = Bunga per bulan (rate tahunan / 12 / 100)
 * n = Tenor dalam bulan
 */
export function calculateMonthlyPaymentEffective(
    principal: number,
    annualInterestRate: number,
    tenorMonths: number
): number {
    if (principal <= 0 || tenorMonths <= 0) return 0;
    if (annualInterestRate === 0) return Math.round(principal / tenorMonths);

    const monthlyRate = annualInterestRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, tenorMonths);
    const monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);

    return Math.round(monthlyPayment);
}

/**
 * Menghitung total kredit dari cicilan bulanan
 */
export function calculateTotalCredit(
    monthlyPayment: number,
    tenorMonths: number
): number {
    return monthlyPayment * tenorMonths;
}

/**
 * Konversi rate flat ke rate efektif (aproximasi)
 * 
 * Rumus pendekatan:
 * Effective Rate ≈ Flat Rate × 1.8 sampai 2.0
 */
export function flatToEffectiveRate(flatRate: number, tenorMonths: number): number {
    // Faktor konversi tergantung tenor
    const factor = 1.8 + (tenorMonths / 120) * 0.2; // 1.8 - 2.0
    return flatRate * factor;
}

/**
 * Konversi rate efektif ke rate flat (aproximasi)
 */
export function effectiveToFlatRate(effectiveRate: number, tenorMonths: number): number {
    const factor = 1.8 + (tenorMonths / 120) * 0.2;
    return effectiveRate / factor;
}

/**
 * Menghitung persentase DP dari harga kendaraan
 */
export function calculateDpPercentage(
    vehiclePrice: number,
    downPayment: number
): number {
    if (vehiclePrice <= 0) return 0;
    return Math.round((downPayment / vehiclePrice) * 100 * 100) / 100;
}

/**
 * Menghitung DP dari persentase
 */
export function calculateDpFromPercentage(
    vehiclePrice: number,
    dpPercentage: number
): number {
    return Math.round(vehiclePrice * (dpPercentage / 100));
}

/**
 * Validasi DP minimum dan maksimum
 */
export function validateDownPayment(
    vehiclePrice: number,
    downPayment: number,
    minDpPercentage: number = 10,
    maxDpPercentage: number = 50
): { isValid: boolean; message?: string } {
    const dpPercentage = calculateDpPercentage(vehiclePrice, downPayment);

    if (dpPercentage < minDpPercentage) {
        return {
            isValid: false,
            message: `DP minimal ${minDpPercentage}% dari harga kendaraan (Rp ${calculateDpFromPercentage(vehiclePrice, minDpPercentage).toLocaleString('id-ID')})`
        };
    }

    if (dpPercentage > maxDpPercentage) {
        return {
            isValid: false,
            message: `DP maksimal ${maxDpPercentage}% dari harga kendaraan`
        };
    }

    return { isValid: true };
}

/**
 * Kalkulasi kredit lengkap
 * 
 * Ini adalah fungsi utama yang harus dipanggil oleh API dan UI
 */
export function calculateCredit(input: CreditCalculationInput): CreditCalculationResult {
    const {
        vehiclePrice,
        downPayment,
        tenor,
        interestRate,
        adminFee = 0,
        insuranceFee = 0
    } = input;

    // Hitung pokok hutang
    const principalAmount = vehiclePrice - downPayment;

    // Hitung DP percentage
    const downPaymentPercentage = calculateDpPercentage(vehiclePrice, downPayment);

    // Hitung cicilan dengan metode flat
    const monthlyPayment = calculateMonthlyPaymentFlat(principalAmount, interestRate, tenor);

    // Hitung total kredit
    const totalCredit = calculateTotalCredit(monthlyPayment, tenor);

    // Hitung total bunga
    const totalInterest = totalCredit - principalAmount;

    // Total pembayaran keseluruhan
    const totalPayment = downPayment + totalCredit + adminFee + insuranceFee;

    return {
        vehiclePrice,
        downPayment,
        downPaymentPercentage,
        principalAmount,
        tenor,
        interestRate,
        totalInterest,
        totalCredit,
        monthlyPayment,
        adminFee,
        insuranceFee,
        totalPayment
    };
}

/**
 * Format angka ke format Rupiah
 */
export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Generate tabel amortisasi untuk kredit efektif
 */
export interface AmortizationRow {
    month: number;
    openingBalance: number;
    monthlyPayment: number;
    principal: number;
    interest: number;
    closingBalance: number;
}

export function generateAmortizationTable(
    principal: number,
    annualInterestRate: number,
    tenorMonths: number
): AmortizationRow[] {
    const rows: AmortizationRow[] = [];
    const monthlyRate = annualInterestRate / 100 / 12;
    const monthlyPayment = calculateMonthlyPaymentEffective(principal, annualInterestRate, tenorMonths);

    let balance = principal;

    for (let month = 1; month <= tenorMonths; month++) {
        const interest = Math.round(balance * monthlyRate);
        const principalPaid = monthlyPayment - interest;
        const closingBalance = Math.max(0, balance - principalPaid);

        rows.push({
            month,
            openingBalance: Math.round(balance),
            monthlyPayment,
            principal: principalPaid,
            interest,
            closingBalance: Math.round(closingBalance)
        });

        balance = closingBalance;
    }

    return rows;
}
