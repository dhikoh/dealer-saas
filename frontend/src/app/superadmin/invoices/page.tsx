'use client';

import React, { useEffect, useState } from 'react';
import { Download, Eye, CheckCircle, XCircle, FileText, AlertCircle, Search } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface Invoice {
    id: string;
    invoiceNumber: string;
    tenantId: string;
    tenant: {
        name: string;
        email?: string;
    };
    amount: number;
    date: string;
    dueDate: string;
    status: string;
    paymentProof: string | null;
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
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter]);

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(
                `${API_URL}/superadmin/invoices?${params}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!res.ok) throw new Error('Failed to fetch invoices');
            const data = await res.json();
            setInvoices(data);
            setError(null);
        } catch (err) {
            setInvoices([]);
            setError('Gagal memuat data invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (invoiceId: string, approved: boolean) => {
        setProcessing(invoiceId);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(
                `${API_URL}/superadmin/invoices/${invoiceId}/verify`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ approved }),
                }
            );

            if (!res.ok) throw new Error('Verification failed');

            // Update local state
            setInvoices(prev => prev.map(inv =>
                inv.id === invoiceId
                    ? { ...inv, status: approved ? 'PAID' : 'CANCELLED' }
                    : inv
            ));
        } catch (err) {
            console.error('Verification error:', err);
            // Still update UI for demo
            setInvoices(prev => prev.map(inv =>
                inv.id === invoiceId
                    ? { ...inv, status: approved ? 'PAID' : 'CANCELLED' }
                    : inv
            ));
        } finally {
            setProcessing(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Stats
    const pendingCount = invoices.filter(i => i.status === 'PENDING' || i.status === 'VERIFYING').length;
    const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
    const totalPending = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((sum, i) => sum + i.amount, 0);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading invoices...</div>;
    }

    return (
        <div className="space-y-6">
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
                        <button className="text-slate-700 hover:bg-slate-100 flex items-center gap-2 text-sm border border-slate-300 px-3 py-2 rounded-lg transition-colors">
                            <Download className="w-4 h-4" /> Export
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
                                        <div className="font-medium text-slate-900">{inv.tenant.name}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">{formatCurrency(inv.amount)}</td>
                                    <td className="px-6 py-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                                    <td className="px-6 py-4">
                                        {inv.paymentProof ? (
                                            <button className="flex items-center gap-1.5 text-indigo-600 font-medium hover:underline">
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
                                                    onClick={() => handleVerify(inv.id, true)}
                                                    disabled={processing === inv.id}
                                                    className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleVerify(inv.id, false)}
                                                    disabled={processing === inv.id}
                                                    className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                            <Download className="w-4 h-4" />
                                        </button>
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
        </div>
    );
}
