'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from 'sonner';
import { BranchProvider } from '@/context/BranchContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const userInfoStr = localStorage.getItem('user_info');

        if (!token) {
            router.push('/auth');
            return;
        }

        if (userInfoStr) {
            try {
                const user = JSON.parse(userInfoStr);

                if (user.role === 'SUPERADMIN') {
                    router.push('/superadmin');
                    return;
                }

                if (!user.isVerified) {
                    router.push(`/auth/verify?email=${user.email}`);
                    return;
                }

                if (!user.onboardingCompleted) {
                    router.push('/onboarding');
                    return;
                }

                setMounted(true);
            } catch (e) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_info');
                router.push('/auth');
            }
        } else {
            localStorage.removeItem('access_token');
            router.push('/auth');
        }

    }, [router]);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#ecf0f3] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00bfa5] rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Memuat...</p>
                </div>
            </div>
        );
    }

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

                {/* TOASTER FOR DASHBOARD ALERTS */}
                <Toaster position="top-right" richColors />
            </div>
        </BranchProvider>
    );
}

