'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, User, Shield, Mail, Phone, X, UserPlus, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Staff {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    branchId: string | null;
    createdAt: string;
}

import { API_URL } from '@/lib/api';

const ROLES = [
    { id: 'OWNER', name: 'Owner', desc: 'Akses penuh', color: 'purple' },
    { id: 'STAFF', name: 'Staff', desc: 'Akses terbatas', color: 'blue' },
];

export default function StaffPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'STAFF',
        password: '',
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/tenant/staff`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch staff');

            const data = await res.json();
            setStaff(data);
        } catch (err) {
            console.error('Error fetching staff:', err);
            toast.error('Gagal memuat data staff');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.email || (!editingStaff && !form.password)) {
            toast.error('Mohon lengkapi semua field yang wajib');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');

            if (editingStaff) {
                // Update existing staff
                const res = await fetch(`${API_URL}/tenant/staff/${editingStaff.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: form.name,
                        phone: form.phone || null,
                        role: form.role,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Gagal update staff');
                }

                toast.success('Staff berhasil diupdate');
            } else {
                // Create new staff
                const res = await fetch(`${API_URL}/tenant/staff`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: form.name,
                        email: form.email,
                        phone: form.phone || null,
                        role: form.role,
                        password: form.password,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Gagal menambah staff');
                }

                toast.success('Staff berhasil ditambahkan');
            }

            setShowModal(false);
            resetForm();
            fetchStaff();
        } catch (err: any) {
            toast.error(err.message || 'Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteTargetId(null);

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/tenant/staff/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Gagal menghapus staff');
            }

            toast.success('Staff berhasil dihapus');
            setStaff(staff.filter(s => s.id !== id));
        } catch (err: any) {
            toast.error(err.message || 'Gagal menghapus staff');
        }
    };

    const resetForm = () => {
        setForm({ name: '', email: '', phone: '', role: 'STAFF', password: '' });
        setEditingStaff(null);
    };

    const openEditModal = (staffMember: Staff) => {
        setEditingStaff(staffMember);
        setForm({
            name: staffMember.name,
            email: staffMember.email,
            phone: staffMember.phone || '',
            role: staffMember.role,
            password: '',
        });
        setShowModal(true);
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        const roleConfig = ROLES.find(r => r.id === role);
        const colors: Record<string, string> = {
            purple: 'bg-purple-100 text-purple-700',
            blue: 'bg-blue-100 text-blue-700',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[roleConfig?.color || 'blue']}`}>
                {roleConfig?.name || role}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Staff</h1>
                    <p className="text-gray-500 mt-1">Kelola tim sales dan akses pengguna</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-[#00bfa5] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#00a896] transition-colors shadow-lg"
                >
                    <UserPlus className="w-5 h-5" /> Tambah Staff
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                    <p className="text-sm text-gray-500">Total Staff</p>
                    <p className="text-2xl font-bold text-gray-800">{staff.length}</p>
                </div>
                <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                    <p className="text-sm text-gray-500">Owner</p>
                    <p className="text-2xl font-bold text-purple-600">{staff.filter(s => s.role === 'OWNER').length}</p>
                </div>
                <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                    <p className="text-sm text-gray-500">Staff</p>
                    <p className="text-2xl font-bold text-blue-600">{staff.filter(s => s.role === 'STAFF').length}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama atau email..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                />
            </div>

            {/* Staff List */}
            <div className="bg-[#ecf0f3] rounded-2xl shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50">
                        <tr className="text-left text-sm text-gray-500">
                            <th className="px-6 py-4">Staff</th>
                            <th className="px-6 py-4">Kontak</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Bergabung</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredStaff.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00bfa5] to-emerald-400 flex items-center justify-center text-white font-bold">
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-gray-800">{s.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-3.5 h-3.5" /> {s.email}
                                        </div>
                                        {s.phone && (
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Phone className="w-3.5 h-3.5" /> {s.phone}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getRoleBadge(s.role)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(s.createdAt).toLocaleDateString('id-ID')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openEditModal(s)}
                                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-[#00bfa5] transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTargetId(s.id)}
                                            className="p-2 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredStaff.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        Tidak ada staff ditemukan
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {editingStaff ? 'Edit Staff' : 'Tambah Staff Baru'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-200 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="email@contoh.com"
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">No. Telepon</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="08123456789"
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {ROLES.map((role) => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setForm({ ...form, role: role.id })}
                                            className={`p-3 rounded-xl border-2 transition-all ${form.role === role.id
                                                ? 'border-[#00bfa5] bg-[#00bfa5]/10'
                                                : 'border-transparent bg-white/50'
                                                }`}
                                        >
                                            <div className="font-medium text-gray-700">{role.name}</div>
                                            <div className="text-xs text-gray-500">{role.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {!editingStaff && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        placeholder="Minimal 6 karakter"
                                        className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                    />
                                </div>
                            )}
                            <button
                                onClick={handleSave}
                                className="w-full bg-[#00bfa5] text-white py-3 rounded-xl font-medium hover:bg-[#00a896] transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                {editingStaff ? 'Simpan Perubahan' : 'Tambah Staff'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Dialog */}
            {deleteTargetId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Hapus Staff?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Apakah Anda yakin ingin menghapus staff ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTargetId(null)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none">Batal</button>
                                <button onClick={() => handleDelete(deleteTargetId)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium shadow-lg hover:bg-red-600 transition-all">Ya, Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
