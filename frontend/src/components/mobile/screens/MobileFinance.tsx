'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, DollarSign } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

interface OperatingCost { id: string; name: string; amount: number; category: string; date: string; note?: string; }

const CATEGORIES = [
    { id: 'SALARY', label: 'Gaji Karyawan', color: 'text-green-500' },
    { id: 'UTILITY', label: 'Listrik & Air', color: 'text-yellow-500' },
    { id: 'RENT', label: 'Sewa Tempat', color: 'text-blue-500' },
    { id: 'MARKETING', label: 'Iklan & Pemasaran', color: 'text-purple-500' },
    { id: 'OTHER', label: 'Lain-lain', color: 'text-gray-500' },
];

export default function MobileFinance() {
    const { theme } = useMobileContext();
    const [costs, setCosts] = useState<OperatingCost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', amount: '', category: 'OTHER', date: new Date().toISOString().split('T')[0], note: '' });
    const [saving, setSaving] = useState(false);

    const load = () => {
        fetchApi('/finance/costs')
            .then(r => r.ok ? r.json() : [])
            .then(d => setCosts(d ?? []))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async () => {
        if (!form.name || !form.amount) { toast.error('Nama dan jumlah wajib diisi'); return; }
        setSaving(true);
        try {
            const res = await fetchApi('/finance/costs', {
                method: 'POST',
                body: JSON.stringify({ ...form, amount: Number(form.amount) }),
            });
            if (res.ok) {
                toast.success('Pengeluaran dicatat');
                setShowAdd(false);
                setForm({ name: '', amount: '', category: 'OTHER', date: new Date().toISOString().split('T')[0], note: '' });
                load();
            } else { toast.error('Gagal menyimpan'); }
        } catch { toast.error('Terjadi kesalahan'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        const res = await fetchApi(`/finance/costs/${id}`, { method: 'DELETE' });
        if (res.ok) { toast.success('Dihapus'); setCosts(c => c.filter(x => x.id !== id)); }
        else toast.error('Gagal hapus');
    };

    const total = costs.reduce((s, c) => s + Number(c.amount), 0);

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select pb-6`}>
            <div className={`${theme.bgHeader} pt-12 pb-4 px-6 sticky top-0 z-10 flex justify-between items-center`}>
                <h2 className={`text-2xl font-black ${theme.textMain}`}>Keuangan</h2>
                <button onClick={() => setShowAdd(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.btnPrimary}`}>
                    <Plus className="h-5 w-5" />
                </button>
            </div>

            {/* Total Card */}
            <div className="px-6 mt-4">
                <div className={`p-6 ${theme.bgCard}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>Total Pengeluaran</p>
                    <h3 className={`text-3xl font-black mt-2 text-red-500`}>Rp {fmt(total)}</h3>
                </div>
            </div>

            {/* List */}
            <div className="px-6 mt-6 space-y-3">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className={`h-16 rounded-3xl ${theme.imagePlaceholder} animate-pulse`} />)
                ) : costs.length === 0 ? (
                    <div className={`p-10 ${theme.bgCard} flex flex-col items-center text-center`}>
                        <AlertCircle className={`h-8 w-8 mb-3 opacity-30 ${theme.textMuted}`} />
                        <p className={`font-black ${theme.textMuted}`}>Belum ada pengeluaran</p>
                    </div>
                ) : costs.map(cost => {
                    const cat = CATEGORIES.find(c => c.id === cost.category) ?? CATEGORIES[4];
                    return (
                        <div key={cost.id} className={`p-4 flex items-center gap-4 ${theme.bgCard}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${theme.iconContainer}`}>
                                <DollarSign className={`h-5 w-5 ${cat.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-black text-sm truncate ${theme.textMain}`}>{cost.name}</p>
                                <p className={`text-[10px] font-black ${cat.color}`}>{cat.label}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-black text-red-500`}>Rp {fmt(Number(cost.amount))}</p>
                                <p className={`text-[9px] font-black ${theme.textMuted}`}>{new Date(cost.date).toLocaleDateString('id-ID')}</p>
                            </div>
                            <button onClick={() => handleDelete(cost.id)} className="p-2 rounded-xl text-red-400 active:scale-90 transition-transform">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Add Modal */}
            <BottomModal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Catat Pengeluaran">
                <div className="space-y-4">
                    {[
                        { label: 'Nama Pengeluaran', key: 'name', type: 'text', placeholder: 'Contoh: Token Listrik' },
                        { label: 'Jumlah (Rp)', key: 'amount', type: 'number', placeholder: '500000' },
                        { label: 'Tanggal', key: 'date', type: 'date', placeholder: '' },
                    ].map(f => (
                        <div key={f.key}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>{f.label}</p>
                            <input
                                type={f.type}
                                placeholder={f.placeholder}
                                value={(form as any)[f.key]}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                className={`w-full px-5 py-4 rounded-2xl text-sm font-bold outline-none ${theme.bgInput}`}
                            />
                        </div>
                    ))}
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Kategori</p>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map(c => (
                                <button key={c.id} onClick={() => setForm({ ...form, category: c.id })}
                                    className={`py-3 text-[10px] font-black rounded-2xl transition-all ${form.category === c.id ? theme.btnPrimary : theme.btnSecondary}`}>
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Catatan (Opsional)</p>
                        <textarea
                            rows={2}
                            value={form.note}
                            onChange={e => setForm({ ...form, note: e.target.value })}
                            className={`w-full px-5 py-4 rounded-2xl text-sm font-bold outline-none resize-none ${theme.bgInput}`}
                        />
                    </div>
                    <button onClick={handleSubmit} disabled={saving}
                        className={`w-full py-4 font-black text-sm rounded-2xl ${theme.btnPrimary} disabled:opacity-50`}>
                        {saving ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                    </button>
                </div>
            </BottomModal>
        </div>
    );
}
