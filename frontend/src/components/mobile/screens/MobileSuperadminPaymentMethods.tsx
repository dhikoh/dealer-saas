'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, Edit2, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';
import { useMobileContext } from '@/context/MobileContext';

interface PaymentMethod {
    id: string;
    name: string;
    provider: string;
    accountNumber: string;
    accountName: string;
    instructions?: string;
    isActive: boolean;
}

const INITIAL_FORM = { name: '', provider: '', accountNumber: '', accountName: '', instructions: '' };

export default function MobileSuperadminPaymentMethods() {
    const { theme } = useMobileContext();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...INITIAL_FORM });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);

    useEffect(() => { fetchMethods(); }, []);

    const fetchMethods = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/payment-methods/admin/all');
            if (res.ok) setMethods(await res.json());
        } catch { } finally { setLoading(false); }
    };

    const openAdd = () => { setForm({ ...INITIAL_FORM }); setEditingId(null); setShowForm(true); };
    const openEdit = (m: PaymentMethod) => {
        setForm({ name: m.name, provider: m.provider, accountNumber: m.accountNumber, accountName: m.accountName, instructions: m.instructions || '' });
        setEditingId(m.id); setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.accountNumber || !form.accountName) { toast.error('Isi semua field wajib'); return; }
        setSaving(true);
        try {
            const res = await fetchApi(editingId ? `/payment-methods/admin/${editingId}` : '/payment-methods/admin', {
                method: editingId ? 'PATCH' : 'POST',
                body: JSON.stringify(form),
            });
            if (res.ok) { toast.success(editingId ? 'Metode diperbarui' : 'Metode ditambahkan'); setShowForm(false); fetchMethods(); }
            else { const err = await res.json(); toast.error(err.message || 'Gagal menyimpan'); }
        } catch { toast.error('Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetchApi(`/payment-methods/admin/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('Metode dihapus'); setDeleteTarget(null); fetchMethods(); }
            else { const err = await res.json(); toast.error(err.message || 'Gagal menghapus'); }
        } catch { toast.error('Gagal menghapus'); }
    };

    const handleToggle = async (m: PaymentMethod) => {
        try {
            const res = await fetchApi(`/payment-methods/admin/${m.id}/toggle`, { method: 'PATCH' });
            if (res.ok) { toast.success(m.isActive ? 'Dinonaktifkan' : 'Diaktifkan'); fetchMethods(); }
        } catch { toast.error('Gagal'); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-4 pb-24 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Metode Pembayaran</h1>
                    <p className="text-sm text-gray-500">Kelola opsi pembayaran platform</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00bfa5] text-white text-sm font-bold shadow-lg">
                    <Plus className="w-4 h-4" /> Tambah
                </button>
            </div>

            <div className="space-y-3">
                {methods.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Belum ada metode pembayaran</p>
                    </div>
                ) : methods.map(m => (
                    <div key={m.id} className={`${theme.bgCard} p-4 ${!m.isActive ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00bfa5] to-emerald-400 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${theme.textMain}`}>{m.name}</h3>
                                    <p className="text-xs text-gray-500">{m.provider}</p>
                                </div>
                            </div>
                            <button onClick={() => handleToggle(m)} className={`p-1 rounded-lg ${m.isActive ? 'text-[#00bfa5]' : 'text-gray-400'}`}>
                                {m.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                            </button>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">{m.accountNumber}</span> — {m.accountName}
                        </div>
                        {m.instructions && <p className="text-xs text-gray-400 mb-2 italic">{m.instructions}</p>}
                        <div className="flex gap-2">
                            <button onClick={() => openEdit(m)} className={`flex-1 py-2 rounded-xl ${theme.btnSecondary} text-xs flex items-center justify-center gap-1`}>
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => setDeleteTarget(m)} className="flex-1 py-2 rounded-xl bg-red-100 text-red-500 text-xs font-bold flex items-center justify-center gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
                    <div className={`${theme.bgFrame} rounded-t-3xl w-full max-w-lg mx-auto p-6 max-h-[90vh] overflow-y-auto`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-bold ${theme.textMain}`}>{editingId ? 'Edit' : 'Tambah'} Metode Pembayaran</h3>
                            <button onClick={() => setShowForm(false)}><X className={`w-5 h-5 ${theme.textMuted}`} /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Nama *', key: 'name', placeholder: 'BCA, Mandiri, QRIS...' },
                                { label: 'Provider', key: 'provider', placeholder: 'Bank, E-Wallet...' },
                                { label: 'No. Rekening / ID *', key: 'accountNumber', placeholder: '1234567890' },
                                { label: 'Nama Pemilik Rekening *', key: 'accountName', placeholder: 'PT Contoh Dealer' },
                                { label: 'Instruksi Transfer', key: 'instructions', placeholder: 'Transfer ke nomor...' },
                            ].map(({ label, key, placeholder }) => (
                                <div key={key}>
                                    <label className={`block text-sm font-medium ${theme.textMuted} mb-1`}>{label}</label>
                                    <input type="text" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                                        placeholder={placeholder}
                                        className={`w-full px-4 py-2.5 rounded-xl outline-none ${theme.bgInput}`} />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowForm(false)} className={`flex-1 py-3 rounded-xl ${theme.btnSecondary}`}>Batal</button>
                            <button onClick={handleSave} disabled={saving} className={`flex-1 py-3 rounded-xl ${theme.btnPrimary} font-bold disabled:opacity-50`}>
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className={`${theme.bgFrame} rounded-2xl p-6 w-full max-w-sm text-center border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className={`font-bold ${theme.textMain}`}>Hapus Metode?</h3>
                        <p className={`text-sm ${theme.textMuted} mt-1 mb-4`}>{deleteTarget.name} akan dihapus permanen.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className={`flex-1 py-3 rounded-xl ${theme.btnSecondary}`}>Batal</button>
                            <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
