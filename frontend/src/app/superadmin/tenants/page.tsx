'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, MoreHorizontal, Eye, Power, PowerOff, ArrowUpCircle, Pencil, Trash2, X, Building2, Users, Car, ShoppingCart, Plus, CheckCircle, Calendar } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { sanitizePayload } from '@/lib/utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

import { Tenant } from '@/types/superadmin';
import { useAuthProtection } from '@/hooks/useAuthProtection';

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        TRIAL: 'bg-blue-100 text-blue-700 border-blue-200',
        SUSPENDED: 'bg-rose-100 text-rose-700 border-rose-200',
        CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
        EXPIRED: 'bg-amber-100 text-amber-700 border-amber-200',
        PENDING_PAYMENT: 'bg-amber-50 text-amber-600 border-amber-200',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.CANCELLED}`}>
            {status.replace('_', ' ')}
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
    const { user, loading: authLoading } = useAuthProtection('SUPERADMIN');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Create Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', slug: '', ownerName: '', ownerEmail: '', ownerPassword: '', planTier: 'DEMO', billingMonths: 1 });
    const [createLoading, setCreateLoading] = useState(false);

    // Edit Modal
    const [editTenant, setEditTenant] = useState<Tenant | null>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });
    const [editLoading, setEditLoading] = useState(false);

    // Direct Plan Change Modal
    const [planTenant, setPlanTenant] = useState<Tenant | null>(null);
    const [planForm, setPlanForm] = useState({ planTier: 'PRO', billingMonths: 1, immediate: true });
    const [planLoading, setPlanLoading] = useState(false);

    // Confirm Dialogs
    const [confirmAction, setConfirmAction] = useState<{
        type: 'suspend' | 'activate' | 'delete';
        tenant: Tenant;
    } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);



    const fetchTenants = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await fetchApi(`/superadmin/tenants?${params}`);

            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            // Handle if data is wrapped in { data: ... }
            const tenantsList = Array.isArray(data) ? data : (data.data || []);
            setTenants(tenantsList);
        } catch {
            setTenants([]);
        } finally {
            setDataLoading(false);
        }
    }, [statusFilter, search]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchTenants();
        }
    }, [authLoading, user, fetchTenants]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    // --- ACTIONS ---

    const handleCreate = async () => {
        setCreateLoading(true);
        try {
            // FIX: Backend DTO strict validation:
            // 1. Remove 'slug' (forbidden)
            // 2. Add 'email' (required by CreateTenantDto, using ownerEmail as default)
            const { slug, ...cleanForm } = createForm;
            const payload = {
                ...cleanForm,
                email: createForm.ownerEmail, // Backend requires 'email' for the tenant contact
            };

            const res = await fetchApi('/superadmin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Create failed');
            }
            showToast('Tenant berhasil dibuat', 'success');
            setShowCreateModal(false);
            setCreateForm({ name: '', slug: '', ownerName: '', ownerEmail: '', ownerPassword: '', planTier: 'DEMO', billingMonths: 1 });
            fetchTenants();
        } catch (e: any) {
            showToast(e.message, 'error');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleEditSave = async () => {
        if (!editTenant) return;
        setEditLoading(true);
        try {
            const res = await fetchApi(`/superadmin/tenants/${editTenant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitizePayload(editForm)),
            });
            if (!res.ok) throw new Error('Update failed');
            showToast('Tenant berhasil diupdate', 'success');
            setEditTenant(null);
            fetchTenants();
        } catch {
            showToast('Gagal mengupdate tenant', 'error');
        } finally {
            setEditLoading(false);
        }
    };

    const handlePlanChange = async () => {
        if (!planTenant) return;
        setPlanLoading(true);
        try {
            // FIX: Backend DTO strict validation:
            // Remove 'immediate' as it is forbidden in DirectPlanChangeDto
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { immediate, ...payload } = planForm;

            const res = await fetchApi(`/superadmin/tenants/${planTenant.id}/plan-direct`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sanitizePayload(payload)),
            });
            if (!res.ok) throw new Error('Plan change failed');
            showToast('Plan berhasil diubah', 'success');
            setPlanTenant(null);
            fetchTenants();
        } catch {
            showToast('Gagal mengubah plan', 'error');
        } finally {
            setPlanLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try {
            let url = '';
            let method = 'POST';

            if (confirmAction.type === 'suspend') url = `/superadmin/tenants/${confirmAction.tenant.id}/suspend`;
            if (confirmAction.type === 'activate') url = `/superadmin/tenants/${confirmAction.tenant.id}/activate`;
            if (confirmAction.type === 'delete') {
                url = `/superadmin/tenants/${confirmAction.tenant.id}`;
                method = 'DELETE';
            }

            const res = await fetchApi(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: confirmAction.type === 'suspend' ? JSON.stringify({ reason: 'Admin action' }) : undefined,
            });

            if (!res.ok) throw new Error('Action failed');
            showToast(`Aksi ${confirmAction.type} berhasil`, 'success');
            fetchTenants();
        } catch {
            showToast(`Gagal melakukan aksi ${confirmAction.type}`, 'error');
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const formatDate = (date: string | null | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (authLoading || dataLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* TOAST */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all animate-in fade-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
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
                            <option value="EXPIRED">Expired</option>
                        </select>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Tenant Baru
                        </button>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4">Billing</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors group">
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
                                        <div className="flex flex-col">
                                            <span>{formatCurrency(tenant.monthlyBill)}/bln</span>
                                            <span className="text-[10px] text-slate-400">Next: {formatDate(tenant.nextBillingDate)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={() => setActionMenuId(actionMenuId === tenant.id ? null : tenant.id)}
                                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>

                                        {actionMenuId === tenant.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-0"
                                                    onClick={() => setActionMenuId(null)}
                                                />
                                                <div className="absolute right-6 top-10 bg-white border border-slate-200 rounded-lg shadow-xl z-10 py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
                                                    <button
                                                        onClick={() => { setSelectedTenant(tenant); setActionMenuId(null); }}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Eye className="w-4 h-4" /> View Details
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditTenant(tenant);
                                                            setEditForm({ name: tenant.name, email: tenant.email || '', phone: tenant.phone || '', address: tenant.address || '' });
                                                            setActionMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                    >
                                                        <Pencil className="w-4 h-4" /> Edit Profile
                                                    </button>
                                                    <button
                                                        onClick={() => { setPlanTenant(tenant); setActionMenuId(null); }}
                                                        className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                                                    >
                                                        <ArrowUpCircle className="w-4 h-4" /> Change Plan
                                                    </button>

                                                    <div className="border-t border-slate-100 my-1" />

                                                    {tenant.subscriptionStatus !== 'SUSPENDED' ? (
                                                        <button
                                                            onClick={() => { setConfirmAction({ type: 'suspend', tenant }); setActionMenuId(null); }}
                                                            className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                                        >
                                                            <PowerOff className="w-4 h-4" /> Suspend
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setConfirmAction({ type: 'activate', tenant }); setActionMenuId(null); }}
                                                            className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                                        >
                                                            <Power className="w-4 h-4" /> Activate
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { setConfirmAction({ type: 'delete', tenant }); setActionMenuId(null); }}
                                                        className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Hapus Tenant
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {tenants.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Tidak ada tenant ditemukan</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900">Buat Tenant Baru</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Dealer</label>
                                <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Contoh: Jaya Motor" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                                <input type="text" value={createForm.slug} onChange={e => setCreateForm({ ...createForm, slug: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="jaya-motor" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Owner</label>
                                    <input type="text" value={createForm.ownerName} onChange={e => setCreateForm({ ...createForm, ownerName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Plan Tier</label>
                                    <select value={createForm.planTier} onChange={e => setCreateForm({ ...createForm, planTier: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                        <option value="DEMO">DEMO</option>
                                        <option value="BASIC">BASIC</option>
                                        <option value="PRO">PRO</option>
                                        <option value="UNLIMITED">UNLIMITED</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Owner</label>
                                <input type="email" value={createForm.ownerEmail} onChange={e => setCreateForm({ ...createForm, ownerEmail: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input type="password" value={createForm.ownerPassword} onChange={e => setCreateForm({ ...createForm, ownerPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleCreate} disabled={createLoading}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {createLoading ? 'Memproses...' : 'Buat Tenant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT TENANT MODAL */}
            {editTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 text-lg font-bold">Edit Profile Tenant</div>
                        <div className="p-6 space-y-4">
                            <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full p-2 border rounded" placeholder="Nama" />
                            <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full p-2 border rounded" placeholder="Email" />
                            <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full p-2 border rounded" placeholder="Telepon" />
                            <textarea value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full p-2 border rounded" placeholder="Alamat" />
                        </div>
                        <div className="p-6 border-t flex justify-end gap-2">
                            <button onClick={() => setEditTenant(null)} className="px-4 py-2 bg-slate-100 rounded">Batal</button>
                            <button onClick={handleEditSave} disabled={editLoading} className="px-4 py-2 bg-indigo-600 text-white rounded">{editLoading ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CHANGE PLAN MODAL */}
            {planTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">Ubah Plan Langganan</h3>
                            <p className="text-sm text-slate-500 mt-1">Ubah plan untuk <strong>{planTenant.name}</strong></p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-amber-50 p-3 rounded-lg flex gap-2 text-xs text-amber-700">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <p>Perubahan plan ini akan langsung aktif tanpa perlu konfirmasi pembayaran (Direct Change).</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Target Plan</label>
                                <select value={planForm.planTier} onChange={e => setPlanForm({ ...planForm, planTier: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                                    {['DEMO', 'BASIC', 'PRO', 'UNLIMITED'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Durasi Tambahan (Bulan)</label>
                                <input type="number" min="1" max="12" value={planForm.billingMonths} onChange={e => setPlanForm({ ...planForm, billingMonths: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="immediate" checked={planForm.immediate} onChange={e => setPlanForm({ ...planForm, immediate: e.target.checked })} />
                                <label htmlFor="immediate" className="text-sm text-slate-700">Aktifkan Sekarang</label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                            <button onClick={() => setPlanTenant(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handlePlanChange} disabled={planLoading}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {planLoading ? 'Memproses...' : 'Ubah Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM DIALOGS */}
            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirmAction}
                title={confirmAction?.type === 'suspend' ? 'Suspend Tenant?' : confirmAction?.type === 'activate' ? 'Aktifkan Tenant?' : 'Hapus Tenant?'}
                message={confirmAction?.type === 'delete'
                    ? `Apakah yakin ingin menghapus ${confirmAction?.tenant.name}?`
                    : `Konfirmasi tindakan ${confirmAction?.type} untuk ${confirmAction?.tenant.name}?`
                }
                variant={confirmAction?.type === 'activate' ? 'success' : 'danger'}
                isLoading={actionLoading}
            />

            {/* DETAILS MODAL */}
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

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Subscription Info
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="text-slate-500">Start Date</p><p>{formatDate(selectedTenant.subscriptionStartedAt || selectedTenant.createdAt)}</p></div>
                                    <div><p className="text-slate-500">End Date</p><p>{formatDate(selectedTenant.subscriptionEndsAt)}</p></div>
                                    <div><p className="text-slate-500">Trial Ends</p><p>{formatDate(selectedTenant.trialEndsAt)}</p></div>
                                    <div><p className="text-slate-500">Next Billing</p><p className="font-bold text-indigo-600">{formatDate(selectedTenant.nextBillingDate)}</p></div>
                                </div>
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UsageStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-100">
            <div className="text-slate-400 flex justify-center mb-1">{icon}</div>
            <p className="text-lg font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
        </div>
    );
}
