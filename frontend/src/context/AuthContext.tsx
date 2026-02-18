'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

import { User } from '@/types/auth';

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
            const res = await fetchApi('/auth/me', {
                // Custom option to prevent auto-redirect on 401 for this specific call
                // We handle it manually here
                headers: { 'X-Skip-Redirect': 'true' }
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setIsAuthenticated(true);
                setLoading(false);
                localStorage.setItem('user_info', JSON.stringify(data));
            } else {
                // Valid response but not OK (e.g. 401, 403)
                // If 401, it's expected when not logged in.
                if (res.status === 401) {
                    console.warn('[AuthContext] 401 Session Expired. Redirecting...');
                    // Use window.location to ensure full refresh and clear state
                    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
                        window.location.href = '/auth?error=session_expired';
                    }
                } else {
                    console.warn(`Auth check failed with status: ${res.status}`);
                }

                setUser(null);
                setIsAuthenticated(false);
                setLoading(false);
                localStorage.removeItem('user_info');
            }
        } catch (error) {
            // Network error or other issues
            console.error('Auth verification network error:', error);
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
