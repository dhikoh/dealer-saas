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

    // H3 FIX: Validate user state from server, not just localStorage
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/auth');
            return;
        }

        // Server-side validation to prevent localStorage manipulation
        const validateUser = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                });

                if (!res.ok) {
                    // Token invalid or expired — force logout
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_info');
                    router.push('/auth');
                    return;
                }

                const serverUser = await res.json();
                // Re-sync localStorage with verified server data
                localStorage.setItem('user_info', JSON.stringify(serverUser));

                // Role-based redirect using VERIFIED server data
                if (serverUser.role === 'SUPERADMIN') {
                    router.push('/superadmin');
                    return;
                }
                if (!serverUser.isVerified) {
                    router.push(`/auth/verify?email=${serverUser.email}`);
                    return;
                }
                if (!serverUser.onboardingCompleted) {
                    router.push('/onboarding');
                    return;
                }
                setMounted(true); // Set mounted to true only after successful validation and checks
            } catch (e) {
                // Network error — keep existing state, don't force logout on connectivity issues
                // If there's a network error, we should still set mounted to true to render the children,
                // assuming the user was already logged in and we just couldn't validate.
                // However, if the user_info was invalid or missing, the original logic would have redirected.
                // For now, if a network error occurs, we assume the user is valid based on existing token
                // and allow rendering, but this might need further refinement based on UX requirements.
                console.error("Failed to validate user with server:", e);
                // Fallback: if server validation fails due to network, try to use local info if available
                const userInfoStr = localStorage.getItem('user_info');
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
                    } catch (parseError) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('user_info');
                        router.push('/auth');
                    }
                } else {
                    localStorage.removeItem('access_token');
                    router.push('/auth');
                }
            }
        };

        validateUser();
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

                {/* TOASTER REMOVED - Already in RootLayout */}
            </div>
        </BranchProvider>
    );
}

