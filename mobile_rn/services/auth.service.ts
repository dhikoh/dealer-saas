import api from './api';
import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '../constants/types';

export const authService = {
    // Login: stores token and returns UserProfile in one flow.
    // HIGH FIX: Previously returned response.data (raw) and then required a
    // separate getProfile() call in AuthContext — causing 2 API calls on login.
    // Now: login → store token → fetch profile → return profile. Single flow.
    login: async (email: string, password: string): Promise<UserProfile> => {
        const response = await api.post('/auth/login', { email, password });

        // FIX: Safe optional chain — don't crash if backend changes response shape
        const token = response.data?.accessToken;
        if (!token) {
            throw new Error('Login failed: no accessToken in response');
        }

        await SecureStore.setItemAsync('auth_token', token);

        // Fetch profile immediately after login so caller gets UserProfile
        return authService.getProfile();
    },

    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get('/auth/me');
        // HIGH FIX: Safe access with fallback — crash prevention if API shape changes
        const data = response.data;
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid profile response');
        }
        return data as UserProfile;
    },

    logout: async (): Promise<void> => {
        // FIX: deleteItemAsync is idempotent — safe to call even if key doesn't exist
        await SecureStore.deleteItemAsync('auth_token');
    },
};
