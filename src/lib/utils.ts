import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah
 */
export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format angka dengan pemisah ribuan
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat("id-ID").format(num);
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatDate(date: Date | string, includeTime = false): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
    };

    if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
    }

    return d.toLocaleDateString("id-ID", options);
}

/**
 * Format tanggal singkat
 */
export function formatDateShort(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/**
 * Slugify string
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + "...";
}

/**
 * Parse phone number to standard format
 */
export function parsePhone(phone: string): string {
    // Remove non-numeric characters
    let cleaned = phone.replace(/\D/g, "");

    // Convert 08xxx to +628xxx
    if (cleaned.startsWith("0")) {
        cleaned = "62" + cleaned.slice(1);
    }

    return cleaned;
}

/**
 * Format phone for display
 */
export function formatPhone(phone: string): string {
    const cleaned = parsePhone(phone);

    if (cleaned.startsWith("62")) {
        const local = cleaned.slice(2);
        // Format: 0812-3456-7890
        return `0${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`;
    }

    return phone;
}

/**
 * Generate WhatsApp link
 */
export function getWhatsAppLink(phone: string, message?: string): string {
    const cleaned = parsePhone(phone);
    let url = `https://wa.me/${cleaned}`;

    if (message) {
        url += `?text=${encodeURIComponent(message)}`;
    }

    return url;
}
