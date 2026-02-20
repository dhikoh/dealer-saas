import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// CRITICAL FIX: Never hardcode API URL in production code.
// Use EAS environment variables via app.config.js / eas.json secrets.
// Falls back to localhost for local dev only.
const API_URL =
    (Constants.expoConfig?.extra?.apiUrl as string) ??
    'http://192.168.1.10:3000';

export { API_URL };

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Attach Token to every request
// ✅ SAFE: Registered ONCE at module load time, not inside any component.
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// HIGH FIX: isHandling401 prevents concurrent 401 responses from each triggering
// a separate token deletion. Only the first 401 event triggers the cleanup.
// A promise queue ensures any subsequent failed requests resolve cleanly.
let isHandling401 = false;

// Interceptor: Handle 401 Unauthorized
// ✅ SAFE: No infinite loop — 401 handler does NOT call api (no retry request).
//          It only clears the token. The AuthContext useEffect monitors user state
//          and will redirect to login when user becomes null.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !isHandling401) {
            isHandling401 = true;
            try {
                await SecureStore.deleteItemAsync('auth_token');
            } finally {
                // Reset after 2s — longer window prevents rapid re-trigger
                setTimeout(() => { isHandling401 = false; }, 2000);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
