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
    let payload: any = null;

    // 2. CHECK FOR TOKEN & VALIDATE IF PRESENT
    if (token) {
        console.log(`[Middleware] Token found for path: ${pathname}`);
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const decoded = atob(parts[1]);
                if (decoded) {
                    const parsed = JSON.parse(decoded);
                    // Check expiration
                    if (parsed.exp && Date.now() < parsed.exp * 1000) {
                        payload = parsed;
                    } else {
                        console.log('[Middleware] Token expired');
                    }
                }
            }
        } catch (e) {
            console.log('[Middleware] Invalid token:', e);
        }
    }

    // 3. IF TOKEN INVALID/EXPIRED
    if (!payload && token) {
        // If token exists but invalid, clear it
        const response = NextResponse.redirect(new URL('/auth', request.url));
        response.cookies.delete('auth_token');
        return response;
    }

    // 4. GUEST GUARD: Redirect authenticated users away from /auth pages
    if (payload && (pathname === '/auth' || pathname === '/auth/verify')) {
        // Special case: Allow verify page if user is NOT verified
        if (pathname === '/auth/verify' && !payload.isVerified) {
            return NextResponse.next();
        }

        console.log('[Middleware] Authenticated user on auth page. Redirecting...');
        if (payload.role === 'SUPERADMIN') {
            return NextResponse.redirect(new URL('/superadmin', request.url));
        } else if (!payload.onboardingCompleted) {
            return NextResponse.redirect(new URL('/onboarding', request.url));
        } else {
            return NextResponse.redirect(new URL('/app', request.url));
        }
    }

    // 5. PUBLIC ROUTES (If no valid payload)
    if (!payload) {
        if (pathname === '/') return NextResponse.next(); // Landing page
        if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
            return NextResponse.next();
        }
        // Redirect to login if accessing protected route without token
        const loginUrl = new URL('/auth', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 6. PROTECTED ROUTES FLOW ENFORCEMENT (Payload exists)
    const { isVerified, onboardingCompleted, role } = payload;

    // SUPERADMIN bypasses flow checks
    if (role === 'SUPERADMIN') {
        return NextResponse.next();
    }

    // === UNVERIFIED USER ===
    if (!isVerified) {
        // Unverified users can only access /auth/verify (handled above in Guest Guard / Public check sort of)
        // If we are here, path is NOT /auth/verify (caught by Guest Guard logic or Public check?)
        // Wait, if path is /app, we need to redirect to /auth/verify
        if (pathname !== '/auth/verify') {
            return NextResponse.redirect(new URL('/auth/verify', request.url));
        }
        return NextResponse.next();
    }

    // === VERIFIED BUT NOT ONBOARDED ===
    if (isVerified && !onboardingCompleted) {
        if (pathname !== ONBOARDING_ROUTE) {
            return NextResponse.redirect(new URL('/onboarding', request.url));
        }
        return NextResponse.next();
    }

    // === FULLY ONBOARDED ===
    if (isVerified && onboardingCompleted) {
        // Already handled Guest Guard above.
        // If accessing /onboarding, redirect to app
        if (pathname === ONBOARDING_ROUTE) {
            return NextResponse.redirect(new URL('/app', request.url));
        }
        return NextResponse.next();
    }

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
