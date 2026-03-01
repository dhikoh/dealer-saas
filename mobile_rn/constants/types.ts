export type ThemeMode = 'light' | 'dark';

// Vehicle type matching backend Prisma schema exactly
export interface Vehicle {
    id: string;
    category: string;
    make: string;
    brand?: string; // alias for make (backward compat)
    model: string;
    variant?: string;
    year: number;
    color: string;
    price: number;
    purchasePrice?: number;
    licensePlate?: string;
    frameNumber?: string;
    condition: 'READY' | 'REPAIR' | 'RESERVED';
    status: 'AVAILABLE' | 'BOOKED' | 'SOLD';
    stock?: string | null;
    image?: string | null;
    images?: string | null;
    branchId?: string;
}

// Transaction type
export interface Transaction {
    id: string;
    invoiceNumber: string;
    type: 'SALE' | 'PURCHASE';
    status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
    paymentType: 'CASH' | 'CREDIT';
    finalPrice: number;
    date: string;
    notes?: string;
    vehicle?: { id: string; make: string; model: string };
    customer?: { id: string; name: string; phone?: string };
    salesPerson?: { id: string; name: string };
}

// Customer type
export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    ktpNumber?: string;
    type?: string;
    source?: string;
    notes?: string;
    createdAt: string;
}

// Operating Cost type
export interface OperatingCost {
    id: string;
    name: string;
    amount: number;
    category: string;
    date: string;
    note?: string;
}

// Notification type
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link?: string;
    createdAt: string;
}

// User profile shape from /auth/me
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role?: string;
    tenantId?: string;
}
