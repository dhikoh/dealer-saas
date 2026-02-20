'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, AlertCircle, Plus, Edit2, Trash2, X, Check, Shield } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';
import { toast } from 'sonner';

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    identityNumber?: string;
}

const INITIAL_FORM = { name: '', email: '', phone: '', address: '', identityNumber: '' };

export default function MobileCustomers() {
    const { theme } = useMobileContext();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filtered, setFiltered] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Customer | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<typeof INITIAL_FORM>({ ...INITIAL_FORM });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    // Blacklist check
    const [showBlacklist, setShowBlacklist] = useState(false);
    const [blKtp, setBlKtp] = useState('');
    const [blResult, setBlResult] = useState<{ found: boolean; data?: any } | null>(null);
    const [blChecking, setBlChecking] = useState(false);

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/customers?limit=100&page=1');
            if (res.ok) {
                const d = await res.json();
                const list = d?.data ?? d ?? [];
                setCustomers(list);
                setFiltered(list);
            }
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => {
        if (!search) { setFiltered(customers); return; }
        const q = search.toLowerCase();
        setFiltered(customers.filter(c => `${c.name} ${c.phone ?? ''} ${c.email ?? ''} ${c.identityNumber ?? ''}`.toLowerCase().includes(q)));
    }, [search, customers]);

    const openAdd = () => {
        setForm({ ...INITIAL_FORM });
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (c: Customer) => {
        setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', identityNumber: c.identityNumber || '' });
        setEditingId(c.id);
        setSelected(null);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name) { toast.error('Nama wajib diisi'); return; }
        setSaving(true);
        try {
            const res = await fetchApi(editingId ? `/customers/${editingId}` : '/customers', {
                method: editingId ? 'PUT' : 'POST',
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast.success(editingId ? 'Pelanggan diperbarui' : 'Pelanggan ditambahkan');
                setShowForm(false);
                fetchCustomers();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menyimpan');
            }
        } catch { toast.error('Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetchApi(`/customers/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Pelanggan dihapus');
                setDeleteTarget(null);
                fetchCustomers();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menghapus');
            }
        } catch { toast.error('Gagal menghapus'); }
    };

    const handleBlacklistCheck = async () => {
        if (!blKtp) { toast.error('Masukkan nomor KTP'); return; }
        setBlChecking(true);
        setBlResult(null);
        try {
            const res = await fetchApi('/blacklist/check', {
                method: 'POST',
                body: JSON.stringify({ identityNumber: blKtp }),
            });
            if (res.ok) {
                const data = await res.json();
                setBlResult(data);
            } else {
                // Not found → not blacklisted
                setBlResult({ found: false });
            }
        } catch { toast.error('Gagal memeriksa blacklist'); }
        finally { setBlChecking(false); }
    };

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-2 px-5 sticky top-0 z-10`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-2xl font-black tracking-tight ${theme.textMain}`}>Pelanggan</h2>
                    <div className="flex gap-2">
                        <button onClick={() => { setShowBlacklist(true); setBlResult(null); setBlKtp(''); }}
                            className="p-2 rounded-xl bg-red-100 text-red-500" title="Cek Blacklist">
                            <Shield className="w-4 h-4" />
                        </button>
                        <button onClick={openAdd} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${theme.btnPrimary}`}>
                            <Plus className="w-4 h-4" /> Tambah
                        </button>
                    </div>
                </div>
                <div className="relative mb-4">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input type="text" placeholder="Cari nama, HP, KTP..." value={search} onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-12 pr-6 py-3.5 rounded-2xl text-sm font-bold outline-none ${theme.bgInput}`} />
                </div>
            </div>

            {/* List */}
            <div className="p-5 pt-2 space-y-3 pb-24">
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
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada pelanggan</p>
                    </div>
                ) : filtered.map(c => (
                    <div key={c.id} onClick={() => setSelected(c)}
                        className={`p-4 flex items-center gap-4 active:scale-[0.97] transition-transform cursor-pointer ${theme.bgCard}`}>
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-black text-base ${theme.iconContainer}`}>
                            {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-black text-sm truncate ${theme.textMain}`}>{c.name}</h4>
                            <p className={`text-xs font-medium truncate mt-0.5 ${theme.textMuted}`}>{c.phone || c.email || '-'}</p>
                        </div>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEdit(c)} className={`p-1.5 rounded-lg ${theme.btnSecondary}`}><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg bg-red-100 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detail Pelanggan">
                {selected && (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-2xl flex items-center gap-4 ${theme.iconContainer}`}>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-black text-2xl ${theme.bgFrame}`}>
                                {selected.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className={`font-black text-lg ${theme.textMain}`}>{selected.name}</h3>
                                <p className={`text-xs font-bold mt-0.5 ${theme.textMuted}`}>{selected.email || '-'}</p>
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl space-y-3 ${theme.bgFrame} border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                            {[
                                { label: 'No. HP', value: selected.phone || '-' },
                                { label: 'Alamat', value: selected.address || '-' },
                                { label: 'No. KTP', value: selected.identityNumber || '-' },
                            ].map((item, idx, arr) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-start gap-2">
                                        <span className={`text-xs ${theme.textMuted} mt-0.5`}>{item.label}</span>
                                        <span className={`text-sm font-bold text-right max-w-[60%] ${theme.textMain}`}>{item.value}</span>
                                    </div>
                                    {idx < arr.length - 1 && <div className={`border-t mt-3 ${theme.divider}`} />}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => openEdit(selected)} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${theme.btnSecondary}`}>
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteTarget(selected); setSelected(null); }} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                        </div>
                    </div>
                )}
            </BottomModal>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
                    <div className="bg-[#ecf0f3] rounded-t-3xl w-full max-w-lg mx-auto p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
                            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Nama Lengkap *', key: 'name', placeholder: 'Budi Santoso', type: 'text' },
                                { label: 'No. HP', key: 'phone', placeholder: '08123456789', type: 'tel' },
                                { label: 'Email', key: 'email', placeholder: 'budi@email.com', type: 'email' },
                                { label: 'No. KTP', key: 'identityNumber', placeholder: '317XXXXXXXXXXXXX', type: 'text' },
                                { label: 'Alamat', key: 'address', placeholder: 'Jl. Contoh No. 123', type: 'text' },
                            ].map(({ label, key, placeholder, type }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                                    <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                                        placeholder={placeholder}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? 'Menyimpan...' : <><Check className="w-4 h-4" /> Simpan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-sm">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="font-bold text-gray-800">Hapus Pelanggan?</h3>
                            <p className="text-sm text-gray-500 mt-1">{deleteTarget.name} akan dihapus permanen.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Blacklist Check Modal */}
            {showBlacklist && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" /> Cek Blacklist</h3>
                            <button onClick={() => setShowBlacklist(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Masukkan nomor KTP untuk memeriksa status blacklist di seluruh dealer.</p>
                        <input type="text" value={blKtp} onChange={e => setBlKtp(e.target.value)} placeholder="317XXXXXXXXXXXXX"
                            className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 mb-3" />
                        {blResult && (
                            <div className={`p-3 rounded-xl mb-3 text-center font-bold text-sm ${blResult.found ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {blResult.found ? '⚠️ Pelanggan TERDAFTAR dalam blacklist!' : '✅ Pelanggan TIDAK terdaftar dalam blacklist'}
                            </div>
                        )}
                        <button onClick={handleBlacklistCheck} disabled={blChecking}
                            className="w-full py-3 rounded-xl bg-[#00bfa5] text-white font-bold disabled:opacity-50">
                            {blChecking ? 'Memeriksa...' : 'Periksa'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
