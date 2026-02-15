'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    isVerified: boolean;
    onboardingCompleted: boolean;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAuthenticated: false,
    refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const pathname = usePathname();

    const refreshUser = useCallback(async () => {
        // Optimistic check from localStorage
        const storedUser = localStorage.getItem('user_info');
        if (storedUser && loading) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                setIsAuthenticated(true);
            } catch {
                localStorage.removeItem('user_info');
            }
        }

        try {
            const res = await fetchApi('/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setIsAuthenticated(true);
                setLoading(false);
                localStorage.setItem('user_info', JSON.stringify(data));
            } else {
                // If 401, we are not authenticated.
                // We do NOT redirect here (global provider).
                // Specialized hooks/layouts will handle redirect.
                setUser(null);
                setIsAuthenticated(false);
                setLoading(false);
                localStorage.removeItem('user_info');
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
        }
    }, [loading]); // Only depend on loading state to prevent infinite loops if we change it? No.
    // Actually, we want to run this ONCE on mount.

    useEffect(() => {
        refreshUser();
    }, []);

    // Re-check when pathname changes?
    // Maybe not necessary if middleware handles token, but useful if session expires mid-navigation.
    // For now, let's keep it simple: check on mount.
    // If we want to re-validate on route change, we can add pathname dependency.
    // But that causes fetches on every click. Expensive. 
    // Best practice: rely on periodic check or error handling (401 interceptor in api.ts).

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}
