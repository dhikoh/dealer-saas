import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Recursively removes null and undefined values from an object.
 * Useful for strict backend DTOs that reject null for optional fields.
 */
export function sanitizePayload(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(v => sanitizePayload(v))
      .filter(v => v !== undefined && v !== null);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      const value = sanitizePayload(obj[key]);
      if (value !== undefined && value !== null) {
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}
