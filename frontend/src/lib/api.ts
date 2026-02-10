/**
 * Centralized API configuration and fetch wrapper.
 * - Single source of truth for API_URL
 * - Automatic 401 handling with refresh token retry
 * - Token injection
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Attempt to refresh the access token using stored refresh_token.
 * Returns true if refresh succeeded, false if it failed.
 */
async function tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        if (data.user) {
            localStorage.setItem('user_info', JSON.stringify(data.user));
        }
        // Update auth cookie for middleware
        document.cookie = `auth_token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        return true;
    } catch {
        return false;
    }
}

function clearAuthAndRedirect() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/auth';
}

/**
 * Wrapper around fetch that handles 401 automatically.
 * On 401 → tries to refresh token, retries request once.
 * If refresh fails → clears auth data and redirects to /auth.
 */
export async function fetchApi(
    endpoint: string,
    options: RequestInit = {},
): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
        ...getAuthHeaders(),
        ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 && typeof window !== 'undefined') {
        // Deduplicate concurrent refresh attempts
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = tryRefreshToken().finally(() => {
                isRefreshing = false;
                refreshPromise = null;
            });
        }

        const refreshed = await (refreshPromise || tryRefreshToken());

        if (refreshed) {
            // Retry original request with new token
            const retryHeaders: Record<string, string> = {
                ...getAuthHeaders(),
                ...(options.headers as Record<string, string> || {}),
            };
            return fetch(url, { ...options, headers: retryHeaders });
        }

        // Refresh failed — full logout
        clearAuthAndRedirect();
    }

    return res;
}
