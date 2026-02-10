
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt, faCheck, faTimes, faSpinner, faArrowRight, faClock, faBan } from '@fortawesome/free-solid-svg-icons';
import { useBranch } from '@/context/BranchContext';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

interface StockTransfer {
    id: string;
    vehicle: {
        make: string;
        model: string;
        year: number;
        licensePlate?: string;
    };
    fromBranch: { id: string; name: string };
    toBranch: { id: string; name: string };
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    notes?: string;
    createdAt: string;
}

export default function StockTransferPage() {
    const { currentBranch } = useBranch();
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'history'>('incoming');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchTransfers = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const res = await fetch(`${API_URL}/stock-transfers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setTransfers(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch transfers:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransfers();
    }, [fetchTransfers]);

    const handleAction = async (id: string, action: 'approve' | 'reject' | 'cancel') => {
        setProcessingId(id);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/stock-transfers/${id}/${action}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success(`Transfer berhasil ${action === 'approve' ? 'disetujui' : action === 'reject' ? 'ditolak' : 'dibatalkan'}`);
                fetchTransfers();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal memproses transfer');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan sistem');
        } finally {
            setProcessingId(null);
        }
    };

    const getFilteredTransfers = () => {
        if (!currentBranch) return [];

        return transfers.filter(t => {
            if (activeTab === 'incoming') {
                return t.toBranch.id === currentBranch.id && t.status === 'PENDING';
            }
            if (activeTab === 'outgoing') {
                return t.fromBranch.id === currentBranch.id && t.status === 'PENDING';
            }
            if (activeTab === 'history') {
                return (t.fromBranch.id === currentBranch.id || t.toBranch.id === currentBranch.id) && t.status !== 'PENDING';
            }
            return false;
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">Disetujui</span>;
            case 'REJECTED': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">Ditolak</span>;
            case 'CANCELLED': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold">Dibatalkan</span>;
            default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-bold">Menunggu</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-[#00bfa5]" />
            </div>
        );
    }

    const filteredTransfers = getFilteredTransfers();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <FontAwesomeIcon icon={faExchangeAlt} className="text-[#00bfa5]" />
                Manajemen Transfer Stock
            </h1>

            {/* TAB NAV */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('incoming')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'incoming' ? 'border-[#00bfa5] text-[#00bfa5]' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Permintaan Masuk
                </button>
                <button
                    onClick={() => setActiveTab('outgoing')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'outgoing' ? 'border-[#00bfa5] text-[#00bfa5]' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Permintaan Keluar
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'history' ? 'border-[#00bfa5] text-[#00bfa5]' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Riwayat
                </button>
            </div>

            {/* LIST */}
            <div className="space-y-4">
                {filteredTransfers.length > 0 ? (
                    filteredTransfers.map((t) => (
                        <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-gray-800 text-lg">{t.vehicle.make} {t.vehicle.model}</span>
                                    <span className="text-gray-400 text-sm">{t.vehicle.year}</span>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">{t.vehicle.licensePlate || 'NO PLAT'}</span>
                                    {activeTab === 'history' && getStatusBadge(t.status)}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium text-gray-700">{t.fromBranch.name}</span>
                                        <FontAwesomeIcon icon={faArrowRight} className="text-xs text-gray-400 mx-1" />
                                        <span className="font-medium text-gray-700">{t.toBranch.name}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <FontAwesomeIcon icon={faClock} className="text-xs" />
                                        {formatDate(t.createdAt)}
                                    </div>
                                </div>
                                {t.notes && (
                                    <div className="mt-2 text-sm text-gray-600 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-100 inline-block">
                                        "{t.notes}"
                                    </div>
                                )}
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-2">
                                {activeTab === 'incoming' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(t.id, 'reject')}
                                            disabled={!!processingId}
                                            className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                            {processingId === t.id ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Tolak'}
                                        </button>
                                        <button
                                            onClick={() => handleAction(t.id, 'approve')}
                                            disabled={!!processingId}
                                            className="px-4 py-2 rounded-lg bg-[#00bfa5] text-white font-medium hover:bg-[#00a891] transition-colors disabled:opacity-50 shadow-md shadow-[#00bfa5]/20"
                                        >
                                            {processingId === t.id ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Terima'}
                                        </button>
                                    </>
                                )}
                                {activeTab === 'outgoing' && (
                                    <button
                                        onClick={() => handleAction(t.id, 'cancel')}
                                        disabled={!!processingId}
                                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        {processingId === t.id ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Batalkan'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <FontAwesomeIcon icon={faExchangeAlt} className="text-2xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">Tidak ada data</h3>
                        <p className="text-gray-500 text-sm">Belum ada permintaan transfer stock pada kategori ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
