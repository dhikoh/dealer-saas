'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { Toaster } from 'sonner';
import { BranchProvider } from '@/context/BranchContext';
import { useAuthProtection } from '@/hooks/useAuthProtection';
import { useMobileContext } from '@/context/MobileContext';
import MobileAppShell from '@/components/mobile/MobileAppShell';
import { fetchApi } from '@/lib/api';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ✅ All hooks at the top level unconditionally
    const { loading, isAuthenticated, user } = useAuthProtection();
    const { isMobileView } = useMobileContext();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth');
        }
    }, [loading, isAuthenticated, router]);

    // H4: Check subscription status — redirect to suspended page if needed
    useEffect(() => {
        if (loading || !isAuthenticated || !user) return;
        if (pathname === '/app/suspended') return;
        if (user.role === 'SUPERADMIN') return;

        const tenant = user.tenant as any;
        if (tenant?.subscriptionStatus === 'SUSPENDED' || tenant?.subscriptionStatus === 'CANCELLED') {
            router.push('/app/suspended');
        }
    }, [loading, isAuthenticated, user, pathname, router]);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                await fetchApi('/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
            }
        } catch { /* ignore */ }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        router.push('/auth');
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#ecf0f3] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00bfa5] rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Memuat...</p>
                </div>
            </div>
        );
    }

    if (user && !user.onboardingCompleted && user.role !== 'SUPERADMIN') {
        router.push('/onboarding');
        return null;
    }

    // ─── MOBILE VIEW: Render Neumorphic Shell ─────────────────────────────────
    if (isMobileView) {
        return <MobileAppShell user={user ?? {}} onLogout={handleLogout} />;
    }

    // ─── DESKTOP VIEW: Full layout with Header + BottomNav ────────────────────
    return (
        <BranchProvider>
            <div className="flex min-h-screen bg-[#ecf0f3] font-poppins text-gray-700 relative">
                {/* BOTTOM NAVIGATION - Fixed Bottom */}
                <BottomNav />

                {/* Main content area - full width */}
                <div className="flex-1 flex flex-col w-full">
                    {/* HEADER - Fixed Top */}
                    <Header />

                    {/* MAIN CONTENT - Scrollable, responsive padding, extra bottom padding for nav */}
                    <main className="flex-1 mt-20 p-4 md:p-6 lg:p-8 pb-32 overflow-y-auto bg-[#ecf0f3]">
                        {children}
                    </main>
                </div>
            </div>
        </BranchProvider>
    );
}
