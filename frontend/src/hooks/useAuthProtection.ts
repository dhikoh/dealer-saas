import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';


import { User } from '@/types/auth';

export function useAuthProtection(requiredRole?: string, options: { redirect?: boolean } = { redirect: true }) {
    const { user, loading, isAuthenticated, refreshUser } = useAuth();
    const router = useRouter();

    // Effect for Redirection based on state
    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            if (options.redirect) {
                router.push('/auth?force_logout=true');
            }
        } else if (requiredRole && user?.role !== requiredRole) {
            router.push('/unauthorized');
        }
    }, [loading, isAuthenticated, user, requiredRole, router, options.redirect]);

    // Return the context state directly, plus refreshUser
    return { user, loading, isAuthenticated, refreshUser };
}
