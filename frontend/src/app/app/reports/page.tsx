'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Car, DollarSign, Users, Package, Download, Calendar } from 'lucide-react';

interface Stats {
    totalVehicles: number;
    availableVehicles: number;
    soldThisMonth: number;
    revenueThisMonth: number;
    totalCustomers: number;
    avgDaysToSell: number;
}

interface MonthlySales {
    month: string;
    count: number;
    revenue: number;
}

export default function ReportsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('6months');

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            const statsRes = await fetch(`${baseUrl}/vehicles/stats`, { headers });
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats({
                    totalVehicles: data.total || 0,
                    availableVehicles: data.available || 0,
                    soldThisMonth: data.sold || 0,
                    revenueThisMonth: data.revenue || 0,
                    totalCustomers: data.customers || 0,
                    avgDaysToSell: data.avgDaysToSell || 0,
                });
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            // Mock data
            setStats({
                totalVehicles: 45,
                availableVehicles: 32,
                soldThisMonth: 8,
                revenueThisMonth: 1250000000,
                totalCustomers: 156,
                avgDaysToSell: 21,
            });
        } finally {
            setLoading(false);
        }

        // Mock monthly sales for chart
        setMonthlySales([
            { month: 'Sep', count: 12, revenue: 1800000000 },
            { month: 'Okt', count: 15, revenue: 2100000000 },
            { month: 'Nov', count: 10, revenue: 1500000000 },
            { month: 'Des', count: 18, revenue: 2700000000 },
            { month: 'Jan', count: 14, revenue: 2000000000 },
            { month: 'Feb', count: 8, revenue: 1250000000 },
        ]);
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000000) {
            return `Rp ${(value / 1000000000).toFixed(1)}M`;
        }
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const handleExport = async (type: 'pdf' | 'excel') => {
        try {
            const token = localStorage.getItem('access_token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            // For now, generate client-side CSV for Excel export
            if (type === 'excel') {
                const csvContent = [
                    ['Laporan Penjualan OTOHUB', '', '', ''],
                    ['Periode', period, '', ''],
                    ['', '', '', ''],
                    ['Bulan', 'Unit Terjual', 'Revenue', ''],
                    ...monthlySales.map(m => [m.month, m.count.toString(), m.revenue.toString(), '']),
                    ['', '', '', ''],
                    ['Total Kendaraan', stats?.totalVehicles || 0, '', ''],
                    ['Terjual Bulan Ini', stats?.soldThisMonth || 0, '', ''],
                    ['Total Customer', stats?.totalCustomers || 0, '', ''],
                ].map(row => row.join(',')).join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `laporan_otohub_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
            } else {
                // For PDF, call backend or use browser print
                window.print();
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };


    const maxRevenue = Math.max(...monthlySales.map(m => m.revenue));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan & Statistik</h1>
                    <p className="text-gray-500 mt-1">Pantau performa bisnis Anda</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-[#ecf0f3] border-none shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                    >
                        <option value="1month">1 Bulan</option>
                        <option value="3months">3 Bulan</option>
                        <option value="6months">6 Bulan</option>
                        <option value="1year">1 Tahun</option>
                    </select>
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
                    subValue="+3 dari bulan lalu"
                    trend="up"
                    color="emerald"
                />
                <StatCard
                    icon={<DollarSign className="w-6 h-6" />}
                    label="Revenue Bulan Ini"
                    value={formatCurrency(stats?.revenueThisMonth || 0)}
                    subValue="-12% dari bulan lalu"
                    trend="down"
                    color="amber"
                />
                <StatCard
                    icon={<Users className="w-6 h-6" />}
                    label="Total Customer"
                    value={stats?.totalCustomers || 0}
                    subValue={`Avg ${stats?.avgDaysToSell || 0} hari/jual`}
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

                {/* Simple Bar Chart */}
                <div className="flex items-end justify-between h-48 gap-4">
                    {monthlySales.map((m, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex gap-1 h-40 items-end justify-center">
                                {/* Unit bar */}
                                <div
                                    className="w-5 bg-gradient-to-t from-[#00bfa5] to-[#00ddc6] rounded-t-md transition-all"
                                    style={{ height: `${(m.count / 20) * 100}%` }}
                                    title={`${m.count} unit`}
                                />
                                {/* Revenue bar */}
                                <div
                                    className="w-5 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md transition-all"
                                    style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                                    title={formatCurrency(m.revenue)}
                                />
                            </div>
                            <span className="text-xs text-gray-500">{m.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid md:grid-cols-3 gap-4">
                {/* Top Selling */}
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    <h4 className="text-sm font-semibold text-gray-600 mb-4">Merek Terlaris</h4>
                    <div className="space-y-3">
                        <RankItem rank={1} name="Toyota" value="12 unit" />
                        <RankItem rank={2} name="Honda" value="8 unit" />
                        <RankItem rank={3} name="Suzuki" value="5 unit" />
                    </div>
                </div>

                {/* Revenue by Category */}
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    <h4 className="text-sm font-semibold text-gray-600 mb-4">Revenue per Kategori</h4>
                    <div className="space-y-3">
                        <CategoryBar name="Mobil" percent={75} color="teal" />
                        <CategoryBar name="Motor" percent={20} color="indigo" />
                        <CategoryBar name="Truk" percent={5} color="amber" />
                    </div>
                </div>

                {/* Performance */}
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    <h4 className="text-sm font-semibold text-gray-600 mb-4">Performa</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Avg. Lama Stok</span>
                            <span className="font-semibold text-gray-700">21 hari</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Margin Rata-rata</span>
                            <span className="font-semibold text-emerald-600">15%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Tingkat Konversi</span>
                            <span className="font-semibold text-gray-700">32%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
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
    };

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{name}</span>
                <span className="font-medium text-gray-700">{percent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${colors[color]}`}
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
                        📊 Export Excel
                    </button>
                </div>
            )}
        </div>
    );
}

