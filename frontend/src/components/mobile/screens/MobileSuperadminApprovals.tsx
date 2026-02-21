'use client';

import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Check, X, Clock } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface Approval {
    id: string;
    type: string;
    status: string;
    reason?: string;
    tenant?: { name: string };
    requestedAt: string;
    processedAt?: string | null;
    requestedBy?: { name: string } | null;
}

const statusBg: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700',
};

export default function MobileSuperadminApprovals() {
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [processing, setProcessing] = useState<string | null>(null);

    const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

    useEffect(() => { fetchApprovals(); }, []);

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/superadmin/approvals?limit=100');
            if (res.ok) { const d = await res.json(); setApprovals(d?.data ?? d ?? []); }
        } catch { } finally { setLoading(false); }
    };

    const doAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
        setProcessing(id);
        try {
            const res = await fetchApi(`/superadmin/approvals/${id}`, { method: 'PATCH', body: JSON.stringify({ approved: action === 'APPROVED' }) });
            if (res.ok) {
                toast.success(action === 'APPROVED' ? 'Request disetujui' : 'Request ditolak');
                fetchApprovals();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal memproses');
            }
        } catch { toast.error('Gagal memproses'); }
        finally { setProcessing(null); }
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);
        return d > 0 ? `${d} hari lalu` : `${h} jam lalu`;
    };

    const filtered = filter === 'ALL' ? approvals : approvals.filter(a => a.status === filter);

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Persetujuan</h1>
                    <p className="text-sm text-gray-500">Kelola permintaan dari tenant</p>
                </div>
                {pendingCount > 0 && (
                    <div className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {pendingCount} pending
                    </div>
                )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'Pending', count: approvals.filter(a => a.status === 'PENDING').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Disetujui', count: approvals.filter(a => a.status === 'APPROVED').length, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Ditolak', count: approvals.filter(a => a.status === 'REJECTED').length, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex-1 transition-all ${filter === f ? 'bg-[#00bfa5] text-white shadow-lg' : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'}`}>
                        {f === 'ALL' ? 'Semua' : f === 'PENDING' ? 'Baru' : f === 'APPROVED' ? 'OK' : 'Tolak'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-7 h-7 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Tidak ada permintaan</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(a => (
                        <div key={a.id} className="bg-[#ecf0f3] rounded-2xl p-4 shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff]">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{a.type?.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-gray-500">{a.tenant?.name ?? '-'}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBg[a.status]}`}>
                                    {a.status === 'PENDING' ? 'Menunggu' : a.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                </span>
                            </div>
                            {a.reason && <p className="text-xs text-gray-500 mb-2 italic">{a.reason}</p>}
                            <p className="text-xs text-gray-400 mb-3">{timeAgo(a.requestedAt)}</p>
                            {a.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <button disabled={processing === a.id} onClick={() => doAction(a.id, 'REJECTED')}
                                        className="flex-1 py-2 rounded-xl bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50">
                                        <X className="w-3.5 h-3.5" /> Tolak
                                    </button>
                                    <button disabled={processing === a.id} onClick={() => doAction(a.id, 'APPROVED')}
                                        className="flex-1 py-2 rounded-xl bg-green-100 text-green-600 text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50">
                                        <Check className="w-3.5 h-3.5" /> Setujui
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
