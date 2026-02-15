
'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExchangeAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/api';
import { useBranch, Branch } from '@/context/BranchContext';

interface StockTransferModalProps {
    vehicle: {
        id: string;
        make: string;
        model: string;
        licensePlate?: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export default function StockTransferModal({ vehicle, onClose, onSuccess }: StockTransferModalProps) {
    const { branches, currentBranch } = useBranch();
    const [targetBranchId, setTargetBranchId] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Filter out current branch from targets
    const availableBranches = branches.filter(b => b.id !== currentBranch?.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetBranchId) {
            toast.error('Pilih cabang tujuan');
            return;
        }

        setLoading(true);
        try {
            const res = await fetchApi('/stock-transfers', {
                method: 'POST',
                body: JSON.stringify({
                    vehicleId: vehicle.id,
                    fromBranchId: currentBranch?.id,
                    toBranchId: targetBranchId,
                    notes: notes || undefined
                })
            });

            if (res.ok) {
                toast.success('Permintaan transfer berhasil dikirim');
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal mengirim permintaan');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan sistem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FontAwesomeIcon icon={faExchangeAlt} className="text-[#00bfa5]" />
                        Transfer Stock
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Vehicle Info Card */}
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                        <div className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Kendaraan</div>
                        <div className="font-bold text-gray-800">{vehicle.make} {vehicle.model}</div>
                        <div className="text-sm text-gray-500 font-mono mt-1">{vehicle.licensePlate || 'Tanpa Plat'}</div>
                    </div>

                    {/* From -> To */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Dari</label>
                            <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed">
                                {currentBranch?.name || '-'}
                            </div>
                        </div>
                        <div className="pt-5 text-gray-400">
                            <FontAwesomeIcon icon={faExchangeAlt} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Ke</label>
                            <select
                                value={targetBranchId}
                                onChange={(e) => setTargetBranchId(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00bfa5] focus:border-transparent transition-all"
                                required
                            >
                                <option value="">Pilih Cabang</option>
                                {availableBranches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#00bfa5] transition-all"
                            rows={3}
                            placeholder="Alasan transfer..."
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !targetBranchId}
                            className="flex-1 py-2.5 rounded-xl bg-[#00bfa5] text-white font-medium hover:bg-[#00a891] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00bfa5]/20"
                        >
                            {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Kirim Permintaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
