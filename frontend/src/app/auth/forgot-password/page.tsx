'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * M7 FIX: Redirect to main auth page with forgot form active.
 * Previously this was a duplicate forgot-password page.
 * Now it redirects to /auth?form=forgot to use the unified auth page.
 */
export default function ForgotPasswordRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/auth?form=forgot');
    }, [router]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#ecf0f3]">
            <div className="text-gray-400">Mengarahkan...</div>
        </div>
    );
}
