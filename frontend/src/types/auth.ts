export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    isVerified: boolean;
    onboardingCompleted: boolean;
    [key: string]: any;
}

export interface AuthState {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
}
