'use client';

// Centralized Multi-Currency Formatting Utility for OTOHUB
// Supports 15 currencies across Southeast Asia, East Asia, and International markets

export type CurrencyCode =
    | 'IDR' | 'USD' | 'EUR' | 'GBP' | 'JPY'
    | 'SGD' | 'MYR' | 'THB' | 'PHP' | 'VND'
    | 'AUD' | 'CNY' | 'KRW' | 'INR' | 'AED';

export interface CurrencyInfo {
    code: CurrencyCode;
    symbol: string;
    locale: string;
    name: string;
    nameId: string; // Indonesian name for display in ID locale
    decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
    IDR: { code: 'IDR', symbol: 'Rp', locale: 'id-ID', name: 'Indonesian Rupiah', nameId: 'Rupiah Indonesia', decimals: 0 },
    USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar', nameId: 'Dolar AS', decimals: 2 },
    EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro', nameId: 'Euro', decimals: 2 },
    GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound', nameId: 'Poundsterling', decimals: 2 },
    JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen', nameId: 'Yen Jepang', decimals: 0 },
    SGD: { code: 'SGD', symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar', nameId: 'Dolar Singapura', decimals: 2 },
    MYR: { code: 'MYR', symbol: 'RM', locale: 'ms-MY', name: 'Malaysian Ringgit', nameId: 'Ringgit Malaysia', decimals: 2 },
    THB: { code: 'THB', symbol: '฿', locale: 'th-TH', name: 'Thai Baht', nameId: 'Baht Thailand', decimals: 2 },
    PHP: { code: 'PHP', symbol: '₱', locale: 'fil-PH', name: 'Philippine Peso', nameId: 'Peso Filipina', decimals: 2 },
    VND: { code: 'VND', symbol: '₫', locale: 'vi-VN', name: 'Vietnamese Dong', nameId: 'Dong Vietnam', decimals: 0 },
    AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar', nameId: 'Dolar Australia', decimals: 2 },
    CNY: { code: 'CNY', symbol: '¥', locale: 'zh-CN', name: 'Chinese Yuan', nameId: 'Yuan Tiongkok', decimals: 2 },
    KRW: { code: 'KRW', symbol: '₩', locale: 'ko-KR', name: 'South Korean Won', nameId: 'Won Korea', decimals: 0 },
    INR: { code: 'INR', symbol: '₹', locale: 'hi-IN', name: 'Indian Rupee', nameId: 'Rupee India', decimals: 2 },
    AED: { code: 'AED', symbol: 'د.إ', locale: 'ar-AE', name: 'UAE Dirham', nameId: 'Dirham UAE', decimals: 2 },
};

/**
 * Format a number as currency using the specified currency code.
 * Uses Intl.NumberFormat for proper locale-aware formatting.
 */
export function formatCurrency(value: number, currencyCode: CurrencyCode = 'IDR'): string {
    const config = CURRENCIES[currencyCode];
    if (!config) {
        return `${value}`;
    }

    try {
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.code,
            minimumFractionDigits: config.decimals,
            maximumFractionDigits: config.decimals,
        }).format(value);
    } catch {
        // Fallback: manual formatting
        const formatted = value.toLocaleString(config.locale, {
            minimumFractionDigits: config.decimals,
            maximumFractionDigits: config.decimals,
        });
        return `${config.symbol} ${formatted}`;
    }
}

/**
 * Format currency in compact/abbreviated form (e.g., Rp 1.5M, $2.3K)
 * Used in charts and summary cards where space is limited.
 */
export function formatCurrencyCompact(value: number, currencyCode: CurrencyCode = 'IDR'): string {
    const config = CURRENCIES[currencyCode];
    const symbol = config?.symbol || '';

    if (value >= 1_000_000_000) {
        return `${symbol}${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
        return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
        return `${symbol}${(value / 1_000).toFixed(0)}K`;
    }
    return `${symbol}${value}`;
}

/**
 * Get a sorted list of all supported currencies for dropdowns/selectors.
 */
export function getCurrencyList(): CurrencyInfo[] {
    return Object.values(CURRENCIES).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get the default currency code from localStorage, defaulting to 'IDR'.
 */
export function getStoredCurrency(): CurrencyCode {
    if (typeof window === 'undefined') return 'IDR';
    const stored = localStorage.getItem('app_currency') as CurrencyCode | null;
    return stored && CURRENCIES[stored] ? stored : 'IDR';
}

/**
 * Save currency preference to localStorage.
 */
export function setStoredCurrency(code: CurrencyCode): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('app_currency', code);
    }
}
