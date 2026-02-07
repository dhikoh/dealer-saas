'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCar,
    faMoneyBillWave,
    faUsers,
    faExclamationTriangle,
    faCalendarAlt,
    faCreditCard,
    faBan,
    faChevronRight,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';
import Link from 'next/link';

interface Reminder {
    tax: {
        expiring: any[];
        expired: any[];
    };
    credit: {
        duesSoon: any[];
        overdue: any[];
    };
    summary: {
        taxExpiringCount: number;
        taxExpiredCount: number;
        creditDueCount: number;
        creditOverdueCount: number;
        totalAlerts: number;
    };
}

interface VehicleStats {
    total: number;
    available: number;
    sold: number;
    repair: number;
}

export default function DashboardPage() {
    const { t } = useLanguage();
    const [reminders, setReminders] = useState<Reminder | null>(null);
    const [stats, setStats] = useState<VehicleStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const [reminderRes, statsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reminders`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles/stats`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (reminderRes.ok) {
                    setReminders(await reminderRes.json());
                }
                if (statsRes.ok) {
                    setStats(await statsRes.json());
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // KPI Cards Data
    const kpiCards = [
        {
            label: t.totalVehicles,
            value: stats?.total || 0,
            icon: faCar,
            color: 'from-blue-500 to-blue-600',
            href: '/app/inventory',
        },
        {
            label: t.available,
            value: stats?.available || 0,
            icon: faCar,
            color: 'from-green-500 to-green-600',
            href: '/app/inventory?status=AVAILABLE',
        },
        {
            label: t.sold,
            value: stats?.sold || 0,
            icon: faMoneyBillWave,
            color: 'from-purple-500 to-purple-600',
            href: '/app/inventory?status=SOLD',
        },
        {
            label: t.repair || 'Perbaikan',
            value: stats?.repair || 0,
            icon: faCar,
            color: 'from-orange-500 to-orange-600',
            href: '/app/inventory?condition=REPAIR',
        },
    ];

    // Alert Cards Data
    const alertCards = [
        {
            label: 'Pajak Akan Expired',
            count: reminders?.summary?.taxExpiringCount || 0,
            icon: faCalendarAlt,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            href: '/app/inventory?taxExpiring=true',
        },
        {
            label: 'Pajak Sudah Expired',
            count: reminders?.summary?.taxExpiredCount || 0,
            icon: faExclamationTriangle,
            color: 'bg-red-500',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50',
            href: '/app/inventory?taxExpired=true',
        },
        {
            label: 'Cicilan Jatuh Tempo',
            count: reminders?.summary?.creditDueCount || 0,
            icon: faCreditCard,
            color: 'bg-orange-500',
            textColor: 'text-orange-600',
            bgColor: 'bg-orange-50',
            href: '/app/credit?due=soon',
        },
        {
            label: 'Cicilan Overdue',
            count: reminders?.summary?.creditOverdueCount || 0,
            icon: faBan,
            color: 'bg-red-600',
            textColor: 'text-red-700',
            bgColor: 'bg-red-100',
            href: '/app/credit?overdue=true',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-[#00bfa5] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{t.dashboard}</h1>
                <p className="text-sm text-gray-500 mt-1">Ringkasan bisnis dan peringatan penting</p>
            </div>

            {/* ALERT SECTION */}
            {reminders && reminders.summary.totalAlerts > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">Perhatian Diperlukan</h2>
                            <p className="text-sm text-gray-500">{reminders.summary.totalAlerts} item membutuhkan tindakan</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {alertCards.map((alert, index) => (
                            <Link key={index} href={alert.href}>
                                <div className={`${alert.bgColor} rounded-xl p-4 cursor-pointer hover:shadow-md transition-all`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${alert.color} flex items-center justify-center`}>
                                            <FontAwesomeIcon icon={alert.icon} className="text-white text-sm" />
                                        </div>
                                        <div>
                                            <div className={`text-2xl font-bold ${alert.textColor}`}>{alert.count}</div>
                                            <div className="text-xs text-gray-600">{alert.label}</div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {kpiCards.map((card, index) => (
                    <Link key={index} href={card.href}>
                        <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff] hover:shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] transition-all cursor-pointer group">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg`}>
                                <FontAwesomeIcon icon={card.icon} className="text-white text-xl" />
                            </div>
                            <div className="text-3xl font-bold text-gray-800 mb-1">{card.value}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                {card.label}
                                <FontAwesomeIcon icon={faChevronRight} className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* TAX EXPIRING VEHICLES */}
            {reminders && reminders.tax.expiring.length > 0 && (
                <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-yellow-500" />
                            Pajak Akan Expired (30 Hari)
                        </h2>
                        <Link href="/app/inventory?taxExpiring=true" className="text-sm text-[#00bfa5] hover:underline">
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {reminders.tax.expiring.slice(0, 5).map((vehicle: any) => (
                            <div key={vehicle.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faCar} className="text-yellow-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800">{vehicle.licensePlate}</div>
                                        <div className="text-sm text-gray-500">{vehicle.make} {vehicle.model} {vehicle.year}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-yellow-600">
                                        {new Date(vehicle.stnkExpiry).toLocaleDateString('id-ID')}
                                    </div>
                                    <div className="text-xs text-gray-400">STNK Expired</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CREDIT DUE SOON */}
            {reminders && reminders.credit.duesSoon.length > 0 && (
                <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCreditCard} className="text-orange-500" />
                            Cicilan Jatuh Tempo (7 Hari)
                        </h2>
                        <Link href="/app/credit?due=soon" className="text-sm text-[#00bfa5] hover:underline">
                            Lihat Semua
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {reminders.credit.duesSoon.slice(0, 5).map((credit: any) => (
                            <div key={credit.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faUsers} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800">{credit.transaction?.customer?.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {credit.transaction?.vehicle?.make} {credit.transaction?.vehicle?.model}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-orange-600">
                                        Rp {Number(credit.monthlyPayment).toLocaleString('id-ID')}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Due: {new Date(credit.nextDueDate).toLocaleDateString('id-ID')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/app/inventory">
                    <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] transition-all cursor-pointer text-center">
                        <FontAwesomeIcon icon={faCar} className="text-2xl text-[#00bfa5] mb-2" />
                        <div className="text-sm font-medium text-gray-700">Inventaris</div>
                    </div>
                </Link>
                <Link href="/app/customers">
                    <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] transition-all cursor-pointer text-center">
                        <FontAwesomeIcon icon={faUsers} className="text-2xl text-[#00bfa5] mb-2" />
                        <div className="text-sm font-medium text-gray-700">Customer</div>
                    </div>
                </Link>
                <Link href="/app/credit">
                    <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] transition-all cursor-pointer text-center">
                        <FontAwesomeIcon icon={faCreditCard} className="text-2xl text-[#00bfa5] mb-2" />
                        <div className="text-sm font-medium text-gray-700">Kredit</div>
                    </div>
                </Link>
                <Link href="/app/transactions">
                    <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] transition-all cursor-pointer text-center">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-2xl text-[#00bfa5] mb-2" />
                        <div className="text-sm font-medium text-gray-700">Transaksi</div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
