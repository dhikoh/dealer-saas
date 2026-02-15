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
import { useCurrency } from '@/hooks/useCurrency';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import SubscriptionWidget from '@/components/dashboard/SubscriptionWidget';

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
    const { t, language } = useLanguage();
    const { fmt } = useCurrency();
    const [reminders, setReminders] = useState<Reminder | null>(null);
    const [stats, setStats] = useState<VehicleStats | null>(null);
    const [loading, setLoading] = useState(true);

    const getLabel = (key: string) => {
        const labels: Record<string, Record<string, string>> = {
            repair: { id: 'Perbaikan', en: 'Repair' },
            taxExpiring: { id: 'Pajak Akan Expired', en: 'Tax Expiring' },
            taxExpired: { id: 'Pajak Sudah Expired', en: 'Tax Expired' },
            creditDue: { id: 'Cicilan Jatuh Tempo', en: 'Credit Due Soon' },
            creditOverdue: { id: 'Cicilan Overdue', en: 'Credit Overdue' },
            attention: { id: 'Perhatian Diperlukan', en: 'Attention Required' },
            itemsAction: { id: 'item membutuhkan tindakan', en: 'items require action' },
            welcome: { id: 'Selamat Datang di OTOHUB!', en: 'Welcome to OTOHUB!' },
            emptyState: { id: 'Dealer Anda belum memiliki inventaris kendaraan. Yuk, mulai tambahkan stok mobil pertama Anda untuk melihat statistik berjalan.', en: 'Your dealer has no inventory yet. Start adding your first vehicle to see statistics running.' },
            addFirstVehicle: { id: '+ Tambah Kendaraan Pertama', en: '+ Add First Vehicle' },
            seeAll: { id: 'Lihat Semua', en: 'See All' },
            due: { id: 'Due:', en: 'Due:' },
            stnkExpired: { id: 'STNK Expired', en: 'STNK Expired' },
            days: { id: 'Hari', en: 'Days' },
            inventory: { id: 'Inventaris', en: 'Inventory' },
            customer: { id: 'Customer', en: 'Customer' },
            credit: { id: 'Kredit', en: 'Credit' },
            transaction: { id: 'Transaksi', en: 'Transaction' },
            dashboardDesc: { id: 'Ringkasan bisnis dan peringatan penting', en: 'Business summary and important alerts' },
        };
        return labels[key]?.[language === 'id' ? 'id' : 'en'] || labels[key]?.['en'] || key;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [reminderRes, statsRes] = await Promise.all([
                    fetchApi('/reminders'),
                    fetchApi('/vehicles/stats'),
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
            label: t.totalAmount || getLabel('inventory'), // Reuse translation if available or getLabel
            value: stats?.total || 0,
            icon: faCar,
            color: 'from-blue-500 to-blue-600',
            href: '/app/inventory',
            text: getLabel('inventory')
        },
        {
            label: t.unitsSoldAndRevenue ? t.unitsSoldAndRevenue.split(' ')[0] : 'Available', // Hacky fallback if key missing, using getLabel preferrably
            value: stats?.available || 0,
            icon: faCar,
            color: 'from-green-500 to-green-600',
            href: '/app/inventory?status=AVAILABLE',
            text: getLabel('inventory') // Just placeholder
        },
        // Better to just use getLabel for consistency if t keys are mixed
    ];

    // Re-defining cards with cleaner logic
    const dashboardCards = [
        {
            label: getLabel('inventory'), // or t.totalVehicles if exists? t.totalAmount is for transactions...
            value: stats?.total || 0,
            icon: faCar,
            color: 'from-blue-500 to-blue-600',
            href: '/app/inventory',
        },
        {
            label: t.newThisMonth || 'Available', // "New This Month" is close to available new stock? No. 'Available' is better.
            value: stats?.available || 0,
            icon: faCar,
            color: 'from-green-500 to-green-600',
            href: '/app/inventory?status=AVAILABLE',
            customLabel: 'Available' // I'll use a string literal if translation missing in t.*
        },
        {
            label: t.soldThisMonth || 'Sold',
            value: stats?.sold || 0,
            icon: faMoneyBillWave,
            color: 'from-purple-500 to-purple-600',
            href: '/app/inventory?status=SOLD',
        },
        {
            label: getLabel('repair'),
            value: stats?.repair || 0,
            icon: faCar,
            color: 'from-orange-500 to-orange-600',
            href: '/app/inventory?condition=REPAIR',
        },
    ];

    // Alert Cards Data
    const alertCards = [
        {
            label: getLabel('taxExpiring'),
            count: reminders?.summary?.taxExpiringCount || 0,
            icon: faCalendarAlt,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            href: '/app/inventory?taxExpiring=true',
        },
        {
            label: getLabel('taxExpired'),
            count: reminders?.summary?.taxExpiredCount || 0,
            icon: faExclamationTriangle,
            color: 'bg-red-500',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50',
            href: '/app/inventory?taxExpired=true',
        },
        {
            label: getLabel('creditDue'),
            count: reminders?.summary?.creditDueCount || 0,
            icon: faCreditCard,
            color: 'bg-orange-500',
            textColor: 'text-orange-600',
            bgColor: 'bg-orange-50',
            href: '/app/credit?due=soon',
        },
        {
            label: getLabel('creditOverdue'),
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
                <h1 className="text-2xl font-bold text-gray-800">{t.dashboard || 'Dashboard'}</h1>
                <p className="text-sm text-gray-500 mt-1">{getLabel('dashboardDesc')}</p>
            </div>

            {/* SUBSCRIPTION WIDGET */}
            <SubscriptionWidget />

            {/* ALERT SECTION */}
            {reminders && reminders.summary.totalAlerts > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">{getLabel('attention')}</h2>
                            <p className="text-sm text-gray-500">{reminders.summary.totalAlerts} {getLabel('itemsAction')}</p>
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
                {dashboardCards.map((card, index) => (
                    <Link key={index} href={card.href}>
                        <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff] hover:shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] transition-all cursor-pointer group">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg`}>
                                <FontAwesomeIcon icon={card.icon} className="text-white text-xl" />
                            </div>
                            <div className="text-3xl font-bold text-gray-800 mb-1">{card.value}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                {card.customLabel || card.label}
                                <FontAwesomeIcon icon={faChevronRight} className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* EMPTY STATE: USER BARU */}
            {stats && stats.total === 0 && (
                <div className="bg-[#ecf0f3] rounded-2xl p-8 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff] text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faCar} className="text-4xl text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{getLabel('welcome')}</h2>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        {getLabel('emptyState')}
                    </p>
                    <Link href="/app/inventory">
                        <button className="px-6 py-3 rounded-xl bg-[#00bfa5] text-white font-bold shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] transition-all">
                            {getLabel('addFirstVehicle')}
                        </button>
                    </Link>
                </div>
            )}

            {/* TAX EXPIRING VEHICLES */}
            {reminders && reminders.tax.expiring.length > 0 && (
                <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-yellow-500" />
                            {getLabel('taxExpiring')} (30 {getLabel('days')})
                        </h2>
                        <Link href="/app/inventory?taxExpiring=true" className="text-sm text-[#00bfa5] hover:underline">
                            {getLabel('seeAll')}
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
                                        {new Date(vehicle.stnkExpiry).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                                    </div>
                                    <div className="text-xs text-gray-400">{getLabel('stnkExpired')}</div>
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
                            {getLabel('creditDue')} (7 {getLabel('days')})
                        </h2>
                        <Link href="/app/credit?due=soon" className="text-sm text-[#00bfa5] hover:underline">
                            {getLabel('seeAll')}
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
                                        {fmt(Number(credit.monthlyPayment))}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {getLabel('due')} {new Date(credit.nextDueDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
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
                        <div className="text-sm font-medium text-gray-700">{getLabel('inventory')}</div>
                    </div>
                </Link>
                <Link href="/app/customers">
                    <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] transition-all cursor-pointer text-center">
                        <FontAwesomeIcon icon={faUsers} className="text-2xl text-[#00bfa5] mb-2" />
                        <div className="text-sm font-medium text-gray-700">{getLabel('customer')}</div>
                    </div>
                </Link>
                <Link href="/app/credit">
                    <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] transition-all cursor-pointer text-center">
                        <FontAwesomeIcon icon={faCreditCard} className="text-2xl text-[#00bfa5] mb-2" />
                        <div className="text-sm font-medium text-gray-700">{getLabel('credit')}</div>
                    </div>
                </Link>
                <Link href="/app/transactions">
                    <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] transition-all cursor-pointer text-center">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-2xl text-[#00bfa5] mb-2" />
                        <div className="text-sm font-medium text-gray-700">{getLabel('transaction')}</div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
