'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEye, faEyeSlash, faCheck } from '@fortawesome/free-solid-svg-icons';

import { API_URL } from '@/lib/api';

export default function ResetPasswordPage() {
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('Password minimal 6 karakter.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Password tidak cocok.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Gagal mereset password.');
            }

            setResetSuccess(true);
            toast.success('Password berhasil direset!');
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

                    {resetSuccess ? (
                        /* Success State */
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00bfa5] flex items-center justify-center shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                                <FontAwesomeIcon icon={faCheck} className="text-white text-2xl" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-700 mb-2">Password Berhasil Direset!</h2>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                Silakan login dengan password baru Anda.
                            </p>
                            <button
                                onClick={() => router.push('/auth')}
                                className="w-full py-3 rounded-xl bg-[#00bfa5] text-white font-medium hover:bg-[#00a896] transition-colors"
                            >
                                Login Sekarang
                            </button>
                        </div>
                    ) : (
                        /* Form State */
                        <>
                            <h2 className="text-lg font-semibold text-gray-700 mb-2 text-center">Reset Password</h2>
                            <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">
                                Buat password baru untuk akun OTOHUB Anda.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div className="relative mb-4">
                                    <FontAwesomeIcon
                                        icon={faLock}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                                    />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password Baru"
                                        required
                                        className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-sm text-gray-700"
                                    />
                                    <FontAwesomeIcon
                                        icon={showPassword ? faEyeSlash : faEye}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm cursor-pointer hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    />
                                </div>

                                <div className="relative mb-4">
                                    <FontAwesomeIcon
                                        icon={faLock}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                                    />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Konfirmasi Password"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-sm text-gray-700"
                                    />
                                </div>

                                {/* Password strength hint */}
                                <div className="text-xs text-gray-400 mb-4 text-center">
                                    Password minimal 6 karakter
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 rounded-xl bg-[#00bfa5] text-white font-semibold text-sm uppercase tracking-wide shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:bg-[#00a896] transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? '...' : 'RESET PASSWORD'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
