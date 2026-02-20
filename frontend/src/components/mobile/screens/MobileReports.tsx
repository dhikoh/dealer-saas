'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Award, RefreshCw } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtCompact = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}jt` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}rb` : String(n);

interface Stats { totalVehicles: number; availableVehicles: number; soldThisMonth: number; salesChange: number; revenueThisMonth: number; revenueChange: number; totalCustomers: number; newCustomersThisMonth: number; }
interface MonthlySale { month: string; count: number; revenue: number; }
interface TopBrand { rank: number; name: string; count: number; revenue: number; }
interface CategoryRevenue { category: string; count: number; revenue: number; percentage: number; }
interface PerformanceMetrics { avgDaysToSell: number; conversionRate: number; avgMarginPerUnit: number; totalProfit: number; }

export default function MobileReports() {
    const { theme } = useMobileContext();
    const [stats, setStats] = useState<Stats | null>(null);
    const [monthly, setMonthly] = useState<MonthlySale[]>([]);
    const [brands, setBrands] = useState<TopBrand[]>([]);
    const [categories, setCategories] = useState<CategoryRevenue[]>([]);
    const [perfMetrics, setPerfMetrics] = useState<PerformanceMetrics | null>(null);
    const [period, setPeriod] = useState('6');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [s, m, b, cat, perf] = await Promise.allSettled([
                fetchApi('/analytics/dashboard'),
                fetchApi(`/analytics/monthly-sales?months=${period}`),
                fetchApi(`/analytics/top-brands?months=${period}`),
                fetchApi(`/analytics/category-revenue?months=${period}`),
                fetchApi(`/analytics/performance-metrics?months=${period}`),
            ]);
            if (s.status === 'fulfilled' && s.value.ok) setStats(await s.value.json());
            if (m.status === 'fulfilled' && m.value.ok) setMonthly(await m.value.json());
            if (b.status === 'fulfilled' && b.value.ok) setBrands(await b.value.json());
            if (cat.status === 'fulfilled' && cat.value.ok) setCategories(await cat.value.json());
            if (perf.status === 'fulfilled' && perf.value.ok) setPerfMetrics(await perf.value.json());
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [period]);

    const maxRevenue = monthly.reduce((m, r) => Math.max(m, r.revenue), 0);

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select pb-6`}>
            <div className={`${theme.bgHeader} pt-12 pb-4 px-6 sticky top-0 z-10 flex justify-between items-center`}>
                <h2 className={`text-2xl font-black ${theme.textMain}`}>Laporan</h2>
                <div className="flex gap-2">
                    {['3', '6', '12'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${period === p ? theme.btnPrimary : theme.btnSecondary}`}>
                            {p}bln
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="px-6 mt-4 grid grid-cols-2 gap-4">
                {[
                    { label: 'Terjual Bulan Ini', value: stats?.soldThisMonth ?? 0, change: stats?.salesChange, unit: 'unit' },
                    { label: 'Pendapatan', value: stats ? fmtCompact(stats.revenueThisMonth) : '-', change: stats?.revenueChange },
                    { label: 'Total Kendaraan', value: stats?.totalVehicles ?? 0, unit: 'unit' },
                    { label: 'Total Pelanggan', value: stats?.totalCustomers ?? 0, unit: 'orang' },
                ].map((card, i) => (
                    <div key={i} className={`p-5 ${theme.bgCard}`}>
                        {loading ? <div className={`h-16 rounded-xl ${theme.imagePlaceholder} animate-pulse`} /> : (
                            <>
                                <h3 className={`text-2xl font-black ${theme.textHighlight}`}>{card.value}</h3>
                                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${theme.textMuted}`}>{card.label}</p>
                                {card.change !== undefined && (
                                    <p className={`text-[10px] font-black mt-1 flex items-center gap-1 ${card.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {card.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {Math.abs(card.change)}%
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Monthly Chart — bar chart using divs */}
            {monthly.length > 0 && (
                <div className="px-6 mt-6">
                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 pl-1 ${theme.textMuted}`}>Penjualan per Bulan</h3>
                    <div className={`p-5 ${theme.bgCard}`}>
                        <div className="flex items-end gap-2 h-28">
                            {monthly.map((m, i) => {
                                const h = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <p className={`text-[8px] font-black ${theme.textHighlight}`}>{m.count}</p>
                                        <div className={`w-full rounded-t-lg ${theme.btnPrimary}`} style={{ height: `${Math.max(h, 4)}%` }} />
                                        <p className={`text-[7px] font-black ${theme.textMuted}`}>{m.month.slice(0, 3)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Top Brands */}
            {brands.length > 0 && (
                <div className="px-6 mt-6">
                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 pl-1 ${theme.textMuted}`}>Merek Terlaris</h3>
                    <div className="space-y-3">
                        {brands.slice(0, 5).map((b, i) => (
                            <div key={i} className={`p-4 flex items-center gap-4 ${theme.bgCard}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black ${theme.iconContainer}`}>
                                    #{b.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-black text-sm ${theme.textMain}`}>{b.name}</p>
                                    <p className={`text-[10px] font-black ${theme.textMuted}`}>{b.count} unit terjual</p>
                                </div>
                                <p className={`text-sm font-black ${theme.textHighlight}`}>{fmtCompact(b.revenue)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Revenue */}
            {categories.length > 0 && (
                <div className="px-6 mt-6">
                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 pl-1 ${theme.textMuted}`}>Pendapatan per Kategori</h3>
                    <div className="space-y-3">
                        {categories.map((cat, i) => (
                            <div key={i} className={`p-4 ${theme.bgCard}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-sm font-black ${theme.textMain}`}>{cat.category || 'Lainnya'}</span>
                                    <span className={`text-sm font-black ${theme.textHighlight}`}>{fmtCompact(cat.revenue)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${theme.btnPrimary}`} style={{ width: `${cat.percentage ?? 0}%` }} />
                                    </div>
                                    <span className={`text-[10px] font-black ${theme.textMuted}`}>{cat.percentage?.toFixed(0)}%</span>
                                </div>
                                <p className={`text-[10px] mt-1 ${theme.textMuted}`}>{cat.count} unit terjual</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Performance Metrics */}
            {perfMetrics && (
                <div className="px-6 mt-6 mb-6">
                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 pl-1 ${theme.textMuted}`}>Performa Penjualan</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Rata-rata Hari Jual', value: `${perfMetrics.avgDaysToSell?.toFixed(0) ?? '-'} hari` },
                            { label: 'Conversion Rate', value: `${perfMetrics.conversionRate?.toFixed(1) ?? '-'}%` },
                            { label: 'Rata-rata Margin/Unit', value: fmtCompact(perfMetrics.avgMarginPerUnit ?? 0) },
                            { label: 'Total Profit', value: fmtCompact(perfMetrics.totalProfit ?? 0) },
                        ].map((m, i) => (
                            <div key={i} className={`p-4 ${theme.bgCard}`}>
                                <h4 className={`text-lg font-black ${theme.textHighlight}`}>{m.value}</h4>
                                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${theme.textMuted}`}>{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
