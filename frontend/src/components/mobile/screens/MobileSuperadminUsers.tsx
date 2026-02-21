'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search, Trash2, X } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';
import { useMobileContext } from '@/context/MobileContext';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
    tenant?: { name: string } | null;
    createdAt: string;
}

const roleBg: Record<string, string> = {
    SUPERADMIN: 'bg-red-100 text-red-700', OWNER: 'bg-purple-100 text-purple-700',
    STAFF: 'bg-blue-100 text-blue-700',
};

export default function MobileSuperadminUsers() {
    const { theme } = useMobileContext();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/superadmin/users?limit=100');
            if (res.ok) { const d = await res.json(); setUsers(d?.data ?? d ?? []); }
        } catch { } finally { setLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setProcessing(true);
        try {
            const res = await fetchApi(`/superadmin/users/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('User dihapus'); setDeleteTarget(null); fetchUsers(); }
            else { const err = await res.json(); toast.error(err.message || 'Gagal menghapus'); }
        } catch { toast.error('Gagal menghapus'); }
        finally { setProcessing(false); }
    };

    const filtered = users.filter(u => {
        const matchSearch = search ? `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()) : true;
        const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    return (
        <div className="p-4 space-y-4 pb-24">
            <div>
                <h1 className={`text-xl font-bold ${theme.textMain}`}>Pengguna Global</h1>
                <p className={`text-sm ${theme.textMuted}`}>{users.length} total pengguna terdaftar</p>
            </div>
            <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, email..."
                    className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm ${theme.bgInput}`} />
            </div>
            <div className="flex gap-2">
                {['ALL', 'SUPERADMIN', 'OWNER', 'STAFF'].map(r => (
                    <button key={r} onClick={() => setRoleFilter(r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex-1 ${roleFilter === r ? 'bg-[#00bfa5] text-white shadow-lg' : theme.btnSecondary}`}>
                        {r === 'ALL' ? 'Semua' : r}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="w-7 h-7 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(u => (
                        <div key={u.id} className={`${theme.bgCard} p-4 flex items-center gap-3`}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00bfa5] to-emerald-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`font-bold text-sm truncate ${theme.textMain}`}>{u.name}</p>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleBg[u.role] ?? 'bg-gray-100 text-gray-500'}`}>{u.role}</span>
                                </div>
                                <p className={`text-xs truncate ${theme.textMuted}`}>{u.email}</p>
                                {u.tenant && <p className="text-xs text-blue-500 truncate">{u.tenant.name}</p>}
                            </div>
                            <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg bg-red-100 text-red-500 flex-shrink-0">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Tidak ada pengguna</p>
                        </div>
                    )}
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className={`${theme.bgFrame} rounded-2xl p-6 w-full max-w-sm text-center border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className={`font-bold ${theme.textMain}`}>Hapus User?</h3>
                        <p className={`text-sm mt-1 mb-4 ${theme.textMuted}`}>{deleteTarget.name} ({deleteTarget.email})</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className={`flex-1 py-3 rounded-xl ${theme.btnSecondary}`}>Batal</button>
                            <button onClick={handleDelete} disabled={processing} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50">
                                {processing ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
