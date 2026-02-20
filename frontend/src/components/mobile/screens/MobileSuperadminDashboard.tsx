'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface SuperadminStats {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    monthlyRevenue: number;
}

interface RecentTenant {
    id: string;
    name: string;
    subscriptionStatus: string;
    createdAt: string;
    owner?: { name: string };
}

interface Props {
    user: { name?: string;[key: string]: unknown };
}

export default function MobileSuperadminDashboard({ user }: Props) {
    const { theme } = useMobileContext();
    const [stats, setStats] = useState<SuperadminStats | null>(null);
    const [recentTenants, setRecentTenants] = useState<RecentTenant[]>([]);
    const [loading, setLoading] = useState(true);

    const displayName = (user?.name as string) || 'Superadmin';
    const initial = displayName.charAt(0).toUpperCase();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsRes, tenantsRes] = await Promise.all([
                    fetchApi('/superadmin/stats'),
                    fetchApi('/superadmin/tenants?limit=5&page=1'),
                ]);
                if (statsRes.ok) {
                    const s = await statsRes.json();
                    setStats({
                        totalTenants: s.totalTenants ?? s.total ?? 0,
                        activeTenants: s.activeTenants ?? s.active ?? 0,
                        totalUsers: s.totalUsers ?? 0,
                        monthlyRevenue: s.monthlyRevenue ?? s.mrr ?? 0,
                    });
                }
                if (tenantsRes.ok) {
                    const t = await tenantsRes.json();
                    setRecentTenants(t?.data ?? t ?? []);
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const statCards = [
        { icon: <Building2 className="h-5 w-5" />, value: stats?.totalTenants ?? 0, label: 'Total Dealer' },
        { icon: <CheckCircle className="h-5 w-5" />, value: stats?.activeTenants ?? 0, label: 'Dealer Aktif' },
        { icon: <Users className="h-5 w-5" />, value: stats?.totalUsers ?? 0, label: 'Total User' },
        { icon: <DollarSign className="h-5 w-5" />, value: stats?.monthlyRevenue ? formatRupiah(stats.monthlyRevenue) : '-', label: 'MRR', small: true },
    ];

    const statusColors: Record<string, string> = {
        ACTIVE: 'text-green-500',
        SUSPENDED: 'text-red-500',
        TRIAL: 'text-yellow-500',
        CANCELLED: 'text-gray-400',
    };

    return (
        <div className="pb-6 no-select">
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-4 px-6 flex justify-between items-center sticky top-0 z-20`}>
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>Superadmin Panel</p>
                    <h2 className={`text-xl font-black ${theme.textMain}`}>{displayName}</h2>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${theme.iconContainer}`}>
                    {initial}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="px-6 mt-4 grid grid-cols-2 gap-4">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className={`p-5 flex flex-col items-center text-center ${theme.bgCard}`}>
                            <div className={`w-12 h-12 rounded-full mb-3 ${theme.imagePlaceholder} animate-pulse`} />
                            <div className={`w-12 h-8 rounded-lg mb-2 ${theme.imagePlaceholder} animate-pulse`} />
                            <div className={`w-20 h-3 rounded ${theme.imagePlaceholder} animate-pulse`} />
                        </div>
                    ))
                ) : statCards.map((card, i) => (
                    <div key={i} className={`p-5 flex flex-col items-center text-center ${theme.bgCard}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${theme.iconContainer}`}>
                            {card.icon}
                        </div>
                        <h3 className={`${card.small ? 'text-sm' : 'text-3xl'} font-black tracking-tight ${theme.textMain}`}>
                            {card.value}
                        </h3>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${theme.textMuted}`}>{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Tenants */}
            <div className="px-6 mt-8">
                <div className="flex justify-between items-center mb-4 pl-1 pr-1">
                    <h3 className={`text-[11px] font-black uppercase tracking-widest ${theme.textMuted}`}>Tenant Terbaru</h3>
                </div>

                {loading ? (
                    <div className={`p-6 ${theme.bgCard} flex items-center justify-center`}>
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : recentTenants.length === 0 ? (
                    <div className={`p-8 ${theme.bgCard} flex flex-col items-center text-center`}>
                        <AlertCircle className={`h-8 w-8 mb-3 opacity-30 ${theme.textMuted}`} />
                        <p className={`text-sm font-black ${theme.textMuted}`}>Belum ada tenant</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentTenants.map(tenant => (
                            <div key={tenant.id} className={`p-4 flex items-center gap-4 ${theme.bgCard}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-black text-lg ${theme.iconContainer}`}>
                                    {tenant.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-black text-sm truncate ${theme.textMain}`}>{tenant.name}</h4>
                                    <p className={`text-xs font-bold truncate mt-1 ${theme.textMuted}`}>
                                        {tenant.owner?.name ?? '-'}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-black uppercase ${statusColors[tenant.subscriptionStatus] ?? theme.textMuted}`}>
                                    {tenant.subscriptionStatus}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
