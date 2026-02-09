'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Car, DollarSign, Users, Package, Download, Calendar, RefreshCw } from 'lucide-react';

interface DashboardStats {
    totalVehicles: number;
    availableVehicles: number;
    soldThisMonth: number;
    salesChange: number;
    revenueThisMonth: number;
    revenueChange: number;
    totalCustomers: number;
    newCustomersThisMonth: number;
}

interface MonthlySales {
    month: string;
    count: number;
    revenue: number;
}

interface TopBrand {
    rank: number;
    name: string;
    count: number;
    revenue: number;
}

interface CategoryRevenue {
    category: string;
    name: string;
    revenue: number;
    percent: number;
}

interface PerformanceMetrics {
    avgDaysToSell: number;
    avgMargin: number;
    conversionRate: number;
    totalSold: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ReportsPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
    const [topBrands, setTopBrands] = useState<TopBrand[]>([]);
    const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
    const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('6');

    useEffect(() => {
        fetchData();
    }, [period]);

    const getHeaders = () => {
        const token = localStorage.getItem('access_token');
        return { 'Authorization': `Bearer ${token}` };
    };

    const fetchData = async () => {
        setLoading(true);
        const headers = getHeaders();

        try {
            const [statsRes, salesRes, brandsRes, catRes, perfRes] = await Promise.allSettled([
                fetch(`${API_BASE}/analytics/dashboard`, { headers }),
                fetch(`${API_BASE}/analytics/monthly-sales?months=${period}`, { headers }),
                fetch(`${API_BASE}/analytics/top-brands?months=${period}`, { headers }),
                fetch(`${API_BASE}/analytics/revenue-breakdown?months=${period}`, { headers }),
                fetch(`${API_BASE}/analytics/performance`, { headers }),
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
                setStats(await statsRes.value.json());
            }
            if (salesRes.status === 'fulfilled' && salesRes.value.ok) {
                setMonthlySales(await salesRes.value.json());
            }
            if (brandsRes.status === 'fulfilled' && brandsRes.value.ok) {
                setTopBrands(await brandsRes.value.json());
            }
            if (catRes.status === 'fulfilled' && catRes.value.ok) {
                setCategoryRevenue(await catRes.value.json());
            }
            if (perfRes.status === 'fulfilled' && perfRes.value.ok) {
                setPerformance(await perfRes.value.json());
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000000) {
            return `Rp ${(value / 1000000000).toFixed(1)}M`;
        }
        if (value >= 1000000) {
            return `Rp ${(value / 1000000).toFixed(0)}jt`;
        }
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const handleExport = async (type: 'pdf' | 'excel') => {
        try {
            const token = localStorage.getItem('access_token');
            const endpoint = type === 'pdf'
                ? `${API_BASE}/pdf/reports/sales?months=${period}`
                : `${API_BASE}/pdf/export/sales-csv?months=${period}`;

            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = type === 'pdf'
                ? `Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.pdf`
                : `Penjualan_OTOHUB_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        }
    };

    const maxRevenue = monthlySales.length > 0 ? Math.max(...monthlySales.map(m => m.revenue)) : 1;
    const maxCount = monthlySales.length > 0 ? Math.max(...monthlySales.map(m => m.count)) : 1;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00bfa5] rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Memuat data laporan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan & Statistik</h1>
                    <p className="text-gray-500 mt-1">Pantau performa bisnis Anda secara real-time</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-[#ecf0f3] border-none shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                    >
                        <option value="1">1 Bulan</option>
                        <option value="3">3 Bulan</option>
                        <option value="6">6 Bulan</option>
                        <option value="12">1 Tahun</option>
                    </select>
                    <button
                        onClick={fetchData}
                        className="p-2.5 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] text-gray-500 hover:text-[#00bfa5] transition-colors"
                        title="Refresh data"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <ExportDropdown
                        onExportPDF={() => handleExport('pdf')}
                        onExportExcel={() => handleExport('excel')}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Car className="w-6 h-6" />}
                    label="Total Kendaraan"
                    value={stats?.totalVehicles || 0}
                    subValue={`${stats?.availableVehicles || 0} tersedia`}
                    color="teal"
                />
                <StatCard
                    icon={<Package className="w-6 h-6" />}
                    label="Terjual Bulan Ini"
                    value={stats?.soldThisMonth || 0}
                    subValue={`${(stats?.salesChange ?? 0) >= 0 ? '+' : ''}${stats?.salesChange || 0} dari bulan lalu`}
                    trend={(stats?.salesChange ?? 0) >= 0 ? 'up' : 'down'}
                    color="emerald"
                />
                <StatCard
                    icon={<DollarSign className="w-6 h-6" />}
                    label="Revenue Bulan Ini"
                    value={formatCurrency(stats?.revenueThisMonth || 0)}
                    subValue={`${(stats?.revenueChange ?? 0) >= 0 ? '+' : ''}${stats?.revenueChange || 0}% dari bulan lalu`}
                    trend={(stats?.revenueChange ?? 0) >= 0 ? 'up' : 'down'}
                    color="amber"
                />
                <StatCard
                    icon={<Users className="w-6 h-6" />}
                    label="Total Customer"
                    value={stats?.totalCustomers || 0}
                    subValue={`+${stats?.newCustomersThisMonth || 0} baru bulan ini`}
                    color="indigo"
                />
            </div>

            {/* Sales Chart */}
            <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Penjualan Bulanan</h3>
                        <p className="text-sm text-gray-500">Unit terjual dan pendapatan</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#00bfa5]"></div>
                            <span className="text-gray-600">Unit</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <span className="text-gray-600">Revenue</span>
                        </div>
                    </div>
                </div>

                {monthlySales.length > 0 ? (
                    <div className="flex items-end justify-between h-48 gap-2 sm:gap-4">
                        {monthlySales.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex gap-1 h-40 items-end justify-center">
                                    <div
                                        className="w-4 sm:w-5 bg-gradient-to-t from-[#00bfa5] to-[#00ddc6] rounded-t-md transition-all duration-500"
                                        style={{ height: `${maxCount > 0 ? (m.count / maxCount) * 100 : 0}%`, minHeight: m.count > 0 ? '8px' : '0' }}
                                        title={`${m.count} unit`}
                                    />
                                    <div
                                        className="w-4 sm:w-5 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md transition-all duration-500"
                                        style={{ height: `${maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0}%`, minHeight: m.revenue > 0 ? '8px' : '0' }}
                                        title={formatCurrency(m.revenue)}
                                    />
                                </div>
                                <span className="text-xs text-gray-500">{m.month}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400">
                        Belum ada data penjualan
                    </div>
                )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid md:grid-cols-3 gap-4">
                {/* Top Selling */}
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    <h4 className="text-sm font-semibold text-gray-600 mb-4">Merek Terlaris</h4>
                    <div className="space-y-3">
                        {topBrands.length > 0 ? (
                            topBrands.map((brand) => (
                                <RankItem key={brand.rank} rank={brand.rank} name={brand.name} value={`${brand.count} unit`} />
                            ))
                        ) : (
                            <p className="text-sm text-gray-400">Belum ada data</p>
                        )}
                    </div>
                </div>

                {/* Revenue by Category */}
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    <h4 className="text-sm font-semibold text-gray-600 mb-4">Revenue per Kategori</h4>
                    <div className="space-y-3">
                        {categoryRevenue.length > 0 ? (
                            categoryRevenue.map((cat) => (
                                <CategoryBar key={cat.category} name={cat.name} percent={cat.percent} color={getCategoryColor(cat.category)} />
                            ))
                        ) : (
                            <p className="text-sm text-gray-400">Belum ada data</p>
                        )}
                    </div>
                </div>

                {/* Performance */}
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    <h4 className="text-sm font-semibold text-gray-600 mb-4">Performa</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Avg. Lama Stok</span>
                            <span className="font-semibold text-gray-700">{performance?.avgDaysToSell || 0} hari</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Margin Rata-rata</span>
                            <span className="font-semibold text-emerald-600">{performance?.avgMargin || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tingkat Konversi</span>
                            <span className="font-semibold text-gray-700">{performance?.conversionRate || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total Terjual (6 bln)</span>
                            <span className="font-semibold text-blue-600">{performance?.totalSold || 0} unit</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        CAR: 'teal',
        MOTORCYCLE: 'indigo',
        TRUCK: 'amber',
        BUS: 'emerald',
        OTHER: 'gray',
    };
    return colors[category] || 'gray';
}

function StatCard({ icon, label, value, subValue, trend, color }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down';
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        teal: 'bg-[#00bfa5]/10 text-[#00bfa5]',
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
        indigo: 'bg-indigo-100 text-indigo-600',
    };

    return (
        <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
            <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            {subValue && (
                <div className="flex items-center gap-1 mt-1">
                    {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                    {trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-500" />}
                    <span className={`text-xs ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-gray-400'}`}>
                        {subValue}
                    </span>
                </div>
            )}
        </div>
    );
}

function RankItem({ rank, name, value }: { rank: number; name: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank === 1 ? 'bg-amber-400 text-white' :
                rank === 2 ? 'bg-gray-300 text-gray-700' :
                    'bg-amber-700 text-white'
                }`}>
                {rank}
            </span>
            <span className="flex-1 text-gray-700">{name}</span>
            <span className="text-sm font-medium text-gray-600">{value}</span>
        </div>
    );
}

function CategoryBar({ name, percent, color }: { name: string; percent: number; color: string }) {
    const colors: Record<string, string> = {
        teal: 'bg-[#00bfa5]',
        indigo: 'bg-indigo-500',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500',
        gray: 'bg-gray-400',
    };

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{name}</span>
                <span className="font-medium text-gray-700">{percent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${colors[color] || 'bg-gray-400'} transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

function ExportDropdown({ onExportPDF, onExportExcel }: { onExportPDF: () => void; onExportExcel: () => void }) {
    const [open, setOpen] = React.useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 bg-[#ecf0f3] text-gray-600 px-4 py-2.5 rounded-xl font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5] transition-colors"
            >
                <Download className="w-4 h-4" /> Export
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-40 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-100">
                    <button
                        onClick={() => { onExportPDF(); setOpen(false); }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        📄 Export PDF
                    </button>
                    <button
                        onClick={() => { onExportExcel(); setOpen(false); }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        📊 Export CSV
                    </button>
                </div>
            )}
        </div>
    );
}
