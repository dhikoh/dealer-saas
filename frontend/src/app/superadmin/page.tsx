'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, TrendingUp, TrendingDown, Users, FileText, AlertCircle, Building2 } from 'lucide-react';

interface Stats {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    totalMrr: number;
    pendingInvoices: number;
    churnRate: number;
    recentActivity: any[];
}

interface RevenueData {
    month: string;
    year: number;
    revenue: number;
}

export default function SuperadminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [statsRes, revenueRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/superadmin/stats`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/superadmin/analytics/revenue`, { headers }),
            ]);

            if (!statsRes.ok || !revenueRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const statsData = await statsRes.json();
            const revenueData = await revenueRes.json();

            setStats(statsData);
            setRevenue(revenueData);
        } catch (err: any) {
            setError(err.message);
            // Fallback to mock data for development
            setStats({
                totalTenants: 156,
                activeTenants: 124,
                trialTenants: 28,
                suspendedTenants: 4,
                totalMrr: 45000000,
                pendingInvoices: 12,
                churnRate: 2.5,
                recentActivity: [
                    { id: 1, userEmail: 'admin@otohub.id', action: 'INVOICE_APPROVE', entityName: 'INV-2024-001', createdAt: new Date().toISOString() },
                    { id: 2, userEmail: 'admin@otohub.id', action: 'TENANT_ACTIVATE', entityName: 'Jaya Motor', createdAt: new Date(Date.now() - 3600000).toISOString() },
                    { id: 3, userEmail: 'admin@otohub.id', action: 'TENANT_UPGRADE', entityName: 'Berkah Auto', createdAt: new Date(Date.now() - 7200000).toISOString() },
                ],
            });
            setRevenue([
                { month: 'Jul', year: 2025, revenue: 38000000 },
                { month: 'Ags', year: 2025, revenue: 41000000 },
                { month: 'Sep', year: 2025, revenue: 39000000 },
                { month: 'Okt', year: 2025, revenue: 44000000 },
                { month: 'Nov', year: 2025, revenue: 42000000 },
                { month: 'Des', year: 2025, revenue: 45000000 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatAction = (action: string) => {
        const actionLabels: Record<string, string> = {
            'INVOICE_APPROVE': 'Verifikasi Invoice',
            'INVOICE_REJECT': 'Tolak Invoice',
            'TENANT_ACTIVATE': 'Aktivasi Tenant',
            'TENANT_SUSPEND': 'Suspend Tenant',
            'TENANT_UPGRADE': 'Upgrade Plan',
            'LOGIN': 'Login',
        };
        return actionLabels[action] || action;
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
        return `${Math.floor(diff / 86400)} hari lalu`;
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">Loading Dashboard...</p>
            </div>
        );
    }

    const maxRevenue = Math.max(...revenue.map(r => r.revenue));

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Using sample data. API: {error}</span>
                </div>
            )}

            {/* METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total MRR"
                    value={formatCurrency(stats?.totalMrr || 0)}
                    change="+12.5%"
                    isPositive={true}
                    icon={<TrendingUp className="w-5 h-5" />}
                />
                <MetricCard
                    title="Active Tenants"
                    value={stats?.activeTenants?.toString() || '0'}
                    subtitle={`${stats?.trialTenants || 0} on trial`}
                    change="+5.2%"
                    isPositive={true}
                    icon={<Building2 className="w-5 h-5" />}
                />
                <MetricCard
                    title="Pending Invoices"
                    value={stats?.pendingInvoices?.toString() || '0'}
                    change="-2"
                    isPositive={true}
                    icon={<FileText className="w-5 h-5" />}
                />
                <MetricCard
                    title="Churn Rate"
                    value={`${stats?.churnRate || 0}%`}
                    change={Number(stats?.churnRate) > 3 ? '+0.5%' : '-0.2%'}
                    isPositive={Number(stats?.churnRate) <= 3}
                    icon={<TrendingDown className="w-5 h-5" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* REVENUE CHART */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-900">Revenue Overview</h3>
                        <span className="text-sm text-slate-500">Last 6 Months</span>
                    </div>
                    <div className="h-64 flex items-end space-x-4 px-2">
                        {revenue.map((r, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer">
                                <div className="relative">
                                    <div
                                        className="w-full bg-indigo-600 rounded-t-lg transition-all duration-300 group-hover:bg-indigo-500"
                                        style={{ height: `${(r.revenue / maxRevenue) * 200}px` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                                            {formatCurrency(r.revenue)}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-center text-slate-400 mt-2 font-medium group-hover:text-indigo-600 transition-colors">
                                    {r.month}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ACTIVITY LOG */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity Log</h3>
                    <div className="space-y-4">
                        {stats?.recentActivity?.slice(0, 5).map((log: any, i: number) => (
                            <div key={log.id || i} className="flex items-start space-x-3 pb-3 border-b border-slate-100 last:border-0">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <UserCheck className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-800 font-medium truncate">
                                        {formatAction(log.action)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {log.entityName} • {getTimeAgo(log.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                            <p className="text-sm text-slate-400 text-center py-4">Belum ada aktivitas</p>
                        )}
                    </div>
                    <button className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium py-2 hover:bg-indigo-50 rounded-lg transition-colors">
                        Lihat Semua Aktivitas
                    </button>
                </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickStat label="Total Tenants" value={stats?.totalTenants || 0} />
                <QuickStat label="Active" value={stats?.activeTenants || 0} color="emerald" />
                <QuickStat label="On Trial" value={stats?.trialTenants || 0} color="amber" />
                <QuickStat label="Suspended" value={stats?.suspendedTenants || 0} color="rose" />
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, change, isPositive, icon }: {
    title: string;
    value: string;
    subtitle?: string;
    change: string;
    isPositive: boolean;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline">
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {change}
                </span>
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
    );
}

function QuickStat({ label, value, color = 'slate' }: { label: string; value: number; color?: string }) {
    const colors: Record<string, string> = {
        slate: 'bg-slate-100 text-slate-900',
        emerald: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        rose: 'bg-rose-100 text-rose-700',
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <span className={`text-xl font-bold px-2 py-0.5 rounded ${colors[color]}`}>{value}</span>
        </div>
    );
}
