'use client';

import React, { useEffect, useState } from 'react';
import { Search, MoreHorizontal, Eye, Power, PowerOff, ArrowUpCircle, Pencil, Trash2, X, Building2, Users, Car, ShoppingCart, AlertTriangle } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    planTier: string;
    planDetails: any;
    subscriptionStatus: string;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    monthlyBill: number;
    autoRenew: boolean;
    usage: {
        users: number;
        vehicles: number;
        customers: number;
        transactions: number;
    };
    createdAt: string;
}

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        TRIAL: 'bg-blue-100 text-blue-700 border-blue-200',
        SUSPENDED: 'bg-rose-100 text-rose-700 border-rose-200',
        CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
        EXPIRED: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.CANCELLED}`}>
            {status}
        </span>
    );
};

const PlanBadge = ({ plan }: { plan: string }) => {
    const styles: Record<string, string> = {
        DEMO: 'bg-slate-100 text-slate-600',
        BASIC: 'bg-blue-100 text-blue-700',
        PRO: 'bg-indigo-100 text-indigo-700',
        ENTERPRISE: 'bg-purple-100 text-purple-700',
        UNLIMITED: 'bg-purple-100 text-purple-700',
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[plan] || styles.DEMO}`}>
            {plan}
        </span>
    );
};

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Edit modal state
    const [editTenant, setEditTenant] = useState<Tenant | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '', planTier: '' });
    const [editLoading, setEditLoading] = useState(false);

    // Delete modal state
    const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Upgrade modal state
    const [upgradeTenant, setUpgradeTenant] = useState<Tenant | null>(null);
    const [upgradeTarget, setUpgradeTarget] = useState('PRO');
    const [upgradeLoading, setUpgradeLoading] = useState(false);

    useEffect(() => {
        fetchTenants();
    }, [statusFilter]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const getToken = () => localStorage.getItem('access_token');

    const fetchTenants = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await fetch(`${API_URL}/superadmin/tenants?${params}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` },
            });

            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTenants(data);
        } catch {
            setTenants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (tenantId: string) => {
        try {
            const res = await fetch(`${API_URL}/superadmin/tenants/${tenantId}/suspend`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Admin action' }),
            });
            if (!res.ok) throw new Error('Suspend failed');
            setToast({ message: 'Tenant berhasil di-suspend', type: 'success' });
            fetchTenants();
        } catch {
            setToast({ message: 'Gagal suspend tenant', type: 'error' });
        }
        setActionMenuId(null);
    };

    const handleActivate = async (tenantId: string) => {
        try {
            const res = await fetch(`${API_URL}/superadmin/tenants/${tenantId}/activate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('Activate failed');
            setToast({ message: 'Tenant berhasil diaktifkan', type: 'success' });
            fetchTenants();
        } catch {
            setToast({ message: 'Gagal mengaktifkan tenant', type: 'error' });
        }
        setActionMenuId(null);
    };

    const handleUpgrade = async () => {
        if (!upgradeTenant) return;
        setUpgradeLoading(true);
        try {
            const res = await fetch(`${API_URL}/superadmin/tenants/${upgradeTenant.id}/upgrade`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ planTier: upgradeTarget }),
            });
            if (!res.ok) throw new Error('Upgrade failed');
            setToast({ message: `Plan berhasil di-upgrade ke ${upgradeTarget}`, type: 'success' });
            setUpgradeTenant(null);
            fetchTenants();
        } catch {
            setToast({ message: 'Gagal upgrade plan', type: 'error' });
        } finally {
            setUpgradeLoading(false);
        }
    };

    const openEditModal = (tenant: Tenant) => {
        setEditTenant(tenant);
        setEditForm({
            name: tenant.name,
            email: tenant.email || '',
            phone: tenant.phone || '',
            address: tenant.address || '',
            planTier: tenant.planTier,
        });
        setActionMenuId(null);
    };

    const handleEditSave = async () => {
        if (!editTenant) return;
        setEditLoading(true);
        try {
            const res = await fetch(`${API_URL}/superadmin/tenants/${editTenant.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error('Update failed');
            setToast({ message: 'Tenant berhasil diupdate', type: 'success' });
            setEditTenant(null);
            fetchTenants();
        } catch {
            setToast({ message: 'Gagal mengupdate tenant', type: 'error' });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTenant) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`${API_URL}/superadmin/tenants/${deleteTenant.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error('Delete failed');
            setToast({ message: 'Tenant berhasil dihapus', type: 'success' });
            setDeleteTenant(null);
            fetchTenants();
        } catch {
            setToast({ message: 'Gagal menghapus tenant', type: 'error' });
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading tenants...</div>;
    }

    return (
        <div className="space-y-6">
            {/* TOAST */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {toast.message}
                </div>
            )}

            {/* HEADER */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Tenant Management</h2>
                        <p className="text-sm text-slate-500">Kelola semua dealer yang terdaftar</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari tenant..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchTenants()}
                                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-64"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Semua Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="TRIAL">Trial</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4">Monthly Bill</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{tenant.name}</div>
                                        <div className="text-xs text-slate-500">{tenant.email || tenant.slug}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <PlanBadge plan={tenant.planTier} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={tenant.subscriptionStatus} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3 text-xs text-slate-600">
                                            <span title="Users"><Users className="w-3 h-3 inline mr-1" />{tenant.usage.users}</span>
                                            <span title="Vehicles"><Car className="w-3 h-3 inline mr-1" />{tenant.usage.vehicles}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {formatCurrency(tenant.monthlyBill)}
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={() => setActionMenuId(actionMenuId === tenant.id ? null : tenant.id)}
                                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        {actionMenuId === tenant.id && (
                                            <div className="absolute right-6 top-12 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 min-w-[180px]">
                                                <button
                                                    onClick={() => { setSelectedTenant(tenant); setActionMenuId(null); }}
                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Eye className="w-4 h-4" /> View Details
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(tenant)}
                                                    className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                >
                                                    <Pencil className="w-4 h-4" /> Edit Tenant
                                                </button>
                                                {tenant.subscriptionStatus !== 'SUSPENDED' ? (
                                                    <button
                                                        onClick={() => handleSuspend(tenant.id)}
                                                        className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                                    >
                                                        <PowerOff className="w-4 h-4" /> Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivate(tenant.id)}
                                                        className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                                    >
                                                        <Power className="w-4 h-4" /> Activate
                                                    </button>
                                                )}
                                                {tenant.planTier !== 'UNLIMITED' && (
                                                    <button
                                                        onClick={() => { setUpgradeTenant(tenant); setActionMenuId(null); }}
                                                        className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                                                    >
                                                        <ArrowUpCircle className="w-4 h-4" /> Upgrade Plan
                                                    </button>
                                                )}
                                                <div className="border-t border-slate-100 my-1" />
                                                <button
                                                    onClick={() => { setDeleteTenant(tenant); setActionMenuId(null); }}
                                                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Hapus Tenant
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredTenants.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Tidak ada tenant</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VIEW DETAILS MODAL */}
            {selectedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTenant(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900">{selectedTenant.name}</h3>
                            <button onClick={() => setSelectedTenant(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-slate-500">Email</p><p className="font-medium">{selectedTenant.email || '-'}</p></div>
                                <div><p className="text-xs text-slate-500">Phone</p><p className="font-medium">{selectedTenant.phone || '-'}</p></div>
                                <div><p className="text-xs text-slate-500">Plan</p><PlanBadge plan={selectedTenant.planTier} /></div>
                                <div><p className="text-xs text-slate-500">Status</p><StatusBadge status={selectedTenant.subscriptionStatus} /></div>
                                <div><p className="text-xs text-slate-500">Alamat</p><p className="font-medium">{selectedTenant.address || '-'}</p></div>
                                <div><p className="text-xs text-slate-500">Slug</p><p className="font-medium font-mono text-sm">{selectedTenant.slug}</p></div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Usage Statistics</h4>
                                <div className="grid grid-cols-4 gap-3">
                                    <UsageStat icon={<Users className="w-4 h-4" />} label="Users" value={selectedTenant.usage.users} />
                                    <UsageStat icon={<Car className="w-4 h-4" />} label="Vehicles" value={selectedTenant.usage.vehicles} />
                                    <UsageStat icon={<Building2 className="w-4 h-4" />} label="Customers" value={selectedTenant.usage.customers} />
                                    <UsageStat icon={<ShoppingCart className="w-4 h-4" />} label="Transactions" value={selectedTenant.usage.transactions} />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Billing</h4>
                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Monthly Bill</span>
                                        <span className="font-bold text-lg">{formatCurrency(selectedTenant.monthlyBill)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-sm">
                                        <span className="text-slate-500">Auto-renew</span>
                                        <span className={selectedTenant.autoRenew ? 'text-emerald-600' : 'text-slate-400'}>
                                            {selectedTenant.autoRenew ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT TENANT MODAL */}
            {editTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditTenant(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900">Edit Tenant</h3>
                            <button onClick={() => setEditTenant(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Dealer</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label>
                                    <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Plan Tier</label>
                                    <select value={editForm.planTier} onChange={e => setEditForm({ ...editForm, planTier: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="DEMO">DEMO</option>
                                        <option value="BASIC">BASIC</option>
                                        <option value="PRO">PRO</option>
                                        <option value="UNLIMITED">UNLIMITED</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                                <textarea value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                    rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                            <button onClick={() => setEditTenant(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleEditSave} disabled={editLoading}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {editLoading ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UPGRADE PLAN MODAL */}
            {upgradeTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setUpgradeTenant(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">Upgrade Plan</h3>
                            <p className="text-sm text-slate-500 mt-1">Upgrade plan untuk <strong>{upgradeTenant.name}</strong></p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-slate-50 rounded-lg text-sm">
                                <span className="text-slate-500">Plan saat ini:</span>
                                <span className="ml-2 font-semibold">{upgradeTenant.planTier}</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Target Plan</label>
                                <select value={upgradeTarget} onChange={e => setUpgradeTarget(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {['BASIC', 'PRO', 'UNLIMITED'].filter(p => p !== upgradeTenant.planTier).map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                            <button onClick={() => setUpgradeTenant(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleUpgrade} disabled={upgradeLoading}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {upgradeLoading ? 'Processing...' : 'Upgrade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteTenant(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Hapus Tenant?</h3>
                            <p className="text-sm text-slate-500">
                                Apakah Anda yakin ingin menghapus <strong>{deleteTenant.name}</strong>?
                                Tenant akan di-nonaktifkan dan tidak bisa login lagi. Data tidak dihapus permanen.
                            </p>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-center gap-3">
                            <button onClick={() => setDeleteTenant(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleDelete} disabled={deleteLoading}
                                className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50">
                                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UsageStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="bg-slate-50 p-3 rounded-lg text-center">
            <div className="text-slate-400 flex justify-center mb-1">{icon}</div>
            <p className="text-lg font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    );
}
