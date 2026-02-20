'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Search, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';

interface Tenant {
    id: string;
    name: string;
    subscriptionStatus: string;
    plan?: { name: string };
    owner?: { name: string; email: string };
    _count?: { vehicles: number; transactions: number };
    createdAt: string;
}

const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ACTIVE') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'SUSPENDED' || status === 'CANCELLED') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
};

const statusLabel: Record<string, string> = {
    ACTIVE: 'Aktif',
    SUSPENDED: 'Ditangguhkan',
    TRIAL: 'Trial',
    CANCELLED: 'Dibatalkan',
};

export default function MobileTenantList() {
    const { theme } = useMobileContext();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [filtered, setFiltered] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Tenant | null>(null);

    useEffect(() => {
        fetchApi('/superadmin/tenants?limit=50&page=1')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                const list = d?.data ?? d ?? [];
                setTenants(list);
                setFiltered(list);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!search) { setFiltered(tenants); return; }
        const q = search.toLowerCase();
        setFiltered(tenants.filter(t => `${t.name} ${t.owner?.name ?? ''}`.toLowerCase().includes(q)));
    }, [search, tenants]);

    const statusColor: Record<string, string> = {
        ACTIVE: 'text-green-500',
        SUSPENDED: 'text-red-500',
        TRIAL: 'text-yellow-500',
        CANCELLED: 'text-gray-400',
    };

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-2 px-6 sticky top-0 z-10`}>
                <h2 className={`text-2xl font-black tracking-tight mb-4 ${theme.textMain}`}>Kelola Tenant</h2>
                <div className="relative mb-4">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input
                        type="text"
                        placeholder="Cari nama tenant, pemilik..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-12 pr-6 py-4 rounded-2xl text-sm font-bold outline-none ${theme.bgInput}`}
                    />
                </div>
            </div>

            <div className="p-6 pt-2 space-y-4">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className={`p-4 ${theme.bgCard}`}>
                            <div className="flex gap-4 items-center">
                                <div className={`w-12 h-12 rounded-full ${theme.imagePlaceholder} animate-pulse`} />
                                <div className="flex-1 space-y-2">
                                    <div className={`h-4 w-3/4 rounded ${theme.imagePlaceholder} animate-pulse`} />
                                    <div className={`h-3 w-1/2 rounded ${theme.imagePlaceholder} animate-pulse`} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className={`p-10 ${theme.bgCard} flex flex-col items-center text-center`}>
                        <AlertCircle className={`h-10 w-10 mb-4 opacity-30 ${theme.textMuted}`} />
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada tenant ditemukan</p>
                    </div>
                ) : filtered.map(t => (
                    <div
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className={`p-4 flex items-center gap-4 active:scale-[0.97] transition-transform cursor-pointer ${theme.bgCard}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-black text-lg ${theme.iconContainer}`}>
                            {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-black text-sm truncate ${theme.textMain}`}>{t.name}</h4>
                            <p className={`text-xs font-bold truncate mt-1 ${theme.textMuted}`}>{t.owner?.name ?? '-'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <StatusIcon status={t.subscriptionStatus} />
                            <span className={`text-[9px] font-black uppercase ${statusColor[t.subscriptionStatus] ?? theme.textMuted}`}>
                                {statusLabel[t.subscriptionStatus] ?? t.subscriptionStatus}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detail Tenant">
                {selected && (
                    <div className="space-y-6">
                        <div className={`p-5 rounded-3xl flex items-center gap-5 ${theme.iconContainer}`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 font-black text-3xl ${theme.bgFrame}`}>
                                {selected.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className={`font-black text-xl ${theme.textMain}`}>{selected.name}</h3>
                                <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{selected.owner?.email ?? '-'}</p>
                            </div>
                        </div>
                        <div className={`p-6 rounded-3xl space-y-4 ${theme.bgFrame} border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                            {[
                                { label: 'Pemilik', value: selected.owner?.name ?? '-' },
                                { label: 'Paket', value: selected.plan?.name ?? '-' },
                                { label: 'Status', value: statusLabel[selected.subscriptionStatus] ?? selected.subscriptionStatus },
                                { label: 'Total Kendaraan', value: selected._count?.vehicles ?? '-' },
                                { label: 'Total Transaksi', value: selected._count?.transactions ?? '-' },
                            ].map((item, idx, arr) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>{item.label}</span>
                                        <span className={`text-sm font-black ${theme.textMain}`}>{String(item.value)}</span>
                                    </div>
                                    {idx < arr.length - 1 && <div className={`border-t mt-4 ${theme.divider}`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </BottomModal>
        </div>
    );
}
