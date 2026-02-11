'use client';

import { useState, useEffect } from 'react';
import {
    formatCurrency,
    formatCurrencyCompact,
    getCurrencyList,
    getStoredCurrency,
    setStoredCurrency,
    CurrencyCode,
    CurrencyInfo,
} from '@/lib/currency';

/**
 * React hook for multi-currency formatting.
 * Reads/writes currency preference from localStorage('app_currency').
 *
 * Usage:
 *   const { currency, setCurrency, fmt, fmtCompact, currencyList } = useCurrency();
 *   <span>{fmt(150000)}</span>  // "Rp 150.000" or "$150.00" etc.
 */
export function useCurrency() {
    const [currency, setCurrencyState] = useState<CurrencyCode>('IDR');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setCurrencyState(getStoredCurrency());
    }, []);

    const setCurrency = (code: CurrencyCode) => {
        setCurrencyState(code);
        setStoredCurrency(code);
    };

    /** Format a number as full currency string */
    const fmt = (value: number): string => {
        return formatCurrency(value, currency);
    };

    /** Format a number as compact currency (for charts/cards) */
    const fmtCompact = (value: number): string => {
        return formatCurrencyCompact(value, currency);
    };

    const currencyList: CurrencyInfo[] = getCurrencyList();

    return {
        currency,
        setCurrency,
        fmt,
        fmtCompact,
        currencyList,
        mounted,
    };
}

export default useCurrency;
