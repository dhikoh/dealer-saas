import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * SECURITY MIDDLEWARE
 * 
 * This middleware enforces:
 * 1. Authentication - Redirect unauthenticated users to login
 * 2. Flow Order - Enforce verify → onboarding → app sequence
 * 3. Token Validation - Basic JWT format and expiry check
 * 
 * Note: Server-side validation is the ultimate source of truth.
 * This middleware provides UX improvements and first-line defense.
 */

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

// Routes accessible during specific flow stages
const ONBOARDING_ROUTE = '/onboarding';
const APP_ROUTES_PREFIX = '/app';
const SUPERADMIN_ROUTES_PREFIX = '/superadmin';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Always allow static assets and API routes
    if (ALWAYS_ALLOWED.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    const token = request.cookies.get('auth_token')?.value;

    // 2. ROOT PATH / LANDING PAGE HANDLER
    if (pathname === '/') {
        // Allow everyone to see the Landing Page
        return NextResponse.next();
    }

    // 3. Allow public routes without authentication
    if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        return NextResponse.next();
    }

    // 4. Check for authentication token
    if (!token) {
        // No token found - redirect to login
        const loginUrl = new URL('/auth', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 4. Validate token format and decode payload
    let payload: any;
    try {
        // JWT format: xxx.xxx.xxx
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Decode payload
        const decoded = atob(parts[1]);
        if (!decoded) throw new Error('Empty payload');
        payload = JSON.parse(decoded);

        // Check expiration
        if (payload.exp && Date.now() >= payload.exp * 1000) {
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

    // 5. FLOW ENFORCEMENT - Based on user state in JWT
    const { isVerified, onboardingCompleted, role } = payload;

    // SUPERADMIN bypasses flow checks
    if (role === 'SUPERADMIN') {
        return NextResponse.next();
    }

    // === UNVERIFIED USER ===
    if (!isVerified) {
        // Unverified users can only access /auth/verify
        if (pathname !== '/auth/verify' && !pathname.startsWith('/auth')) {
            return NextResponse.redirect(new URL('/auth/verify', request.url));
        }
        return NextResponse.next();
    }

    // === VERIFIED BUT NOT ONBOARDED ===
    if (isVerified && !onboardingCompleted) {
        // Can access: /onboarding only
        if (pathname !== ONBOARDING_ROUTE) {
            return NextResponse.redirect(new URL('/onboarding', request.url));
        }
        return NextResponse.next();
    }

    // === FULLY ONBOARDED ===
    if (isVerified && onboardingCompleted) {
        // Redirect away from onboarding/verify pages
        if (pathname === ONBOARDING_ROUTE) {
            return NextResponse.redirect(new URL('/app', request.url));
        }
        if (pathname === '/auth/verify') {
            return NextResponse.redirect(new URL('/app', request.url));
        }
        // Allow access to /app routes
        return NextResponse.next();
    }

    // Default: allow access
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
