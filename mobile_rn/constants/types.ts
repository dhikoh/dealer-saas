export type ThemeMode = 'light' | 'dark';

// FIX: Vehicle type updated to match backend Prisma contract exactly.
// - status uses uppercase enum as returned by Prisma (AVAILABLE | RESERVED | SOLD)
// - condition mapped to match backend if applicable
// - price typed as number with null-safety enforced in UI
// - id typed as number (Prisma default Int primary key)
export interface Vehicle {
    id: number;                              // Prisma Int PK
    brand: string;
    model: string;
    variant: string;
    year: number;
    color: string;
    price: number;
    condition: string;                       // flexible — backend may send 'BARU'/'BEKAS' or 'baru'/'bekas'
    status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'available' | 'reserved' | 'sold';
    stock?: string | null;
    image?: string | null;
}

// User profile shape from /auth/me
export interface UserProfile {
    id: number;
    email: string;
    name: string;
    role?: string;
    tenantId?: number;
}
