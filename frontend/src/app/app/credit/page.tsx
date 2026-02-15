'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCreditCard,
    faSpinner,
    faExclamationTriangle,
    faCheck,
    faClock,
    faMoneyBillWave,
    faUser,
    faCar,
    faPlus,
    faTimes,
    faCalculator,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { API_URL, fetchApi } from '@/lib/api';

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

export default function CreditPage() {
    const { t, language } = useLanguage();
    const { fmt } = useCurrency();
    const [credits, setCredits] = useState<Credit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'overdue' | 'active'>('all');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');



    const getLabel = (key: string) => {
        const labels: Record<string, Record<string, string>> = {
            creditDesc: { id: 'Kelola kredit dan cicilan customer', en: 'Manage customer credits and installments' },
            pay: { id: 'Bayar', en: 'Pay' },
            totalCredit: { id: 'Total Kredit', en: 'Total Credit' },
            monthlyInstallment: { id: 'Cicilan/bulan', en: 'Monthly Installment' },
            tenor: { id: 'Tenor', en: 'Tenor' },
            months: { id: 'bulan', en: 'months' },
            paid: { id: 'Sudah Bayar', en: 'Paid' },
            dueDate: { id: 'Jatuh Tempo', en: 'Due Date' },
            paymentProgress: { id: 'Progress Pembayaran', en: 'Payment Progress' },
            noCredits: { id: 'Tidak ada data kredit', en: 'No credit data found' },
            recordPayment: { id: 'Catat Pembayaran', en: 'Record Payment' },
            installmentNo: { id: 'Cicilan ke-', en: 'Installment #' },
            of: { id: 'dari', en: 'of' },
            paymentAmount: { id: 'Jumlah Pembayaran', en: 'Payment Amount' },
            savePayment: { id: 'Simpan Pembayaran', en: 'Save Payment' },
            cancel: { id: 'Batal', en: 'Cancel' },
            active: { id: 'Aktif', en: 'Active' },
            overdue: { id: 'Overdue', en: 'Overdue' },
            completed: { id: 'Lunas', en: 'Paid Off' },
            leasing: { id: 'Leasing', en: 'Leasing' },
            dealerCredit: { id: 'Kredit Dealer', en: 'Dealer Credit' },
            dealerToLeasing: { id: 'Dialihkan ke Leasing', en: 'Switched to Leasing' },
            all: { id: 'Semua', en: 'All' },
            invalidAmount: { id: 'Masukkan jumlah pembayaran yang valid', en: 'Enter a valid payment amount' },
            paymentSuccess: { id: 'Pembayaran berhasil dicatat', en: 'Payment recorded successfully' },
            paymentFailed: { id: 'Gagal mencatat pembayaran', en: 'Failed to record payment' },
            loadFailed: { id: 'Gagal memuat data kredit', en: 'Failed to load credit data' },
        };
        return labels[key]?.[language === 'id' ? 'id' : 'en'] || labels[key]?.['en'] || key;
    };

    useEffect(() => {
        fetchCredits();
    }, []);

    const fetchCredits = async () => {
        setLoading(true); // Set loading to true when fetching starts
        try {
            const res = await fetchApi('/credit'); // Use fetchApi
            if (res.ok) {
                setCredits(await res.json());
            } else {
                // fetchApi handles 401 and redirects, so other errors can be handled generally
                toast.error(getLabel('loadFailed'));
            }
        } catch (error) {
            console.error('Failed to fetch credits:', error);
            toast.error(getLabel('loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async () => {
        if (!selectedCredit) return;

        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error(getLabel('invalidAmount'));
            return;
        }

        try {
            const res = await fetchApi(`/credit/${selectedCredit.id}/payments`, { // Use fetchApi
                method: 'POST',
                body: JSON.stringify({
                    month: selectedCredit.payments.length + 1,
                    amount: parseFloat(paymentAmount),
                }),
            });

            if (res.ok) {
                toast.success(getLabel('paymentSuccess'));
                setShowPaymentModal(false);
                setPaymentAmount('');
                fetchCredits();
            } else {
                const err = await res.json();
                toast.error(err.message || getLabel('paymentFailed'));
            }
        } catch (error) {
            console.error('Failed to add payment:', error);
            toast.error(getLabel('paymentFailed'));
        }
    };

    const getStatusBadge = (credit: Credit) => {
        const now = new Date();
        const dueDate = credit.nextDueDate ? new Date(credit.nextDueDate) : null;
        const isOverdue = dueDate && dueDate < now && credit.status === 'ACTIVE';

        if (credit.status === 'COMPLETED') {
            return <span className="px-2 py-1 rounded-full bg-green-100 text-green-600 text-xs font-medium">{getLabel('completed')}</span>;
        }
        if (isOverdue) {
            return <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 text-xs font-medium">{getLabel('overdue')}</span>;
        }
        if (credit.status === 'ACTIVE') {
            return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">{getLabel('active')}</span>;
        }
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{credit.status}</span>;
    };

    const getCreditTypeBadge = (type: string) => {
        const types: { [key: string]: { label: string; color: string } } = {
            LEASING: { label: getLabel('leasing'), color: 'bg-purple-100 text-purple-600' },
            DEALER_CREDIT: { label: getLabel('dealerCredit'), color: 'bg-blue-100 text-blue-600' },
            DEALER_TO_LEASING: { label: getLabel('dealerToLeasing'), color: 'bg-orange-100 text-orange-600' },
        };
        const config = types[type] || { label: type, color: 'bg-gray-100 text-gray-600' };
        return <span className={`px-2 py-1 rounded-full ${config.color} text-xs font-medium`}>{config.label}</span>;
    };

    const filteredCredits = credits.filter(credit => {
        if (filter === 'overdue') {
            const now = new Date();
            const dueDate = credit.nextDueDate ? new Date(credit.nextDueDate) : null;
            return dueDate && dueDate < now && credit.status === 'ACTIVE';
        }
        if (filter === 'active') return credit.status === 'ACTIVE';
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-[#00bfa5] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t.credit || 'Credit'}</h1>
                    <p className="text-sm text-gray-500">{getLabel('creditDesc')}</p>
                </div>
            </div>

            {/* FILTER TABS */}
            <div className="flex gap-2">
                {(['all', 'active', 'overdue'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === f
                            ? 'bg-[#00bfa5] text-white shadow-lg'
                            : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                            }`}
                    >
                        {f === 'all' ? getLabel('all') : f === 'active' ? getLabel('active') : getLabel('overdue')}
                        {f === 'overdue' && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                                {credits.filter(c => {
                                    const now = new Date();
                                    const dueDate = c.nextDueDate ? new Date(c.nextDueDate) : null;
                                    return dueDate && dueDate < now && c.status === 'ACTIVE';
                                }).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* CREDIT LIST */}
            <div className="space-y-4">
                {filteredCredits.map((credit) => (
                    <div
                        key={credit.id}
                        className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff]"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00bfa5] to-[#00a891] flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCreditCard} className="text-white text-xl" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">
                                            {credit.transaction?.customer?.name || 'Unknown'}
                                        </span>
                                        {getStatusBadge(credit)}
                                        {getCreditTypeBadge(credit.creditType)}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faCar} className="text-xs" />
                                            {credit.transaction?.vehicle?.make} {credit.transaction?.vehicle?.model}
                                        </span>
                                        {credit.leasingCompany && (
                                            <span className="text-purple-600">• {credit.leasingCompany}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {credit.status === 'ACTIVE' && credit.creditType !== 'LEASING' && (
                                <button
                                    onClick={() => {
                                        setSelectedCredit(credit);
                                        setPaymentAmount(credit.monthlyPayment);
                                        setShowPaymentModal(true);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] transition-all flex items-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    {getLabel('pay')}
                                </button>
                            )}
                        </div>

                        {/* CREDIT INFO GRID */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-white/50 rounded-xl">
                            <div>
                                <div className="text-xs text-gray-400">{getLabel('totalCredit')}</div>
                                <div className="font-bold text-gray-800">
                                    {fmt(Number(credit.totalAmount))}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">{getLabel('monthlyInstallment')}</div>
                                <div className="font-bold text-[#00bfa5]">
                                    {fmt(Number(credit.monthlyPayment))}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">{getLabel('tenor')}</div>
                                <div className="font-bold text-gray-800">{credit.tenorMonths} {getLabel('months')}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">{getLabel('paid')}</div>
                                <div className="font-bold text-gray-800">{credit.payments?.length || 0}x</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">{getLabel('dueDate')}</div>
                                <div className={`font-bold ${credit.nextDueDate && new Date(credit.nextDueDate) < new Date() ? 'text-red-500' : 'text-gray-800'}`}>
                                    {credit.nextDueDate ? new Date(credit.nextDueDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US') : '-'}
                                </div>
                            </div>
                        </div>

                        {/* PROGRESS BAR */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{getLabel('paymentProgress')}</span>
                                <span>{credit.payments?.length || 0} / {credit.tenorMonths}</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#00bfa5] to-[#00a891] transition-all duration-500"
                                    style={{ width: `${((credit.payments?.length || 0) / credit.tenorMonths) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {filteredCredits.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <FontAwesomeIcon icon={faCreditCard} className="text-4xl mb-4" />
                        <p>{getLabel('noCredits')}</p>
                    </div>
                )}
            </div>

            {/* PAYMENT MODAL */}
            {showPaymentModal && selectedCredit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{getLabel('recordPayment')}</h2>
                            <button onClick={() => setShowPaymentModal(false)}>
                                <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div className="bg-gray-100 p-4 rounded-xl mb-4">
                            <div className="font-bold text-gray-800">{selectedCredit.transaction?.customer?.name}</div>
                            <div className="text-sm text-gray-500">
                                {getLabel('installmentNo')}{(selectedCredit.payments?.length || 0) + 1} {getLabel('of')} {selectedCredit.tenorMonths}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{getLabel('paymentAmount')}</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]"
                                >
                                    {getLabel('cancel')}
                                </button>
                                <button
                                    onClick={handleAddPayment}
                                    className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891]"
                                >
                                    {getLabel('savePayment')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
