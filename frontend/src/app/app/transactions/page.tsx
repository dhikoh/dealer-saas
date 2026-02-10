'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, DollarSign, ShoppingCart, TrendingUp, TrendingDown, Eye, FileText, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

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

import { API_URL } from '@/lib/api';

export default function TransactionsPage() {
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
        finalPrice: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
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
                const mapped = data.map((tx: any) => ({
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
            toast.error('Gagal memuat data transaksi');
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

    const handleCreateTransaction = async () => {
        const token = getToken();
        if (!token || !txForm.vehicleId || !txForm.finalPrice || !txForm.customerId) {
            toast.error('Mohon lengkapi data kendaraan, customer, dan harga');
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
                    finalPrice: parseFloat(txForm.finalPrice),
                    notes: txForm.notes || undefined,
                }),
            });

            if (res.ok) {
                toast.success('Transaksi berhasil dibuat');
                setShowModal(false);
                setTxForm({ type: 'SALE', vehicleId: '', customerId: '', paymentType: 'CASH', finalPrice: '', date: new Date().toISOString().split('T')[0], notes: '' });
                fetchTransactions();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal membuat transaksi');
            }
        } catch (err) {
            toast.error('Gagal membuat transaksi');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transaksi</h1>
                    <p className="text-gray-500 mt-1">Kelola penjualan dan pembelian kendaraan</p>
                </div>
                <button
                    onClick={() => { fetchFormData(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-[#00bfa5] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#00a896] transition-colors shadow-lg"
                >
                    <Plus className="w-5 h-5" /> Tambah Transaksi
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp />} label="Total Penjualan" value={formatCurrency(stats.totalSales)} color="emerald" />
                <StatCard icon={<ShoppingCart />} label="Total Pembelian" value={formatCurrency(stats.totalPurchases)} color="blue" />
                <StatCard icon={<DollarSign />} label="Total Profit" value={formatCurrency(stats.totalProfit)} color="amber" />
                <StatCard icon={<FileText />} label="Pending" value={stats.pending.toString()} color="rose" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari kendaraan atau customer..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-800 border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700 dark:text-white"
                    />
                </div>
                <div className="flex gap-2">
                    {(['ALL', 'SALE', 'PURCHASE'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${filter === f
                                ? 'bg-[#00bfa5] text-white'
                                : 'bg-[#ecf0f3] dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none'
                                }`}
                        >
                            {f === 'ALL' ? 'Semua' : f === 'SALE' ? 'Penjualan' : 'Pembelian'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] dark:shadow-none overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                        <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                            <th className="px-6 py-4">Tipe</th>
                            <th className="px-6 py-4">Kendaraan</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Jumlah</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredTx.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tx.type === 'SALE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {tx.type === 'SALE' ? <TrendingUp className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                                        {tx.type === 'SALE' ? 'Jual' : 'Beli'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">{tx.vehicleName}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{tx.customerName || '-'}</td>
                                <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{formatCurrency(tx.finalPrice)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedTx(tx)}
                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-[#00bfa5] transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredTx.length === 0 && (
                    <div className="text-center py-12 text-gray-500">Tidak ada transaksi ditemukan</div>
                )}
            </div>

            {/* Pagination */}
            {filteredTx.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 rounded-xl bg-[#ecf0f3] dark:bg-gray-800 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none flex items-center justify-center text-gray-500 disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
                        Halaman {currentPage} dari {Math.ceil(filteredTx.length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredTx.length / ITEMS_PER_PAGE), p + 1))}
                        disabled={currentPage >= Math.ceil(filteredTx.length / ITEMS_PER_PAGE)}
                        className="w-10 h-10 rounded-xl bg-[#ecf0f3] dark:bg-gray-800 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none flex items-center justify-center text-gray-500 disabled:opacity-30"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Detail Transaksi</h3>
                            <button onClick={() => setSelectedTx(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <DetailRow label="Tipe" value={selectedTx.type === 'SALE' ? 'Penjualan' : 'Pembelian'} />
                            <DetailRow label="Kendaraan" value={selectedTx.vehicleName} />
                            {selectedTx.customerName && <DetailRow label="Customer" value={selectedTx.customerName} />}
                            <DetailRow label="Jumlah" value={formatCurrency(selectedTx.finalPrice)} />
                            <DetailRow label="Pembayaran" value={selectedTx.paymentType === 'CREDIT' ? 'Kredit' : 'Tunai'} />
                            {selectedTx.profit && <DetailRow label="Profit" value={formatCurrency(selectedTx.profit)} highlight />}
                            <DetailRow label="Tanggal" value={new Date(selectedTx.date).toLocaleDateString('id-ID')} />
                            <DetailRow label="Status" value={selectedTx.status} />
                            {selectedTx.notes && <DetailRow label="Catatan" value={selectedTx.notes} />}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Transaction Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-[#ecf0f3] dark:bg-gray-800 z-10">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Tambah Transaksi</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Tipe Transaksi</label>
                                <div className="flex gap-2">
                                    {(['SALE', 'PURCHASE'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTxForm({ ...txForm, type: t })}
                                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${txForm.type === t
                                                ? 'bg-[#00bfa5] text-white shadow-lg'
                                                : 'bg-[#ecf0f3] dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none'
                                                }`}
                                        >
                                            {t === 'SALE' ? 'Penjualan' : 'Pembelian'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Vehicle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Kendaraan *</label>
                                <select
                                    value={txForm.vehicleId}
                                    onChange={(e) => setTxForm({ ...txForm, vehicleId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700 dark:text-white"
                                >
                                    <option value="">Pilih Kendaraan</option>
                                    {vehicles.map((v: any) => (
                                        <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year}) - {v.licensePlate || 'No Plat'}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Customer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Customer *</label>
                                <select
                                    value={txForm.customerId}
                                    onChange={(e) => setTxForm({ ...txForm, customerId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700 dark:text-white"
                                >
                                    <option value="">Pilih Customer</option>
                                    {customers.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Tipe Pembayaran *</label>
                                <div className="flex gap-2">
                                    {(['CASH', 'CREDIT'] as const).map((pt) => (
                                        <button
                                            key={pt}
                                            onClick={() => setTxForm({ ...txForm, paymentType: pt })}
                                            className={`flex-1 py-3 rounded-xl font-medium transition-all ${txForm.paymentType === pt
                                                ? 'bg-[#00bfa5] text-white shadow-lg'
                                                : 'bg-[#ecf0f3] dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none'
                                                }`}
                                        >
                                            {pt === 'CASH' ? 'Tunai' : 'Kredit'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Harga *</label>
                                <input
                                    type="number"
                                    value={txForm.finalPrice}
                                    onChange={(e) => setTxForm({ ...txForm, finalPrice: e.target.value })}
                                    placeholder="Contoh: 195000000"
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    value={txForm.date}
                                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Catatan</label>
                                <textarea
                                    value={txForm.notes}
                                    onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                                    placeholder="Catatan tambahan..."
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#00bfa5] resize-none text-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleCreateTransaction}
                                    disabled={submitting}
                                    className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] disabled:opacity-50 transition-all"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
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
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    };
    return (
        <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] dark:shadow-none">
            <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
        </div>
    );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`font-medium ${highlight ? 'text-emerald-600' : 'text-gray-800 dark:text-white'}`}>{value}</span>
        </div>
    );
}
