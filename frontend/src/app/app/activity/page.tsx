'use client';

import React, { useEffect, useState } from 'react';
import { Clock, User, Car, DollarSign, FileText, Users, Settings } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

interface Activity {
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
    user?: { name: string };
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    VEHICLE: <Car className="w-4 h-4" />,
    TRANSACTION: <DollarSign className="w-4 h-4" />,
    CUSTOMER: <Users className="w-4 h-4" />,
    STAFF: <User className="w-4 h-4" />,
    SETTINGS: <Settings className="w-4 h-4" />,
    OTHER: <FileText className="w-4 h-4" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
    VEHICLE: 'bg-blue-100 text-blue-600',
    TRANSACTION: 'bg-emerald-100 text-emerald-600',
    CUSTOMER: 'bg-purple-100 text-purple-600',
    STAFF: 'bg-amber-100 text-amber-600',
    SETTINGS: 'bg-gray-100 text-gray-600',
    OTHER: 'bg-gray-100 text-gray-600',
};

export default function ActivityLogPage() {
    const { t, language } = useLanguage();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const token = localStorage.getItem('access_token');

            // Fetch from notifications as activity proxy
            const res = await fetch(`${API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Map notifications to activity format
                setActivities(data.map((n: any) => ({
                    id: n.id,
                    type: getTypeFromTitle(n.title),
                    title: n.title,
                    description: n.message,
                    createdAt: n.createdAt,
                    user: null,
                })));
            } else {
                setActivities([]);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTypeFromTitle = (title: string): string => {
        const lower = title.toLowerCase();
        if (lower.includes('kendaraan') || lower.includes('vehicle')) return 'VEHICLE';
        if (lower.includes('transaksi') || lower.includes('jual') || lower.includes('beli') || lower.includes('transaction') || lower.includes('sale') || lower.includes('purchase')) return 'TRANSACTION';
        if (lower.includes('customer') || lower.includes('pelanggan')) return 'CUSTOMER';
        if (lower.includes('staff') || lower.includes('user') || lower.includes('pengguna')) return 'STAFF';
        if (lower.includes('setting') || lower.includes('pengaturan')) return 'SETTINGS';
        return 'OTHER';
    };

    const formatTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        const labels = {
            mins: { id: 'menit lalu', en: 'minutes ago' },
            hours: { id: 'jam lalu', en: 'hours ago' },
            days: { id: 'hari lalu', en: 'days ago' },
        };
        const lang = language === 'id' ? 'id' : 'en';

        if (mins < 60) return `${mins} ${labels.mins[lang]}`;
        if (hours < 24) return `${hours} ${labels.hours[lang]}`;
        return `${days} ${labels.days[lang]}`;
    };

    const getLabel = (key: string) => {
        const labels: Record<string, Record<string, string>> = {
            activityDesc: { id: 'Riwayat aktivitas di dealer Anda', en: 'Activity history in your dealer' },
            vehicle: { id: 'Kendaraan', en: 'Vehicle' },
            transaction: { id: 'Transaksi', en: 'Transaction' },
            customer: { id: 'Customer', en: 'Customer' },
            staff: { id: 'Staff', en: 'Staff' },
            noActivity: { id: 'Tidak ada aktivitas ditemukan', en: 'No activity found' },
        };
        return labels[key]?.[language === 'id' ? 'id' : 'en'] || labels[key]?.['en'] || key;
    };

    const filteredActivities = filter === 'ALL'
        ? activities
        : activities.filter(a => a.type === filter);

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
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t.activityTitle}</h1>
                <p className="text-gray-500 mt-1">{getLabel('activityDesc')}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {['ALL', 'VEHICLE', 'TRANSACTION', 'CUSTOMER', 'STAFF'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${filter === type
                            ? 'bg-[#00bfa5] text-white'
                            : 'bg-[#ecf0f3] dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none'
                            }`}
                    >
                        {type === 'ALL' ? t.all :
                            type === 'VEHICLE' ? getLabel('vehicle') :
                                type === 'TRANSACTION' ? getLabel('transaction') :
                                    type === 'CUSTOMER' ? getLabel('customer') :
                                        getLabel('staff')}
                    </button>
                ))}
            </div>

            {/* Activity List */}
            <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] dark:shadow-none">
                <div className="space-y-4">
                    {filteredActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors">
                            <div className={`w-10 h-10 rounded-xl ${ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.OTHER} flex items-center justify-center flex-shrink-0`}>
                                {ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.OTHER}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-800 dark:text-white">{activity.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{activity.description}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(activity.createdAt)}
                            </div>
                        </div>
                    ))}

                    {filteredActivities.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            {getLabel('noActivity')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
