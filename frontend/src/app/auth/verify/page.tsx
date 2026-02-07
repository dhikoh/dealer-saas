'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function VerifyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (isResending) return;
        setIsResending(true);
        try {
            const res = await fetch(`${API_URL}/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Gagal mengirim ulang kode');
            }

            toast.success('Kode OTP baru telah dikirim!');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#ecf0f3] font-['Poppins']">
            <div className="w-[400px] p-10 rounded-[20px] bg-[#ecf0f3] shadow-[13px_13px_20px_#cbced1,-13px_-13px_20px_#ffffff] relative">
                <button
                    onClick={() => router.push('/auth')}
                    className="absolute top-6 left-6 text-[#555] hover:text-[#00bfa5] transition-colors"
                    title="Kembali ke Login"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#1b1b1b] mb-2 mt-2">Verifikasi Email</h1>
                    <p className="text-sm text-[#555]">
                        Kode OTP telah dikirim ke <br /> <span className="font-semibold text-[#00bfa5]">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between mb-8 gap-2">
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
                                className="w-10 h-12 text-center text-xl font-bold bg-[#ecf0f3] border-none rounded-[10px] shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff] focus:outline-none focus:shadow-[inset_5px_5px_10px_#cbced1,inset_-5px_-5px_10px_#ffffff,0_0_0_2px_#00bfa5] text-[#1b1b1b]"
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[50px] rounded-[10px] bg-[#00bfa5] text-white font-bold text-lg shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] hover:scale-[0.98] active:shadow-[inset_5px_5px_10px_#008f7a,inset_-5px_-5px_10px_#00efcf] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                <div className="mt-6 text-center text-sm text-[#555]">
                    Tidak menerima kode?
                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="text-[#00bfa5] font-semibold hover:underline ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResending ? 'Mengirim...' : 'Kirim Ulang'}
                    </button>
                </div>
            </div>
        </div>
    );
}
