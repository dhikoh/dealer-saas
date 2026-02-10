'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle,
    faLock,
    faCreditCard,
    faCalendarTimes,
    faArrowRight,
    faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SuspendedPage() {
    const router = useRouter();
    const [tenantInfo, setTenantInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenantInfo = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    router.push('/auth');
                    return;
                }

                const res = await fetch(`${API_URL}/tenant/info`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setTenantInfo(data);
                    // If tenant is ACTIVE or TRIAL, redirect back to app
                    if (data.subscriptionStatus === 'ACTIVE' || data.subscriptionStatus === 'TRIAL') {
                        router.push('/app');
                    }
                }
            } catch (err) {
                console.error('Error fetching tenant info:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTenantInfo();
    }, [router]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const daysUntilDeletion = () => {
        if (!tenantInfo?.scheduledDeletionAt) return null;
        const diff = new Date(tenantInfo.scheduledDeletionAt).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#ecf0f3]">
                <div className="animate-spin w-12 h-12 border-4 border-[#00bfa5] border-t-transparent rounded-full" />
            </div>
        );
    }

    const deletionDays = daysUntilDeletion();

    return (
        <div className="min-h-screen bg-[#ecf0f3] flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                {/* Warning Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#ecf0f3] shadow-[8px_8px_16px_#cbced1,-8px_-8px_16px_#ffffff] mb-4">
                        <FontAwesomeIcon icon={faLock} className="text-4xl text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Akun Anda Ditangguhkan
                    </h1>
                    <p className="text-gray-500">
                        Langganan dealer Anda telah kedaluwarsa. Perpanjang sekarang untuk mengakses kembali semua fitur.
                    </p>
                </div>

                {/* Info Card */}
                <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[6px_6px_12px_#cbced1,-6px_-6px_12px_#ffffff] mb-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faCalendarTimes} className="text-orange-500 w-5" />
                            <div>
                                <p className="text-xs text-gray-400">Status</p>
                                <p className="font-semibold text-red-600">
                                    {tenantInfo?.subscriptionStatus === 'EXPIRED' ? 'Kedaluwarsa' : 'Ditangguhkan'}
                                </p>
                            </div>
                        </div>

                        {tenantInfo?.subscriptionEndsAt && (
                            <div className="flex items-center gap-3">
                                <FontAwesomeIcon icon={faCalendarTimes} className="text-gray-400 w-5" />
                                <div>
                                    <p className="text-xs text-gray-400">Berakhir pada</p>
                                    <p className="font-semibold text-gray-700">{formatDate(tenantInfo.subscriptionEndsAt)}</p>
                                </div>
                            </div>
                        )}

                        {deletionDays !== null && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-700 text-sm">
                                            Data akan dihapus dalam {deletionDays} hari
                                        </p>
                                        <p className="text-xs text-red-500 mt-1">
                                            Tanggal penghapusan: {formatDate(tenantInfo.scheduledDeletionAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/app/billing')}
                        className="w-full py-4 px-6 bg-[#00bfa5] text-white font-bold rounded-2xl shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] hover:bg-[#00a894] transition-all flex items-center justify-center gap-3"
                    >
                        <FontAwesomeIcon icon={faCreditCard} />
                        Perpanjang Langganan
                        <FontAwesomeIcon icon={faArrowRight} />
                    </button>

                    <a
                        href="https://wa.me/6287712333434"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-6 bg-[#ecf0f3] text-gray-600 font-medium rounded-2xl shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] transition-all flex items-center justify-center gap-3"
                    >
                        <FontAwesomeIcon icon={faHeadset} />
                        Hubungi Admin
                    </a>

                    <button
                        onClick={() => {
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('user_info');
                            router.push('/auth');
                        }}
                        className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
