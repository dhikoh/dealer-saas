

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
