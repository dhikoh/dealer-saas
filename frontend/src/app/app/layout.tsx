'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from 'sonner';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false); // Changed from authorized to mounted

    useEffect(() => {
        // Check for authentication token logic
        const token = localStorage.getItem('access_token');
        const userInfoStr = localStorage.getItem('user_info');

        if (!token) {
            router.push('/auth');
            return;
        }

        if (userInfoStr) {
            try {
                const user = JSON.parse(userInfoStr);

                // 0. Check if SUPERADMIN - redirect to superadmin dashboard
                if (user.role === 'SUPERADMIN') {
                    router.push('/superadmin');
                    return;
                }

                // 1. Check Verification
                if (!user.isVerified) {
                    router.push(`/auth/verify?email=${user.email}`);
                    return;
                }

                // 2. Check Onboarding
                if (!user.onboardingCompleted) {
                    router.push('/onboarding');
                    return;
                }

                // All good
                setMounted(true);
            } catch (e) {
                // Invalid user info
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_info');
                router.push('/auth');
            }
        } else {
            // Token exists but no user info? fetch or logout. For now logout.
            localStorage.removeItem('access_token');
            router.push('/auth');
        }

    }, [router]);

    if (!mounted) {
        return <div className="min-h-screen bg-[#ecf0f3] flex items-center justify-center text-gray-500">Redirecting...</div>;
    }

    return (
        <div className="flex min-h-screen bg-[#ecf0f3] font-poppins text-gray-700">
            {/* SIDEBAR - Fixed Left */}
            <Sidebar />

            <div className="flex-1 flex flex-col ml-64">
                {/* HEADER - Fixed Top */}
                <Header />

                {/* MAIN CONTENT - Scrollable */}
                <main className="flex-1 mt-20 p-8 overflow-y-auto bg-[#ecf0f3]">
                    {children}
                </main>
            </div>

            {/* TOASTER FOR DASHBOARD ALERTS */}
            <Toaster position="top-right" richColors />
        </div>
    );
}
