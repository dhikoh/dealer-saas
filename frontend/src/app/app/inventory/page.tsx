'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faEdit,
    faTrash,
    faEye,
    faSearch,
    faCar,
    faMotorcycle,
    faSpinner,
    faTimes,
    faMoneyBillWave,
    faCalendarAlt,
    faIdCard,
    faReceipt,
    faExclamationTriangle,
    faFileExport,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';

interface Vehicle {
    id: string;
    category: string;
    make: string;
    model: string;
    variant?: string;
    year: number;
    color: string;
    purchasePrice?: number;
    price: number;
    status: string;
    condition: string;
    licensePlate?: string;
    chassisNumber?: string;
    engineNumber?: string;
    bpkbNumber?: string;
    stnkExpiry?: string;
    bpkbAvailable: boolean;
    fakturAvailable: boolean;
    serviceBook: boolean;
    spareKey: boolean;
    costs?: VehicleCost[];
    costSummary?: {
        purchasePrice: number;
        additionalCosts: number;
        totalCost: number;
        sellingPrice: number;
        profitMargin: number;
        profitPercentage: string;
    };
}

interface VehicleCost {
    id: string;
    costType: string;
    amount: number;
    description?: string;
    date: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function InventoryPage() {
    const { t } = useLanguage();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showAddCostModal, setShowAddCostModal] = useState(false);
    const [costForm, setCostForm] = useState({
        costType: 'MAINTENANCE',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });

    const getToken = () => localStorage.getItem('token');

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setVehicles(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicleDetail = async (vehicleId: string) => {
        const token = getToken();
        if (!token) return;

        setDetailLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles/${vehicleId}/costs`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setSelectedVehicle(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch vehicle detail:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleAddCost = async () => {
        const token = getToken();
        if (!token || !selectedVehicle) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles/${selectedVehicle.id}/costs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...costForm,
                    amount: parseFloat(costForm.amount),
                    date: new Date(costForm.date),
                }),
            });

            if (res.ok) {
                setShowAddCostModal(false);
                setCostForm({ costType: 'MAINTENANCE', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
                fetchVehicleDetail(selectedVehicle.id);
            }
        } catch (error) {
            console.error('Failed to add cost:', error);
        }
    };

    const filteredData = vehicles.filter(item => {
        const searchMatch = `${item.make} ${item.model} ${item.licensePlate || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = filterStatus === 'all' || item.status.toLowerCase() === filterStatus;
        return searchMatch && statusMatch;
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            AVAILABLE: 'bg-green-100 text-green-700',
            SOLD: 'bg-red-100 text-red-700',
            BOOKED: 'bg-yellow-100 text-yellow-700',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {status === 'AVAILABLE' ? t.available : status === 'SOLD' ? t.sold : status === 'BOOKED' ? t.reserved : status}
            </span>
        );
    };

    const getConditionBadge = (condition: string) => {
        const styles: Record<string, string> = {
            READY: 'bg-green-100 text-green-700',
            REPAIR: 'bg-orange-100 text-orange-700',
            RESERVED: 'bg-blue-100 text-blue-700',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[condition] || 'bg-gray-100 text-gray-700'}`}>
                {condition}
            </span>
        );
    };

    const isTaxExpiringSoon = (expiry?: string) => {
        if (!expiry) return false;
        const expiryDate = new Date(expiry);
        const now = new Date();
        const diffDays = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 30 && diffDays >= 0;
    };

    const isTaxExpired = (expiry?: string) => {
        if (!expiry) return false;
        return new Date(expiry) < new Date();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-[#00bfa5] animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* PAGE HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t.inventoryTitle}</h1>
                    <p className="text-sm text-gray-500 mt-1">{vehicles.length} kendaraan</p>
                </div>
                <button className="px-6 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] transition-all flex items-center gap-2">
                    <FontAwesomeIcon icon={faPlus} />
                    {t.addVehicle}
                </button>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[250px]">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari merk, model, atau plat..."
                        className="w-full bg-[#ecf0f3] h-12 pl-12 pr-4 rounded-xl text-sm text-gray-600 outline-none shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] focus:ring-2 focus:ring-[#00bfa5] transition-all"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                <div className="flex gap-2">
                    {['all', 'available', 'booked', 'sold'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${filterStatus === status
                                ? 'bg-[#00bfa5] text-white shadow-lg'
                                : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5]'
                                }`}
                        >
                            {status === 'all' ? 'Semua' : status === 'available' ? t.available : status === 'sold' ? t.sold : t.reserved}
                        </button>
                    ))}
                </div>
            </div>

            {/* INVENTORY TABLE */}
            <div className="bg-[#ecf0f3] rounded-2xl shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#e0e4e8]">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Kendaraan</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Plat</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Harga Jual</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Pajak</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-[#e8ecef] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center text-[#00bfa5]">
                                                <FontAwesomeIcon icon={item.category === 'CAR' ? faCar : faMotorcycle} />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700">{item.make} {item.model}</span>
                                                <div className="text-xs text-gray-400">{item.year} • {item.color}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-mono">{item.licensePlate || '-'}</td>
                                    <td className="px-6 py-4 text-gray-700 font-semibold">{formatCurrency(Number(item.price))}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {getStatusBadge(item.status)}
                                            {getConditionBadge(item.condition)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.stnkExpiry ? (
                                            <div className={`flex items-center gap-2 ${isTaxExpired(item.stnkExpiry) ? 'text-red-600' : isTaxExpiringSoon(item.stnkExpiry) ? 'text-yellow-600' : 'text-gray-600'}`}>
                                                {(isTaxExpired(item.stnkExpiry) || isTaxExpiringSoon(item.stnkExpiry)) && (
                                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                                )}
                                                {new Date(item.stnkExpiry).toLocaleDateString('id-ID')}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedVehicle(item);
                                                    fetchVehicleDetail(item.id);
                                                    setShowDetailModal(true);
                                                }}
                                                className="w-8 h-8 rounded-lg bg-[#ecf0f3] shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff] flex items-center justify-center text-blue-500 hover:text-blue-700 transition-all"
                                            >
                                                <FontAwesomeIcon icon={faEye} size="sm" />
                                            </button>
                                            <button className="w-8 h-8 rounded-lg bg-[#ecf0f3] shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff] flex items-center justify-center text-yellow-500 hover:text-yellow-700 transition-all">
                                                <FontAwesomeIcon icon={faEdit} size="sm" />
                                            </button>
                                            <button className="w-8 h-8 rounded-lg bg-[#ecf0f3] shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff] flex items-center justify-center text-red-500 hover:text-red-700 transition-all">
                                                <FontAwesomeIcon icon={faTrash} size="sm" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredData.length === 0 && (
                    <div className="p-12 text-center">
                        <FontAwesomeIcon icon={faCar} className="text-4xl text-gray-300 mb-4" />
                        <div className="text-gray-400 text-lg">{t.noData}</div>
                    </div>
                )}
            </div>

            {/* VEHICLE DETAIL MODAL */}
            {showDetailModal && selectedVehicle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-[#ecf0f3] z-10">
                            <h2 className="text-xl font-bold text-gray-800">Detail Kendaraan</h2>
                            <button onClick={() => setShowDetailModal(false)}>
                                <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="p-12 text-center">
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#00bfa5] text-2xl" />
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* VEHICLE INFO */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">Kendaraan</div>
                                        <div className="font-bold text-gray-800">{selectedVehicle.make} {selectedVehicle.model}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">Tahun</div>
                                        <div className="font-bold text-gray-800">{selectedVehicle.year}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">Warna</div>
                                        <div className="font-bold text-gray-800">{selectedVehicle.color}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">No. Plat</div>
                                        <div className="font-bold text-gray-800 font-mono">{selectedVehicle.licensePlate || '-'}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">No. Rangka</div>
                                        <div className="font-bold text-gray-800 font-mono text-sm">{selectedVehicle.chassisNumber || '-'}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">No. Mesin</div>
                                        <div className="font-bold text-gray-800 font-mono text-sm">{selectedVehicle.engineNumber || '-'}</div>
                                    </div>
                                </div>

                                {/* COST SUMMARY */}
                                {selectedVehicle.costSummary && (
                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500" />
                                            Ringkasan Biaya
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-400">Modal</div>
                                                <div className="font-bold text-gray-800">{formatCurrency(selectedVehicle.costSummary.purchasePrice)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Biaya Tambahan</div>
                                                <div className="font-bold text-orange-600">{formatCurrency(selectedVehicle.costSummary.additionalCosts)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Total Cost</div>
                                                <div className="font-bold text-red-600">{formatCurrency(selectedVehicle.costSummary.totalCost)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">Profit</div>
                                                <div className={`font-bold ${selectedVehicle.costSummary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(selectedVehicle.costSummary.profitMargin)} ({selectedVehicle.costSummary.profitPercentage}%)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* COST LIST */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faReceipt} className="text-blue-500" />
                                            Rincian Biaya
                                        </h3>
                                        <button
                                            onClick={() => setShowAddCostModal(true)}
                                            className="px-4 py-2 rounded-lg bg-[#00bfa5] text-white text-sm font-medium hover:bg-[#00a891]"
                                        >
                                            <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                            Tambah Biaya
                                        </button>
                                    </div>

                                    {selectedVehicle.costs && selectedVehicle.costs.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedVehicle.costs.map((cost) => (
                                                <div key={cost.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                                                    <div>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${cost.costType === 'PURCHASE' ? 'bg-blue-100 text-blue-600' :
                                                            cost.costType === 'MAINTENANCE' ? 'bg-orange-100 text-orange-600' :
                                                                cost.costType === 'TAX' ? 'bg-red-100 text-red-600' :
                                                                    'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {cost.costType}
                                                        </span>
                                                        <span className="ml-2 text-gray-600">{cost.description}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-gray-800">{formatCurrency(cost.amount)}</div>
                                                        <div className="text-xs text-gray-400">{new Date(cost.date).toLocaleDateString('id-ID')}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">Belum ada rincian biaya</div>
                                    )}
                                </div>

                                {/* ACTIONS */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            const token = localStorage.getItem('token');
                                            window.open(`${process.env.NEXT_PUBLIC_API_URL}/pdf/vehicle/${selectedVehicle.id}/internal?token=${token}`, '_blank');
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faFileExport} />
                                        Export PDF (Internal)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const token = localStorage.getItem('token');
                                            window.open(`${process.env.NEXT_PUBLIC_API_URL}/pdf/vehicle/${selectedVehicle.id}/customer?token=${token}`, '_blank');
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faFileExport} />
                                        Export PDF (Customer)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADD COST MODAL */}
            {showAddCostModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Tambah Biaya</h2>
                            <button onClick={() => setShowAddCostModal(false)}>
                                <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Jenis Biaya</label>
                                <select
                                    value={costForm.costType}
                                    onChange={(e) => setCostForm({ ...costForm, costType: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                >
                                    <option value="PURCHASE">Modal (Beli)</option>
                                    <option value="MAINTENANCE">Perawatan/Service</option>
                                    <option value="TAX">Pajak</option>
                                    <option value="INSURANCE">Asuransi</option>
                                    <option value="OTHER">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Jumlah</label>
                                <input
                                    type="number"
                                    value={costForm.amount}
                                    onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                    placeholder="Rp"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Keterangan</label>
                                <input
                                    type="text"
                                    value={costForm.description}
                                    onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                    placeholder="Contoh: Service rutin"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal</label>
                                <input
                                    type="date"
                                    value={costForm.date}
                                    onChange={(e) => setCostForm({ ...costForm, date: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowAddCostModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAddCost}
                                    className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891]"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
