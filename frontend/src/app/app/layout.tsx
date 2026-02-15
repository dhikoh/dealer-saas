'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from 'sonner';
import { BranchProvider } from '@/context/BranchContext';

import { useAuthProtection } from '@/hooks/useAuthProtection';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Phase 4: Use centralized auth protection
    const { loading, isAuthenticated, user } = useAuthProtection();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth');
        }
    }, [loading, isAuthenticated, router]);

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
            <div className="flex min-h-screen bg-[#ecf0f3] font-poppins text-gray-700">
                {/* SIDEBAR - Fixed Left, hidden on mobile */}
                <Sidebar />

                {/* Main content area - responsive margin */}
                <div className="flex-1 flex flex-col lg:ml-64">
                    {/* HEADER - Fixed Top */}
                    <Header />

                    {/* MAIN CONTENT - Scrollable, responsive padding */}
                    <main className="flex-1 mt-20 p-4 md:p-6 lg:p-8 overflow-y-auto bg-[#ecf0f3]">
                        {children}
                    </main>
                </div>

                {/* TOASTER REMOVED - Already in RootLayout */}
            </div>
        </BranchProvider>
    );
}

