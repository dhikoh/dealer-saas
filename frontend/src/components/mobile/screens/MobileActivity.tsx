'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Car, DollarSign, Users, Settings, FileText } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface ActivityLog {
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
    user?: { name: string; email: string } | null;
}

const ICONS: Record<string, React.ReactNode> = {
    VEHICLE: <Car className="w-4 h-4" />,
    TRANSACTION: <DollarSign className="w-4 h-4" />,
    CUSTOMER: <Users className="w-4 h-4" />,
    STAFF: <Users className="w-4 h-4" />,
    SETTINGS: <Settings className="w-4 h-4" />,
    OTHER: <FileText className="w-4 h-4" />,
};

const COLORS: Record<string, string> = {
    VEHICLE: 'bg-blue-100 text-blue-600',
    TRANSACTION: 'bg-emerald-100 text-emerald-600',
    CUSTOMER: 'bg-purple-100 text-purple-600',
    STAFF: 'bg-amber-100 text-amber-600',
    SETTINGS: 'bg-gray-100 text-gray-600',
    OTHER: 'bg-gray-100 text-gray-600',
};

const mapType = (entityType: string | null): string => {
    if (!entityType) return 'OTHER';
    const u = entityType.toUpperCase();
    if (u.includes('VEHICLE') || u.includes('BRAND')) return 'VEHICLE';
    if (u.includes('TRANSACTION') || u.includes('SALE')) return 'TRANSACTION';
    if (u.includes('CUSTOMER')) return 'CUSTOMER';
    if (u.includes('STAFF') || u.includes('USER')) return 'STAFF';
    if (u.includes('SETTING') || u.includes('TENANT')) return 'SETTINGS';
    return 'OTHER';
};

const FILTERS = ['ALL', 'VEHICLE', 'TRANSACTION', 'CUSTOMER', 'STAFF'];

export default function MobileActivity() {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => { fetchActivities(); }, []);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/activity-logs?page=1&limit=50');
            if (res.ok) {
                const d = await res.json();
                const logs = d.logs || [];
                setActivities(logs.map((log: any) => ({
                    id: log.id,
                    type: mapType(log.entityType),
                    title: log.action,
                    description: log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : (log.entityName || ''),
                    createdAt: log.createdAt,
                    user: log.user || null,
                })));
            }
        } catch { } finally { setLoading(false); }
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 60) return `${mins} menit lalu`;
        if (hours < 24) return `${hours} jam lalu`;
        return `${days} hari lalu`;
    };

    const filtered = filter === 'ALL' ? activities : activities.filter(a => a.type === filter);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-4 space-y-4 pb-24">
            <div>
                <h1 className="text-xl font-bold text-gray-800">Log Aktivitas</h1>
                <p className="text-sm text-gray-500">Riwayat aktivitas di dealer Anda</p>
            </div>

            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${filter === f ? 'bg-[#00bfa5] text-white shadow-lg' : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'}`}>
                        {f === 'ALL' ? 'Semua' : f === 'VEHICLE' ? 'Kendaraan' : f === 'TRANSACTION' ? 'Transaksi' : f === 'CUSTOMER' ? 'Pelanggan' : 'Staff'}
                    </button>
                ))}
            </div>

            {/* Activity list */}
            <div className="bg-[#ecf0f3] rounded-2xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Tidak ada aktivitas</p>
                    </div>
                ) : filtered.map(a => (
                    <div key={a.id} className="flex items-start gap-3 p-3 bg-white/50 rounded-xl">
                        <div className={`w-9 h-9 rounded-xl ${COLORS[a.type] || COLORS.OTHER} flex items-center justify-center flex-shrink-0`}>
                            {ICONS[a.type] || ICONS.OTHER}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-sm">{a.title}</h4>
                            {a.description && <p className="text-xs text-gray-500 truncate">{a.description}</p>}
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                            {a.user && <div className="font-medium text-gray-500 text-[10px]">{a.user.name || a.user.email}</div>}
                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(a.createdAt)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
