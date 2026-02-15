'use client';

import React, { useEffect, useState } from 'react';
import { Crown, AlertTriangle, ChevronRight, Clock, CreditCard } from 'lucide-react';
import Link from 'next/link';

import { fetchApi } from '@/lib/api';

interface SubscriptionStatus {
    planTier: string;
    status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';
    trialEndsAt: string | null;
    daysRemaining?: number;
    hasPendingInvoice: boolean;
}

export default function SubscriptionWidget() {
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const res = await fetchApi('/tenant/profile');

                if (res.ok) {
                    const data = await res.json();
                    setSubscription({
                        planTier: data.planTier,
                        status: data.subscriptionStatus,
                        trialEndsAt: data.trialEndsAt,
                        daysRemaining: data.trialDaysRemaining,
                        hasPendingInvoice: false, // You might need another check for this, or backend adds it to profile
                    });
                    // Check for pending invoices separately if needed or if profile includes it
                    const invoiceRes = await fetchApi('/tenant/invoices?status=PENDING');
                    if (invoiceRes.ok) {
                        const invoices = await invoiceRes.json();
                        if (invoices.length > 0) {
                            setSubscription(prev => prev ? ({ ...prev, hasPendingInvoice: true }) : null);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch subscription status', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, []);

    if (loading || !subscription) return null;

    const isTrial = subscription.status === 'TRIAL';
    const isPastDue = subscription.status === 'PAST_DUE' || subscription.hasPendingInvoice;
    const isFree = subscription.planTier === 'DEMO' || subscription.planTier === 'FREE';

    // Don't show widget if active paid user with no issues
    if (subscription.status === 'ACTIVE' && !isFree && !isPastDue) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                <Crown size={150} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {isPastDue ? (
                            <span className="bg-rose-500/20 text-rose-100 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                                <AlertTriangle size={12} /> Payment Required
                            </span>
                        ) : isTrial ? (
                            <span className="bg-blue-500/20 text-blue-100 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30 flex items-center gap-1">
                                <Clock size={12} /> Trial Period
                            </span>
                        ) : (
                            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/30 flex items-center gap-1">
                                <Crown size={12} /> {subscription.planTier} Plan
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold">
                        {isPastDue
                            ? 'Tagihan Anda Belum Dibayar'
                            : isTrial
                                ? `Masa Percobaan Berakhir Dalam ${subscription.daysRemaining} Hari`
                                : 'Upgrade ke Pro untuk Fitur Lebih Lengkap'}
                    </h3>

                    <p className="text-indigo-100 text-sm mt-1 max-w-xl">
                        {isPastDue
                            ? 'Layanan Anda mungkin akan dibatasi segera. Mohon selesaikan pembayaran invoice pending Anda.'
                            : isTrial
                                ? 'Jangan sampai kehilangan akses ke data dan fitur premium Anda. Upgrade plan Anda sekarang.'
                                : 'Dapatkan akses unlimited kendaraan, multi-user, dan laporan keuangan detail dengan paket Pro.'}
                    </p>
                </div>

                <Link
                    href="/app/billing"
                    className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                    {isPastDue ? 'Bayar Tagihan' : 'Lihat Paket'} <ChevronRight size={16} />
                </Link>
            </div>
        </div>
    );
}
