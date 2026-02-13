'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '@/lib/api';

function VerifyPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);


    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        } else {
            // Fallback: Check local storage or redirect
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                setEmail(user.email);
            } else {
                toast.error('Email not found');
                router.push('/auth');
            }
        }
    }, [searchParams, router]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newCode = [...code];
        pastedData.split('').forEach((char, index) => {
            if (index < 6) newCode[index] = char;
        });
        setCode(newCode);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = code.join('');
        if (otpCode.length !== 6) {
            toast.error('Masukkan 6 digit kode OTP');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otpCode }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Verifikasi Gagal');
            }

            const data = await res.json();

            // Store auth token so user can access onboarding
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
            }
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }
            if (data.user) {
                localStorage.setItem('user_info', JSON.stringify(data.user));
            }

            toast.success('Email Berhasil Diverifikasi!');

            // Redirect to Onboarding
            setTimeout(() => {
                router.push('/onboarding');
            }, 1000);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (cooldown > 0) {
            interval = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [cooldown]);

    const handleResend = async () => {
        if (isResending || cooldown > 0) return;
        setIsResending(true);
        try {
            const res = await fetch(`${API_URL}/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle Rate Limiting (429)
                if (res.status === 429 && data.retryAfter) {
                    setCooldown(data.retryAfter);
                    toast.error(data.message || `Mohon tunggu ${data.retryAfter} detik.`);
                    return;
                }

                // Handle Blocked (403)
                if (res.status === 403) {
                    toast.error(data.message || 'Akun dibekukan sementara.', {
                        duration: 5000,
                        action: {
                            label: 'Hubungi Admin',
                            onClick: () => window.open('https://wa.me/6287712333434', '_blank')
                        }
                    });
                    return;
                }

                throw new Error(data.message || 'Gagal mengirim ulang kode');
            }

            toast.success('Kode OTP baru telah dikirim!');
            setCooldown(60); // Default cooldown after success
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#ecf0f3] font-['Poppins']">
            <div className="w-[450px] p-10 rounded-[24px] bg-[#ecf0f3] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] relative">
                <button
                    onClick={() => router.push('/auth')}
                    className="absolute top-6 left-6 text-[#555] hover:text-[#00bfa5] transition-colors"
                    title="Kembali ke Login"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
                </button>

                <div className="text-center mb-8">
                    <div className="mb-4 flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#ecf0f3] shadow-[inset_5px_5px_10px_#d1d9e6,inset_-5px_-5px_10px_#ffffff] flex items-center justify-center">
                            <span className="text-2xl">🔐</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1b1b1b] mb-2 mt-2">Verifikasi Email</h1>
                    <p className="text-sm text-[#555]">
                        Masukkan 6 digit kode OTP yang dikirim ke <br /> <span className="font-semibold text-[#00bfa5]">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center gap-3 mb-8">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="w-12 h-14 text-center text-2xl font-bold bg-[#ecf0f3] border-none rounded-[12px] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff,0_0_0_2px_#00bfa5] text-[#1b1b1b] transition-all"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[52px] rounded-[14px] bg-[#00bfa5] text-white font-bold text-lg shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff] hover:transform hover:translate-y-[-2px] active:translate-y-[2px] active:shadow-[inset_5px_5px_10px_#008f7a,inset_-5px_-5px_10px_#00efcf] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="text-white" />
                                Memproses...
                            </>
                        ) : (
                            'Verifikasi'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-[#555]">
                    <p className="mb-2">Tidak menerima kode?</p>
                    <button
                        onClick={handleResend}
                        disabled={isResending || cooldown > 0}
                        className="text-[#00bfa5] font-semibold hover:text-[#008f7a] transition-colors disabled:text-gray-400 disabled:cursor-not-allowed items-center gap-2 inline-flex"
                    >
                        {isResending ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin size="sm" /> Mengirim...
                            </>
                        ) : cooldown > 0 ? (
                            `Kirim Ulang (${cooldown}s)`
                        ) : (
                            'Kirim Ulang'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Loading fallback for Suspense
function VerifyPageLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#ecf0f3] font-['Poppins']">
            <div className="w-[400px] p-10 rounded-[20px] bg-[#ecf0f3] shadow-[13px_13px_20px_#cbced1,-13px_-13px_20px_#ffffff] text-center">
                <FontAwesomeIcon icon={faSpinner} spin className="text-[#00bfa5] text-3xl" />
                <p className="text-sm text-[#555] mt-4">Memuat...</p>
            </div>
        </div>
    );
}

// Wrap with Suspense to handle useSearchParams during static generation
export default function VerifyPage() {
    return (
        <Suspense fallback={<VerifyPageLoading />}>
            <VerifyPageContent />
        </Suspense>
    );
}
