'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, AlertCircle, Phone, MapPin } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    identityNumber?: string;
}

export default function MobileCustomers() {
    const { theme } = useMobileContext();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filtered, setFiltered] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Customer | null>(null);

    useEffect(() => {
        fetchApi('/customers?limit=50&page=1')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                const list = d?.data ?? d ?? [];
                setCustomers(list);
                setFiltered(list);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!search) { setFiltered(customers); return; }
        const q = search.toLowerCase();
        setFiltered(customers.filter(c => `${c.name} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(q)));
    }, [search, customers]);

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            <div className={`${theme.bgHeader} pt-12 pb-2 px-6 sticky top-0 z-10`}>
                <h2 className={`text-2xl font-black tracking-tight mb-4 ${theme.textMain}`}>Pelanggan</h2>
                <div className="relative mb-4">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input
                        type="text"
                        placeholder="Cari nama, nomor HP..."
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
                            <div className="flex items-center gap-4">
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
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada pelanggan ditemukan</p>
                    </div>
                ) : filtered.map(c => (
                    <div
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className={`p-4 flex items-center gap-4 active:scale-[0.97] transition-transform cursor-pointer ${theme.bgCard}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-black text-lg ${theme.iconContainer}`}>
                            {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-black text-sm truncate ${theme.textMain}`}>{c.name}</h4>
                            <p className={`text-xs font-bold truncate mt-1 ${theme.textMuted}`}>{c.phone ?? c.email ?? '-'}</p>
                        </div>
                        <Users className={`h-4 w-4 flex-shrink-0 ${theme.textMuted}`} />
                    </div>
                ))}
            </div>

            <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detail Pelanggan">
                {selected && (
                    <div className="space-y-6">
                        <div className={`p-5 rounded-3xl flex items-center gap-5 ${theme.iconContainer}`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 font-black text-3xl ${theme.bgFrame}`}>
                                {selected.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className={`font-black text-xl ${theme.textMain}`}>{selected.name}</h3>
                                <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{selected.email ?? '-'}</p>
                            </div>
                        </div>
                        <div className={`p-6 rounded-3xl space-y-4 ${theme.bgFrame} border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                            {[
                                { label: 'No. Telp', value: selected.phone ?? '-', icon: <Phone className="h-4 w-4" /> },
                                { label: 'Alamat', value: selected.address ?? '-', icon: <MapPin className="h-4 w-4" /> },
                                { label: 'No. KTP', value: selected.identityNumber ?? '-', icon: <Users className="h-4 w-4" /> },
                            ].map((item, idx, arr) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className={theme.textMuted}>{item.icon}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>{item.label}</span>
                                        </div>
                                        <span className={`text-sm font-black max-w-[60%] text-right ${theme.textMain}`}>{item.value}</span>
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
