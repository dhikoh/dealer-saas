'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCar,
    faShoppingCart,
    faMoneyBillWave,
    faHandshake,
    faArrowUp,
    faArrowDown,
    faMotorcycle,
    faTruck
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function StatsPage() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalVehicles: 0,
        totalSales: 0,
        revenue: 0,
        pendingDeals: 0,
    });
    const [monthlySales, setMonthlySales] = useState<{ month: string; count: number; revenue: number }[]>([]);

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            // Fetch vehicle stats + transaction stats + monthly sales in parallel
            const [vehicleRes, txStatsRes, monthlyRes] = await Promise.all([
                fetch(`${API_URL}/vehicles`, { headers }).catch(() => null),
                fetch(`${API_URL}/transactions/stats`, { headers }).catch(() => null),
                fetch(`${API_URL}/transactions/reports/monthly?months=6`, { headers }).catch(() => null),
            ]);

            // Handle 401 from any response
            if (vehicleRes?.status === 401 || txStatsRes?.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_info');
                window.location.href = '/auth';
                return;
            }

            // Process vehicles
            let totalVehicles = 0;
            if (vehicleRes?.ok) {
                const vehicles = await vehicleRes.json();
                totalVehicles = Array.isArray(vehicles) ? vehicles.length : 0;
            }

            // Process transaction stats
            let totalSales = 0;
            let revenue = 0;
            let pendingDeals = 0;
            if (txStatsRes?.ok) {
                const txStats = await txStatsRes.json();
                totalSales = txStats.totalSales || txStats.totalTransactions || 0;
                revenue = typeof txStats.totalRevenue === 'object'
                    ? parseFloat(txStats.totalRevenue.toString())
                    : (txStats.totalRevenue || 0);
                pendingDeals = txStats.pendingTransactions || 0;
            }

            // Process monthly sales
            let monthlyData: { month: string; count: number; revenue: number }[] = [];
            if (monthlyRes?.ok) {
                const monthly = await monthlyRes.json();
                if (Array.isArray(monthly)) {
                    monthlyData = monthly.map((m: any) => ({
                        month: MONTH_NAMES[new Date(m.month || m.date || '').getMonth()] || m.month || '?',
                        count: m.count || m.sales || 0,
                        revenue: typeof m.revenue === 'object' ? parseFloat(m.revenue.toString()) : (m.revenue || 0),
                    }));
                }
            }

            // If no monthly data, show placeholder
            if (monthlyData.length === 0) {
                const now = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    monthlyData.push({ month: MONTH_NAMES[d.getMonth()], count: 0, revenue: 0 });
                }
            }

            setStats({ totalVehicles, totalSales, revenue, pendingDeals });
            setMonthlySales(monthlyData);
        } catch (err) {
            console.error('Error fetching stats:', err);
            toast.error('Gagal memuat statistik');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    // Stats Card Component
    const StatCard = ({
        title,
        value,
        icon,
        trend,
        trendValue,
        color = '#00bfa5'
    }: {
        title: string;
        value: string | number;
        icon: any;
        trend?: 'up' | 'down';
        trendValue?: string;
        color?: string;
    }) => (
        <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff] hover:shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]" style={{ color }}>
                    <FontAwesomeIcon icon={icon} size="lg" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        <FontAwesomeIcon icon={trend === 'up' ? faArrowUp : faArrowDown} />
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <div className="text-sm text-gray-500 mb-1">{title}</div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
        </div>
    );

    // Simple Bar Chart Component
    const BarChart = ({ data }: { data: { month: string; count: number }[] }) => {
        const maxCount = Math.max(...data.map(d => d.count), 1);
        return (
            <div className="flex items-end justify-between gap-4 h-40 mt-4">
                {data.map((item) => (
                    <div key={item.month} className="flex flex-col items-center flex-1">
                        <div
                            className="w-full bg-gradient-to-t from-[#00bfa5] to-[#00e5c3] rounded-t-lg shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)] transition-all duration-500 hover:from-[#00a891] hover:to-[#00bfa5]"
                            style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: '10px' }}
                        />
                        <div className="text-xs text-gray-500 mt-2 font-medium">{item.month}</div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div>
            {/* PAGE HEADER */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">{t.statsTitle}</h1>
                <p className="text-sm text-gray-500 mt-1">{t.latestUpdate}</p>
            </div>

            {/* STATS CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title={t.totalVehicles}
                    value={stats.totalVehicles}
                    icon={faCar}
                />
                <StatCard
                    title={t.totalSales}
                    value={stats.totalSales}
                    icon={faShoppingCart}
                    color="#3b82f6"
                />
                <StatCard
                    title={t.revenue}
                    value={formatCurrency(stats.revenue)}
                    icon={faMoneyBillWave}
                    color="#10b981"
                />
                <StatCard
                    title={t.pendingDeals}
                    value={stats.pendingDeals}
                    icon={faHandshake}
                    color="#f59e0b"
                />
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* MONTHLY SALES CHART */}
                <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff]">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{t.monthlySales}</h3>
                    <p className="text-xs text-gray-500 mb-4">6 bulan terakhir</p>
                    <BarChart data={monthlySales} />
                </div>

                {/* MONTHLY REVENUE TABLE */}
                <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Pendapatan Bulanan</h3>
                    <div className="space-y-3">
                        {monthlySales.map((item) => (
                            <div key={item.month} className="flex items-center justify-between p-3 rounded-xl bg-[#ecf0f3] shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#00bfa5] bg-[#00bfa5]/10 text-xs font-bold">
                                        {item.month}
                                    </div>
                                    <span className="font-medium text-gray-700 text-sm">{item.count} transaksi</span>
                                </div>
                                <span className="font-semibold text-gray-800 text-sm">{formatCurrency(item.revenue)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
