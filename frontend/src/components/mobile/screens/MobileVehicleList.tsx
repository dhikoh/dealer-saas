'use client';

import React, { useState, useEffect } from 'react';
import { Car, Search, AlertCircle, Calculator } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface Vehicle {
    id: string;
    brand: string;
    model: string;
    variant?: string;
    year: number;
    color: string;
    price: number;
    condition?: string;
    status: string;
    stockCode?: string;
    imageUrl?: string;
}

export default function MobileVehicleList() {
    const { theme } = useMobileContext();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [filtered, setFiltered] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'baru' | 'bekas' | 'available'>('all');
    const [selected, setSelected] = useState<Vehicle | null>(null);

    useEffect(() => {
        fetchApi('/vehicles?limit=50&page=1')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                const list = d?.data ?? d ?? [];
                setVehicles(list);
                setFiltered(list);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let list = [...vehicles];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(v => `${v.brand} ${v.model} ${v.variant ?? ''}`.toLowerCase().includes(q));
        }
        if (activeFilter === 'baru') list = list.filter(v => v.condition === 'BARU' || v.condition === 'baru' || v.condition === 'NEW');
        if (activeFilter === 'bekas') list = list.filter(v => v.condition === 'BEKAS' || v.condition === 'bekas' || v.condition === 'USED');
        if (activeFilter === 'available') list = list.filter(v => v.status === 'AVAILABLE');
        setFiltered(list);
    }, [search, activeFilter, vehicles]);

    const filters: { key: typeof activeFilter; label: string }[] = [
        { key: 'all', label: 'Semua' },
        { key: 'baru', label: 'Baru' },
        { key: 'bekas', label: 'Bekas' },
        { key: 'available', label: 'Tersedia' },
    ];

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-2 px-6 sticky top-0 z-10`}>
                <h2 className={`text-2xl font-black tracking-tight mb-4 ${theme.textMain}`}>Inventaris</h2>
                <div className="relative">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input
                        type="text"
                        placeholder="Cari merek, model..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-12 pr-6 py-4 rounded-2xl text-sm font-bold outline-none ${theme.bgInput}`}
                    />
                </div>
                <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar pb-3">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shrink-0 transition-all ${activeFilter === f.key ? theme.btnPrimary : theme.btnSecondary}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 pt-2 space-y-5">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className={`p-4 ${theme.bgCard}`}>
                            <div className="flex gap-4 items-center">
                                <div className={`w-28 h-20 rounded-2xl ${theme.imagePlaceholder} animate-pulse`} />
                                <div className="flex-1 space-y-2">
                                    <div className={`h-5 w-3/4 rounded-lg ${theme.imagePlaceholder} animate-pulse`} />
                                    <div className={`h-3 w-1/2 rounded ${theme.imagePlaceholder} animate-pulse`} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className={`p-10 ${theme.bgCard} flex flex-col items-center text-center`}>
                        <AlertCircle className={`h-10 w-10 mb-4 opacity-30 ${theme.textMuted}`} />
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada kendaraan ditemukan</p>
                    </div>
                ) : filtered.map(v => (
                    <div
                        key={v.id}
                        onClick={() => setSelected(v)}
                        className={`p-4 flex flex-col active:scale-[0.97] transition-transform cursor-pointer ${theme.bgCard}`}
                    >
                        <div className="flex gap-4 items-center">
                            <div className={`w-28 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${theme.imagePlaceholder}`}>
                                {v.imageUrl
                                    ? <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" />
                                    : <Car className="h-8 w-8 opacity-30" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-black text-lg leading-tight ${theme.textMain}`}>{v.brand} {v.model}</h3>
                                <p className={`text-xs font-bold mt-1.5 ${theme.textMuted}`}>{v.variant ?? '-'} • {v.year}</p>
                                <p className={`text-[10px] mt-1 font-mono uppercase ${theme.textMuted}`}>{v.stockCode ?? v.id.slice(0, 8)}</p>
                            </div>
                        </div>
                        <div className={`pt-3 mt-1 border-t ${theme.divider} flex justify-between items-center`}>
                            <p className={`font-black text-lg ${theme.textHighlight}`}>{formatRupiah(v.price)}</p>
                            <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${theme.btnSecondary}`}>
                                {v.status === 'AVAILABLE' ? 'Tersedia' : v.status === 'SOLD' ? 'Terjual' : 'Dipesan'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detail Kendaraan">
                {selected && (
                    <div className="space-y-6">
                        <div className={`w-full h-48 rounded-[32px] overflow-hidden flex items-center justify-center ${theme.imagePlaceholder}`}>
                            {selected.imageUrl
                                ? <img src={selected.imageUrl} alt={selected.model} className="w-full h-full object-cover" />
                                : <Car className="h-20 w-20 opacity-30" />}
                        </div>
                        <div className="px-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${theme.textMuted}`}>{selected.brand}</p>
                                    <h2 className={`text-3xl font-black tracking-tight ${theme.textMain}`}>{selected.model}</h2>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${theme.btnSecondary}`}>
                                    {selected.condition ?? '-'}
                                </div>
                            </div>
                            <h3 className={`text-2xl font-black mt-4 ${theme.textHighlight}`}>{formatRupiah(selected.price)}</h3>
                        </div>
                        <div className="px-2">
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${theme.textMuted}`}>Spesifikasi</p>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Varian', value: selected.variant ?? '-' },
                                    { label: 'Tahun', value: selected.year },
                                    { label: 'Warna', value: selected.color },
                                    { label: 'Status', value: selected.status },
                                ].map(s => (
                                    <div key={s.label} className={`p-4 rounded-2xl border ${theme.bgFrame} ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${theme.textMuted}`}>{s.label}</p>
                                        <p className={`text-xs font-black truncate ${theme.textMain}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </BottomModal>
        </div>
    );
}
