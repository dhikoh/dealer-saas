import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth.service';
import { useRouter, useSegments } from 'expo-router';
import { UserProfile } from '../constants/types';

interface AuthContextType {
    user: UserProfile | null;   // HIGH FIX: Typed as UserProfile, not `any`
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

    // EFFECT 1: Bootstrap auth state ONCE on mount.
    // Uses isMounted flag to prevent state updates after unmount (React StrictMode safe).
    useEffect(() => {
        let isMounted = true;
        const checkUser = async () => {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (token && isMounted) {
                    // HIGH: getProfile() response safely typed via UserProfile
                    const profile = await authService.getProfile();
                    if (isMounted) setUser(profile);
                }
            } catch {
                // Token invalid or network error — clear token, force login
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

    // EFFECT 2: Navigation guard — only fires on auth STATE change (not on every tab switch)
    // FIX: `segments` excluded from deps — it changes on every tab navigation and would
    //      cause router.replace() to fire on every tab change → navigation loop.
    useEffect(() => {
        if (isLoading) return;

        const inTabsGroup = segments[0] === '(tabs)';

        if (!user && inTabsGroup) {
            router.replace('/');
        } else if (user && !inTabsGroup) {
            router.replace('/(tabs)/dashboard');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLoading]);

    const login = useCallback(async (email: string, password: string) => {
        const profile = await authService.login(email, password);
        // auth.service.login now returns UserProfile directly
        setUser(profile);
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
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
