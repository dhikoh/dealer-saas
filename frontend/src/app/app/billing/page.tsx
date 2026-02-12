'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Check, X, AlertCircle, Upload, Clock, Crown, Zap, Star, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrency } from '@/hooks/useCurrency';
import PaymentModal from '@/components/billing/PaymentModal';

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
    price: number;
    priceLabel: string;
    features: any;
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
    const { t, language } = useLanguage();
    const { fmt } = useCurrency();
    const [profile, setProfile] = useState<TenantProfile | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const getLabel = (key: string) => {
        const labels: Record<string, Record<string, string>> = {
            billingTitle: { id: 'Langganan & Billing', en: 'Subscription & Billing' },
            billingDesc: { id: 'Kelola paket langganan dan histori tagihan Anda', en: 'Manage your subscription plan and billing history' },
            currentPlan: { id: 'Paket Saat Ini', en: 'Current Plan' },
            monthlyBill: { id: 'Total Tagihan Bulanan', en: 'Total Monthly Bill' },
            exclVAT: { id: 'belum termasuk PPN', en: 'excludes VAT' },
            vehicles: { id: 'Kendaraan', en: 'Vehicles' },
            staffMembers: { id: 'Staff Members', en: 'Staff Members' },
            customers: { id: 'Customers', en: 'Customers' },
            planOptions: { id: 'Pilihan Paket', en: 'Plan Options' },
            bestValue: { id: 'BEST VALUE', en: 'BEST VALUE' },
            perMonth: { id: '/bln', en: '/mo' },
            selectPlan: { id: 'Pilih Paket', en: 'Select Plan' },
            contactSales: { id: 'Kontak Sales', en: 'Contact Sales' },
            processing: { id: 'Memproses', en: 'Processing' },
            invoiceHistory: { id: 'Riwayat Tagihan', en: 'Billing History' },
            invoice: { id: 'Invoice #', en: 'Invoice #' },
            date: { id: 'Tanggal', en: 'Date' },
            amount: { id: 'Jumlah', en: 'Amount' },
            status: { id: 'Status', en: 'Status' },
            action: { id: 'Aksi', en: 'Action' },
            uploadProof: { id: 'Upload Bukti', en: 'Upload Proof' },
            proofUploaded: { id: 'Bukti terupload', en: 'Proof uploaded' },
            paymentInstructions: { id: 'Instruksi Pembayaran', en: 'Payment Instructions' },
            paymentDesc: { id: 'Pembayaran dapat dilakukan melalui transfer bank ke rekening berikut:', en: 'Payment can be made via bank transfer to the following account:' },
            instruction1: { id: 'Pastikan nominal transfer sesuai dengan total tagihan (hingga 3 digit terakhir).', en: 'Ensure transfer amount matches total bill (up to last 3 digits).' },
            instruction2: { id: 'Simpan bukti transfer Anda.', en: 'Save your transfer proof.' },
            instruction3: { id: 'Upload bukti transfer pada invoice yang berstatus PENDING.', en: 'Upload transfer proof on invoices with PENDING status.' },
            instruction4: { id: 'Verifikasi akan diproses maksimal 1x24 jam kerja.', en: 'Verification will be processed within 1x24 working hours.' },
            uploadTitle: { id: 'Upload Bukti Pembayaran', en: 'Upload Payment Proof' },
            dragDrop: { id: 'Klik untuk pilih file atau drag & drop', en: 'Click to select file or drag & drop' },
            fileType: { id: 'JPG, PNG, PDF (Max 5MB)', en: 'JPG, PNG, PDF (Max 5MB)' },
            cancel: { id: 'Batal', en: 'Cancel' },
            upload: { id: 'Upload', en: 'Upload' },
            unlimited: { id: 'Unlimited', en: 'Unlimited' },
            standardReports: { id: 'Laporan Standard', en: 'Standard Reports' },
            prioritySupport: { id: 'Support Prioritas', en: 'Priority Support' },
            packet: { id: 'Paket', en: 'Plan' },
            nextBilling: { id: 'Next billing:', en: 'Next billing:' },
            trialEnds: { id: 'Trial berakhir dalam', en: 'Trial ends in' },
            days: { id: 'hari', en: 'days' },
            free: { id: 'Gratis', en: 'Free' },
            noInvoices: { id: 'Belum ada riwayat tagihan', en: 'No billing history' },
            uploadSuccess: { id: 'Bukti pembayaran berhasil diupload', en: 'Payment proof uploaded successfully' },
            uploadFailed: { id: 'Gagal mengupload bukti pembayaran', en: 'Failed to upload payment proof' },
            invoiceCreated: { id: 'Invoice telah dibuat. Silakan lakukan pembayaran.', en: 'Invoice created. Please make payment.' },
            systemError: { id: 'Terjadi kesalahan sistem', en: 'System error occurred' },
            loadError: { id: 'Gagal memuat data billing', en: 'Failed to load billing data' },
        };
        return labels[key]?.[language === 'id' ? 'id' : 'en'] || labels[key]?.['en'] || key;
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const baseUrl = API_URL;

            const [profileRes, plansRes, invoicesRes] = await Promise.all([
                fetch(`${baseUrl}/billing/my-subscription`, { headers }),
                fetch(`${baseUrl}/billing/plans`, { headers }),
                fetch(`${baseUrl}/billing/my-invoices`, { headers }),
            ]);

            if (profileRes.ok) setProfile(await profileRes.json());
            if (plansRes.ok) setPlans(await plansRes.json());
            if (invoicesRes.ok) setInvoices(await invoicesRes.json());
        } catch (err) {
            console.error('Error fetching data:', err);
            toast.error(getLabel('loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        setUpgrading(true);
        setSelectedPlan(planId);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/tenant/upgrade`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planTier: planId }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Invoice ${data.invoice.invoiceNumber}: ${getLabel('invoiceCreated')}`);
                fetchData();
            } else {
                const error = await res.json();
                toast.error(error.message || t.error);
            }
        } catch (err) {
            toast.error(getLabel('systemError'));
        } finally {
            setUpgrading(false);
            setSelectedPlan(null);
        }
    };

    const handlePayClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        fetchData();
        toast.success(getLabel('uploadSuccess'));
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

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            PAID: 'bg-emerald-100 text-emerald-700',
            PENDING: 'bg-amber-100 text-amber-700',
            VERIFYING: 'bg-blue-100 text-blue-700',
            OVERDUE: 'bg-rose-100 text-rose-700',
            CANCELLED: 'bg-slate-100 text-slate-600',
        };
        const localizedStatus: Record<string, string> = {
            PAID: t.paid || 'Paid',
            PENDING: t.pending || 'Pending',
            VERIFYING: 'Verifying',
            OVERDUE: 'Overdue',
            CANCELLED: t.cancelled || 'Cancelled',
        };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {localizedStatus[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[#00bfa5] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{getLabel('billingTitle')}</h1>
                <p className="text-gray-500 mt-1">{getLabel('billingDesc')}</p>
            </div>

            {/* Current Plan Status */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${profile?.subscriptionStatus === 'TRIAL' ? 'bg-blue-50 text-blue-600' :
                            profile?.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-amber-50 text-amber-600'
                            }`}>
                            {getPlanIcon(profile?.planTier || 'DEMO')}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {getLabel('packet')} {profile?.planDetails?.name || profile?.planTier}
                                </h2>
                                <StatusBadge status={profile?.subscriptionStatus || 'UNKNOWN'} />
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                                {profile?.subscriptionStatus === 'TRIAL' && profile.trialDaysRemaining !== undefined ? (
                                    <span className="text-blue-600 font-medium">{getLabel('trialEnds')} {profile.trialDaysRemaining} {getLabel('days')}</span>
                                ) : (
                                    <span>{getLabel('nextBilling')} {profile?.subscriptionEndsAt ? new Date(profile.subscriptionEndsAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US') : '-'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                        <p className="text-sm text-gray-500 mb-1">{getLabel('monthlyBill')}</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {profile?.monthlyBill ? fmt(profile.monthlyBill) : getLabel('free')}
                        </p>
                        <p className="text-xs text-gray-400">{getLabel('exclVAT')}</p>
                    </div>
                </div>

                {/* Usage Stats */}
                {profile?.limits && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                        <UsageBar
                            label={getLabel('vehicles')}
                            used={profile.usage.vehicles}
                            limit={profile.limits.maxVehicles}
                        />
                        <UsageBar
                            label={getLabel('staffMembers')}
                            used={profile.usage.users}
                            limit={profile.limits.maxUsers}
                        />
                        <UsageBar
                            label={getLabel('customers')}
                            used={profile.usage.customers}
                            limit={profile.limits.maxCustomers}
                        />
                    </div>
                )}
            </div>

            {/* Plan Options */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-indigo-600" /> {getLabel('planOptions')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-white rounded-xl p-5 border shadow-sm transition-all hover:shadow-md ${plan.isCurrent ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-200'
                                } ${plan.recommended ? 'relative' : ''}`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide">
                                        {getLabel('bestValue')}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6 pt-2">
                                <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                                <div className="mt-2 flex items-baseline justify-center gap-1">
                                    <span className="text-2xl font-bold text-gray-900">
                                        {plan.price === 0 ? getLabel('free') : fmt(plan.price)}
                                    </span>
                                    {plan.price > 0 && <span className="text-sm text-gray-500">{getLabel('perMonth')}</span>}
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <FeatureItem label={`${plan.features.maxVehicles === -1 ? getLabel('unlimited') : plan.features.maxVehicles} ${getLabel('vehicles')}`} />
                                <FeatureItem label={`${plan.features.maxUsers === -1 ? getLabel('unlimited') : plan.features.maxUsers} ${getLabel('staffMembers')}`} />
                                <FeatureItem label={getLabel('standardReports')} included={true} />
                                <FeatureItem label={getLabel('prioritySupport')} included={plan.id !== 'DEMO'} />
                            </div>

                            {plan.isCurrent ? (
                                <button disabled className="w-full py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-sm">
                                    {getLabel('currentPlan')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={!plan.canUpgrade || (upgrading && selectedPlan === plan.id)}
                                    className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${plan.recommended
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {upgrading && selectedPlan === plan.id ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> {getLabel('processing')}
                                        </span>
                                    ) : (
                                        plan.canUpgrade ? getLabel('selectPlan') : getLabel('contactSales')
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Invoices & Payment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> {getLabel('invoiceHistory')}
                            </h3>
                        </div>
                        {invoices.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">{getLabel('invoice')}</th>
                                        <th className="px-4 py-3">{getLabel('date')}</th>
                                        <th className="px-4 py-3">{getLabel('amount')}</th>
                                        <th className="px-4 py-3">{getLabel('status')}</th>
                                        <th className="px-4 py-3 text-right">{getLabel('action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono text-slate-600">{inv.invoiceNumber}</td>
                                            <td className="px-4 py-3 text-slate-600">{new Date(inv.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{fmt(inv.amount)}</td>
                                            <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                                            <td className="px-4 py-3 text-right">
                                                {inv.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handlePayClick(inv)}
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
                                                    >
                                                        <CreditCard className="w-3 h-3" /> {getLabel('action') === 'Aksi' ? 'Bayar' : 'Pay'}
                                                    </button>
                                                )}
                                                {(inv.status === 'VERIFYING' || (inv.paymentProof && inv.status !== 'PENDING')) && (
                                                    <span className="text-xs text-slate-500 italic flex items-center justify-end gap-1">
                                                        <FileText className="w-3 h-3" /> {getLabel('proofUploaded')}
                                                    </span>
                                                )}
                                                {inv.status === 'REJECTED' && (
                                                    <button
                                                        onClick={() => handlePayClick(inv)}
                                                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-medium text-xs bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-rose-100"
                                                    >
                                                        <Upload className="w-3 h-3" /> Re-Upload
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-slate-500">
                                {getLabel('noInvoices')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Premium Support Banner */}
                <div>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white p-6 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CreditCard className="w-24 h-24 transform rotate-12" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Premium Support</h3>
                        <p className="text-indigo-100 text-sm mb-4 relative z-10">
                            {language === 'id' ? 'Butuh bantuan pembayaran? Hubungi kami.' : 'Need help with payment? Contact us.'}
                        </p>
                        <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors relative z-10">
                            WhatsApp Support
                        </button>
                    </div>
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {selectedInvoice && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    invoiceId={selectedInvoice.id}
                    invoiceNumber={selectedInvoice.invoiceNumber}
                    amount={selectedInvoice.amount}
                    onUploadSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}

function FeatureItem({ label, included = true }: { label: string; included?: boolean }) {
    return (
        <div className={`flex items-start gap-2 text-sm ${included ? 'text-gray-700' : 'text-gray-400'}`}>
            {included ? (
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
                <X className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            )}
            <span>{label}</span>
        </div>
    );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
    const isUnlimited = limit === -1;
    const percentage = isUnlimited ? 15 : Math.min(100, (used / limit) * 100);
    const isNearLimit = !isUnlimited && percentage >= 85;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-700">{label}</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isNearLimit ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {used} / {isUnlimited ? '∞' : limit}
                </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
