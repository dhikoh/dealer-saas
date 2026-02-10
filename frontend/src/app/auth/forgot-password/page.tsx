'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope as faEnvelopeReg } from '@fortawesome/free-regular-svg-icons';
import { faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Mohon masukkan email Anda.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase() }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Gagal mengirim link reset.');
            }

            setEmailSent(true);
            toast.success('Link reset password telah dikirim!');
        } catch (err: any) {
            toast.error(err.message || 'Terjadi kesalahan.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-start min-h-screen bg-[#ecf0f3] py-5 pt-[10vh] font-poppins text-gray-700 select-none">
            <div className="w-full max-w-md mx-4">
                {/* Card */}
                <div className="rounded-2xl bg-[#ecf0f3] shadow-[6px_6px_12px_#cbced1,-6px_-6px_12px_#ffffff] p-8">
                    {/* Logo */}
                    <div className="text-center mb-6">
                        <div className="text-3xl font-bold text-[#00bfa5] tracking-wider">OTOHUB</div>
                        <div className="text-xs text-gray-400 font-medium">Smart System</div>
                    </div>

                    {emailSent ? (
                        /* Success State */
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00bfa5] flex items-center justify-center shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                                <FontAwesomeIcon icon={faCheck} className="text-white text-2xl" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-700 mb-2">Email Terkirim!</h2>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                Kami telah mengirim link reset password ke <strong className="text-gray-700">{email}</strong>. Cek inbox atau folder spam Anda.
                            </p>
                            <p className="text-xs text-gray-400 mb-6">Link berlaku selama 30 menit.</p>
                            <button
                                onClick={() => router.push('/auth')}
                                className="w-full py-3 rounded-xl bg-[#00bfa5] text-white font-medium hover:bg-[#00a896] transition-colors"
                            >
                                Kembali ke Login
                            </button>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <h2 className="text-lg font-semibold text-gray-700 mb-2 text-center">Lupa Password?</h2>
                            <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">
                                Masukkan email yang terdaftar. Kami akan mengirimkan link untuk mereset password Anda.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div className="relative mb-4">
                                    <FontAwesomeIcon
                                        icon={faEnvelopeReg}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email Terdaftar"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-sm text-gray-700"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl bg-[#00bfa5] text-white font-semibold text-sm uppercase tracking-wide shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:bg-[#00a896] transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? '...' : 'KIRIM LINK RESET'}
                                </button>
                            </form>

                            <button
                                onClick={() => router.push('/auth')}
                                className="w-full mt-4 py-3 rounded-xl text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                                Kembali ke Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
