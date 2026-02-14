'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Search, Trash2, Shield, User, Building2,
    MoreVertical, AlertTriangle, Loader2
} from 'lucide-react';
import { API_URL } from '@/lib/api';

import { SuperadminUser } from '@/types/superadmin';

export default function SuperadminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<SuperadminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<SuperadminUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [activeTab, setActiveTab] = useState<'all' | 'tenant' | 'ghost'>('all');

    // Reset page when tab changes
    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);

            // Tab Filters
            if (activeTab === 'tenant') params.append('hasTenant', 'true');
            if (activeTab === 'ghost') params.append('hasTenant', 'false');

            const res = await fetch(`${API_URL}/superadmin/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch users');

            const data = await res.json();
            setUsers(data.data); // Directly set users, filtering is done on backend
            setTotalPages(data.pagination.totalPages);
        } catch (error) {
            toast.error('Gagal memuat data user');
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter, activeTab]); // Added activeTab dependency

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/superadmin/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Gagal menghapus user');
            }

            toast.success('User berhasil dihapus permanent');
            setDeleteModalOpen(false);
            setUserToDelete(null);
            fetchUsers(); // Refresh list
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'SUPERADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'OWNER': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'ADMIN_STAFF': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage global users. Clean up ghost users who don't belong to any tenant.</p>
                </div>
            </div>

            {/* TABS & FILTERS */}
            <div className="flex flex-col gap-4">
                {/* TABS */}
                <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'all'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        All Users
                    </button>
                    <button
                        onClick={() => setActiveTab('tenant')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'tenant'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Tenant Users
                    </button>
                    <button
                        onClick={() => setActiveTab('ghost')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'ghost'
                            ? 'bg-white text-rose-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Ghost Users
                    </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari nama, email, username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">Semua Role</option>
                        <option value="OWNER">Owner</option>
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN_STAFF">Admin Staff</option>
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase font-semibold">
                                <th className="p-4">User Info</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Tenant / Dealership</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-500" />
                                        <p>Memuat data user...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        {'Data tidak ditemukan.'}
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                    {user.username && <p className="text-[10px] text-slate-400">@{user.username}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.tenantId ? (
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <Building2 className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium">{user.tenantName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> No Tenant
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {user.isVerified ? 'Verified' : 'Unverified'}
                                                </span>
                                                {user.deletedAt && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                                                        Deleted
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setUserToDelete(user);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {!loading && users.length > 0 && (
                    <div className="p-4 border-t border-slate-200 flex justify-between items-center">
                        <p className="text-sm text-slate-500">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DELETE MODAL */}
            {deleteModalOpen && userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-rose-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus User Ini?</h3>
                            <p className="text-slate-600 mb-6">
                                Anda akan menghapus user <strong>{userToDelete.name}</strong> ({userToDelete.email}).
                                <br />
                                <span className="text-rose-600 text-sm font-semibold mt-2 block">
                                    Tindakan ini permanen dan tidak dapat dibatalkan.
                                </span>
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                    disabled={isDeleting}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-medium shadow-lg shadow-rose-200 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-300 transition-all flex items-center gap-2"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Menghapus...
                                        </>
                                    ) : (
                                        'Ya, Hapus Permanen'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
