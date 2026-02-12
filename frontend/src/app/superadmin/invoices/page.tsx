'use client';

import React, { useEffect, useState } from 'react';
import { Download, Eye, CheckCircle, XCircle, FileText, AlertCircle, Plus, X } from 'lucide-react';
import { API_URL } from '@/lib/api';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Invoice {
    id: string;
    invoiceNumber: string;
    tenantId: string;
    tenant: { name: string; email?: string };
    amount: number;
    date: string;
    dueDate: string;
    status: string;
    paymentProof: string | null;
    items?: string;
}

interface Tenant {
    id: string;
    name: string;
    planTier: string;
    monthlyBill: number;
}

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
        VERIFYING: 'bg-blue-100 text-blue-700 border-blue-200',
        OVERDUE: 'bg-rose-100 text-rose-700 border-rose-200',
        CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    const labels: Record<string, string> = {
        PAID: 'Lunas',
        PENDING: 'Menunggu Bayar',
        VERIFYING: 'Verifikasi',
        OVERDUE: 'Jatuh Tempo',
        CANCELLED: 'Dibatalkan',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>
            {labels[status] || status}
        </span>
    );
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Actions
    const [confirmVerify, setConfirmVerify] = useState<{ id: string; approved: boolean } | null>(null);
    const [verifyLoading, setVerifyLoading] = useState(false);

    // Create invoice modal
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ tenantId: '', amount: 0, dueDate: '', items: '' });
    const [createLoading, setCreateLoading] = useState(false);

    // Payment proof modal
    const [proofUrl, setProofUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchInvoices();
        fetchTenants();
    }, [statusFilter]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const getToken = () => localStorage.getItem('access_token');

    const fetchInvoices = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(`${API_URL}/superadmin/invoices?${params}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` },
            });

            if (!res.ok) throw new Error('Failed to fetch invoices');
            const data = await res.json();
            setInvoices(data);
            setError(null);
        } catch {
            setInvoices([]);
            setError('Gagal memuat data invoice');
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await fetch(`${API_URL}/superadmin/tenants`, {
                headers: { 'Authorization': `Bearer ${getToken()}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setTenants(data);
        } catch { /* ignore */ }
    };

    const handleVerifyAction = async () => {
        if (!confirmVerify) return;
        setVerifyLoading(true);
        try {
            const res = await fetch(`${API_URL}/superadmin/invoices/${confirmVerify.id}/verify`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ approved: confirmVerify.approved }),
            });
            if (!res.ok) throw new Error('Verification failed');
            setToast({ message: confirmVerify.approved ? 'Invoice disetujui' : 'Invoice ditolak', type: 'success' });
            fetchInvoices();
        } catch {
            setToast({ message: 'Gagal memverifikasi invoice', type: 'error' });
        } finally {
            setVerifyLoading(false);
            setConfirmVerify(null);
        }
    };

    const handleCreate = async () => {
        if (!createForm.tenantId || !createForm.amount || !createForm.dueDate) {
            setToast({ message: 'Lengkapi semua field', type: 'error' });
            return;
        }
        setCreateLoading(true);
        try {
            const res = await fetch(`${API_URL}/superadmin/invoices`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm),
            });
            if (!res.ok) throw new Error('Create failed');
            setToast({ message: 'Invoice berhasil dibuat', type: 'success' });
            setShowCreate(false);
            setCreateForm({ tenantId: '', amount: 0, dueDate: '', items: '' });
            fetchInvoices();
        } catch {
            setToast({ message: 'Gagal membuat invoice', type: 'error' });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleTenantSelect = (tenantId: string) => {
        const tenant = tenants.find(t => t.id === tenantId);
        setCreateForm(prev => ({
            ...prev,
            tenantId,
            amount: tenant?.monthlyBill || 0,
        }));
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    // Stats
    const pendingCount = invoices.filter(i => i.status === 'PENDING' || i.status === 'VERIFYING').length;
    const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
    const totalPending = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((sum, i) => sum + i.amount, 0);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading invoices...</div>;
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {toast.message}
                </div>
            )}

            {/* STATS BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-lg">
                        <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Menunggu Verifikasi</p>
                        <p className="text-xl font-bold text-slate-900">{pendingCount}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Jatuh Tempo</p>
                        <p className="text-xl font-bold text-rose-600">{overdueCount}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                        <Download className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Total Outstanding</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(totalPending)}</p>
                    </div>
                </div>
            </div>

            {/* MAIN TABLE */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Invoice & Billing</h2>
                        <p className="text-sm text-slate-500">Verifikasi bukti transfer dan kelola tagihan</p>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Semua Status</option>
                            <option value="PENDING">Menunggu Bayar</option>
                            <option value="VERIFYING">Verifikasi</option>
                            <option value="PAID">Lunas</option>
                            <option value="OVERDUE">Jatuh Tempo</option>
                        </select>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Buat Invoice
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="px-6 py-2 bg-amber-50 text-amber-700 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Invoice</th>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Bukti</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-600">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{inv.tenant?.name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">{formatCurrency(inv.amount)}</td>
                                    <td className="px-6 py-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                                    <td className="px-6 py-4">
                                        {inv.paymentProof ? (
                                            <button
                                                onClick={() => setProofUrl(inv.paymentProof)}
                                                className="flex items-center gap-1.5 text-indigo-600 font-medium hover:underline"
                                            >
                                                <Eye className="w-4 h-4" /> Lihat
                                            </button>
                                        ) : (
                                            <span className="text-slate-400 italic">Belum upload</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {(inv.status === 'VERIFYING' || inv.status === 'PENDING') && (
                                            <>
                                                <button
                                                    onClick={() => setConfirmVerify({ id: inv.id, approved: true })}
                                                    className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 transition-colors"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <a
                                                    href={`${API_URL}/pdf/invoice/${inv.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg border border-indigo-200 transition-colors inline-flex items-center justify-center"
                                                    title="Download PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => setConfirmVerify({ id: inv.id, approved: false })}
                                                    className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-200 transition-colors"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        Tidak ada invoice
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CONFIRM VERIFY DIALOG */}
            <ConfirmDialog
                isOpen={!!confirmVerify}
                onClose={() => setConfirmVerify(null)}
                onConfirm={handleVerifyAction}
                title={confirmVerify?.approved ? "Setujui Pembayaran?" : "Tolak Pembayaran?"}
                message={confirmVerify?.approved
                    ? "Apakah Anda yakin ingin menyetujui invoice ini? Status akan berubah menjadi PAID dan langganan tenant akan diperbarui."
                    : "Apakah Anda yakin ingin menolak invoice ini? Tenant akan diminta untuk upload ulang bukti pembayaran."}
                confirmText={confirmVerify?.approved ? "Ya, Setujui" : "Ya, Tolak"}
                cancelText="Batal"
                variant={confirmVerify?.approved ? "success" : "danger"}
                isLoading={verifyLoading}
            />

            {/* CREATE INVOICE MODAL */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900">Buat Invoice Baru</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tenant</label>
                                <select
                                    value={createForm.tenantId}
                                    onChange={e => handleTenantSelect(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Pilih tenant...</option>
                                    {tenants.filter(t => t.planTier !== 'DEMO').map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.planTier})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah (IDR)</label>
                                    <input type="number" value={createForm.amount}
                                        onChange={e => setCreateForm({ ...createForm, amount: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                    <input type="date" value={createForm.dueDate}
                                        onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi / Items</label>
                                <textarea value={createForm.items}
                                    onChange={e => setCreateForm({ ...createForm, items: e.target.value })}
                                    rows={3} placeholder="e.g. Langganan bulanan - Plan Pro"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            {createForm.amount > 0 && (
                                <div className="bg-indigo-50 p-3 rounded-lg text-sm">
                                    <span className="text-slate-600">Total: </span>
                                    <span className="font-bold text-indigo-700">{formatCurrency(createForm.amount)}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleCreate} disabled={createLoading}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {createLoading ? 'Membuat...' : 'Buat Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT PROOF MODAL */}
            {proofUrl && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setProofUrl(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900">Bukti Pembayaran</h3>
                            <button onClick={() => setProofUrl(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 flex justify-center">
                            <img src={proofUrl} alt="Payment Proof" className="max-h-[60vh] rounded-lg object-contain border border-slate-200" onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-center text-slate-500 py-12"><p>Gambar tidak dapat dimuat</p><p class="text-sm mt-1">' + proofUrl + '</p></div>';
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
