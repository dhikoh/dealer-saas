import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth.service';
import { useRouter, useSegments } from 'expo-router';
import { UserProfile } from '../constants/types';

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    // Bootstrap auth state on mount — check for persisted token
    useEffect(() => {
        let isMounted = true;
        const checkUser = async () => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (token && isMounted) {
                    const profile = await authService.getProfile();
                    if (isMounted) setUser(profile);
                }
            } catch {
                // Token invalid — clear it and stay on login
                if (isMounted) {
                    await SecureStore.deleteItemAsync('auth_token');
                    setUser(null);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        checkUser();
        return () => { isMounted = false; };
    }, []);

    // Navigation guard — fires ONLY when auth state changes (not on every render)
    // FIX: Do NOT navigate during isLoading to prevent flicker on cold start
    useEffect(() => {
        if (isLoading) return;

        const inTabsGroup = segments[0] === '(tabs)';
        const onLoginScreen = !segments[0] || segments[0] === 'index';

        // If logged in but still on login screen → go to dashboard
        if (user && (onLoginScreen || !inTabsGroup)) {
            router.replace('/(tabs)/dashboard');
        }
        // If NOT logged in but somehow in tabs → go to login
        else if (!user && inTabsGroup) {
            router.replace('/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLoading]);

    const login = useCallback(async (email: string, password: string) => {
        const profile = await authService.login(email, password);
        setUser(profile);
        // Navigation is handled by the useEffect above — do NOT navigate here
        // to avoid double navigation race condition
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        // Navigation guard useEffect will redirect to '/' after user becomes null
    }, []);

    const value = useMemo(
        () => ({ user, isLoading, login, logout }),
        [user, isLoading, login, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
