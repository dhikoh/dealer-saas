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
    // Legacy support: if token exists in localStorage, use it.
    // But primary method is now HTTP-only cookies.
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) return { 'Authorization': `Bearer ${token}` };
    }
    return {};
}

/**
 * Attempt to refresh the access token.
 * Note: With HTTP-only cookies, the refresh endpoint should also rely on cookies.
 * We keep this for legacy/hybrid support, but ensure credentials are sent.
 */
async function tryRefreshToken(): Promise<boolean> {
    try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

        // No refresh token stored — nothing to refresh (user never logged in or was logged out)
        if (!refreshToken) return false;

        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
            credentials: 'include', // Send cookies for new auth_token to be set
        });

        if (!res.ok) return false;

        const data = await res.json();

        // If backend returns new tokens for localStorage (hybrid), save them
        if (data.access_token) localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

        if (data.user) {
            localStorage.setItem('user_info', JSON.stringify(data.user));
        }

        return true;
    } catch {
        return false;
    }
}

function clearAuthAndRedirect() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');

        // Prevent infinite loop: Only redirect if NOT already on an auth page
        if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth';
        }
    }
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

    // Auto-set Content-Type for JSON
    if (
        options.body &&
        typeof options.body === 'string' &&
        !headers['Content-Type'] &&
        !headers['content-type']
    ) {
        headers['Content-Type'] = 'application/json';
    }

    // IMPORTANT: Include credentials (cookies) for cross-origin requests
    const fetchOptions: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
    };

    if (typeof window !== 'undefined' && (url.includes('/auth') || url.includes('/app'))) {
        console.log(`[API] Fetching ${url}`);
    }

    const res = await fetch(url, fetchOptions);

    if (res.status === 401 && typeof window !== 'undefined') {
        console.warn(`[API] 401 Unauthorized for ${url}. Attempting refresh...`);
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
            // Retry original request with new token (or just cookies)
            const retryHeaders: Record<string, string> = {
                ...getAuthHeaders(),
                ...(options.headers as Record<string, string> || {}),
            };
            return fetch(url, { ...fetchOptions, headers: retryHeaders });
        }

        // Refresh failed — full logout
        // Check if we should skip redirect (e.g. for initial auth check)
        const skipRedirect = options.headers && (
            (options.headers as Record<string, string>)['X-Skip-Redirect'] === 'true'
        );

        if (!skipRedirect) {
            clearAuthAndRedirect();
        }
    }

    return res;
}
