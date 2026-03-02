import api from './api';
import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '../constants/types';

export const authService = {
    // Login: stores token and returns UserProfile.
    // Backend at dealer.modula.click returns { access_token, user } (snake_case)
    // NOT accessToken (camelCase) — confirmed from webapp auth/page.tsx line 160:
    //   localStorage.setItem('access_token', data.access_token)
    login: async (email: string, password: string): Promise<UserProfile> => {
        const response = await api.post('/auth/login', { email, password });

        // Backend returns access_token (snake_case), NOT accessToken
        const token =
            response.data?.access_token ??
            response.data?.accessToken ??
            response.data?.token;

        if (!token) {
            console.error('[Auth] Response keys:', Object.keys(response.data || {}));
            throw new Error('Login gagal: tidak ada token dalam respons backend');
        }

        await SecureStore.setItemAsync('auth_token', token);

        // Fetch full profile immediately after storing token
        return authService.getProfile();
    },

    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get('/auth/me');
        const data = response.data;
        if (!data || typeof data !== 'object') {
            throw new Error('Respons profil tidak valid dari backend');
        }
        return data as UserProfile;
    },

    logout: async (): Promise<void> => {
        await SecureStore.deleteItemAsync('auth_token');
    },
};
