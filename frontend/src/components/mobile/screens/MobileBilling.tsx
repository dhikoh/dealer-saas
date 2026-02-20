'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi, API_URL } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface TenantProfile {
    planTier: string;
    subscriptionStatus: string;
    trialDaysRemaining: number;
    subscriptionEndsAt: string | null;
    monthlyBill: number;
    usage: { users: number; vehicles: number; customers: number };
    limits: { maxUsers: number; maxVehicles: number; maxCustomers: number } | null;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    date: string;
    status: string;
}

const statusColor: Record<string, string> = {
    PAID: 'text-green-500',
    PENDING: 'text-yellow-500',
    OVERDUE: 'text-red-500',
};

const statusLabel: Record<string, string> = {
    PAID: 'Lunas',
    PENDING: 'Menunggu',
    OVERDUE: 'Jatuh Tempo',
};

export default function MobileBilling() {
    const { theme } = useMobileContext();
    const [profile, setProfile] = useState<TenantProfile | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        Promise.allSettled([
            fetchApi('/billing/profile'),
            fetchApi('/billing/invoices'),
        ]).then(([p, i]) => {
            if (p.status === 'fulfilled' && p.value.ok) p.value.json().then(setProfile);
            if (i.status === 'fulfilled' && i.value.ok) i.value.json().then((d: any) => setInvoices(d?.invoices ?? d ?? []));
        }).finally(() => setLoading(false));
    }, []);

    const handlePayment = async (invoiceId: string, file: File) => {
        setUploading(true);
        const fd = new FormData();
        fd.append('proof', file);
        try {
            const uploadRes = await fetchApi(`/billing/invoices/${invoiceId}/payment-proof`, { method: 'POST', body: fd });
            if (uploadRes.ok) {
                alert('Bukti pembayaran berhasil dikirim!');
                setSelectedInvoice(null);
            } else { alert('Gagal mengirim bukti'); }
        } catch { alert('Terjadi kesalahan'); }
        finally { setUploading(false); }
    };

    const usagePercent = (used: number, max: number | null) => max ? Math.min((used / max) * 100, 100) : 0;

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select pb-6`}>
            <div className={`${theme.bgHeader} pt-12 pb-4 px-6 sticky top-0 z-10`}>
                <h2 className={`text-2xl font-black ${theme.textMain}`}>Langganan & Tagihan</h2>
            </div>

            <div className="px-6 mt-4 space-y-4">
                {/* Current Plan */}
                {loading ? (
                    <div className={`h-40 rounded-3xl ${theme.imagePlaceholder} animate-pulse`} />
                ) : profile && (
                    <div className={`p-6 ${theme.bgCard}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>Paket Aktif</p>
                                <h3 className={`text-2xl font-black mt-1 ${theme.textHighlight}`}>{profile.planTier}</h3>
                                <p className={`text-sm font-black mt-1 ${theme.textMuted}`}>{fmt(profile.monthlyBill)}/bulan</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${profile.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                    profile.subscriptionStatus === 'TRIAL' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>{profile.subscriptionStatus}</span>
                        </div>

                        {profile.subscriptionStatus === 'TRIAL' && profile.trialDaysRemaining > 0 && (
                            <div className="mt-4 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-yellow-500" />
                                <p className={`text-sm font-black text-yellow-500`}>Trial tersisa {profile.trialDaysRemaining} hari</p>
                            </div>
                        )}

                        {/* Usage bars */}
                        {profile.limits && (
                            <div className="mt-5 space-y-3">
                                {[
                                    { label: 'Pengguna', used: profile.usage.users, max: profile.limits.maxUsers },
                                    { label: 'Kendaraan', used: profile.usage.vehicles, max: profile.limits.maxVehicles },
                                    { label: 'Pelanggan', used: profile.usage.customers, max: profile.limits.maxCustomers },
                                ].map(u => (
                                    <div key={u.label}>
                                        <div className="flex justify-between mb-1">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>{u.label}</p>
                                            <p className={`text-[10px] font-black ${theme.textMuted}`}>{u.used}/{u.max}</p>
                                        </div>
                                        <div className={`h-2 rounded-full ${theme.imagePlaceholder}`}>
                                            <div className={`h-full rounded-full ${theme.btnPrimary}`} style={{ width: `${usagePercent(u.used, u.max)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Invoices */}
                <h3 className={`text-[11px] font-black uppercase tracking-widest pl-1 pt-2 ${theme.textMuted}`}>Riwayat Tagihan</h3>
                {invoices.length === 0 && !loading ? (
                    <div className={`p-8 ${theme.bgCard} flex flex-col items-center text-center`}>
                        <AlertCircle className={`h-8 w-8 mb-3 opacity-30 ${theme.textMuted}`} />
                        <p className={`font-black ${theme.textMuted}`}>Belum ada tagihan</p>
                    </div>
                ) : invoices.map(inv => (
                    <div key={inv.id} onClick={() => setSelectedInvoice(inv)}
                        className={`p-4 flex items-center gap-4 cursor-pointer active:scale-[0.97] transition-transform ${theme.bgCard}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${theme.iconContainer}`}>
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-black text-sm truncate ${theme.textMain}`}>{inv.invoiceNumber}</p>
                            <p className={`text-[10px] font-black ${theme.textMuted}`}>{new Date(inv.date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-black ${theme.textHighlight}`}>{fmt(inv.amount)}</p>
                            <p className={`text-[9px] font-black uppercase ${statusColor[inv.status] ?? theme.textMuted}`}>{statusLabel[inv.status] ?? inv.status}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Invoice Detail */}
            <BottomModal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Detail Tagihan">
                {selectedInvoice && (
                    <div className="space-y-6">
                        <div className={`p-6 rounded-3xl space-y-4 ${theme.bgFrame} border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                            {[
                                { label: 'No. Invoice', value: selectedInvoice.invoiceNumber },
                                { label: 'Jumlah', value: fmt(selectedInvoice.amount) },
                                { label: 'Status', value: statusLabel[selectedInvoice.status] ?? selectedInvoice.status },
                                { label: 'Tanggal', value: new Date(selectedInvoice.date).toLocaleDateString('id-ID') },
                            ].map((item, idx, arr) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted}`}>{item.label}</span>
                                        <span className={`text-sm font-black ${theme.textMain}`}>{item.value}</span>
                                    </div>
                                    {idx < arr.length - 1 && <div className={`border-t mt-4 ${theme.divider}`} />}
                                </div>
                            ))}
                        </div>
                        {selectedInvoice.status !== 'PAID' && (
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${theme.textMuted}`}>Upload Bukti Bayar</p>
                                <input type="file" accept="image/*"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePayment(selectedInvoice.id, f); }}
                                    className={`w-full px-5 py-4 rounded-2xl text-sm font-bold ${theme.bgInput}`}
                                    disabled={uploading} />
                            </div>
                        )}
                    </div>
                )}
            </BottomModal>
        </div>
    );
}
