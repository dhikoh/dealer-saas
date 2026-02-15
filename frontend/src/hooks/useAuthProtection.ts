
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchApi } from '@/lib/api';

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

interface AuthState {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
}

export function useAuthProtection(requiredRole?: string) {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        isAuthenticated: false,
    });
    const router = useRouter();
    const pathname = usePathname();

    const refreshUser = async () => {
        // 1. Optimistic check: read from localStorage if available (fast load)
        const storedUser = localStorage.getItem('user_info');
        if (storedUser && state.loading) {
            try {
                const parsed = JSON.parse(storedUser);
                setState(prev => ({ ...prev, user: parsed, isAuthenticated: true }));
            } catch {
                localStorage.removeItem('user_info');
            }
        }

        // 2. Network verification (Source of truth)
        try {
            const res = await fetchApi('/auth/me');

            if (res.ok) {
                const data = await res.json();
                setState({
                    user: data,
                    loading: false,
                    isAuthenticated: true,
                });
                // Update cache
                localStorage.setItem('user_info', JSON.stringify(data));
            } else {
                setState({ user: null, loading: false, isAuthenticated: false });
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            setState({ user: null, loading: false, isAuthenticated: false });
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    // Effect for Redirection based on state
    useEffect(() => {
        if (state.loading) return;

        if (!state.isAuthenticated) {
            // Optional: redirect to login
        } else if (requiredRole && state.user?.role !== requiredRole) {
            router.push('/unauthorized');
        }
    }, [state.loading, state.isAuthenticated, state.user, requiredRole, router]);

    return { ...state, refreshUser };
}
