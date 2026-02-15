// Tenant Types
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone?: string;
    address?: string;
    logo?: string;
    planTier: 'DEMO' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'UNLIMITED' | string;
    subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';
    billingCycle: 'MONTHLY' | 'YEARLY';
    startDate: string; // ISO Date
    endDate?: string;
    createdAt: string;
    trialEndsAt?: string | null;
    subscriptionStartedAt?: string | null;
    subscriptionEndsAt?: string | null;
    nextBillingDate?: string | null;
    monthlyBill: number;
    autoRenew: boolean;
    usage: {
        users: number;
        vehicles: number;
        customers: number;
        transactions: number;
    };
}

export interface CreateTenantVariables {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    planTier: string;
    billingMonths: number;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
}

export interface UpdateTenantVariables {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
}

// Invoice Types
export interface SystemInvoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'VERIFYING' | 'OVERDUE';
    dueDate: string;
    paidAt?: string;
    tenantId: string;
    tenant: {
        name: string;
        email: string;
    };
    items?: string;
    paymentProof?: string | null;
    createdAt: string;
}

// User Types
export interface SuperadminUser {
    id: string;
    name: string;
    email: string;
    username: string;
    role: string;
    phone: string | null;
    tenantName?: string;
    tenantId: string | null;
    isVerified: boolean;
    createdAt: string;
    deletedAt?: string | null;
}

// Activity Log Types
export interface ActivityLog {
    id: string;
    userEmail: string;
    action: string;
    details?: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
    createdAt: string;
    ipAddress?: string;
}

// Dashboard Stats
export interface DashboardStats {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    totalMrr: number;
    pendingInvoices: number;
    churnRate: number;
    recentActivity: ActivityLog[];
}

// Approval Types
export interface ApprovalRequest {
    id: string;
    requestedById: string;
    approvedById: string | null;
    type: string;
    payload: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    note: string | null;
    createdAt: string;
    updatedAt: string;
}

// Settings Types
export interface SuperadminStaff {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    subscriptionStatus?: string;
}

export interface ApiKey {
    id: string;
    name: string;
    key: string;
    created: string;
    status: 'active' | 'revoked';
}

export interface BillingConfig {
    gateway: string;
    bankInfo: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    autoInvoice: boolean;
}

// Plan Types
// Plan Types
export interface PlanFeatures {
    maxVehicles: number;
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

export interface Plan {
    id: string;
    name: string;
    price: number;
    priceLabel: string;
    description: string;
    descriptionId: string;
    trialDays: number;
    yearlyDiscount: number;
    badge: string;
    badgeColor: string;
    recommended: boolean;
    features: PlanFeatures;
}
