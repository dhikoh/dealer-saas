'use client';

import React, { useEffect, useState } from 'react';
import { Search, MoreHorizontal, Eye, Power, PowerOff, ArrowUpCircle, X, Building2, Users, Car, ShoppingCart } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
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

    useEffect(() => {
        fetchTenants();
    }, [statusFilter]);

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/superadmin/tenants?${params}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTenants(data);
        } catch (err) {
            setTenants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (tenantId: string, action: 'suspend' | 'activate' | 'upgrade') => {
        try {
            const token = localStorage.getItem('access_token');
            const endpoint = action === 'upgrade'
                ? `/superadmin/tenants/${tenantId}/upgrade`
                : `/superadmin/tenants/${tenantId}/${action}`;

            const body = action === 'upgrade' ? { planTier: 'PRO' } : { reason: 'Admin action' };

            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            fetchTenants();
            setActionMenuId(null);
        } catch (err) {
            console.error('Action failed:', err);
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
                                            <div className="absolute right-6 top-12 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
                                                <button
                                                    onClick={() => setSelectedTenant(tenant)}
                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Eye className="w-4 h-4" /> View Details
                                                </button>
                                                {tenant.subscriptionStatus !== 'SUSPENDED' ? (
                                                    <button
                                                        onClick={() => handleAction(tenant.id, 'suspend')}
                                                        className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                    >
                                                        <PowerOff className="w-4 h-4" /> Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAction(tenant.id, 'activate')}
                                                        className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                                    >
                                                        <Power className="w-4 h-4" /> Activate
                                                    </button>
                                                )}
                                                {tenant.planTier !== 'UNLIMITED' && (
                                                    <button
                                                        onClick={() => handleAction(tenant.id, 'upgrade')}
                                                        className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                                                    >
                                                        <ArrowUpCircle className="w-4 h-4" /> Upgrade Plan
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TENANT DETAIL MODAL */}
            {selectedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900">{selectedTenant.name}</h3>
                            <button onClick={() => setSelectedTenant(null)} className="p-1 hover:bg-slate-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Info Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="font-medium">{selectedTenant.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Phone</p>
                                    <p className="font-medium">{selectedTenant.phone || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Plan</p>
                                    <PlanBadge plan={selectedTenant.planTier} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Status</p>
                                    <StatusBadge status={selectedTenant.subscriptionStatus} />
                                </div>
                            </div>

                            {/* Usage Stats */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Usage Statistics</h4>
                                <div className="grid grid-cols-4 gap-3">
                                    <UsageStat icon={<Users className="w-4 h-4" />} label="Users" value={selectedTenant.usage.users} />
                                    <UsageStat icon={<Car className="w-4 h-4" />} label="Vehicles" value={selectedTenant.usage.vehicles} />
                                    <UsageStat icon={<Building2 className="w-4 h-4" />} label="Customers" value={selectedTenant.usage.customers} />
                                    <UsageStat icon={<ShoppingCart className="w-4 h-4" />} label="Transactions" value={selectedTenant.usage.transactions} />
                                </div>
                            </div>

                            {/* Billing */}
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
