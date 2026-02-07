'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, DollarSign, ShoppingCart, TrendingUp, TrendingDown, Eye, FileText, X, Check } from 'lucide-react';

interface Transaction {
    id: string;
    type: 'SALE' | 'PURCHASE';
    vehicleId: string;
    vehicleName: string;
    customerId?: string;
    customerName?: string;
    amount: number;
    profit?: number;
    date: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'SALE' | 'PURCHASE'>('ALL');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTransactions(await res.json());
            } else {
                // Mock data
                setTransactions([
                    { id: '1', type: 'SALE', vehicleId: 'v1', vehicleName: 'Toyota Avanza 2022', customerId: 'c1', customerName: 'Budi Santoso', amount: 195000000, profit: 15000000, date: '2026-02-05', status: 'COMPLETED' },
                    { id: '2', type: 'PURCHASE', vehicleId: 'v2', vehicleName: 'Honda Jazz 2021', amount: 165000000, date: '2026-02-03', status: 'COMPLETED' },
                    { id: '3', type: 'SALE', vehicleId: 'v3', vehicleName: 'Suzuki Ertiga 2023', customerId: 'c2', customerName: 'Dewi Sari', amount: 220000000, profit: 18000000, date: '2026-02-01', status: 'PENDING', notes: 'Menunggu DP' },
                    { id: '4', type: 'PURCHASE', vehicleId: 'v4', vehicleName: 'Daihatsu Xenia 2020', amount: 140000000, date: '2026-01-28', status: 'COMPLETED' },
                ]);
            }
        } catch (err) {
            console.error('Error:', err);
            setTransactions([]);
        } finally {
            setLoading(false);
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
        totalSales: transactions.filter(t => t.type === 'SALE' && t.status === 'COMPLETED').reduce((a, b) => a + b.amount, 0),
        totalPurchases: transactions.filter(t => t.type === 'PURCHASE' && t.status === 'COMPLETED').reduce((a, b) => a + b.amount, 0),
        totalProfit: transactions.filter(t => t.type === 'SALE' && t.status === 'COMPLETED').reduce((a, b) => a + (b.profit || 0), 0),
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
                    onClick={() => setShowModal(true)}
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
                        {filteredTx.map((tx) => (
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
                                <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">{formatCurrency(tx.amount)}</td>
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
                            <DetailRow label="Jumlah" value={formatCurrency(selectedTx.amount)} />
                            {selectedTx.profit && <DetailRow label="Profit" value={formatCurrency(selectedTx.profit)} highlight />}
                            <DetailRow label="Tanggal" value={new Date(selectedTx.date).toLocaleDateString('id-ID')} />
                            <DetailRow label="Status" value={selectedTx.status} />
                            {selectedTx.notes && <DetailRow label="Catatan" value={selectedTx.notes} />}
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
