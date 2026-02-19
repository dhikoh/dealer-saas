'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// import Sidebar from '@/components/Sidebar'; // Replaced by BottomNav
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { Toaster } from 'sonner';
import { BranchProvider } from '@/context/BranchContext';

import { useAuthProtection } from '@/hooks/useAuthProtection';
import { fetchApi } from '@/lib/api';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Phase 4: Use centralized auth protection
    const { loading, isAuthenticated, user } = useAuthProtection();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth');
        }
    }, [loading, isAuthenticated, router]);

    // H4: Check subscription status — redirect to suspended page if needed
    // H4: Check subscription status — redirect to suspended page if needed
    useEffect(() => {
        if (loading || !isAuthenticated || !user) return;
        // Don't check on the suspended page itself to avoid redirect loops
        if (pathname === '/app/suspended') return;
        // SUPERADMIN doesn't have subscription
        if (user.role === 'SUPERADMIN') return;

        // OPTIMIZATION: Check directly from user object (filled by getProfile)
        // instead of making a redundant API call to /tenant/profile
        const tenant = user.tenant as any; // Type assertion since User has [key: string]: any
        if (tenant?.subscriptionStatus === 'SUSPENDED' || tenant?.subscriptionStatus === 'CANCELLED') {
            router.push('/app/suspended');
        }
    }, [loading, isAuthenticated, user, pathname, router]);

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

    // Optional: Extra check for user verification/onboarding if needed, 
    // though useAuthProtection handles basic auth.
    // If we need specific redirections for onboarding, we can add them here.
    if (user && !user.onboardingCompleted && user.role !== 'SUPERADMIN') {
        // This check was present in original code
        // We might want to handle it here or let the page handle it.
        // For now, let's keep it simple or redirect.
        router.push('/onboarding');
        return null;
    }

    // Check verification?
    // if (user && !user.isVerified) { ... }

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

                {/* TOASTER REMOVED - Already in RootLayout */}
            </div>
        </BranchProvider>
    );
}
