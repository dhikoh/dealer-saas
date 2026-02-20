'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, X, ChevronRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface Credit {
    id: string;
    creditType: string;
    leasingCompany?: string;
    downPayment: string;
    totalAmount: string;
    interestRate: string;
    tenorMonths: number;
    monthlyPayment: string;
    nextDueDate?: string;
    status: string;
    transaction: {
        customer: { name: string; phone: string };
        vehicle: { make: string; model: string; licensePlate: string };
    };
    payments: any[];
}

export default function MobileCreditList() {
    const [credits, setCredits] = useState<Credit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'overdue' | 'active'>('all');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchCredits(); }, []);

    const fetchCredits = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/credit');
            if (res.ok) setCredits(await res.json());
            else toast.error('Gagal memuat data kredit');
        } catch { toast.error('Gagal memuat data kredit'); }
        finally { setLoading(false); }
    };

    const handleAddPayment = async () => {
        if (!selectedCredit || !paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Masukkan jumlah pembayaran yang valid');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetchApi(`/credit/${selectedCredit.id}/payments`, {
                method: 'POST',
                body: JSON.stringify({ month: selectedCredit.payments.length + 1, amount: parseFloat(paymentAmount) }),
            });
            if (res.ok) {
                toast.success('Pembayaran berhasil dicatat');
                setShowPaymentModal(false);
                setPaymentAmount('');
                setSelectedCredit(null);
                fetchCredits();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal mencatat pembayaran');
            }
        } catch { toast.error('Gagal mencatat pembayaran'); }
        finally { setSubmitting(false); }
    };

    const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const getStatusInfo = (credit: Credit) => {
        const now = new Date();
        const dueDate = credit.nextDueDate ? new Date(credit.nextDueDate) : null;
        const isOverdue = dueDate && dueDate < now && credit.status === 'ACTIVE';
        if (credit.status === 'COMPLETED') return { label: 'Lunas', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
        if (isOverdue) return { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
        return { label: 'Aktif', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock };
    };

    const filteredCredits = credits.filter(c => {
        if (filter === 'overdue') {
            const now = new Date();
            const d = c.nextDueDate ? new Date(c.nextDueDate) : null;
            return d && d < now && c.status === 'ACTIVE';
        }
        if (filter === 'active') return c.status === 'ACTIVE';
        return true;
    });

    const overdueCount = credits.filter(c => {
        const now = new Date();
        const d = c.nextDueDate ? new Date(c.nextDueDate) : null;
        return d && d < now && c.status === 'ACTIVE';
    }).length;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-4 space-y-4 pb-24">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-800">Kredit Aktif</h1>
                <p className="text-sm text-gray-500">Kelola kredit dan cicilan pelanggan</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {(['all', 'active', 'overdue'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all relative ${filter === f
                            ? 'bg-[#00bfa5] text-white shadow-lg'
                            : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'}`}
                    >
                        {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Overdue'}
                        {f === 'overdue' && overdueCount > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs">
                                {overdueCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Credit List */}
            <div className="space-y-3">
                {filteredCredits.map(credit => {
                    const status = getStatusInfo(credit);
                    const StatusIcon = status.icon;
                    const progress = Math.min(((credit.payments?.length || 0) / credit.tenorMonths) * 100, 100);
                    return (
                        <div key={credit.id} className="bg-[#ecf0f3] rounded-2xl p-4 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                            {/* Customer + Status */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00bfa5] to-[#00a891] flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800 text-sm">
                                            {credit.transaction?.customer?.name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {credit.transaction?.vehicle?.make} {credit.transaction?.vehicle?.model}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {status.label}
                                    </span>
                                </div>
                            </div>

                            {/* Credit Details */}
                            <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-white/50 rounded-xl">
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Cicilan/bln</div>
                                    <div className="text-sm font-bold text-[#00bfa5]">{fmt(Number(credit.monthlyPayment))}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Tenor</div>
                                    <div className="text-sm font-bold text-gray-800">{credit.tenorMonths} bln</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-gray-400">Terbayar</div>
                                    <div className="text-sm font-bold text-gray-800">{credit.payments?.length || 0}x</div>
                                </div>
                            </div>

                            {/* Jatuh Tempo */}
                            {credit.nextDueDate && (
                                <div className={`text-xs mb-2 px-2 py-1 rounded-lg ${new Date(credit.nextDueDate) < new Date() && credit.status === 'ACTIVE' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                    Jatuh tempo: {new Date(credit.nextDueDate).toLocaleDateString('id-ID')}
                                </div>
                            )}

                            {/* Progress Bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Progress Cicilan</span>
                                    <span>{credit.payments?.length || 0}/{credit.tenorMonths}</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#00bfa5] to-[#00a891] transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            {credit.status === 'ACTIVE' && credit.creditType !== 'LEASING' && (
                                <button
                                    onClick={() => {
                                        setSelectedCredit(credit);
                                        setPaymentAmount(credit.monthlyPayment);
                                        setShowPaymentModal(true);
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-[#00bfa5] text-white text-sm font-medium shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Catat Pembayaran
                                </button>
                            )}
                        </div>
                    );
                })}

                {filteredCredits.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Tidak ada data kredit</p>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedCredit && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
                    <div className="bg-[#ecf0f3] rounded-t-3xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Catat Pembayaran</h3>
                            <button onClick={() => { setShowPaymentModal(false); setPaymentAmount(''); }}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="bg-white/60 rounded-xl p-3 mb-4">
                            <div className="font-semibold text-gray-800">{selectedCredit.transaction?.customer?.name}</div>
                            <div className="text-sm text-gray-500">
                                Cicilan ke-{(selectedCredit.payments?.length || 0) + 1} dari {selectedCredit.tenorMonths}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">Jumlah Pembayaran (Rp)</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-lg font-bold"
                                placeholder="0"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowPaymentModal(false); setPaymentAmount(''); }}
                                className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddPayment}
                                disabled={submitting}
                                className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg disabled:opacity-50"
                            >
                                {submitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
