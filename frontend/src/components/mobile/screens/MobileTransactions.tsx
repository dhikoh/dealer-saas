'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search, AlertCircle, Plus, X, Check, Printer, ChevronDown } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi, API_URL } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface Transaction {
    id: string;
    type?: string;
    invoiceNumber?: string;
    customer?: { id: string; name: string };
    vehicle?: { id: string; make?: string; brand?: string; model: string };
    finalPrice: number;
    paymentType?: string;
    status: string;
    createdAt: string;
    spkNumber?: string;
}

interface VehicleOption { id: string; make?: string; brand?: string; model: string; price: number; status: string; }
interface CustomerOption { id: string; name: string; phone?: string; }

const statusColor: Record<string, string> = {
    COMPLETED: 'text-green-500', PENDING: 'text-yellow-500', CANCELLED: 'text-red-500',
};

const PAYMENT_TYPES = ['CASH', 'KREDIT', 'LEASING', 'TRANSFER'];

export default function MobileTransactions() {
    const { theme } = useMobileContext();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [selected, setSelected] = useState<Transaction | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [txType, setTxType] = useState<'SALE' | 'PURCHASE'>('SALE');
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
    const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
    const [customerList, setCustomerList] = useState<CustomerOption[]>([]);
    const [finalPrice, setFinalPrice] = useState('');
    const [paymentType, setPaymentType] = useState('CASH');
    const [notes, setNotes] = useState('');
    // Credit fields
    const [dp, setDp] = useState('');
    const [interestRate, setInterestRate] = useState('12');
    const [tenor, setTenor] = useState('12');
    const [leasingCompany, setLeasingCompany] = useState('');
    // Search vehicle / customer
    const [vSearch, setVSearch] = useState('');
    const [cSearch, setCSearch] = useState('');

    useEffect(() => { fetchTransactions(); }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/transactions?limit=50&page=1');
            if (res.ok) {
                const d = await res.json();
                setTransactions(d?.data ?? d ?? []);
            }
        } catch { } finally { setLoading(false); }
    };

    const fetchFormData = async () => {
        const [vRes, cRes] = await Promise.all([
            fetchApi('/vehicles?limit=200&status=AVAILABLE'),
            fetchApi('/customers?limit=200'),
        ]);
        if (vRes.ok) { const d = await vRes.json(); setVehicles(d?.data ?? d ?? []); }
        if (cRes.ok) { const d = await cRes.json(); setCustomerList(d?.data ?? d ?? []); }
    };

    const openForm = () => {
        setTxType('SALE');
        setSelectedVehicle(null);
        setSelectedCustomer(null);
        setFinalPrice('');
        setPaymentType('CASH');
        setNotes('');
        setDp('');
        setInterestRate('12');
        setTenor('12');
        setLeasingCompany('');
        setVSearch('');
        setCSearch('');
        fetchFormData();
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!selectedVehicle) { toast.error('Pilih kendaraan'); return; }
        if (txType === 'SALE' && !selectedCustomer) { toast.error('Pilih pelanggan'); return; }
        if (!finalPrice) { toast.error('Masukkan harga'); return; }
        setSaving(true);
        try {
            const body: any = {
                type: txType,
                vehicleId: selectedVehicle.id,
                customerId: selectedCustomer?.id,
                finalPrice: Number(finalPrice),
                paymentType,
                notes,
            };
            if (paymentType === 'KREDIT' || paymentType === 'LEASING') {
                body.credit = {
                    downPayment: Number(dp) || 0,
                    interestRate: Number(interestRate),
                    tenorMonths: Number(tenor),
                    leasingCompany: leasingCompany || undefined,
                    creditType: paymentType,
                };
            }
            const res = await fetchApi('/transactions', { method: 'POST', body: JSON.stringify(body) });
            if (res.ok) {
                toast.success('Transaksi berhasil dibuat');
                setShowForm(false);
                fetchTransactions();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal membuat transaksi');
            }
        } catch { toast.error('Gagal membuat transaksi'); }
        finally { setSaving(false); }
    };

    const handlePrint = async (type: 'invoice' | 'spk' | 'receipt', txId: string) => {
        const endpoints: Record<string, string> = {
            invoice: `/pdf/transaction/${txId}/invoice`,
            spk: `/pdf/transaction/${txId}/spk`,
            receipt: `/pdf/transaction/${txId}/receipt`,
        };
        try {
            const res = await fetchApi(endpoints[type]);
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                toast.error('Gagal membuka dokumen');
            }
        } catch { toast.error('Gagal membuka dokumen'); }
    };

    const filteredTx = transactions.filter(tx => {
        const matchSearch = search
            ? `${tx.invoiceNumber ?? ''} ${tx.customer?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())
            : true;
        const matchType = typeFilter === 'ALL' || tx.type === typeFilter;
        return matchSearch && matchType;
    });

    const filteredVehicles = vehicles.filter(v =>
        `${v.make || v.brand || ''} ${v.model}`.toLowerCase().includes(vSearch.toLowerCase())
    );
    const filteredCustomers = customerList.filter(c =>
        c.name.toLowerCase().includes(cSearch.toLowerCase())
    );

    const monthlyPayment = () => {
        if (!finalPrice || !dp || !tenor) return 0;
        const principal = Number(finalPrice) - Number(dp);
        const rate = Number(interestRate) / 100 / 12;
        const n = Number(tenor);
        if (rate === 0) return principal / n;
        return (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    };

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-2 px-5 sticky top-0 z-10`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-2xl font-black tracking-tight ${theme.textMain}`}>Transaksi</h2>
                    <button onClick={openForm} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${theme.btnPrimary}`}>
                        <Plus className="w-4 h-4" /> Baru
                    </button>
                </div>
                <div className="relative mb-3">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input type="text" placeholder="Cari invoice, pelanggan..." value={search} onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-12 pr-6 py-3.5 rounded-2xl text-sm font-bold outline-none ${theme.bgInput}`} />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3">
                    {['ALL', 'SALE', 'PURCHASE'].map(f => (
                        <button key={f} onClick={() => setTypeFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${typeFilter === f ? theme.btnPrimary : theme.btnSecondary}`}>
                            {f === 'ALL' ? 'Semua' : f === 'SALE' ? 'Penjualan' : 'Pembelian'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
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
                ) : filteredTx.length === 0 ? (
                    <div className={`p-10 ${theme.bgCard} flex flex-col items-center text-center`}>
                        <AlertCircle className={`h-10 w-10 mb-4 opacity-30 ${theme.textMuted}`} />
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada transaksi</p>
                    </div>
                ) : filteredTx.map(tx => (
                    <div key={tx.id} onClick={() => setSelected(tx)}
                        className={`p-4 flex items-center gap-4 active:scale-[0.97] transition-transform cursor-pointer ${theme.bgCard}`}>
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${theme.iconContainer} text-xs font-bold`}>
                            {tx.type === 'SALE' ? '↑' : '↓'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-black text-sm truncate ${theme.textMain}`}>{tx.customer?.name ?? (tx.type === 'PURCHASE' ? 'Pembelian' : '-')}</h4>
                            <p className={`text-xs font-medium truncate mt-0.5 ${theme.textMuted}`}>{tx.invoiceNumber ?? tx.id.slice(0, 8)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-black ${theme.textHighlight}`}>{fmt(tx.finalPrice)}</p>
                            <p className={`text-[10px] font-bold uppercase ${statusColor[tx.status] ?? theme.textMuted}`}>{tx.status}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detail Transaksi">
                {selected && (
                    <div className="space-y-5">
                        <div className={`p-4 rounded-2xl space-y-3 ${theme.bgFrame} border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                            {[
                                { label: 'Invoice', value: selected.invoiceNumber ?? '-' },
                                { label: 'Tipe', value: selected.type ?? '-' },
                                { label: 'Pelanggan', value: selected.customer?.name ?? '-' },
                                { label: 'Kendaraan', value: selected.vehicle ? `${selected.vehicle.make || selected.vehicle.brand} ${selected.vehicle.model}` : '-' },
                                { label: 'Total', value: fmt(selected.finalPrice) },
                                { label: 'Pembayaran', value: selected.paymentType ?? '-' },
                                { label: 'Status', value: selected.status },
                            ].map((item, idx, arr) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs ${theme.textMuted}`}>{item.label}</span>
                                        <span className={`text-sm font-bold ${theme.textMain}`}>{item.value}</span>
                                    </div>
                                    {idx < arr.length - 1 && <div className={`border-t mt-3 ${theme.divider}`} />}
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase mb-2 ${theme.textMuted}`}>Cetak Dokumen</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { type: 'invoice' as const, label: 'Invoice' },
                                    { type: 'spk' as const, label: 'SPK' },
                                    { type: 'receipt' as const, label: 'Kwitansi' },
                                ].map(({ type, label }) => (
                                    <button key={type} onClick={() => handlePrint(type, selected.id)}
                                        className={`py-3 flex flex-col items-center gap-2 rounded-xl text-xs font-bold ${theme.btnSecondary}`}>
                                        <Printer className="h-4 w-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </BottomModal>

            {/* New Transaction Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
                    <div className="bg-[#ecf0f3] rounded-t-3xl w-full max-w-lg mx-auto p-6 max-h-[95vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Transaksi Baru</h3>
                            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>

                        {/* Type Toggle */}
                        <div className="flex rounded-xl overflow-hidden mb-4 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                            {(['SALE', 'PURCHASE'] as const).map(t => (
                                <button key={t} onClick={() => setTxType(t)}
                                    className={`flex-1 py-2.5 text-sm font-bold transition-all ${txType === t ? 'bg-[#00bfa5] text-white' : 'bg-[#ecf0f3] text-gray-500'}`}>
                                    {t === 'SALE' ? 'Penjualan' : 'Pembelian'}
                                </button>
                            ))}
                        </div>

                        {/* Vehicle Picker */}
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Kendaraan *</label>
                            {selectedVehicle ? (
                                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]">
                                    <span className="text-sm text-gray-800 font-medium">{selectedVehicle.make || selectedVehicle.brand} {selectedVehicle.model}</span>
                                    <button onClick={() => setSelectedVehicle(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div>
                                    <input type="text" placeholder="Cari kendaraan..." value={vSearch} onChange={e => setVSearch(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-sm text-gray-800 mb-2" />
                                    <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-white/50 p-2">
                                        {filteredVehicles.slice(0, 10).map(v => (
                                            <button key={v.id} onClick={() => { setSelectedVehicle(v); setFinalPrice(String(v.price)); }}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#00bfa5]/10 text-sm text-gray-700">
                                                {v.make || v.brand} {v.model} — {fmt(v.price)}
                                            </button>
                                        ))}
                                        {filteredVehicles.length === 0 && <p className="text-center text-gray-400 text-xs py-3">Tidak ada kendaraan tersedia</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Customer Picker (SALE only) */}
                        {txType === 'SALE' && (
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Pelanggan *</label>
                                {selectedCustomer ? (
                                    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]">
                                        <span className="text-sm text-gray-800 font-medium">{selectedCustomer.name}</span>
                                        <button onClick={() => setSelectedCustomer(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <div>
                                        <input type="text" placeholder="Cari pelanggan..." value={cSearch} onChange={e => setCSearch(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-sm text-gray-800 mb-2" />
                                        <div className="max-h-32 overflow-y-auto space-y-1 rounded-xl bg-white/50 p-2">
                                            {filteredCustomers.slice(0, 8).map(c => (
                                                <button key={c.id} onClick={() => setSelectedCustomer(c)}
                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#00bfa5]/10 text-sm text-gray-700">
                                                    {c.name} {c.phone ? `(${c.phone})` : ''}
                                                </button>
                                            ))}
                                            {filteredCustomers.length === 0 && <p className="text-center text-gray-400 text-xs py-3">Tidak ada pelanggan</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Price + Payment Type */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Harga Final (Rp) *</label>
                                <input type="number" value={finalPrice} onChange={e => setFinalPrice(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-sm text-gray-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Jenis Bayar</label>
                                <select value={paymentType} onChange={e => setPaymentType(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] focus:outline-none text-sm text-gray-800">
                                    {PAYMENT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Credit Fields */}
                        {(paymentType === 'KREDIT' || paymentType === 'LEASING') && (
                            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 mb-3 space-y-2">
                                <p className="text-xs font-bold text-blue-600 mb-1">Detail Kredit</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">DP (Rp)</label>
                                        <input type="number" value={dp} onChange={e => setDp(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white text-gray-800 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#00bfa5]" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Bunga (%/thn)</label>
                                        <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white text-gray-800 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#00bfa5]" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Tenor (bln)</label>
                                        <input type="number" value={tenor} onChange={e => setTenor(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white text-gray-800 text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#00bfa5]" />
                                    </div>
                                </div>
                                {paymentType === 'LEASING' && (
                                    <input type="text" placeholder="Nama Leasing/Finance..." value={leasingCompany} onChange={e => setLeasingCompany(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-white text-gray-800 text-xs border border-gray-200 focus:outline-none" />
                                )}
                                {dp && finalPrice && tenor && (
                                    <div className="text-xs font-bold text-blue-700 bg-blue-100 rounded-lg p-2 text-center">
                                        Estimasi cicilan: {fmt(monthlyPayment())}/bulan
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Catatan</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Catatan tambahan..."
                                className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-sm text-gray-800 resize-none" />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? 'Menyimpan...' : <><Check className="w-4 h-4" /> Buat Transaksi</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
