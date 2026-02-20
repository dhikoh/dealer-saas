'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, AlertCircle, Check, X } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';
import { toast } from 'sonner';

interface Staff { id: string; name: string; email: string; phone: string | null; role: string; createdAt: string; }

const ROLES = [
    { id: 'ADMIN', label: 'Admin', color: 'text-purple-500' },
    { id: 'STAFF', label: 'Staff', color: 'text-blue-500' },
    { id: 'SALES', label: 'Sales', color: 'text-green-500' },
    { id: 'MECHANIC', label: 'Mekanik', color: 'text-amber-500' },
];

export default function MobileStaff() {
    const { theme } = useMobileContext();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [filtered, setFiltered] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState<Staff | null>(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'STAFF', password: '' });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        fetchApi('/tenant/staff')
            .then(r => r.ok ? r.json() : [])
            .then(d => { setStaff(d ?? []); setFiltered(d ?? []); })
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);
    useEffect(() => {
        if (!search) { setFiltered(staff); return; }
        const q = search.toLowerCase();
        setFiltered(staff.filter(s => `${s.name} ${s.email}`.toLowerCase().includes(q)));
    }, [search, staff]);

    const openEdit = (s: Staff) => {
        setEditing(s);
        setForm({ name: s.name, email: s.email, phone: s.phone ?? '', role: s.role, password: '' });
        setShowAdd(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.email || (!editing && !form.password)) { toast.error('Lengkapi data wajib'); return; }
        setSaving(true);
        try {
            const payload = editing
                ? { name: form.name, phone: form.phone || null, role: form.role }
                : { name: form.name, email: form.email, phone: form.phone || null, role: form.role, password: form.password };
            const res = await fetchApi(editing ? `/tenant/staff/${editing.id}` : '/tenant/staff', {
                method: editing ? 'PUT' : 'POST',
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast.success(editing ? 'Staff diperbarui' : 'Staff ditambahkan');
                setShowAdd(false);
                setEditing(null);
                setForm({ name: '', email: '', phone: '', role: 'STAFF', password: '' });
                load();
            } else { const e = await res.json(); toast.error(e.message ?? 'Gagal'); }
        } catch { toast.error('Terjadi kesalahan'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        const res = await fetchApi(`/tenant/staff/${id}`, { method: 'DELETE' });
        if (res.ok) { toast.success('Staff dihapus'); setStaff(s => s.filter(x => x.id !== id)); }
        else toast.error('Gagal hapus');
    };

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            <div className={`${theme.bgHeader} pt-12 pb-2 px-6 sticky top-0 z-10`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-2xl font-black ${theme.textMain}`}>Staff</h2>
                    <button onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', role: 'STAFF', password: '' }); setShowAdd(true); }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.btnPrimary}`}>
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
                <div className="relative mb-4">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input type="text" placeholder="Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-12 pr-6 py-4 rounded-2xl text-sm font-bold outline-none ${theme.bgInput}`} />
                </div>
            </div>

            <div className="p-6 pt-2 space-y-4">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className={`h-16 rounded-3xl ${theme.imagePlaceholder} animate-pulse`} />)
                ) : filtered.length === 0 ? (
                    <div className={`p-10 ${theme.bgCard} flex flex-col items-center text-center`}>
                        <AlertCircle className={`h-8 w-8 mb-3 opacity-30 ${theme.textMuted}`} />
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada staff ditemukan</p>
                    </div>
                ) : filtered.map(s => {
                    const roleConf = ROLES.find(r => r.id === s.role) ?? ROLES[1];
                    return (
                        <div key={s.id} className={`p-4 flex items-center gap-4 ${theme.bgCard}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-black text-lg ${theme.iconContainer}`}>
                                {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-black text-sm truncate ${theme.textMain}`}>{s.name}</p>
                                <p className={`text-[10px] font-black truncate ${roleConf.color}`}>{roleConf.label} · {s.email}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(s)} className={`p-2 rounded-xl ${theme.btnSecondary} active:scale-90 transition-transform`}>
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-xl text-red-400 active:scale-90 transition-transform">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <BottomModal isOpen={showAdd} onClose={() => setShowAdd(false)} title={editing ? 'Edit Staff' : 'Tambah Staff'}>
                <div className="space-y-4">
                    {[
                        { label: 'Nama', key: 'name', type: 'text' },
                        { label: 'Email', key: 'email', type: 'email', disabled: !!editing },
                        { label: 'No. HP', key: 'phone', type: 'tel' },
                        ...(!editing ? [{ label: 'Password', key: 'password', type: 'password' }] : []),
                    ].map(f => (
                        <div key={f.key}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>{f.label}</p>
                            <input type={f.type} value={(form as any)[f.key]} disabled={f.disabled}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                className={`w-full px-5 py-4 rounded-2xl text-sm font-bold outline-none ${theme.bgInput} ${f.disabled ? 'opacity-50' : ''}`} />
                        </div>
                    ))}
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Role</p>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(r => (
                                <button key={r.id} onClick={() => setForm({ ...form, role: r.id })}
                                    className={`py-3 text-[10px] font-black rounded-2xl ${form.role === r.id ? theme.btnPrimary : theme.btnSecondary}`}>
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving}
                        className={`w-full py-4 font-black text-sm rounded-2xl ${theme.btnPrimary} disabled:opacity-50`}>
                        {saving ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Tambah Staff')}
                    </button>
                </div>
            </BottomModal>
        </div>
    );
}
