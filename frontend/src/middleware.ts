import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    '/auth',
    '/auth/verify',
];

// Routes that should always be accessible (static assets, API, etc.)
const ALWAYS_ALLOWED = [
    '/_next',
    '/favicon.ico',
    '/api',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Always allow static assets and API routes
    if (ALWAYS_ALLOWED.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // 2. Allow public routes without authentication
    if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        return NextResponse.next();
    }

    // 3. Check for authentication token
    const token = request.cookies.get('auth_token')?.value;

    // Also check localStorage via a custom header (for client-side navigation compatibility)
    // Note: We'll also set a cookie on login for middleware to work on first request
    if (!token) {
        // No token found - redirect to login
        const loginUrl = new URL('/auth', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 4. Basic token validation (check if it looks like a JWT)
    try {
        // JWT format: xxx.xxx.xxx
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Decode payload to check expiration
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp;

        if (exp && Date.now() >= exp * 1000) {
            // Token expired - clear cookie and redirect
            const response = NextResponse.redirect(new URL('/auth', request.url));
            response.cookies.delete('auth_token');
            return response;
        }
    } catch {
        // Invalid token - clear and redirect
        const response = NextResponse.redirect(new URL('/auth', request.url));
        response.cookies.delete('auth_token');
        return response;
    }

    // 5. Token valid - allow access
    return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
