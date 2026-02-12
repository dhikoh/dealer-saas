'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, DollarSign, ShoppingCart, TrendingUp, TrendingDown, Eye, FileText, X, Check, ChevronLeft, ChevronRight, Printer, Calculator, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrency } from '@/hooks/useCurrency';

interface Transaction {
    id: string;
    type: 'SALE' | 'PURCHASE';
    vehicleId: string;
    vehicleName: string;
    customerId?: string;
    customerName?: string;
    finalPrice: number;
    paymentType?: 'CASH' | 'CREDIT';
    profit?: number;
    date: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED' | 'COMPLETED';
    notes?: string;
    vehicle?: { make: string; model: string; licensePlate: string };
    customer?: { name: string; phone: string };
}

interface VehicleOption {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate?: string;
}

interface CustomerOption {
    id: string;
    name: string;
    phone: string;
}

import { API_URL } from '@/lib/api';

export default function TransactionsPage() {
    const { t, language } = useLanguage();
    const { fmt } = useCurrency();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'SALE' | 'PURCHASE'>('ALL');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [txForm, setTxForm] = useState({
        type: 'SALE' as 'SALE' | 'PURCHASE',
        vehicleId: '',
        customerId: '',
        paymentType: 'CASH' as 'CASH' | 'CREDIT',
        paymentMethod: 'CASH',
        finalPrice: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        // Credit Data
        downPayment: '',
        interestRate: '10', // Default 10%
        tenorMonths: '12', // Default 1 year
        leasingCompany: '',
    });
    const [monthlyInstallment, setMonthlyInstallment] = useState(0);
    const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const getToken = () => localStorage.getItem('access_token');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map backend response to frontend Transaction shape
                const mapped: Transaction[] = data.map((tx: any) => ({
                    ...tx,
                    vehicleName: tx.vehicle ? `${tx.vehicle.make} ${tx.vehicle.model}` : '-',
                    customerName: tx.customer?.name || '-',
                    finalPrice: typeof tx.finalPrice === 'object' ? parseFloat(tx.finalPrice.toString()) : parseFloat(tx.finalPrice || '0'),
                }));
                setTransactions(mapped);
            } else if (res.status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_info');
                window.location.href = '/auth';
            }
        } catch (err) {
            console.error('Error:', err);
            toast.error(t.error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormData = async () => {
        const token = getToken();
        try {
            const [vRes, cRes] = await Promise.all([
                fetch(`${API_URL}/vehicles`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/customers`, { headers: { 'Authorization': `Bearer ${token}` } }),
            ]);
            if (vRes.ok) setVehicles(await vRes.json());
            if (cRes.ok) setCustomers(await cRes.json());
        } catch (err) {
            console.error('Error loading form data:', err);
        }
    };

    // Calculate Installment
    useEffect(() => {
        if (txForm.paymentType === 'CREDIT' && txForm.finalPrice && txForm.downPayment && txForm.tenorMonths && txForm.interestRate) {
            const price = parseFloat(txForm.finalPrice);
            const dp = parseFloat(txForm.downPayment);
            const rate = parseFloat(txForm.interestRate);
            const tenor = parseInt(txForm.tenorMonths);

            if (price > 0 && dp >= 0 && tenor > 0) {
                const loanAmount = price - dp;
                const monthlyInterest = (rate / 100) / 12;

                let installment = 0;
                if (monthlyInterest === 0) {
                    installment = loanAmount / tenor;
                } else {
                    installment = loanAmount * (monthlyInterest * Math.pow(1 + monthlyInterest, tenor)) / (Math.pow(1 + monthlyInterest, tenor) - 1);
                }
                setMonthlyInstallment(Math.round(installment));
            } else {
                setMonthlyInstallment(0);
            }
        } else {
            setMonthlyInstallment(0);
        }
    }, [txForm.finalPrice, txForm.downPayment, txForm.interestRate, txForm.tenorMonths, txForm.paymentType]);

    const handleCreateTransaction = async () => {
        const token = getToken();
        if (!token || !txForm.vehicleId || !txForm.finalPrice || !txForm.customerId) {
            toast.error(t.requiredFields);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: txForm.type,
                    vehicleId: txForm.vehicleId,
                    customerId: txForm.customerId,
                    paymentType: txForm.paymentType,
                    paymentMethod: txForm.paymentMethod,
                    finalPrice: parseFloat(txForm.finalPrice),
                    notes: txForm.notes || undefined,
                    creditData: txForm.paymentType === 'CREDIT' ? {
                        creditType: txForm.leasingCompany ? 'LEASING' : 'DEALER_CREDIT', // Simple logic for now
                        leasingCompany: txForm.leasingCompany || undefined,
                        downPayment: parseFloat(txForm.downPayment),
                        interestRate: parseFloat(txForm.interestRate),
                        tenorMonths: parseInt(txForm.tenorMonths),
                    } : undefined,
                }),
            });

            if (res.ok) {
                toast.success(t.success);
                setShowModal(false);
                setTxForm({
                    type: 'SALE',
                    vehicleId: '',
                    customerId: '',
                    paymentType: 'CASH',
                    paymentMethod: 'CASH',
                    finalPrice: '',
                    date: new Date().toISOString().split('T')[0],
                    notes: '',
                    downPayment: '',
                    interestRate: '10',
                    tenorMonths: '12',
                    leasingCompany: ''
                });
                fetchTransactions();
            } else {
                const err = await res.json();
                toast.error(err.message || t.error);
            }
        } catch (err) {
            toast.error(t.error);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrintInvoice = async (txId: string) => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/pdf/transaction/${txId}/invoice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to generate PDF');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            toast.error('Gagal mencetak invoice');
            console.error(err);
        }
    };

    const handlePrintSPK = async (txId: string) => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/pdf/transaction/${txId}/spk`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to generate SPK');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            toast.error('Gagal mencetak SPK');
            console.error(err);
        }
    };

    const handlePrintReceipt = async (txId: string) => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/pdf/transaction/${txId}/receipt`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to generate Receipt');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            toast.error('Gagal mencetak Kwitansi');
            console.error(err);
        }
    };

    const filteredTx = transactions.filter(tx => {
        const matchFilter = filter === 'ALL' || tx.type === filter;
        const matchSearch = tx.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
            (tx.customerName?.toLowerCase().includes(search.toLowerCase()));
        return matchFilter && matchSearch;
    });

    const stats = {
        totalSales: transactions.filter(t => t.type === 'SALE' && t.status === 'PAID').reduce((a, b) => a + (b.finalPrice || 0), 0),
        totalPurchases: transactions.filter(t => t.type === 'PURCHASE' && t.status === 'PAID').reduce((a, b) => a + (b.finalPrice || 0), 0),
        totalProfit: transactions.filter(t => t.type === 'SALE' && t.status === 'PAID').reduce((a, b) => a + (b.profit || 0), 0),
        pending: transactions.filter(t => t.status === 'PENDING').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t.transactionTitle}</h1>
                    <p className="text-gray-500 mt-1">{t.transactionDesc}</p>
                </div>
                <button
                    onClick={() => { fetchFormData(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-[#00bfa5] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#00a896] transition-colors shadow-lg"
                >
                    <Plus className="w-5 h-5" /> {t.newTransaction}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp />} label={t.totalSoldPeriod} value={fmt(stats.totalSales)} color="emerald" />
                <StatCard icon={<ShoppingCart />} label="Total Pembelian" value={fmt(stats.totalPurchases)} color="blue" />
                <StatCard icon={<DollarSign />} label="Total Profit" value={fmt(stats.totalProfit)} color="amber" />
                <StatCard icon={<FileText />} label={t.pending} value={stats.pending.toString()} color="rose" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t.searchNameEmail}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                    />
                </div>
                <div className="flex gap-2">
                    {(['ALL', 'SALE', 'PURCHASE'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${filter === f
                                ? 'bg-[#00bfa5] text-white'
                                : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                                }`}
                        >
                            {f === 'ALL' ? t.all : f === 'SALE' ? t.saleType : t.purchaseType}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#ecf0f3] rounded-2xl shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50">
                        <tr className="text-left text-sm text-gray-500">
                            <th className="px-6 py-4">{t.saleType} / {t.purchaseType}</th>
                            <th className="px-6 py-4">{t.selectVehicle}</th>
                            <th className="px-6 py-4">{t.selectCustomer}</th>
                            <th className="px-6 py-4">{t.totalAmount}</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">{t.transactionDate}</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredTx.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tx.type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {tx.type === 'SALE' ? <TrendingUp className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                                        {tx.type === 'SALE' ? t.saleType : t.purchaseType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-800">{tx.vehicleName}</td>
                                <td className="px-6 py-4 text-gray-600">{tx.customerName || '-'}</td>
                                <td className="px-6 py-4 font-semibold text-gray-800">{fmt(tx.finalPrice)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tx.status === 'COMPLETED' ? t.completed :
                                            tx.status === 'PENDING' ? t.pending :
                                                tx.status === 'PAID' ? t.paid :
                                                    tx.status === 'CANCELLED' ? t.cancelled : tx.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(tx.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'id' ? 'id-ID' : 'en-US')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handlePrintInvoice(tx.id)}
                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-blue-600 transition-colors mr-1"
                                        title="Cetak Invoice"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handlePrintSPK(tx.id)}
                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-purple-600 transition-colors mr-1"
                                        title="Cetak SPK"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handlePrintReceipt(tx.id)}
                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-emerald-600 transition-colors mr-1"
                                        title="Cetak Kwitansi"
                                    >
                                        <Banknote className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedTx(tx)}
                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-[#00bfa5] transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredTx.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <ShoppingCart className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">
                            {search ? t.noSalesData : t.noSalesData}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                            {t.transactionDesc}
                        </p>
                        {!search && (
                            <button
                                onClick={() => { fetchFormData(); setShowModal(true); }}
                                className="px-8 py-3 rounded-xl bg-[#00bfa5] text-white font-bold shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] transition-all flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" /> {t.newTransaction}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {filteredTx.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center text-gray-500 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600 px-3">
                        {t.previous} / {t.next} {currentPage}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredTx.length / ITEMS_PER_PAGE), p + 1))}
                        disabled={currentPage >= Math.ceil(filteredTx.length / ITEMS_PER_PAGE)}
                        className="w-10 h-10 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center text-gray-500 disabled:opacity-30"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">{t.transactionTitle}</h3>
                            <button onClick={() => setSelectedTx(null)} className="p-1 hover:bg-gray-200 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <DetailRow label={t.saleType} value={selectedTx.type === 'SALE' ? t.saleType : t.purchaseType} />
                            <DetailRow label={t.selectVehicle} value={selectedTx.vehicleName} />
                            {selectedTx.customerName && <DetailRow label={t.selectCustomer} value={selectedTx.customerName} />}
                            <DetailRow label={t.totalAmount} value={fmt(selectedTx.finalPrice)} />
                            <DetailRow label={t.paymentMethod} value={selectedTx.paymentType === 'CREDIT' ? t.credit : t.cash} />
                            {selectedTx.profit && <DetailRow label="Profit" value={fmt(selectedTx.profit)} highlight />}
                            <DetailRow label={t.transactionDate} value={new Date(selectedTx.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'id' ? 'id-ID' : 'en-US')} />
                            <DetailRow label="Status" value={selectedTx.status} />
                            {selectedTx.notes && <DetailRow label={t.notes} value={selectedTx.notes} />}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Transaction Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-[#ecf0f3] z-10">
                            <h3 className="text-lg font-semibold text-gray-800">{t.newTransaction}</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-200 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">{t.saleType} / {t.purchaseType}</label>
                                <div className="flex gap-2">
                                    {(['SALE', 'PURCHASE'] as const).map((tType) => (
                                        <button
                                            key={tType}
                                            onClick={() => setTxForm({ ...txForm, type: tType })}
                                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${txForm.type === tType
                                                ? 'bg-[#00bfa5] text-white shadow-lg'
                                                : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                                                }`}
                                        >
                                            {tType === 'SALE' ? t.saleType : t.purchaseType}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Vehicle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{t.selectVehicle} *</label>
                                <select
                                    value={txForm.vehicleId}
                                    onChange={(e) => setTxForm({ ...txForm, vehicleId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                >
                                    <option value="">{t.selectVehicle}</option>
                                    {vehicles.map((v: any) => (
                                        <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year}) - {v.licensePlate || 'No Plat'}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Customer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{t.selectCustomer} *</label>
                                <select
                                    value={txForm.customerId}
                                    onChange={(e) => setTxForm({ ...txForm, customerId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                >
                                    <option value="">{t.selectCustomer}</option>
                                    {customers.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">{t.paymentMethod} *</label>
                                <div className="flex gap-2">
                                    {(['CASH', 'CREDIT'] as const).map((pt) => (
                                        <button
                                            key={pt}
                                            onClick={() => setTxForm({ ...txForm, paymentType: pt })}
                                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${txForm.paymentType === pt
                                                ? 'bg-[#00bfa5] text-white shadow-lg'
                                                : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                                                }`}
                                        >
                                            {pt === 'CASH' ? t.cash : t.credit}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method Details (Instrument) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Metode Pembayaran (Instrument)</label>
                                <select
                                    value={txForm.paymentMethod}
                                    onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                >
                                    <option value="CASH">Tunai (Cash)</option>
                                    <option value="TRANSFER">Transfer Bank</option>
                                    <option value="DEBIT">Kartu Debit</option>
                                    <option value="CREDIT_CARD">Kartu Kredit</option>
                                    <option value="QRIS">QRIS</option>
                                    <option value="CHEQUE">Cek / Giro</option>
                                </select>
                            </div>

                            {/* Credit Details */}
                            {txForm.paymentType === 'CREDIT' && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <Calculator className="w-4 h-4 text-[#00bfa5]" /> Simulasi Kredit
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Uang Muka (DP)</label>
                                            <input
                                                type="number"
                                                value={txForm.downPayment}
                                                onChange={(e) => setTxForm({ ...txForm, downPayment: e.target.value })}
                                                placeholder="Contoh: 5000000"
                                                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-[#00bfa5] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Tenor (Bulan)</label>
                                            <select
                                                value={txForm.tenorMonths}
                                                onChange={(e) => setTxForm({ ...txForm, tenorMonths: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-[#00bfa5] outline-none"
                                            >
                                                {[6, 12, 18, 24, 30, 36, 48, 60].map(m => (
                                                    <option key={m} value={m}>{m} Bulan</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Bunga (%/Tahun)</label>
                                            <input
                                                type="number"
                                                value={txForm.interestRate}
                                                onChange={(e) => setTxForm({ ...txForm, interestRate: e.target.value })}
                                                placeholder="Contoh: 10"
                                                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-[#00bfa5] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Leasing (Opsional)</label>
                                            <input
                                                type="text"
                                                value={txForm.leasingCompany}
                                                onChange={(e) => setTxForm({ ...txForm, leasingCompany: e.target.value })}
                                                placeholder="Nama Leasing"
                                                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-[#00bfa5] outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Simulation Result */}
                                    <div className="bg-[#e0f7fa] p-3 rounded-lg flex justify-between items-center">
                                        <span className="text-sm text-[#006064] font-medium">Estimasi Cicilan/Bulan:</span>
                                        <span className="text-lg font-bold text-[#00bfa5]">{fmt(monthlyInstallment)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{t.totalAmount} *</label>
                                <input
                                    type="number"
                                    value={txForm.finalPrice}
                                    onChange={(e) => setTxForm({ ...txForm, finalPrice: e.target.value })}
                                    placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{t.transactionDate}</label>
                                <input
                                    type="date"
                                    value={txForm.date}
                                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{t.notes}</label>
                                <textarea
                                    value={txForm.notes}
                                    onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                                    placeholder={t.notes}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] resize-none text-gray-700"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]"
                                >
                                    {t.back}
                                </button>
                                <button
                                    onClick={handleCreateTransaction}
                                    disabled={submitting}
                                    className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] disabled:opacity-50 transition-all"
                                >
                                    {submitting ? '...' : t.saveChanges}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-100 text-emerald-600',
        blue: 'bg-blue-100 text-blue-600',
        amber: 'bg-amber-100 text-amber-600',
        rose: 'bg-rose-100 text-rose-600',
    };
    return (
        <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
            <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
    );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500">{label}</span>
            <span className={`font-medium ${highlight ? 'text-emerald-600' : 'text-gray-800'}`}>{value}</span>
        </div>
    );
}
