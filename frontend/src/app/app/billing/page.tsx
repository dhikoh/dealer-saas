'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Check, X, AlertCircle, Upload, Clock, Crown, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

interface TenantProfile {
    planTier: string;
    planDetails: any;
    subscriptionStatus: string;
    trialEndsAt: string | null;
    trialDaysRemaining: number;
    subscriptionEndsAt: string | null;
    monthlyBill: number;
    usage: {
        users: number;
        vehicles: number;
        customers: number;
    };
    limits: {
        maxUsers: number;
        maxVehicles: number;
        maxCustomers: number;
    } | null;
}

interface Plan {
    id: string;
    name: string;
    nameId: string;
    description: string;
    descriptionId: string;
    price: number;
    priceLabel: string;
    features: any;
    badge: string;
    badgeColor: string;
    recommended: boolean;
    isCurrent: boolean;
    canUpgrade: boolean;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    date: string;
    dueDate: string;
    status: string;
    paymentProof: string | null;
}

export default function BillingPage() {
    const [profile, setProfile] = useState<TenantProfile | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

            const [profileRes, plansRes, invoicesRes] = await Promise.all([
                fetch(`${baseUrl}/tenant/profile`, { headers }),
                fetch(`${baseUrl}/tenant/plans`, { headers }),
                fetch(`${baseUrl}/tenant/invoices`, { headers }),
            ]);

            if (profileRes.ok) setProfile(await profileRes.json());
            if (plansRes.ok) setPlans(await plansRes.json());
            if (invoicesRes.ok) setInvoices(await invoicesRes.json());
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        setUpgrading(true);
        setSelectedPlan(planId);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/tenant/upgrade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planTier: planId }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Invoice ${data.invoice.invoiceNumber} telah dibuat. Silakan lakukan pembayaran.`);
                fetchData();
            } else {
                toast.error('Gagal membuat invoice. Silakan coba lagi.');
            }
        } catch (err) {
            toast.error('Gagal membuat invoice. Silakan coba lagi.');
        } finally {
            setUpgrading(false);
            setSelectedPlan(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const getPlanIcon = (planId: string) => {
        switch (planId) {
            case 'DEMO': return <Clock className="w-6 h-6" />;
            case 'BASIC': return <Zap className="w-6 h-6" />;
            case 'PRO': return <Star className="w-6 h-6" />;
            case 'UNLIMITED': return <Crown className="w-6 h-6" />;
            default: return <CreditCard className="w-6 h-6" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Langganan & Billing</h1>
                <p className="text-gray-500 mt-1">Kelola paket langganan dan tagihan Anda</p>
            </div>

            {/* Current Plan Status */}
            <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${profile?.subscriptionStatus === 'TRIAL' ? 'bg-blue-100 text-blue-600' :
                            profile?.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-amber-100 text-amber-600'
                            }`}>
                            {getPlanIcon(profile?.planTier || 'DEMO')}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                Paket {profile?.planDetails?.name || profile?.planTier}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${profile?.subscriptionStatus === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
                                    profile?.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {profile?.subscriptionStatus}
                                </span>
                                {profile?.subscriptionStatus === 'TRIAL' && profile.trialDaysRemaining !== undefined && (
                                    <span className="text-sm text-gray-500">
                                        {profile.trialDaysRemaining > 0
                                            ? `Sisa ${profile.trialDaysRemaining} hari trial`
                                            : 'Trial berakhir'
                                        }
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">
                            {profile?.monthlyBill ? formatCurrency(profile.monthlyBill) : 'Gratis'}
                        </p>
                        <p className="text-sm text-gray-500">/bulan</p>
                    </div>
                </div>

                {/* Usage Bar */}
                {profile?.limits && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <UsageBar
                            label="Kendaraan"
                            used={profile.usage.vehicles}
                            limit={profile.limits.maxVehicles}
                        />
                        <UsageBar
                            label="User/Staff"
                            used={profile.usage.users}
                            limit={profile.limits.maxUsers}
                        />
                        <UsageBar
                            label="Customer"
                            used={profile.usage.customers}
                            limit={profile.limits.maxCustomers}
                        />
                    </div>
                )}
            </div>

            {/* Plan Comparison */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pilih Paket</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] relative transition-all ${plan.isCurrent ? 'ring-2 ring-[#00bfa5]' : ''
                                } ${plan.recommended ? 'md:-mt-2 md:mb-2' : ''}`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        REKOMENDASI
                                    </span>
                                </div>
                            )}
                            {plan.isCurrent && (
                                <div className="absolute top-3 right-3">
                                    <span className="bg-[#00bfa5] text-white text-xs font-bold px-2 py-0.5 rounded">
                                        AKTIF
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-4 pt-2">
                                <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${plan.id === 'DEMO' ? 'bg-gray-100 text-gray-500' :
                                    plan.id === 'BASIC' ? 'bg-blue-100 text-blue-600' :
                                        plan.id === 'PRO' ? 'bg-indigo-100 text-indigo-600' :
                                            'bg-purple-100 text-purple-600'
                                    }`}>
                                    {getPlanIcon(plan.id)}
                                </div>
                                <h4 className="text-lg font-bold text-gray-800">{plan.name}</h4>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {plan.price === 0 ? 'Gratis' : plan.priceLabel}
                                </p>
                                {plan.price > 0 && <p className="text-xs text-gray-500">/bulan</p>}
                            </div>

                            <ul className="space-y-2 mb-5 text-sm">
                                <li className="flex items-center gap-2 text-gray-600">
                                    <Check className="w-4 h-4 text-[#00bfa5]" />
                                    {plan.features.maxVehicles === -1 ? 'Unlimited' : plan.features.maxVehicles || 5} Kendaraan
                                </li>
                                <li className="flex items-center gap-2 text-gray-600">
                                    <Check className="w-4 h-4 text-[#00bfa5]" />
                                    {plan.features.maxUsers === -1 ? 'Unlimited' : plan.features.maxUsers || 1} User
                                </li>
                            </ul>

                            {plan.canUpgrade && !plan.isCurrent && (
                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={upgrading && selectedPlan === plan.id}
                                    className={`w-full py-2.5 rounded-xl font-medium transition-all ${plan.recommended
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90'
                                        : 'bg-[#00bfa5] text-white hover:bg-[#00a896]'
                                        } disabled:opacity-50`}
                                >
                                    {upgrading && selectedPlan === plan.id ? 'Processing...' : 'Upgrade'}
                                </button>
                            )}
                            {plan.isCurrent && (
                                <div className="text-center text-sm text-gray-500 py-2.5">
                                    Paket Saat Ini
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Invoice History */}
            {invoices.length > 0 && (
                <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Riwayat Tagihan</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-gray-500 border-b border-gray-300">
                                <tr>
                                    <th className="text-left pb-3">Invoice</th>
                                    <th className="text-left pb-3">Jumlah</th>
                                    <th className="text-left pb-3">Status</th>
                                    <th className="text-left pb-3">Bukti</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="py-3 font-mono text-gray-600">{inv.invoiceNumber}</td>
                                        <td className="py-3 font-medium">{formatCurrency(inv.amount)}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                                inv.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                    inv.status === 'VERIFYING' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            {inv.status === 'PENDING' && (
                                                <button className="flex items-center gap-1 text-[#00bfa5] font-medium hover:underline">
                                                    <Upload className="w-4 h-4" /> Upload
                                                </button>
                                            )}
                                            {inv.paymentProof && (
                                                <span className="text-gray-500">Uploaded</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-800">Cara Pembayaran</h4>
                        <ol className="mt-2 text-sm text-blue-700 space-y-1 list-decimal list-inside">
                            <li>Pilih paket yang diinginkan dan klik "Upgrade".</li>
                            <li>Transfer ke rekening: <strong>BCA 1234567890 a.n. PT OTOHUB</strong></li>
                            <li>Upload bukti transfer pada invoice yang muncul.</li>
                            <li>Tunggu verifikasi admin (maks 1x24 jam).</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
    const isUnlimited = limit === -1;
    const percentage = isUnlimited ? 30 : Math.min(100, (used / limit) * 100);
    const isNearLimit = !isUnlimited && percentage >= 80;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{label}</span>
                <span className={`font-medium ${isNearLimit ? 'text-amber-600' : 'text-gray-700'}`}>
                    {used} / {isUnlimited ? '∞' : limit}
                </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-amber-500' : 'bg-[#00bfa5]'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
