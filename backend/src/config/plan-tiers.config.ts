// Detailed Plan Tier Configuration for OTOHUB SaaS
// Complete feature matrix and business logic

export interface PlanFeatures {
    maxVehicles: number;      // -1 = unlimited
    maxUsers: number;
    maxCustomers: number;
    maxBranches: number;
    pdfExport: boolean;
    internalReports: boolean;
    blacklistAccess: boolean;
    reminderNotifications: boolean;
    multiLanguage: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    advancedAnalytics: boolean;
    dataExport: boolean;
    whatsappIntegration: boolean;
}

export interface PlanTier {
    id: string;
    name: string;
    nameId: string; // Indonesian name
    description: string;
    descriptionId: string;
    price: number;
    priceLabel: string;
    billingCycle: 'monthly' | 'yearly' | null;
    trialDays: number;
    features: PlanFeatures;
    badge: string;
    badgeColor: string;
    recommended: boolean;
    yearlyDiscount: number; // Percentage discount for yearly
}

export const PLAN_TIERS: Record<string, PlanTier> = {
    DEMO: {
        id: 'DEMO',
        name: 'Demo',
        nameId: 'Demo',
        description: 'Free 14-day trial to explore all features',
        descriptionId: 'Uji coba gratis 14 hari untuk eksplorasi fitur',
        price: 0,
        priceLabel: 'Gratis',
        billingCycle: null,
        trialDays: 14,
        features: {
            maxVehicles: 5,
            maxUsers: 1,
            maxCustomers: 20,
            maxBranches: 1,
            pdfExport: true, // Limited trial access
            internalReports: false,
            blacklistAccess: false,
            reminderNotifications: false,
            multiLanguage: false,
            prioritySupport: false,
            apiAccess: false,
            customBranding: false,
            advancedAnalytics: false,
            dataExport: false,
            whatsappIntegration: false,
        },
        badge: 'Trial',
        badgeColor: 'gray',
        recommended: false,
        yearlyDiscount: 0,
    },

    BASIC: {
        id: 'BASIC',
        name: 'Basic',
        nameId: 'Basic',
        description: 'Perfect for small dealerships just getting started',
        descriptionId: 'Cocok untuk dealer kecil yang baru mulai',
        price: 299000,
        priceLabel: 'Rp 299.000',
        billingCycle: 'monthly',
        trialDays: 0,
        features: {
            maxVehicles: 50,
            maxUsers: 3,
            maxCustomers: 200,
            maxBranches: 1,
            pdfExport: true,
            internalReports: false,
            blacklistAccess: true,
            reminderNotifications: true,
            multiLanguage: false,
            prioritySupport: false,
            apiAccess: false,
            customBranding: false,
            advancedAnalytics: false,
            dataExport: true,
            whatsappIntegration: false,
        },
        badge: 'Starter',
        badgeColor: 'blue',
        recommended: false,
        yearlyDiscount: 10, // 10% off for yearly
    },

    PRO: {
        id: 'PRO',
        name: 'Pro',
        nameId: 'Pro',
        description: 'Best for growing dealerships with multiple staff',
        descriptionId: 'Terbaik untuk dealer berkembang dengan banyak staff',
        price: 599000,
        priceLabel: 'Rp 599.000',
        billingCycle: 'monthly',
        trialDays: 0,
        features: {
            maxVehicles: 200,
            maxUsers: 10,
            maxCustomers: 1000,
            maxBranches: 3,
            pdfExport: true,
            internalReports: true,
            blacklistAccess: true,
            reminderNotifications: true,
            multiLanguage: true,
            prioritySupport: false,
            apiAccess: false,
            customBranding: false,
            advancedAnalytics: true,
            dataExport: true,
            whatsappIntegration: true,
        },
        badge: 'Popular',
        badgeColor: 'indigo',
        recommended: true,
        yearlyDiscount: 15, // 15% off for yearly
    },

    UNLIMITED: {
        id: 'UNLIMITED',
        name: 'Unlimited',
        nameId: 'Unlimited',
        description: 'For large dealerships and enterprise needs',
        descriptionId: 'Untuk dealer besar dan kebutuhan enterprise',
        price: 1499000,
        priceLabel: 'Rp 1.499.000',
        billingCycle: 'monthly',
        trialDays: 0,
        features: {
            maxVehicles: -1, // Unlimited
            maxUsers: -1,
            maxCustomers: -1,
            maxBranches: -1,
            pdfExport: true,
            internalReports: true,
            blacklistAccess: true,
            reminderNotifications: true,
            multiLanguage: true,
            prioritySupport: true,
            apiAccess: true,
            customBranding: true,
            advancedAnalytics: true,
            dataExport: true,
            whatsappIntegration: true,
        },
        badge: 'Enterprise',
        badgeColor: 'purple',
        recommended: false,
        yearlyDiscount: 20, // 20% off for yearly
    },
};

// Feature display configuration
export const FEATURE_LABELS = {
    maxVehicles: { label: 'Kendaraan', icon: '🚗', type: 'limit' },
    maxUsers: { label: 'User/Staff', icon: '👥', type: 'limit' },
    maxCustomers: { label: 'Customer', icon: '📋', type: 'limit' },
    maxBranches: { label: 'Cabang', icon: '🏢', type: 'limit' },
    pdfExport: { label: 'Export PDF', icon: '📄', type: 'boolean' },
    internalReports: { label: 'Laporan Internal', icon: '📊', type: 'boolean' },
    blacklistAccess: { label: 'Akses Blacklist', icon: '🚫', type: 'boolean' },
    reminderNotifications: { label: 'Notifikasi Pengingat', icon: '🔔', type: 'boolean' },
    multiLanguage: { label: 'Multi Bahasa', icon: '🌐', type: 'boolean' },
    prioritySupport: { label: 'Support Prioritas', icon: '⭐', type: 'boolean' },
    apiAccess: { label: 'Akses API', icon: '🔌', type: 'boolean' },
    customBranding: { label: 'Custom Branding', icon: '🎨', type: 'boolean' },
    advancedAnalytics: { label: 'Analitik Lanjutan', icon: '📈', type: 'boolean' },
    dataExport: { label: 'Export Data', icon: '💾', type: 'boolean' },
    whatsappIntegration: { label: 'Integrasi WhatsApp', icon: '💬', type: 'boolean' },
};

// Utility functions
export function getPlanById(planId: string): PlanTier | undefined {
    return PLAN_TIERS[planId];
}

export function checkFeatureLimit(planId: string, feature: keyof PlanFeatures, currentCount: number): {
    allowed: boolean;
    limit: number | boolean;
    remaining: number;
} {
    const plan = PLAN_TIERS[planId];
    if (!plan) return { allowed: false, limit: 0, remaining: 0 };

    const limit = plan.features[feature];

    if (typeof limit === 'boolean') {
        return { allowed: limit, limit, remaining: limit ? 1 : 0 };
    }

    if (limit === -1) {
        return { allowed: true, limit: -1, remaining: Infinity };
    }

    return {
        allowed: currentCount < limit,
        limit,
        remaining: Math.max(0, limit - currentCount),
    };
}

export function calculateYearlyPrice(planId: string): { monthly: number; yearly: number; savings: number } {
    const plan = PLAN_TIERS[planId];
    if (!plan || plan.price === 0) {
        return { monthly: 0, yearly: 0, savings: 0 };
    }

    const monthly = plan.price;
    const yearlyTotal = monthly * 12;
    const discountAmount = yearlyTotal * (plan.yearlyDiscount / 100);
    const yearly = yearlyTotal - discountAmount;

    return {
        monthly,
        yearly,
        savings: discountAmount,
    };
}

export function canUpgrade(currentPlan: string, targetPlan: string): boolean {
    const order = ['DEMO', 'BASIC', 'PRO', 'UNLIMITED'];
    return order.indexOf(targetPlan) > order.indexOf(currentPlan);
}

export function canDowngrade(currentPlan: string, targetPlan: string): boolean {
    const order = ['DEMO', 'BASIC', 'PRO', 'UNLIMITED'];
    return order.indexOf(targetPlan) < order.indexOf(currentPlan);
}
