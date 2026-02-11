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
    faChevronLeft,
    faChevronRight,
    faExchangeAlt,
    faInbox,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import CrossTenantTransferModal from '@/components/inventory/CrossTenantTransferModal';
import IncomingTransfers from '@/components/inventory/IncomingTransfers';
import VehicleImageUploader from '@/components/inventory/VehicleImageUploader';
import DocumentUploader from '@/components/inventory/DocumentUploader';


interface Vehicle {
    id: string;
    branchId: string;
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
    // New Fields
    purchaseDate?: string;
    conditionNote?: string;
    isShowroom?: boolean;
    bpkbNumber?: string;
    stnkExpiry?: string;
    bpkbAvailable: boolean;
    fakturAvailable: boolean;
    serviceBook: boolean;
    spareKey: boolean;
    specs?: string;
    images?: string; // JSON
    ktpOwnerImage?: string;
    stnkImage?: string;
    bpkbImage?: string;
    taxImage?: string;
    bpkbOwnerName?: string;
    isOwnerDifferent?: boolean;
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
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    // Transfer Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferVehicle, setTransferVehicle] = useState<Vehicle | null>(null);

    // Page-level tab: INVENTORY or TRANSFERS
    const [pageTab, setPageTab] = useState<'INVENTORY' | 'TRANSFERS'>('INVENTORY');

    // Image/Document state for vehicle modal
    const [vehicleImages, setVehicleImages] = useState<string[]>([]);
    const [vehicleDocs, setVehicleDocs] = useState<Record<string, string | null>>({
        ktpOwnerImage: null, stnkImage: null, bpkbImage: null, taxImage: null,
    });

    const [submitting, setSubmitting] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({
        category: 'CAR',
        make: '',
        model: '',
        variant: '',
        year: new Date().getFullYear(),
        color: '',
        price: '',
        purchasePrice: '',
        purchaseDate: '',
        status: 'AVAILABLE',
        condition: 'READY',
        conditionNote: '',
        isShowroom: true,
        licensePlate: '',
        chassisNumber: '',
        engineNumber: '',
        bpkbNumber: '',
        stnkExpiry: '',
        bpkbAvailable: true,
        fakturAvailable: true,
        serviceBook: false,
        spareKey: false,
        specs: '',
        branchId: '',
        // Identity Fields
        isOwnerDifferent: false,
        bpkbOwnerName: '',
    });

    // Master Data State
    const [brands, setBrands] = useState<any[]>([]);
    const [availableModels, setAvailableModels] = useState<any[]>([]);

    // Fetch brands when category changes
    useEffect(() => {
        if (showVehicleModal) {
            fetchBrands();
        }
    }, [vehicleForm.category, showVehicleModal]);

    const fetchBrands = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/vehicles/brands/list?category=${vehicleForm.category}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setBrands(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch brands');
        }
    };

    // Update available models when Make changes
    useEffect(() => {
        const selectedBrand = brands.find(b => b.name === vehicleForm.make);
        if (selectedBrand) {
            setAvailableModels(selectedBrand.models || []);
        } else {
            setAvailableModels([]);
        }
    }, [vehicleForm.make, brands]);
    const [costForm, setCostForm] = useState({
        costType: 'MAINTENANCE',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const getToken = () => localStorage.getItem('access_token');

    const resetVehicleForm = () => {
        setVehicleForm({
            category: 'CAR', make: '', model: '', variant: '', year: new Date().getFullYear(), color: '', price: '', purchasePrice: '',
            purchaseDate: '', status: 'AVAILABLE', condition: 'READY', conditionNote: '', isShowroom: true, licensePlate: '',
            chassisNumber: '', engineNumber: '', bpkbNumber: '', stnkExpiry: '', bpkbAvailable: true, fakturAvailable: true,
            serviceBook: false, spareKey: false, specs: '', branchId: '', isOwnerDifferent: false, bpkbOwnerName: '',
        });
        setVehicleImages([]);
        setVehicleDocs({ ktpOwnerImage: null, stnkImage: null, bpkbImage: null, taxImage: null });
        setEditingVehicle(null);
    };

    useEffect(() => {
        fetchVehicles();
    }, []);;

    const fetchVehicles = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/vehicles`, {
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
            const res = await fetch(`${API_URL}/vehicles/${vehicleId}/costs`, {
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
            const res = await fetch(`${API_URL}/vehicles/${selectedVehicle.id}/costs`, {
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
                toast.success('Biaya berhasil ditambahkan');
                setShowAddCostModal(false);
                setCostForm({ costType: 'MAINTENANCE', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
                fetchVehicleDetail(selectedVehicle.id);
            } else {
                toast.error('Gagal menambah biaya');
            }
        } catch (error) {
            toast.error('Gagal menambah biaya');
        }
    };

    const handleSaveVehicle = async () => {
        const token = getToken();
        if (!token || !vehicleForm.make || !vehicleForm.model || !vehicleForm.price) {
            toast.error('Mohon lengkapi merk, model, dan harga');
            return;
        }

        // VALIDATION: Showroom requires at least 1 photo
        if (vehicleForm.isShowroom && vehicleImages.length === 0) {
            toast.error('Minimal 1 foto wajib diupload untuk tampil di Showroom/Website');
            return;
        }

        // VALIDATION: Identity mismatch requires name
        if (vehicleForm.isOwnerDifferent && !vehicleForm.bpkbOwnerName.trim()) {
            toast.error('Nama pemilik BPKB wajib diisi jika berbeda dengan pemilik KTP');
            return;
        }

        setSubmitting(true);
        try {
            const url = editingVehicle
                ? `${API_URL}/vehicles/${editingVehicle.id}`
                : `${API_URL}/vehicles`;
            const method = editingVehicle ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...vehicleForm,
                    price: parseFloat(vehicleForm.price),
                    purchasePrice: vehicleForm.purchasePrice ? parseFloat(vehicleForm.purchasePrice) : undefined,
                    year: Number(vehicleForm.year),
                    images: JSON.stringify(vehicleImages), // Send images
                    ...vehicleDocs, // Send document URLs
                }),
            });

            if (res.ok) {
                toast.success(editingVehicle ? 'Kendaraan berhasil diperbarui' : 'Kendaraan berhasil ditambahkan');
                setShowVehicleModal(false);
                resetVehicleForm();
                fetchVehicles();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menyimpan kendaraan');
            }
        } catch (error) {
            toast.error('Gagal menyimpan kendaraan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteVehicle = async () => {
        const token = getToken();
        if (!token || !deleteTarget) return;

        try {
            const res = await fetch(`${API_URL}/vehicles/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Kendaraan berhasil dihapus');
                setShowDeleteConfirm(false);
                setDeleteTarget(null);
                fetchVehicles();
            } else {
                toast.error('Gagal menghapus kendaraan');
            }
        } catch (error) {
            toast.error('Gagal menghapus kendaraan');
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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t.inventoryTitle}</h1>
                    <p className="text-sm text-gray-500 mt-1">{vehicles.length} kendaraan</p>
                </div>
                {pageTab === 'INVENTORY' && (
                    <button
                        onClick={() => { resetVehicleForm(); setShowVehicleModal(true); }}
                        className="px-6 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] transition-all flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        {t.addVehicle}
                    </button>
                )}
            </div>

            {/* PAGE-LEVEL TABS */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setPageTab('INVENTORY')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${pageTab === 'INVENTORY'
                        ? 'bg-[#00bfa5] text-white shadow-lg'
                        : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5]'
                        }`}
                >
                    <FontAwesomeIcon icon={faCar} />
                    Unit
                </button>
                <button
                    onClick={() => setPageTab('TRANSFERS')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${pageTab === 'TRANSFERS'
                        ? 'bg-[#00bfa5] text-white shadow-lg'
                        : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5]'
                        }`}
                >
                    <FontAwesomeIcon icon={faInbox} />
                    Transfer Stok
                </button>
            </div>

            {/* TRANSFERS TAB CONTENT */}
            {pageTab === 'TRANSFERS' && <IncomingTransfers />}

            {/* INVENTORY TAB CONTENT */}
            {pageTab === 'INVENTORY' && (<>

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
                                {filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((item) => (
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
                                                <button
                                                    onClick={() => {
                                                        setEditingVehicle(item);
                                                        setVehicleForm({
                                                            category: item.category,
                                                            make: item.make,
                                                            model: item.model,
                                                            variant: item.variant || '',
                                                            year: item.year,
                                                            color: item.color,
                                                            price: String(item.price),
                                                            purchasePrice: item.purchasePrice ? String(item.purchasePrice) : '',
                                                            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
                                                            status: item.status,
                                                            condition: item.condition,
                                                            conditionNote: item.conditionNote || '',
                                                            isShowroom: item.isShowroom !== undefined ? item.isShowroom : true,
                                                            licensePlate: item.licensePlate || '',
                                                            chassisNumber: item.chassisNumber || '',
                                                            engineNumber: item.engineNumber || '',
                                                            bpkbNumber: item.bpkbNumber || '',
                                                            stnkExpiry: item.stnkExpiry ? new Date(item.stnkExpiry).toISOString().split('T')[0] : '',
                                                            bpkbAvailable: item.bpkbAvailable,
                                                            fakturAvailable: item.fakturAvailable,
                                                            serviceBook: item.serviceBook,
                                                            spareKey: item.spareKey,
                                                            specs: item.specs || '',
                                                            branchId: item.branchId || '',
                                                            isOwnerDifferent: item.isOwnerDifferent || false,
                                                            bpkbOwnerName: item.bpkbOwnerName || '',
                                                        });
                                                        // Parse existing images
                                                        try {
                                                            const imgs = item.images ? JSON.parse(item.images) : [];
                                                            setVehicleImages(imgs);
                                                        } catch (e) {
                                                            setVehicleImages([]);
                                                        }
                                                        // Set docs
                                                        setVehicleDocs({
                                                            ktpOwnerImage: item.ktpOwnerImage || null,
                                                            stnkImage: item.stnkImage || null,
                                                            bpkbImage: item.bpkbImage || null,
                                                            taxImage: item.taxImage || null
                                                        });
                                                        setShowVehicleModal(true);
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-[#ecf0f3] shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff] flex items-center justify-center text-yellow-500 hover:text-yellow-700 transition-all"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} size="sm" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setDeleteTarget(item);
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-[#ecf0f3] shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff] flex items-center justify-center text-red-500 hover:text-red-700 transition-all"
                                                >
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
                        <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <FontAwesomeIcon icon={faCar} className="text-5xl text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">
                                {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada kendaraan'}
                            </h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                {searchTerm
                                    ? `Tidak ditemukan kendaraan dengan kata kunci "${searchTerm}". Coba kata kunci lain.`
                                    : 'Mulai tambahkan inventaris kendaraan Anda untuk mengelola stok dengan lebih mudah.'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => { resetVehicleForm(); setShowVehicleModal(true); }}
                                    className="px-8 py-3 rounded-xl bg-[#00bfa5] text-white font-bold shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] transition-all"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                    Tambah Kendaraan
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* PAGINATION */}
                {filteredData.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center text-gray-500 disabled:opacity-30"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <span className="text-sm text-gray-600 px-3">
                            Halaman {currentPage} dari {Math.ceil(filteredData.length / ITEMS_PER_PAGE)}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / ITEMS_PER_PAGE), p + 1))}
                            disabled={currentPage >= Math.ceil(filteredData.length / ITEMS_PER_PAGE)}
                            className="w-10 h-10 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center text-gray-500 disabled:opacity-30"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                )}

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
                                                const token = localStorage.getItem('access_token');
                                                window.open(`${API_URL}/pdf/vehicle/${selectedVehicle.id}/internal?token=${token}`, '_blank');
                                            }}
                                            className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faFileExport} />
                                            Export PDF (Internal)
                                        </button>
                                        <button
                                            onClick={() => {
                                                const token = localStorage.getItem('access_token');
                                                window.open(`${API_URL}/pdf/vehicle/${selectedVehicle.id}/customer?token=${token}`, '_blank');
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

                {/* TRANSFER MODAL */}
                {showTransferModal && transferVehicle && (
                    <CrossTenantTransferModal
                        isOpen={showTransferModal}
                        onClose={() => setShowTransferModal(false)}
                        vehicleId={transferVehicle.id}
                        vehicleName={`${transferVehicle.make} ${transferVehicle.model} ${transferVehicle.year}`}
                        onSuccess={() => {
                            fetchVehicles();
                            toast.success('Transfer stok berhasil diajukan');
                        }}
                    />
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



                {/* Vehicle Create/Edit Modal */}
                {showVehicleModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 sm:p-4">
                        <div className="bg-[#ecf0f3] w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-xl sm:max-w-2xl overflow-y-auto">
                            <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-[#ecf0f3] z-10">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {editingVehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
                                </h3>
                                <button onClick={() => { setShowVehicleModal(false); resetVehicleForm(); }} className="text-gray-400 hover:text-gray-600">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Kategori</label>
                                    <select
                                        value={vehicleForm.category}
                                        onChange={(e) => setVehicleForm({ ...vehicleForm, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                    >
                                        <option value="CAR">Mobil</option>
                                        <option value="MOTORCYCLE">Motor</option>
                                        <option value="TRUCK">Truk</option>
                                    </select>
                                </div>

                                {/* Make + Model (Master Data) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Merk *</label>
                                        <div className="relative">
                                            <select
                                                value={vehicleForm.make}
                                                onChange={(e) => {
                                                    setVehicleForm({ ...vehicleForm, make: e.target.value, model: '' });
                                                }}
                                                className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] appearance-none"
                                            >
                                                <option value="">Pilih Merk...</option>
                                                {brands.map((brand) => (
                                                    <option key={brand.id} value={brand.name}>
                                                        {brand.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                            </div>
                                        </div>
                                        {brands.length === 0 && (
                                            <p className="text-xs text-red-500 mt-1">Master Data kosong. Tambahkan di menu Master.</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Model *</label>
                                        <div className="relative">
                                            <select
                                                value={vehicleForm.model}
                                                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                                                disabled={!vehicleForm.make}
                                                className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] appearance-none disabled:opacity-50"
                                            >
                                                <option value="">Pilih Model...</option>
                                                {availableModels.map((model) => (
                                                    <option key={model.id} value={model.name}>
                                                        {model.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Variant + Year */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Varian</label>
                                        <input type="text" value={vehicleForm.variant} onChange={(e) => setVehicleForm({ ...vehicleForm, variant: e.target.value })} placeholder="1.5 G AT" className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Tahun</label>
                                        <input type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]" />
                                    </div>
                                </div>

                                {/* Color + Condition */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Warna</label>
                                        <input type="text" value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} placeholder="Putih" className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Kondisi</label>
                                        <select value={vehicleForm.condition} onChange={(e) => setVehicleForm({ ...vehicleForm, condition: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]">
                                            <option value="READY">Siap Jual</option>
                                            <option value="REPAIR">Perlu Perbaikan</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Price + Purchase Price */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Harga Jual *</label>
                                        <input type="number" value={vehicleForm.price} onChange={(e) => setVehicleForm({ ...vehicleForm, price: e.target.value })} placeholder="195000000" className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Harga Beli</label>
                                        <input type="number" value={vehicleForm.purchasePrice} onChange={(e) => setVehicleForm({ ...vehicleForm, purchasePrice: e.target.value })} placeholder="180000000" className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]" />
                                    </div>
                                </div>

                                {/* License Plate */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Plat Nomor</label>
                                    <input type="text" value={vehicleForm.licensePlate} onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value })} placeholder="B 1234 ABC" className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]" />
                                </div>

                                {/* Chassis + Engine */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">No. Rangka</label>
                                        <input type="text" value={vehicleForm.chassisNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, chassisNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">No. Mesin</label>
                                        <input type="text" value={vehicleForm.engineNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, engineNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]" />
                                    </div>
                                </div>

                                {/* BPKB Owner Identity */}
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700">Identitas Pemilik BPKB</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Sama dengan KTP?</span>
                                            <button
                                                onClick={() => setVehicleForm({ ...vehicleForm, isOwnerDifferent: !vehicleForm.isOwnerDifferent })}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${vehicleForm.isOwnerDifferent ? 'bg-[#00bfa5]' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${vehicleForm.isOwnerDifferent ? 'translate-x-5' : ''}`} />
                                            </button>
                                            <span className="text-xs font-bold text-gray-700">{vehicleForm.isOwnerDifferent ? 'BERBEDA' : 'SAMA'}</span>
                                        </div>
                                    </div>

                                    {vehicleForm.isOwnerDifferent && (
                                        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Nama Pemilik di BPKB <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={vehicleForm.bpkbOwnerName}
                                                onChange={(e) => setVehicleForm({ ...vehicleForm, bpkbOwnerName: e.target.value })}
                                                placeholder="Nama sesuai BPKB"
                                                className="w-full px-4 py-3 rounded-xl bg-white border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Wajib diisi karena berbeda dengan identitas pemilik.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Image Upload (only for existing vehicles) */}
                                {editingVehicle && (
                                    <VehicleImageUploader
                                        vehicleId={editingVehicle.id}
                                        existingImages={vehicleImages}
                                        onImagesChange={setVehicleImages}
                                    />
                                )}

                                {/* Document Upload (only for existing vehicles) */}
                                {editingVehicle && (
                                    <DocumentUploader
                                        vehicleId={editingVehicle.id}
                                        documents={vehicleDocs}
                                        onDocumentChange={(key, url) => setVehicleDocs(prev => ({ ...prev, [key]: url }))}
                                    />
                                )}

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => { setShowVehicleModal(false); resetVehicleForm(); }} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                                        Batal
                                    </button>
                                    <button onClick={handleSaveVehicle} disabled={submitting} className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] disabled:opacity-50 transition-all">
                                        {submitting ? 'Menyimpan...' : (editingVehicle ? 'Simpan Perubahan' : 'Tambah Kendaraan')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </>)}{/* END INVENTORY TAB */}

            {/* Delete Confirmation */}
            {showDeleteConfirm && deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl shadow-xl max-w-sm w-full p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <FontAwesomeIcon icon={faTrash} className="text-red-500 text-2xl" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Kendaraan?</h3>
                            <p className="text-gray-500 mb-6">
                                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.make} {deleteTarget.model}</strong>? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                                    Batal
                                </button>
                                <button onClick={handleDeleteVehicle} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium shadow-lg hover:bg-red-600 transition-all">
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
