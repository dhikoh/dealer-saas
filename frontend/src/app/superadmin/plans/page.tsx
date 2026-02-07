'use client';

import React from 'react';
import { Check, X, Crown, Zap, Rocket, Star } from 'lucide-react';

// Plan data matching backend config
const PLANS = [
    {
        id: 'DEMO',
        name: 'Demo',
        price: 0,
        priceLabel: 'Gratis',
        description: '14 hari uji coba',
        badge: 'Trial',
        badgeColor: 'bg-gray-100 text-gray-600',
        icon: Star,
        features: {
            maxVehicles: 5,
            maxUsers: 1,
            maxCustomers: 20,
            maxBranches: 1,
            pdfExport: true,
            internalReports: false,
            blacklistAccess: false,
            reminderNotifications: false,
            multiLanguage: false,
            prioritySupport: false,
            apiAccess: false,
            customBranding: false,
            advancedAnalytics: false,
            dataExport: false,
            whatsappIntegration: false,
        },
    },
    {
        id: 'BASIC',
        name: 'Basic',
        price: 299000,
        priceLabel: 'Rp 299.000',
        description: 'Untuk dealer kecil',
        badge: 'Starter',
        badgeColor: 'bg-blue-100 text-blue-700',
        icon: Zap,
        features: {
            maxVehicles: 50,
            maxUsers: 3,
            maxCustomers: 200,
            maxBranches: 1,
            pdfExport: true,
            internalReports: false,
            blacklistAccess: true,
            reminderNotifications: true,
            multiLanguage: false,
            prioritySupport: false,
            apiAccess: false,
            customBranding: false,
            advancedAnalytics: false,
            dataExport: true,
            whatsappIntegration: false,
        },
    },
    {
        id: 'PRO',
        name: 'Pro',
        price: 599000,
        priceLabel: 'Rp 599.000',
        description: 'Paling populer',
        badge: 'Popular',
        badgeColor: 'bg-indigo-100 text-indigo-700',
        icon: Rocket,
        recommended: true,
        features: {
            maxVehicles: 200,
            maxUsers: 10,
            maxCustomers: 1000,
            maxBranches: 3,
            pdfExport: true,
            internalReports: true,
            blacklistAccess: true,
            reminderNotifications: true,
            multiLanguage: true,
            prioritySupport: false,
            apiAccess: false,
            customBranding: false,
            advancedAnalytics: true,
            dataExport: true,
            whatsappIntegration: true,
        },
    },
    {
        id: 'UNLIMITED',
        name: 'Unlimited',
        price: 1499000,
        priceLabel: 'Rp 1.499.000',
        description: 'Enterprise',
        badge: 'Enterprise',
        badgeColor: 'bg-purple-100 text-purple-700',
        icon: Crown,
        features: {
            maxVehicles: -1,
            maxUsers: -1,
            maxCustomers: -1,
            maxBranches: -1,
            pdfExport: true,
            internalReports: true,
            blacklistAccess: true,
            reminderNotifications: true,
            multiLanguage: true,
            prioritySupport: true,
            apiAccess: true,
            customBranding: true,
            advancedAnalytics: true,
            dataExport: true,
            whatsappIntegration: true,
        },
    },
];

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

const formatLimit = (value: number) => {
    if (value === -1) return '∞';
    return value.toString();
};

export default function PlansPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Plan Tiers Management</h2>
                    <p className="text-sm text-slate-500">Kelola paket langganan dan fitur masing-masing tier</p>
                </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-white rounded-xl border-2 ${plan.recommended ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'} p-6 relative transition-all hover:shadow-lg`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                Rekomendasi
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-lg ${plan.badgeColor} flex items-center justify-center`}>
                                <plan.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{plan.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${plan.badgeColor}`}>{plan.badge}</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <span className="text-2xl font-bold text-slate-900">{plan.priceLabel}</span>
                            {plan.price > 0 && <span className="text-sm text-slate-500">/bulan</span>}
                        </div>

                        <p className="text-sm text-slate-600 mb-4">{plan.description}</p>

                        {/* Limits */}
                        <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
                            {['maxVehicles', 'maxUsers', 'maxCustomers', 'maxBranches'].map((key) => (
                                <div key={key} className="flex justify-between text-sm">
                                    <span className="text-slate-600">{FEATURE_LABELS[key]}</span>
                                    <span className="font-semibold text-slate-900">
                                        {formatLimit(plan.features[key as keyof typeof plan.features] as number)}
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
                ))}
            </div>

            {/* Feature Comparison Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-900">Perbandingan Fitur Lengkap</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-slate-600 font-medium">Fitur</th>
                                {PLANS.map((plan) => (
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
                                    {PLANS.map((plan) => {
                                        const value = plan.features[featureKey as keyof typeof plan.features];
                                        return (
                                            <td key={plan.id} className="px-6 py-3 text-center">
                                                {typeof value === 'boolean' ? (
                                                    value ? (
                                                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-slate-300 mx-auto" />
                                                    )
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
        </div>
    );
}
