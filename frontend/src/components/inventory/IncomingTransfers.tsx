'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faInbox,
    faCheck,
    faTimes,
    faSpinner,
    faCar,
    faMotorcycle,
    faExchangeAlt,
    faMoneyBillWave,
    faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

interface Transfer {
    id: string;
    tenantId: string;
    targetTenantId: string;
    vehicleId: string;
    type: string;
    price: number | null;
    status: string;
    notes: string | null;
    direction: string;
    createdAt: string;
    vehicle: {
        id: string;
        make: string;
        model: string;
        licensePlate: string | null;
        category: string;
        year: number;
        color: string;
    };
    tenant: { id: string; name: string };
    targetTenant: { id: string; name: string } | null;
    requestedBy: { id: string; name: string } | null;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);

export default function IncomingTransfers() {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [tab, setTab] = useState<'INCOMING' | 'OUTGOING' | 'HISTORY'>('INCOMING');

    // Confirmation dialog state
    const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
    const [confirmNotes, setConfirmNotes] = useState('');

    useEffect(() => {
        fetchTransfers();
    }, []);

    const getToken = () => localStorage.getItem('access_token');

    const fetchTransfers = async () => {
        const token = getToken();
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/stock-transfers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setTransfers(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch transfers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!confirmAction) return;
        const { id, action } = confirmAction;
        const token = getToken();
        if (!token) return;
        setProcessingId(id);

        try {
            const res = await fetch(`${API_URL}/stock-transfers/${id}/${action}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ notes: confirmNotes || undefined }),
            });

            if (res.ok) {
                toast.success(action === 'approve' ? 'Transfer diterima!' : 'Transfer ditolak.');
                fetchTransfers();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal memproses transfer');
            }
        } catch {
            toast.error('Terjadi kesalahan jaringan');
        } finally {
            setProcessingId(null);
            setConfirmAction(null);
            setConfirmNotes('');
        }
    };

    const handleCancel = async (id: string) => {
        const token = getToken();
        if (!token) return;
        setProcessingId(id);
        try {
            const res = await fetch(`${API_URL}/stock-transfers/${id}/cancel`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success('Transfer dibatalkan');
                fetchTransfers();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal membatalkan');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredTransfers = transfers.filter((t) => {
        if (tab === 'INCOMING') return t.direction === 'INCOMING' && t.status === 'PENDING';
        if (tab === 'OUTGOING') return t.direction === 'OUTGOING' && t.status === 'PENDING';
        return t.status !== 'PENDING'; // HISTORY
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <FontAwesomeIcon icon={faSpinner} className="text-[#00bfa5] animate-spin text-2xl" />
            </div>
        );
    }

    const incomingCount = transfers.filter((t) => t.direction === 'INCOMING' && t.status === 'PENDING').length;
    const outgoingCount = transfers.filter((t) => t.direction === 'OUTGOING' && t.status === 'PENDING').length;

    return (
        <div>
            {/* TAB BAR */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: 'INCOMING' as const, label: 'Permintaan Masuk', count: incomingCount, color: 'bg-red-500' },
                    { key: 'OUTGOING' as const, label: 'Permintaan Keluar', count: outgoingCount, color: 'bg-blue-500' },
                    { key: 'HISTORY' as const, label: 'Riwayat', count: 0, color: '' },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all relative ${tab === t.key
                                ? 'bg-[#00bfa5] text-white shadow-lg'
                                : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5]'
                            }`}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span className={`absolute -top-2 -right-2 w-5 h-5 ${t.color} text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse`}>
                                {t.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* TRANSFER LIST */}
            {filteredTransfers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <FontAwesomeIcon icon={faInbox} className="text-5xl mb-4" />
                    <p className="text-lg font-medium">
                        {tab === 'INCOMING' ? 'Tidak ada permintaan masuk' : tab === 'OUTGOING' ? 'Tidak ada permintaan keluar' : 'Belum ada riwayat'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTransfers.map((transfer) => (
                        <div
                            key={transfer.id}
                            className="bg-[#ecf0f3] rounded-2xl shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] p-5 transition-all hover:shadow-[7px_7px_14px_#cbced1,-7px_-7px_14px_#ffffff]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* LEFT: Vehicle Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-[#ecf0f3] shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center text-[#00bfa5]">
                                        <FontAwesomeIcon icon={transfer.vehicle.category === 'CAR' ? faCar : faMotorcycle} className="text-lg" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">
                                            {transfer.vehicle.make} {transfer.vehicle.model}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {transfer.vehicle.year} • {transfer.vehicle.color} • {transfer.vehicle.licensePlate || 'Tanpa Plat'}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <span className="font-medium text-gray-700">{transfer.tenant.name}</span>
                                            <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                                            <span className="font-medium text-gray-700">{transfer.targetTenant?.name || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: Type & Price */}
                                <div className="text-right">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${transfer.type === 'SALE'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={transfer.type === 'SALE' ? faMoneyBillWave : faExchangeAlt} />
                                        {transfer.type === 'SALE' ? 'Jual Beli' : 'Mutasi'}
                                    </span>
                                    {transfer.type === 'SALE' && transfer.price && (
                                        <div className="text-lg font-bold text-green-600 mt-1">
                                            {formatCurrency(Number(transfer.price))}
                                        </div>
                                    )}
                                    {transfer.status !== 'PENDING' && (
                                        <span
                                            className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${transfer.status === 'APPROVED'
                                                    ? 'bg-green-100 text-green-700'
                                                    : transfer.status === 'REJECTED'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}
                                        >
                                            {transfer.status === 'APPROVED' ? 'Diterima' : transfer.status === 'REJECTED' ? 'Ditolak' : 'Dibatalkan'}
                                        </span>
                                    )}
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(transfer.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            {/* NOTES */}
                            {transfer.notes && (
                                <div className="mt-3 p-3 bg-white/30 rounded-lg text-sm text-gray-600 italic">
                                    &ldquo;{transfer.notes}&rdquo;
                                </div>
                            )}

                            {/* ACTIONS */}
                            {transfer.status === 'PENDING' && (
                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
                                    {transfer.direction === 'INCOMING' ? (
                                        <>
                                            <button
                                                onClick={() => setConfirmAction({ id: transfer.id, action: 'reject' })}
                                                disabled={processingId === transfer.id}
                                                className="px-5 py-2 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-all flex items-center gap-2"
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                                Tolak
                                            </button>
                                            <button
                                                onClick={() => setConfirmAction({ id: transfer.id, action: 'approve' })}
                                                disabled={processingId === transfer.id}
                                                className="px-5 py-2 rounded-xl bg-green-500 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.02] transition-all flex items-center gap-2"
                                            >
                                                {processingId === transfer.id ? (
                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faCheck} />
                                                )}
                                                Terima Transfer
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleCancel(transfer.id)}
                                            disabled={processingId === transfer.id}
                                            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
                                        >
                                            {processingId === transfer.id ? (
                                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            ) : (
                                                <FontAwesomeIcon icon={faTimes} />
                                            )}
                                            Batalkan
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* CONFIRMATION DIALOG */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
                        <div
                            className={`p-4 ${confirmAction.action === 'approve'
                                    ? 'bg-gradient-to-r from-green-600 to-green-500'
                                    : 'bg-gradient-to-r from-red-600 to-red-500'
                                }`}
                        >
                            <h3 className="text-white font-bold text-lg">
                                {confirmAction.action === 'approve' ? '✅ Konfirmasi Terima Transfer' : '❌ Konfirmasi Tolak Transfer'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-700">
                                {confirmAction.action === 'approve'
                                    ? 'Apakah Anda yakin ingin MENERIMA transfer ini? Kendaraan akan ditambahkan ke inventaris Anda dan transaksi keuangan akan dicatat otomatis.'
                                    : 'Apakah Anda yakin ingin MENOLAK transfer ini? Kendaraan tetap menjadi milik pengirim.'}
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Catatan (Opsional)</label>
                                <textarea
                                    value={confirmNotes}
                                    onChange={(e) => setConfirmNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Tambahkan catatan..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setConfirmAction(null);
                                        setConfirmNotes('');
                                    }}
                                    className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={processingId !== null}
                                    className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all disabled:opacity-50 ${confirmAction.action === 'approve'
                                            ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30'
                                            : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                                        }`}
                                >
                                    {processingId
                                        ? 'Memproses...'
                                        : confirmAction.action === 'approve'
                                            ? 'Ya, Terima'
                                            : 'Ya, Tolak'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
