'use client';

import React from 'react';
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

// Dummy stats data
const STATS_DATA = {
    totalVehicles: 156,
    totalSales: 42,
    revenue: 'Rp 2.45 M',
    pendingDeals: 8,
    vehiclesByType: [
        { type: 'Mobil', count: 98, icon: faCar },
        { type: 'Motor', count: 45, icon: faMotorcycle },
        { type: 'Truk', count: 13, icon: faTruck },
    ],
    monthlySales: [
        { month: 'Jan', sales: 12 },
        { month: 'Feb', sales: 8 },
        { month: 'Mar', sales: 15 },
        { month: 'Apr', sales: 10 },
        { month: 'Mei', sales: 18 },
        { month: 'Jun', sales: 14 },
    ],
};

export default function StatsPage() {
    const { t } = useLanguage();

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
    const BarChart = ({ data }: { data: { month: string; sales: number }[] }) => {
        const maxSales = Math.max(...data.map(d => d.sales));
        return (
            <div className="flex items-end justify-between gap-4 h-40 mt-4">
                {data.map((item) => (
                    <div key={item.month} className="flex flex-col items-center flex-1">
                        <div
                            className="w-full bg-gradient-to-t from-[#00bfa5] to-[#00e5c3] rounded-t-lg shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1)] transition-all duration-500 hover:from-[#00a891] hover:to-[#00bfa5]"
                            style={{ height: `${(item.sales / maxSales) * 100}%`, minHeight: '10px' }}
                        />
                        <div className="text-xs text-gray-500 mt-2 font-medium">{item.month}</div>
                    </div>
                ))}
            </div>
        );
    };

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
                    value={STATS_DATA.totalVehicles}
                    icon={faCar}
                    trend="up"
                    trendValue="+12%"
                />
                <StatCard
                    title={t.totalSales}
                    value={STATS_DATA.totalSales}
                    icon={faShoppingCart}
                    trend="up"
                    trendValue="+8%"
                    color="#3b82f6"
                />
                <StatCard
                    title={t.revenue}
                    value={STATS_DATA.revenue}
                    icon={faMoneyBillWave}
                    trend="up"
                    trendValue="+15%"
                    color="#10b981"
                />
                <StatCard
                    title={t.pendingDeals}
                    value={STATS_DATA.pendingDeals}
                    icon={faHandshake}
                    trend="down"
                    trendValue="-3%"
                    color="#f59e0b"
                />
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* MONTHLY SALES CHART */}
                <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff]">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{t.monthlySales}</h3>
                    <p className="text-xs text-gray-500 mb-4">{t.latestUpdate}</p>
                    <BarChart data={STATS_DATA.monthlySales} />
                </div>

                {/* VEHICLE TYPES */}
                <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t.vehicleTypes}</h3>
                    <div className="space-y-4">
                        {STATS_DATA.vehiclesByType.map((item) => (
                            <div key={item.type} className="flex items-center justify-between p-4 rounded-xl bg-[#ecf0f3] shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff]">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[#00bfa5] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                                        <FontAwesomeIcon icon={item.icon} />
                                    </div>
                                    <span className="font-semibold text-gray-700">{item.type}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-gray-800">{item.count}</div>
                                    <div className="text-xs text-gray-500">unit</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
