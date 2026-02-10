/**
 * Centralized API configuration and fetch wrapper.
 * - Single source of truth for API_URL
 * - Automatic 401 handling → redirect to login
 * - Token injection
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Wrapper around fetch that handles 401 automatically.
 * On 401 → clears auth data and redirects to /auth.
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
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/auth';
    }

    return res;
}
