'use client';

import React, { useEffect, useState } from 'react';
import { Check, X, Crown, Zap, Rocket, Star, Pencil, Save } from 'lucide-react';
import { fetchApi } from '@/lib/api';

import ConfirmDialog from '@/components/ui/ConfirmDialog';

import { Plan, PlanFeatures } from '@/types/superadmin';

// Mapping local usage to shared type if needed, or just using shared type directly. 
// The shared Plan type has `features: string[]` but the page uses an object. 
// I need to update the Plan type in shared types to match this page first if I want to use it here without breaking changes.
// Wait, I saw I updated Plan type in previous turn but I might have made it `features: string[]` which contradicts to `PlanFeatures` object here.
// Let me check shared type again.

const ICONS: Record<string, any> = { DEMO: Star, BASIC: Zap, PRO: Rocket, UNLIMITED: Crown };
const BADGE_COLORS: Record<string, string> = {
    DEMO: 'bg-gray-100 text-gray-600',
    BASIC: 'bg-blue-100 text-blue-700',
    PRO: 'bg-indigo-100 text-indigo-700',
    UNLIMITED: 'bg-purple-100 text-purple-700',
};

const FEATURE_LABELS: Record<string, string> = {
    maxVehicles: 'Kendaraan',
    maxUsers: 'User/Staff',
    maxCustomers: 'Customer',
    maxBranches: 'Cabang',
    pdfExport: 'Export PDF',
    internalReports: 'Laporan Internal',
    blacklistAccess: 'Akses Blacklist',
    reminderNotifications: 'Notifikasi Pengingat',
    multiLanguage: 'Multi Bahasa',
    prioritySupport: 'Support Prioritas',
    apiAccess: 'Akses API',
    customBranding: 'Custom Branding',
    advancedAnalytics: 'Analitik Lanjutan',
    dataExport: 'Export Data',
    whatsappIntegration: 'Integrasi WhatsApp',
};

const formatLimit = (value: number) => value === -1 ? '∞' : value.toString();

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editPlan, setEditPlan] = useState<Plan | null>(null);
    const [editForm, setEditForm] = useState<Partial<Plan> | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmSave, setConfirmSave] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);



    const fetchPlans = async () => {
        try {
            const res = await fetchApi('/superadmin/plans');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setPlans(data);
        } catch {
            // Fallback to static plans
            setPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (plan: Plan) => {
        setEditPlan(plan);
        setEditForm({
            name: plan.name,
            price: plan.price,
            priceLabel: plan.priceLabel,
            description: plan.description,
            descriptionId: plan.descriptionId,
            trialDays: plan.trialDays,
            yearlyDiscount: plan.yearlyDiscount,
            features: { ...plan.features },
        });
    };

    const handleSave = async () => {
        if (!editPlan || !editForm) return;
        setConfirmSave(false); // Close confirm dialog immediately
        setSaving(true);
        try {
            // Sanitize payload: Remove fields not allowed by backend DTO
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { priceLabel, descriptionId, ...payload } = editForm as any;

            const res = await fetchApi(`/superadmin/plans/${editPlan.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Update failed');
            setToast({ message: `Plan ${editPlan.name} berhasil diupdate`, type: 'success' });
            setEditPlan(null);
            fetchPlans();
        } catch {
            setToast({ message: 'Gagal mengupdate plan', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const updateFeature = (key: string, value: number | boolean) => {
        setEditForm((prev) => {
            if (!prev || !prev.features) return prev;
            return {
                ...prev,
                features: { ...prev.features, [key]: value },
            };
        });
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading plans...</div>;
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Plan Tiers Management</h2>
                    <p className="text-sm text-slate-500">Kelola paket langganan dan fitur masing-masing tier</p>
                </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const Icon = ICONS[plan.id] || Star;
                    const badgeColor = BADGE_COLORS[plan.id] || BADGE_COLORS.DEMO;
                    return (
                        <div
                            key={plan.id}
                            className={`bg-white rounded-xl border-2 ${plan.recommended ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'} p-6 relative transition-all hover:shadow-lg`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                    Rekomendasi
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg ${badgeColor} flex items-center justify-center`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{plan.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>{plan.badge}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openEdit(plan)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit Plan"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <span className="text-2xl font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                                {plan.price > 0 && <span className="text-sm text-slate-500">/bulan</span>}
                            </div>

                            <p className="text-sm text-slate-600 mb-4">{plan.descriptionId || plan.description}</p>

                            {/* Limits */}
                            <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
                                {['maxVehicles', 'maxUsers', 'maxCustomers', 'maxBranches'].map((key) => (
                                    <div key={key} className="flex justify-between text-sm">
                                        <span className="text-slate-600">{FEATURE_LABELS[key]}</span>
                                        <span className="font-semibold text-slate-900">
                                            {formatLimit(plan.features[key as keyof PlanFeatures] as number)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Boolean Features */}
                            <div className="space-y-2">
                                {Object.entries(plan.features)
                                    .filter(([key]) => !key.startsWith('max'))
                                    .map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2 text-sm">
                                            {value ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <X className="w-4 h-4 text-slate-300" />
                                            )}
                                            <span className={value ? 'text-slate-700' : 'text-slate-400'}>
                                                {FEATURE_LABELS[key]}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feature Comparison Table */}
            {plans.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                        <h3 className="text-lg font-semibold text-slate-900">Perbandingan Fitur Lengkap</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-slate-600 font-medium">Fitur</th>
                                    {plans.map((plan) => (
                                        <th key={plan.id} className="px-6 py-4 text-center font-semibold text-slate-900">
                                            {plan.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.keys(FEATURE_LABELS).map((featureKey) => (
                                    <tr key={featureKey} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 text-slate-700">{FEATURE_LABELS[featureKey]}</td>
                                        {plans.map((plan) => {
                                            const value = plan.features[featureKey as keyof PlanFeatures];
                                            return (
                                                <td key={plan.id} className="px-6 py-3 text-center">
                                                    {typeof value === 'boolean' ? (
                                                        value ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                                                    ) : (
                                                        <span className="font-semibold text-slate-900">{formatLimit(value)}</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* EDIT PLAN MODAL */}
            {editPlan && editForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditPlan(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-slate-900">Edit Plan: {editPlan.name}</h3>
                            <button onClick={() => setEditPlan(null)} className="p-1 hover:bg-slate-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Plan</label>
                                    <input type="text" value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga (IDR)</label>
                                    <input type="number" value={editForm.price}
                                        onChange={e => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Label Harga</label>
                                    <input type="text" value={editForm.priceLabel}
                                        onChange={e => setEditForm({ ...editForm, priceLabel: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Diskon Tahunan (%)</label>
                                    <input type="number" value={editForm.yearlyDiscount}
                                        onChange={e => setEditForm({ ...editForm, yearlyDiscount: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                                <input type="text" value={editForm.descriptionId}
                                    onChange={e => setEditForm({ ...editForm, descriptionId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>

                            {/* Limits */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-800 mb-3">Batas Kuota</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {editForm.features && ['maxVehicles', 'maxUsers', 'maxCustomers', 'maxBranches'].map(key => (
                                        <div key={key}>
                                            <label className="block text-xs text-slate-500 mb-1">{FEATURE_LABELS[key as keyof PlanFeatures]} <span className="text-slate-400">(-1 = unlimited)</span></label>
                                            <input type="number"
                                                value={(editForm.features as PlanFeatures)?.[key as keyof PlanFeatures] as number ?? 0}
                                                onChange={e => updateFeature(key, parseInt(e.target.value))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Boolean Features */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-800 mb-3">Fitur</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {editForm.features && Object.entries(editForm.features)
                                        .filter(([key]) => !key.startsWith('max'))
                                        .map(([key, value]) => (
                                            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={value as boolean}
                                                    onChange={e => updateFeature(key, e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-slate-700">{FEATURE_LABELS[key]}</span>
                                            </label>
                                        ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2 sticky bottom-0 bg-white">
                            <button onClick={() => setEditPlan(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                                Batal
                            </button>
                            <button onClick={() => setConfirmSave(true)} disabled={saving}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM DIALOG */}
            <ConfirmDialog
                isOpen={confirmSave}
                onClose={() => setConfirmSave(false)}
                onConfirm={handleSave}
                title="Simpan Perubahan Plan?"
                message={`Anda akan mengubah konfigurasi plan ${editPlan?.name || ''}. Perubahan ini akan berlaku untuk tenant baru yang mendaftar.`}
                confirmText="Ya, Simpan"
                isLoading={saving}
            />
        </div>
    );
}
