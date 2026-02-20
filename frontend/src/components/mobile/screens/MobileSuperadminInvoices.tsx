'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Search, Check, X, Plus, Eye } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface Invoice {
    id: string;
    invoiceNumber?: string;
    amount: number;
    status: string;
    dueDate?: string;
    paidAt?: string | null;
    paymentProofUrl?: string | null;
    tenant?: { name: string };
    billingPeriod?: { name: string };
}

const statusBg: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700', PENDING: 'bg-amber-100 text-amber-700',
    VERIFYING: 'bg-blue-100 text-blue-700', OVERDUE: 'bg-red-100 text-red-700',
};
const statusLabel: Record<string, string> = {
    PAID: 'Dibayar', PENDING: 'Menunggu', VERIFYING: 'Verifikasi', OVERDUE: 'Jatuh Tempo',
};

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function MobileSuperadminInvoices() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selected, setSelected] = useState<Invoice | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => { fetchInvoices(); }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/superadmin/invoices?limit=100');
            if (res.ok) { const d = await res.json(); setInvoices(d?.data ?? d ?? []); }
        } catch { } finally { setLoading(false); }
    };

    const doVerify = async (invoiceId: string, action: 'VERIFY' | 'REJECT') => {
        setProcessing(true);
        try {
            const res = await fetchApi(`/superadmin/invoices/${invoiceId}/verify`, {
                method: 'PATCH',
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                toast.success(action === 'VERIFY' ? 'Pembayaran diverifikasi' : 'Pembayaran ditolak');
                setSelected(null);
                fetchInvoices();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal memproses');
            }
        } catch { toast.error('Gagal memproses'); }
        finally { setProcessing(false); }
    };

    const filtered = invoices.filter(inv => {
        const matchSearch = search ? `${inv.invoiceNumber ?? ''} ${inv.tenant?.name ?? ''}`.toLowerCase().includes(search.toLowerCase()) : true;
        const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const pendingVerify = invoices.filter(i => i.status === 'VERIFYING').length;

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Invoice</h1>
                    <p className="text-sm text-gray-500">Manajemen tagihan semua tenant</p>
                </div>
                {pendingVerify > 0 && (
                    <div className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        {pendingVerify} perlu verifikasi
                    </div>
                )}
            </div>

            {/* Filter */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari invoice, tenant..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-sm text-gray-800" />
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {['ALL', 'PENDING', 'VERIFYING', 'PAID', 'OVERDUE'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${statusFilter === s ? 'bg-[#00bfa5] text-white shadow-lg' : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'}`}>
                        {s === 'ALL' ? 'Semua' : statusLabel[s] ?? s}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-7 h-7 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada invoice</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(inv => (
                        <div key={inv.id} onClick={() => setSelected(inv)}
                            className="bg-[#ecf0f3] rounded-2xl p-4 shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] cursor-pointer active:scale-[0.98] transition-transform">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{inv.tenant?.name ?? '-'}</p>
                                    <p className="text-xs text-gray-500">{inv.invoiceNumber ?? inv.id.slice(0, 8)}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBg[inv.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                    {statusLabel[inv.status] ?? inv.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <p className="font-black text-[#00bfa5] text-base">{fmt(inv.amount)}</p>
                                {inv.dueDate && <p className="text-xs text-gray-400">Jatuh tempo: {new Date(inv.dueDate).toLocaleDateString('id-ID')}</p>}
                            </div>
                            {inv.paymentProofUrl && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                                    <Eye className="w-3.5 h-3.5" /> Bukti bayar tersedia
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
                    <div className="bg-[#ecf0f3] rounded-t-3xl w-full max-w-lg mx-auto p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Detail Invoice</h3>
                            <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-3 mb-4">
                            {[
                                { label: 'Tenant', value: selected.tenant?.name ?? '-' },
                                { label: 'Invoice #', value: selected.invoiceNumber ?? selected.id.slice(0, 12) },
                                { label: 'Jumlah', value: fmt(selected.amount) },
                                { label: 'Status', value: statusLabel[selected.status] ?? selected.status },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between">
                                    <span className="text-sm text-gray-500">{item.label}</span>
                                    <span className="text-sm font-bold text-gray-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                        {/* Bukti bayar */}
                        {selected.paymentProofUrl && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-600 mb-2">Bukti Pembayaran:</p>
                                <img src={selected.paymentProofUrl} alt="Bukti bayar" className="w-full rounded-xl object-cover max-h-48" />
                            </div>
                        )}
                        {/* Verify/Reject buttons (only when VERIFYING) */}
                        {selected.status === 'VERIFYING' && (
                            <div className="flex gap-3">
                                <button disabled={processing} onClick={() => doVerify(selected.id, 'REJECT')}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                                    <X className="w-4 h-4" /> Tolak
                                </button>
                                <button disabled={processing} onClick={() => doVerify(selected.id, 'VERIFY')}
                                    className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                                    <Check className="w-4 h-4" /> Verifikasi
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
