'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Search, AlertCircle, CheckCircle, XCircle, Clock, Plus, Trash2, ChevronDown, Star } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';
import { toast } from 'sonner';

interface Tenant {
    id: string;
    name: string;
    subscriptionStatus: string;
    plan?: { id: string; name: string };
    owner?: { name: string; email: string };
    _count?: { vehicles: number; transactions: number; users: number };
    createdAt: string;
}

interface Plan { id: string; name: string; }

const statusBg: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700', SUSPENDED: 'bg-red-100 text-red-700',
    TRIAL: 'bg-amber-100 text-amber-700', CANCELLED: 'bg-gray-100 text-gray-500',
};
const statusLabel: Record<string, string> = {
    ACTIVE: 'Aktif', SUSPENDED: 'Ditangguhkan', TRIAL: 'Trial', CANCELLED: 'Dibatalkan',
};

export default function MobileTenantList() {
    const { theme } = useMobileContext();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selected, setSelected] = useState<Tenant | null>(null);
    const [processing, setProcessing] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => { fetchTenants(); fetchPlans(); }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/superadmin/tenants?limit=100&page=1');
            if (res.ok) { const d = await res.json(); setTenants(d?.data ?? d ?? []); }
        } catch { } finally { setLoading(false); }
    };

    const fetchPlans = async () => {
        try {
            const res = await fetchApi('/superadmin/plans');
            if (res.ok) { const d = await res.json(); setPlans(d?.data ?? d ?? []); }
        } catch { }
    };

    const doAction = async (action: 'ACTIVE' | 'SUSPENDED', tenantId: string) => {
        setProcessing(true);
        try {
            const res = await fetchApi(`/superadmin/tenants/${tenantId}`, {
                method: 'PATCH',
                body: JSON.stringify({ subscriptionStatus: action }),
            });
            if (res.ok) {
                toast.success(action === 'ACTIVE' ? 'Tenant diaktifkan' : 'Tenant ditangguhkan');
                setSelected(null);
                fetchTenants();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal memproses aksi');
            }
        } catch { toast.error('Gagal memproses aksi'); }
        finally { setProcessing(false); }
    };

    const doUpgradePlan = async () => {
        if (!selected || !selectedPlanId) return;
        setProcessing(true);
        try {
            const res = await fetchApi(`/superadmin/tenants/${selected.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ planId: selectedPlanId }),
            });
            if (res.ok) {
                toast.success('Plan berhasil diubah');
                setShowUpgrade(false);
                setSelected(null);
                fetchTenants();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal mengubah plan');
            }
        } catch { toast.error('Gagal mengubah plan'); }
        finally { setProcessing(false); }
    };

    const doDelete = async () => {
        if (!selected) return;
        setProcessing(true);
        try {
            const res = await fetchApi(`/superadmin/tenants/${selected.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Tenant dihapus');
                setShowDeleteConfirm(false);
                setSelected(null);
                fetchTenants();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menghapus');
            }
        } catch { toast.error('Gagal menghapus'); }
        finally { setProcessing(false); }
    };

    const filtered = tenants.filter(t => {
        const matchSearch = search ? `${t.name} ${t.owner?.name ?? ''}`.toLowerCase().includes(search.toLowerCase()) : true;
        const matchStatus = statusFilter === 'ALL' || t.subscriptionStatus === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            <div className={`${theme.bgHeader} pt-12 pb-2 px-5 sticky top-0 z-10`}>
                <h2 className={`text-2xl font-black tracking-tight mb-4 ${theme.textMain}`}>Kelola Tenant</h2>
                <div className="relative mb-3">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input type="text" placeholder="Cari nama tenant, pemilik..." value={search} onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-12 pr-6 py-3.5 rounded-2xl text-sm font-bold outline-none ${theme.bgInput}`} />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3">
                    {['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${statusFilter === s ? theme.btnPrimary : theme.btnSecondary}`}>
                            {s === 'ALL' ? 'Semua' : statusLabel[s] ?? s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-5 pt-2 space-y-3 pb-24">
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
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada tenant</p>
                    </div>
                ) : filtered.map(t => (
                    <div key={t.id} onClick={() => setSelected(t)}
                        className={`p-4 flex items-center gap-3 active:scale-[0.97] transition-transform cursor-pointer ${theme.bgCard}`}>
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-black text-base ${theme.iconContainer}`}>
                            {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-black text-sm truncate ${theme.textMain}`}>{t.name}</h4>
                            <p className={`text-xs font-medium truncate mt-0.5 ${theme.textMuted}`}>{t.owner?.name ?? '-'} • {t.plan?.name ?? 'No Plan'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${statusBg[t.subscriptionStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                            {statusLabel[t.subscriptionStatus] ?? t.subscriptionStatus}
                        </span>
                    </div>
                ))}
            </div>

            {/* Detail + Actions */}
            <BottomModal isOpen={!!selected && !showUpgrade && !showDeleteConfirm} onClose={() => setSelected(null)} title="Detail Tenant">
                {selected && (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-2xl flex items-center gap-4 ${theme.iconContainer}`}>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-black text-2xl ${theme.bgFrame}`}>
                                {selected.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className={`font-black text-lg ${theme.textMain}`}>{selected.name}</h3>
                                <p className={`text-xs ${theme.textMuted}`}>{selected.owner?.email ?? '-'}</p>
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl space-y-2 ${theme.bgFrame} border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                            {[
                                { label: 'Plan', value: selected.plan?.name ?? '-' },
                                { label: 'Status', value: statusLabel[selected.subscriptionStatus] ?? selected.subscriptionStatus },
                                { label: 'Kendaraan', value: selected._count?.vehicles ?? 0 },
                                { label: 'Transaksi', value: selected._count?.transactions ?? 0 },
                                { label: 'Users', value: selected._count?.users ?? 0 },
                            ].map((item, idx, arr) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center py-1">
                                        <span className={`text-xs ${theme.textMuted}`}>{item.label}</span>
                                        <span className={`text-sm font-bold ${theme.textMain}`}>{String(item.value)}</span>
                                    </div>
                                    {idx < arr.length - 1 && <div className={`border-t ${theme.divider}`} />}
                                </div>
                            ))}
                        </div>
                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            {selected.subscriptionStatus !== 'ACTIVE' && (
                                <button disabled={processing} onClick={() => doAction('ACTIVE', selected.id)}
                                    className="py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                                    <CheckCircle className="w-4 h-4" /> Aktifkan
                                </button>
                            )}
                            {selected.subscriptionStatus === 'ACTIVE' && (
                                <button disabled={processing} onClick={() => doAction('SUSPENDED', selected.id)}
                                    className="py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                                    <XCircle className="w-4 h-4" /> Tangguhkan
                                </button>
                            )}
                            <button onClick={() => { setSelectedPlanId(selected.plan?.id || ''); setShowUpgrade(true); }}
                                className="py-2.5 rounded-xl bg-purple-500 text-white text-sm font-bold flex items-center justify-center gap-1.5">
                                <Star className="w-4 h-4" /> Ubah Plan
                            </button>
                            <button onClick={() => setShowDeleteConfirm(true)}
                                className="py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-1.5 col-span-2">
                                <Trash2 className="w-4 h-4" /> Hapus Tenant
                            </button>
                        </div>
                    </div>
                )}
            </BottomModal>

            {/* Upgrade Plan Modal */}
            {showUpgrade && selected && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-gray-800 mb-3">Ubah Plan: {selected.name}</h3>
                        <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] focus:outline-none text-gray-800 mb-4">
                            <option value="">Pilih Plan...</option>
                            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setShowUpgrade(false)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={doUpgradePlan} disabled={processing || !selectedPlanId} className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-bold disabled:opacity-50">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {showDeleteConfirm && selected && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-sm text-center">
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Hapus Tenant?</h3>
                        <p className="text-sm text-gray-500 mb-1">{selected.name}</p>
                        <p className="text-xs text-red-500 mb-4">Semua data akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={doDelete} disabled={processing} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50">
                                {processing ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
