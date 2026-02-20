'use client';

import React, { useState, useEffect } from 'react';
import { Car, Search, AlertCircle, Plus, Edit2, Trash2, X, Check, Upload, Filter } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi, API_URL } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface Vehicle {
    id: string;
    make?: string;
    brand?: string;
    model: string;
    variant?: string;
    year: number;
    color: string;
    price: number;
    purchasePrice?: number;
    condition?: string;
    status: string;
    stockCode?: string;
    licensePlate?: string;
    frameNumber?: string;
    imageUrl?: string;
}

const INITIAL_FORM = {
    make: '', model: '', variant: '', year: new Date().getFullYear(), color: '',
    licensePlate: '', frameNumber: '', condition: 'BEKAS',
    purchasePrice: '', price: '', status: 'AVAILABLE', notes: '',
};

const CONDITIONS = ['BARU', 'BEKAS'];
const STATUSES = ['AVAILABLE', 'SOLD', 'REPAIR'];

export default function MobileVehicleList() {
    const { theme } = useMobileContext();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [filtered, setFiltered] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selected, setSelected] = useState<Vehicle | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<typeof INITIAL_FORM>({ ...INITIAL_FORM });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
    const [uploadingImg, setUploadingImg] = useState(false);

    useEffect(() => { fetchVehicles(); }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/vehicles?limit=100&page=1');
            if (res.ok) {
                const d = await res.json();
                const list = d?.data ?? d ?? [];
                setVehicles(list);
                setFiltered(list);
            }
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => {
        let list = [...vehicles];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(v => `${v.make ?? v.brand ?? ''} ${v.model} ${v.variant ?? ''}`.toLowerCase().includes(q));
        }
        if (statusFilter !== 'ALL') list = list.filter(v => v.status === statusFilter);
        setFiltered(list);
    }, [search, statusFilter, vehicles]);

    const openAdd = () => {
        setForm({ ...INITIAL_FORM });
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (v: Vehicle) => {
        setForm({
            make: v.make || v.brand || '', model: v.model, variant: v.variant || '',
            year: v.year, color: v.color, licensePlate: v.licensePlate || '',
            frameNumber: v.frameNumber || '', condition: v.condition || 'BEKAS',
            purchasePrice: String(v.purchasePrice || ''), price: String(v.price),
            status: v.status, notes: '',
        });
        setEditingId(v.id);
        setSelected(null);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.make || !form.model || !form.price) {
            toast.error('Merek, model, dan harga jual wajib diisi');
            return;
        }
        setSaving(true);
        try {
            const body = {
                make: form.make, model: form.model, variant: form.variant,
                year: Number(form.year), color: form.color,
                licensePlate: form.licensePlate, frameNumber: form.frameNumber,
                condition: form.condition,
                purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
                price: Number(form.price),
                status: form.status,
            };
            const res = await fetchApi(editingId ? `/vehicles/${editingId}` : '/vehicles', {
                method: editingId ? 'PUT' : 'POST',
                body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success(editingId ? 'Kendaraan diperbarui' : 'Kendaraan ditambahkan');
                setShowForm(false);
                fetchVehicles();
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
            const res = await fetchApi(`/vehicles/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Kendaraan dihapus');
                setDeleteTarget(null);
                fetchVehicles();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menghapus');
            }
        } catch { toast.error('Gagal menghapus'); }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, vehicleId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImg(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetchApi(`/vehicles/${vehicleId}/images`, { method: 'POST', body: fd });
            if (res.ok) { toast.success('Foto diupload'); fetchVehicles(); }
            else toast.error('Gagal upload foto');
        } catch { toast.error('Gagal upload foto'); }
        finally { setUploadingImg(false); }
    };

    const statusBadge = (status: string) => {
        if (status === 'AVAILABLE') return 'bg-green-100 text-green-700';
        if (status === 'SOLD') return 'bg-gray-200 text-gray-600';
        if (status === 'REPAIR') return 'bg-amber-100 text-amber-700';
        return 'bg-gray-100 text-gray-500';
    };

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-2 px-5 sticky top-0 z-10`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-2xl font-black tracking-tight ${theme.textMain}`}>Inventaris</h2>
                    <button onClick={openAdd} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold ${theme.btnPrimary}`}>
                        <Plus className="w-4 h-4" /> Tambah
                    </button>
                </div>
                <div className="relative mb-3">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input type="text" placeholder="Cari merek, model..." value={search} onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-12 pr-6 py-3.5 rounded-2xl text-sm font-bold outline-none ${theme.bgInput}`} />
                </div>
                {/* Status Filter */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3">
                    {['ALL', 'AVAILABLE', 'SOLD', 'REPAIR'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${statusFilter === s ? theme.btnPrimary : theme.btnSecondary}`}>
                            {s === 'ALL' ? 'Semua' : s === 'AVAILABLE' ? 'Tersedia' : s === 'SOLD' ? 'Terjual' : 'Servis'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="p-5 pt-2 space-y-4 pb-24">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className={`p-4 ${theme.bgCard}`}>
                            <div className="flex gap-4 items-center">
                                <div className={`w-24 h-16 rounded-xl ${theme.imagePlaceholder} animate-pulse`} />
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
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada kendaraan</p>
                    </div>
                ) : filtered.map(v => (
                    <div key={v.id} onClick={() => setSelected(v)}
                        className={`p-4 flex flex-col active:scale-[0.97] transition-transform cursor-pointer ${theme.bgCard}`}>
                        <div className="flex gap-4 items-center">
                            <div className={`w-24 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${theme.imagePlaceholder}`}>
                                {v.imageUrl ? <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" /> : <Car className="h-7 w-7 opacity-30" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-black text-base leading-tight ${theme.textMain}`}>{v.make || v.brand} {v.model}</h3>
                                <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{v.variant ?? '-'} • {v.year} • {v.color}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${statusBadge(v.status)}`}>
                                        {v.status === 'AVAILABLE' ? 'Tersedia' : v.status === 'SOLD' ? 'Terjual' : 'Servis'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={`pt-3 mt-2 border-t ${theme.divider} flex justify-between items-center`}>
                            <p className={`font-black text-base ${theme.textHighlight}`}>{fmt(v.price)}</p>
                            <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openEdit(v)}
                                    className={`p-2 rounded-xl ${theme.btnSecondary}`}><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => setDeleteTarget(v)}
                                    className="p-2 rounded-xl bg-red-100 text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detail Kendaraan">
                {selected && (
                    <div className="space-y-5">
                        <div className={`w-full h-44 rounded-2xl overflow-hidden flex items-center justify-center ${theme.imagePlaceholder}`}>
                            {selected.imageUrl ? <img src={selected.imageUrl} alt={selected.model} className="w-full h-full object-cover" /> : <Car className="h-16 w-16 opacity-30" />}
                        </div>
                        {/* Upload foto */}
                        <label className={`flex items-center justify-center gap-2 py-2.5 rounded-xl w-full cursor-pointer ${theme.btnSecondary} text-sm font-bold`}>
                            {uploadingImg ? 'Mengupload...' : <><Upload className="w-4 h-4" /> Ganti Foto</>}
                            <input type="file" accept="image/*" className="hidden"
                                onChange={e => handleUploadImage(e, selected.id)} disabled={uploadingImg} />
                        </label>
                        <div className={`rounded-2xl p-4 space-y-3 ${theme.bgFrame} border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                            {[
                                { label: 'Merek / Model', value: `${selected.make || selected.brand} ${selected.model}` },
                                { label: 'Varian', value: selected.variant || '-' },
                                { label: 'Tahun', value: selected.year },
                                { label: 'Warna', value: selected.color },
                                { label: 'Plat', value: selected.licensePlate || '-' },
                                { label: 'No. Rangka', value: selected.frameNumber || '-' },
                                { label: 'Kondisi', value: selected.condition || '-' },
                                { label: 'Status', value: selected.status },
                                { label: 'Harga Jual', value: fmt(selected.price) },
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
                        <div className="flex gap-3">
                            <button onClick={() => { openEdit(selected); }}
                                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${theme.btnSecondary}`}>
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteTarget(selected); setSelected(null); }}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                        </div>
                    </div>
                )}
            </BottomModal>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
                    <div className="bg-[#ecf0f3] rounded-t-3xl w-full max-w-lg mx-auto p-6 max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Kendaraan' : 'Tambah Kendaraan'}</h3>
                            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Merek *', key: 'make', placeholder: 'Toyota, Honda, Suzuki...' },
                                { label: 'Model *', key: 'model', placeholder: 'Avanza, Jazz, Ertiga...' },
                                { label: 'Varian', key: 'variant', placeholder: 'G, S, E, VVT-i...' },
                                { label: 'Warna', key: 'color', placeholder: 'Putih, Hitam, Silver...' },
                                { label: 'No. Plat', key: 'licensePlate', placeholder: 'B 1234 XYZ' },
                                { label: 'No. Rangka', key: 'frameNumber', placeholder: 'MHF...' },
                            ].map(({ label, key, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                                    <input type="text" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                                        placeholder={placeholder}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Tahun</label>
                                    <input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Kondisi</label>
                                    <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm">
                                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Harga Beli (Rp)</label>
                                    <input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Harga Jual (Rp) *</label>
                                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm">
                                    {STATUSES.map(s => <option key={s} value={s}>{s === 'AVAILABLE' ? 'Tersedia' : s === 'SOLD' ? 'Terjual' : 'Service'}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? 'Menyimpan...' : <><Check className="w-4 h-4" /> Simpan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-sm">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="font-bold text-gray-800">Hapus Kendaraan?</h3>
                            <p className="text-sm text-gray-500 mt-1">{deleteTarget.make || deleteTarget.brand} {deleteTarget.model} akan dihapus permanen.</p>
                        </div>
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
