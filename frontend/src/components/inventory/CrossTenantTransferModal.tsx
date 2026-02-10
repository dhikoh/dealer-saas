'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt, faStore, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import NeumorphicSelect from '@/components/NeumorphicSelect';

interface CrossTenantTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string;
    vehicleName: string;
    onSuccess: () => void;
}

interface GroupMember {
    id: string;
    name: string;
    address?: string;
}

export default function CrossTenantTransferModal({ isOpen, onClose, vehicleId, vehicleName, onSuccess }: CrossTenantTransferModalProps) {
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const [targetTenantId, setTargetTenantId] = useState('');
    const [transferType, setTransferType] = useState('MUTATION'); // MUTATION | SALE
    const [price, setPrice] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchGroupMembers();
        }
    }, [isOpen]);

    const fetchGroupMembers = async () => {
        setLoadingMembers(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/dealer-groups/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.members) {
                    // Filter out myself? Logic needs current tenant ID. 
                    // Backend filter is better, or just show all and let backend reject same tenant.
                    // For now, list all. Backend will catch if selecting self.
                    setMembers(data.members);
                }
            } else {
                toast.error('Gagal memuat daftar dealer group');
            }
        } catch (error) {
            toast.error('Gagal memuat anggota grup');
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            vehicleId,
            targetTenantId,
            type: transferType,
            price: transferType === 'SALE' ? parseFloat(price.replace(/[^0-9]/g, '')) : undefined,
            notes
        };

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/stock-transfers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Permintaan transfer berhasil dikirim');
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal mengirim transfer');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <FontAwesomeIcon icon={faExchangeAlt} />
                        Transfer Stok Antar Dealer
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                        Kendaraan: <strong>{vehicleName}</strong>
                    </div>

                    {/* SELECT DEALER */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Dealer</label>
                        {loadingMembers ? (
                            <div className="text-sm text-gray-400">Memuat dealer...</div>
                        ) : members.length === 0 ? (
                            <div className="text-sm text-red-500">Anda belum bergabung dalam grup dealer.</div>
                        ) : (
                            <NeumorphicSelect
                                name="targetTenant"
                                options={members.map(m => ({ code: m.id, label: m.name }))}
                                value={targetTenantId}
                                onChange={(name, val) => setTargetTenantId(val)}
                                placeholder="Pilih Dealer Tujuan"
                            />
                        )}
                    </div>

                    {/* TYPE SELECTION */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Transfer</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setTransferType('MUTATION')}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${transferType === 'MUTATION'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200'
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <FontAwesomeIcon icon={faExchangeAlt} className="text-lg" />
                                <span className="text-sm font-bold">Mutasi (Gratis)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTransferType('SALE')}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${transferType === 'SALE'
                                    ? 'bg-green-50 border-green-500 text-green-700 ring-2 ring-green-200'
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-lg" />
                                <span className="text-sm font-bold">Jual Beli</span>
                            </button>
                        </div>
                    </div>

                    {/* PRICE INPUT (IF SALE) */}
                    {transferType === 'SALE' && (
                        <div className="animate-fade-in-down">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Kesepakatan (Rp)</label>
                            <input
                                type="text"
                                value={price}
                                onChange={(e) => {
                                    // Format currency
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setPrice(new Intl.NumberFormat('id-ID').format(parseInt(val || '0')));
                                }}
                                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-right font-mono font-bold text-lg"
                                placeholder="0"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Transaksi penjualan akan otomatis dicatat untuk Anda, dan pembelian untuk dealer tujuan.
                            </p>
                        </div>
                    )}

                    {/* NOTES */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Contoh: Dikirim via towing Pak Budi jam 2 siang..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !targetTenantId || (transferType === 'SALE' && !price)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {submitting ? 'Mengirim...' : 'Kirim Transfer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
