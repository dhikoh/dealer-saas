'use client';

import React, { useEffect, useState } from 'react';
import { Car, CheckCircle, TrendingUp, Users, FileText, Calculator, AlertCircle, Bell, CreditCard, Crown } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';
import type { MobileTab } from '@/components/mobile/MobileBottomNav';

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface DashboardStats {
    totalAktif: number;
    terjualBulanIni: number;
    totalPendapatan: number;
    totalPelanggan: number;
}

interface RecentTransaction {
    id: string;
    invoiceNumber?: string;
    customer?: { name: string };
    vehicle?: { brand: string; model: string };
    finalPrice: number;
    status: string;
    date: string;
}

interface Reminder {
    id: string;
    type: 'TAX' | 'CREDIT' | 'SUBSCRIPTION';
    title: string;
    message: string;
    dueDate?: string;
    daysUntilDue?: number;
    isOverdue?: boolean;
}

interface TenantProfile {
    subscriptionStatus: string;
    trialEndsAt?: string | null;
    plan?: { name: string };
}

interface Props {
    user: { name?: string;[key: string]: unknown };
    onTabChange: (tab: MobileTab) => void;
}

export default function MobileDashboard({ user, onTabChange }: Props) {
    const { theme } = useMobileContext();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recent, setRecent] = useState<RecentTransaction[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const displayName = (user?.name as string) || 'User';
    const initial = displayName.charAt(0).toUpperCase();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsRes, txRes, remindersRes, profileRes] = await Promise.all([
                    fetchApi('/vehicles/stats'),
                    fetchApi('/transactions?limit=5&page=1'),
                    fetchApi('/reminders'),
                    fetchApi('/tenant/profile'),
                ]);
                if (statsRes.ok) {
                    const s = await statsRes.json();
                    setStats({
                        totalAktif: s.available ?? s.total ?? 0,
                        terjualBulanIni: s.sold ?? s.soldThisMonth ?? 0,
                        totalPendapatan: s.revenue ?? 0,
                        totalPelanggan: s.customers ?? 0,
                    });
                }
                if (txRes.ok) {
                    const t = await txRes.json();
                    setRecent(t.data ?? t ?? []);
                }
                if (remindersRes.ok) {
                    const r = await remindersRes.json();
                    setReminders(r?.reminders ?? r ?? []);
                }
                if (profileRes.ok) {
                    setTenantProfile(await profileRes.json());
                }
            } catch {
                // silently fail, show empty state
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <div className="pb-6 no-select">
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-4 px-6 flex justify-between items-center sticky top-0 z-20`}>
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>Selamat Datang,</p>
                    <h2 className={`text-xl font-black ${theme.textMain}`}>{displayName}</h2>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${theme.iconContainer}`}>
                    {initial}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="px-6 mt-4 grid grid-cols-2 gap-4">
                {loading ? (
                    <>
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`p-5 flex flex-col items-center text-center ${theme.bgCard}`}>
                                <div className={`w-12 h-12 rounded-full mb-3 ${theme.imagePlaceholder} animate-pulse`} />
                                <div className={`w-10 h-8 rounded-lg mb-2 ${theme.imagePlaceholder} animate-pulse`} />
                                <div className={`w-20 h-3 rounded ${theme.imagePlaceholder} animate-pulse`} />
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className={`p-5 flex flex-col items-center text-center ${theme.bgCard}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${theme.iconContainer}`}>
                                <Car className="h-5 w-5" />
                            </div>
                            <h3 className={`text-3xl font-black tracking-tight ${theme.textMain}`}>{stats?.totalAktif ?? 0}</h3>
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${theme.textMuted}`}>Stok Tersedia</p>
                        </div>
                        <div className={`p-5 flex flex-col items-center text-center ${theme.bgCard}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${theme.iconContainer}`}>
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <h3 className={`text-3xl font-black tracking-tight ${theme.textMain}`}>{stats?.terjualBulanIni ?? 0}</h3>
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${theme.textMuted}`}>Terjual Bln Ini</p>
                        </div>
                        <div className={`p-5 flex flex-col items-center text-center ${theme.bgCard}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${theme.iconContainer}`}>
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <p className={`text-sm font-black tracking-tight ${theme.textMain}`}>{stats?.totalPendapatan ? formatRupiah(stats.totalPendapatan) : '-'}</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${theme.textMuted}`}>Pendapatan</p>
                        </div>
                        <div className={`p-5 flex flex-col items-center text-center ${theme.bgCard}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${theme.iconContainer}`}>
                                <Users className="h-5 w-5" />
                            </div>
                            <h3 className={`text-3xl font-black tracking-tight ${theme.textMain}`}>{stats?.totalPelanggan ?? 0}</h3>
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${theme.textMuted}`}>Pelanggan</p>
                        </div>
                    </>
                )}
            </div>

            {/* Reminder Alerts */}
            {!loading && reminders.length > 0 && (
                <div className="px-6 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Bell className="h-4 w-4 text-amber-500" />
                        <h3 className={`text-[11px] font-black uppercase tracking-widest ${theme.textMuted}`}>Pengingat</h3>
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">{reminders.length}</span>
                    </div>
                    <div className="space-y-2">
                        {reminders.slice(0, 3).map(r => (
                            <div key={r.id} className={`p-3 rounded-xl flex items-start gap-3 ${r.isOverdue ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.type === 'CREDIT' ? 'bg-red-100' : 'bg-amber-100'}`}>
                                    {r.type === 'CREDIT' ? <CreditCard className="w-4 h-4 text-red-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold ${r.isOverdue ? 'text-red-700' : 'text-amber-700'}`}>{r.title}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{r.message}</p>
                                </div>
                                {r.daysUntilDue !== undefined && (
                                    <span className={`text-[10px] font-bold flex-shrink-0 ${r.isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                                        {r.isOverdue ? 'Lewat' : `${r.daysUntilDue}h`}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Subscription Widget */}
            {!loading && tenantProfile && (tenantProfile.subscriptionStatus === 'TRIAL' || tenantProfile.subscriptionStatus === 'SUSPENDED') && (
                <div className="px-6 mt-4">
                    <div className={`rounded-2xl p-4 flex items-center gap-3 ${tenantProfile.subscriptionStatus === 'TRIAL' ? 'bg-purple-50 border border-purple-200' : 'bg-red-50 border border-red-200'}`}
                        onClick={() => onTabChange('subscriptions')}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tenantProfile.subscriptionStatus === 'TRIAL' ? 'bg-purple-100' : 'bg-red-100'}`}>
                            <Crown className={`w-5 h-5 ${tenantProfile.subscriptionStatus === 'TRIAL' ? 'text-purple-600' : 'text-red-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${tenantProfile.subscriptionStatus === 'TRIAL' ? 'text-purple-700' : 'text-red-700'}`}>
                                {tenantProfile.subscriptionStatus === 'TRIAL' ? `Trial: ${tenantProfile.plan?.name ?? 'Demo'}` : 'Akun Ditangguhkan'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {tenantProfile.subscriptionStatus === 'TRIAL'
                                    ? (tenantProfile.trialEndsAt ? `Berakhir: ${new Date(tenantProfile.trialEndsAt).toLocaleDateString('id-ID')}` : 'Upgrade untuk akses penuh')
                                    : 'Hubungi admin untuk mengaktifkan'}
                            </p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${tenantProfile.subscriptionStatus === 'TRIAL' ? 'bg-purple-600 text-white' : 'bg-red-600 text-white'}`}>
                            {tenantProfile.subscriptionStatus === 'TRIAL' ? 'Upgrade' : 'Info'}
                        </span>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="px-6 mt-6">
                <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 pl-1 ${theme.textMuted}`}>Aksi Cepat</h3>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-2">
                    {[
                        { icon: <Car className="h-6 w-6" />, label: 'Stok', tab: 'vehicles' as MobileTab },
                        { icon: <FileText className="h-6 w-6" />, label: 'Transaksi', tab: 'transactions' as MobileTab },
                        { icon: <CreditCard className="h-6 w-6" />, label: 'Kredit', tab: 'credit' as MobileTab },
                        { icon: <Users className="h-6 w-6" />, label: 'Klien', tab: 'customers' as MobileTab },
                    ].map(a => (
                        <div key={a.label} className="snap-start flex flex-col items-center gap-3 active:scale-95 transition-transform shrink-0">
                            <button
                                onClick={() => onTabChange(a.tab)}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme.iconContainer}`}
                            >
                                {a.icon}
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textMain}`}>{a.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="px-6 mt-8">
                <div className="flex justify-between items-end mb-4 pl-1 pr-1">
                    <h3 className={`text-[11px] font-black uppercase tracking-widest ${theme.textMuted}`}>Transaksi Terbaru</h3>
                    <button onClick={() => onTabChange('transactions')} className={`text-[11px] font-black uppercase tracking-widest ${theme.textHighlight}`}>Lihat Semua</button>
                </div>

                {loading ? (
                    <div className={`p-6 ${theme.bgCard} flex items-center justify-center`}>
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : recent.length === 0 ? (
                    <div className={`p-8 ${theme.bgCard} flex flex-col items-center text-center`}>
                        <AlertCircle className={`h-8 w-8 mb-3 opacity-30 ${theme.textMuted}`} />
                        <p className={`text-sm font-black ${theme.textMuted}`}>Belum ada transaksi</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recent.map((tx) => (
                            <div key={tx.id} className={`p-4 flex items-center gap-4 ${theme.bgCard}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${theme.iconContainer}`}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-black text-sm truncate ${theme.textMain}`}>{tx.customer?.name ?? '-'}</h4>
                                    <p className={`text-xs font-bold truncate mt-1 ${theme.textMuted}`}>{tx.vehicle ? `${tx.vehicle.brand} ${tx.vehicle.model}` : '-'}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className={`text-sm font-black ${theme.textHighlight}`}>{formatRupiah(tx.finalPrice)}</p>
                                    <div className={`inline-block px-3 py-1 mt-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${theme.btnSecondary}`}>
                                        {tx.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
