'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search, AlertCircle, Printer } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface Transaction {
    id: string;
    invoiceNumber?: string;
    customer?: { name: string };
    vehicle?: { brand: string; model: string };
    finalPrice: number;
    status: string;
    date: string;
    spkNumber?: string;
}

const statusColor: Record<string, string> = {
    COMPLETED: 'text-green-500',
    PENDING: 'text-yellow-500',
    CANCELLED: 'text-red-500',
};

export default function MobileTransactions() {
    const { theme } = useMobileContext();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Transaction | null>(null);

    useEffect(() => {
        fetchApi('/transactions?limit=30&page=1')
            .then(r => r.ok ? r.json() : null)
            .then(d => setTransactions(d?.data ?? d ?? []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const filtered = search
        ? transactions.filter(t =>
            `${t.invoiceNumber ?? ''} ${t.customer?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())
        )
        : transactions;

    const handlePrint = async (type: 'invoice' | 'spk' | 'receipt', txId: string) => {
        const endpoints: Record<string, string> = {
            invoice: `/pdf/transaction/${txId}/invoice`,
            spk: `/pdf/transaction/${txId}/spk`,
            receipt: `/pdf/transaction/${txId}/receipt`,
        };
        const res = await fetchApi(endpoints[type]);
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        }
    };

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            <div className={`${theme.bgHeader} pt-12 pb-2 px-6 sticky top-0 z-10`}>
                <h2 className={`text-2xl font-black tracking-tight mb-4 ${theme.textMain}`}>Transaksi</h2>
                <div className="relative mb-4">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input
                        type="text"
                        placeholder="Cari invoice, nama pelanggan..."
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
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada transaksi ditemukan</p>
                    </div>
                ) : filtered.map(tx => (
                    <div
                        key={tx.id}
                        onClick={() => setSelected(tx)}
                        className={`p-4 flex items-center gap-4 active:scale-[0.97] transition-transform cursor-pointer ${theme.bgCard}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${theme.iconContainer}`}>
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-black text-sm truncate ${theme.textMain}`}>{tx.customer?.name ?? '-'}</h4>
                            <p className={`text-xs font-bold truncate mt-1 ${theme.textMuted}`}>{tx.invoiceNumber ?? tx.id.slice(0, 8)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-black ${theme.textHighlight}`}>{formatRupiah(tx.finalPrice)}</p>
                            <p className={`text-[9px] font-black uppercase ${statusColor[tx.status] ?? theme.textMuted}`}>{tx.status}</p>
                        </div>
                    </div>
                ))}
            </div>

            <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detail Transaksi">
                {selected && (
                    <div className="space-y-6">
                        <div className={`p-6 rounded-3xl space-y-4 ${theme.bgFrame} border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                            {[
                                { label: 'Invoice', value: selected.invoiceNumber ?? '-' },
                                { label: 'Pelanggan', value: selected.customer?.name ?? '-' },
                                { label: 'Kendaraan', value: selected.vehicle ? `${selected.vehicle.brand} ${selected.vehicle.model}` : '-' },
                                { label: 'Total', value: formatRupiah(selected.finalPrice) },
                                { label: 'Status', value: selected.status },
                            ].map((item, idx, arr) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>{item.label}</span>
                                        <span className={`text-sm font-black ${theme.textMain}`}>{item.value}</span>
                                    </div>
                                    {idx < arr.length - 1 && <div className={`border-t mt-4 ${theme.divider}`} />}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { type: 'invoice' as const, label: 'Invoice' },
                                { type: 'spk' as const, label: 'SPK' },
                                { type: 'receipt' as const, label: 'Kwitansi' },
                            ].map(({ type, label }) => (
                                <button
                                    key={type}
                                    onClick={() => handlePrint(type, selected.id)}
                                    className={`py-3 flex flex-col items-center gap-2 text-[10px] font-black uppercase tracking-widest ${theme.btnSecondary}`}
                                >
                                    <Printer className="h-5 w-5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </BottomModal>
        </div>
    );
}
