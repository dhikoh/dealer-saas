'use client';

import React, { useEffect, useState } from 'react';
import { Building, Plus, Edit2, Trash2, X, Check, Users, Crown, MapPin, Phone } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface Branch {
    id: string;
    name: string;
    address: string;
    phone?: string | null;
    _count?: { users?: number; vehicles?: number };
}

const INITIAL_FORM = { name: '', address: '', phone: '' };

export default function MobileBranches() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...INITIAL_FORM });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

    useEffect(() => { checkPlan(); fetchBranches(); }, []);

    const checkPlan = async () => {
        try {
            const res = await fetchApi('/tenant/profile');
            if (res.ok) {
                const d = await res.json();
                setIsPro(d.planTier === 'PRO' || d.planTier === 'UNLIMITED');
            }
        } catch { }
    };

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/tenant/branches');
            if (res.ok) setBranches(await res.json());
        } catch { } finally { setLoading(false); }
    };

    const openAdd = () => { setForm({ ...INITIAL_FORM }); setEditingId(null); setShowForm(true); };
    const openEdit = (b: Branch) => { setForm({ name: b.name, address: b.address, phone: b.phone || '' }); setEditingId(b.id); setShowForm(true); };

    const handleSave = async () => {
        if (!form.name || !form.address) { toast.error('Nama dan alamat wajib diisi'); return; }
        setSaving(true);
        try {
            const res = await fetchApi(editingId ? `/tenant/branches/${editingId}` : '/tenant/branches', {
                method: editingId ? 'PUT' : 'POST',
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast.success(editingId ? 'Cabang diperbarui' : 'Cabang ditambahkan');
                setShowForm(false);
                fetchBranches();
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
            const res = await fetchApi(`/tenant/branches/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('Cabang dihapus'); setDeleteTarget(null); fetchBranches(); }
            else { const err = await res.json(); toast.error(err.message || 'Gagal menghapus'); }
        } catch { toast.error('Gagal menghapus'); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    // PRO gate
    if (!isPro) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 shadow-xl">
                <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Fitur Multi-Cabang</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">Kelola beberapa cabang dealer dalam satu dashboard. Fitur ini tersedia untuk plan PRO & UNLIMITED.</p>
            <div className="bg-purple-50 rounded-2xl p-4 mb-6 w-full max-w-xs text-left space-y-2">
                {['Kelola unlimited cabang', 'Laporan per cabang', 'Assignment staff ke cabang', 'Transfer kendaraan antar cabang'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-purple-700">
                        <Check className="w-4 h-4 text-purple-500 flex-shrink-0" /> {f}
                    </div>
                ))}
            </div>
            <button onClick={() => window.location.href = '/app/billing'}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg">
                Upgrade ke PRO
            </button>
        </div>
    );

    return (
        <div className="p-4 pb-24 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Cabang</h1>
                    <p className="text-sm text-gray-500">Kelola lokasi dealer</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00bfa5] text-white text-sm font-bold shadow-lg">
                    <Plus className="w-4 h-4" /> Tambah
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Cabang', value: branches.length, color: 'text-[#00bfa5]' },
                    { label: 'Total Staff', value: branches.reduce((a, b) => a + (b._count?.users || 0), 0), color: 'text-blue-600' },
                    { label: 'Kendaraan', value: branches.reduce((a, b) => a + (b._count?.vehicles || 0), 0), color: 'text-emerald-600' },
                ].map(s => (
                    <div key={s.label} className="bg-[#ecf0f3] rounded-xl p-3 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] text-center">
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Branch list */}
            <div className="space-y-3">
                {branches.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Building className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Belum ada cabang</p>
                    </div>
                ) : branches.map(b => (
                    <div key={b.id} className="bg-[#ecf0f3] rounded-2xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00bfa5] to-emerald-400 flex items-center justify-center">
                                    <Building className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-800">{b.name}</h3>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg bg-[#ecf0f3] shadow-[2px_2px_4px_#cbced1,-2px_-2px_4px_#ffffff] text-gray-500">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setDeleteTarget(b)} className="p-1.5 rounded-lg bg-red-100 text-red-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5 mb-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{b.address}
                            </div>
                            {b.phone && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Phone className="w-3.5 h-3.5 text-gray-400" />{b.phone}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Users className="w-3.5 h-3.5 text-blue-500" />{b._count?.users || 0} Staff
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Building className="w-3.5 h-3.5 text-emerald-500" />{b._count?.vehicles || 0} Unit
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
                    <div className="bg-[#ecf0f3] rounded-t-3xl w-full max-w-lg mx-auto p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Cabang' : 'Tambah Cabang'}</h3>
                            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Nama Cabang *', key: 'name', placeholder: 'Cabang Jakarta Selatan', type: 'text' },
                                { label: 'Alamat Lengkap *', key: 'address', placeholder: 'Jl. Contoh No. 123', type: 'text' },
                                { label: 'No. Telepon', key: 'phone', placeholder: '021-xxxx', type: 'tel' },
                            ].map(({ label, key, placeholder, type }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                                    <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                                        placeholder={placeholder}
                                        className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-bold disabled:opacity-50">
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-sm text-center">
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Hapus Cabang?</h3>
                        <p className="text-sm text-gray-500 mb-4">{deleteTarget.name} akan dihapus permanen.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
