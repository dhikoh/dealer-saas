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
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/api';
import CrossTenantTransferModal from '@/components/inventory/CrossTenantTransferModal';
import IncomingTransfers from '@/components/inventory/IncomingTransfers';
import { useRouter } from 'next/navigation';


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
    taxExpiry?: string;
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
    tenant?: {
        id: string;
        name: string;
        phone?: string;
        address?: string;
    };
}

interface VehicleCost {
    id: string;
    costType: string;
    amount: number;
    description?: string;
    date: string;
}

interface GroupAnalytics {
    totalVehicles: number;
    totalValue: number;
    topDealers: { name: string; count: number }[];
    categoryBreakdown: { category: string; count: number }[];
}



export default function InventoryPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const { fmt } = useCurrency();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [groupVehicles, setGroupVehicles] = useState<Vehicle[]>([]); // GROUP STOCK STATE
    const [groupAnalytics, setGroupAnalytics] = useState<GroupAnalytics | null>(null); // GROUP ANALYTICS STATE
    const [loading, setLoading] = useState(true);
    const [groupLoading, setGroupLoading] = useState(false);

    const getLabel = (key: string) => {
        const labels: Record<string, Record<string, string>> = {
            inventoryTitle: { id: 'Inventaris', en: 'Inventory' },
            addVehicle: { id: 'Tambah Kendaraan', en: 'Add Vehicle' },
            vehiclesCount: { id: 'kendaraan', en: 'vehicles' },
            unit: { id: 'Unit', en: 'Unit' },
            transferStock: { id: 'Transfer Stok', en: 'Transfer Stock' },
            groupStock: { id: 'Stok Grup', en: 'Group Stock' }, // NEW
            dealer: { id: 'Dealer', en: 'Dealer' }, // NEW
            copyUnit: { id: 'Salin Unit', en: 'Copy Unit' }, // NEW
            copyConfirm: { id: 'Salin kendaraan ini ke inventaris Anda?', en: 'Copy this vehicle to your inventory?' }, // NEW
            copySuccess: { id: 'Kendaraan berhasil disalin', en: 'Vehicle copied successfully' }, // NEW
            searchPlaceholder: { id: 'Cari merk, model, atau plat...', en: 'Search make, model, or plate...' },
            all: { id: 'Semua', en: 'All' },
            available: { id: 'Tersedia', en: 'Available' },
            sold: { id: 'Terjual', en: 'Sold' },
            booked: { id: 'Terpesan', en: 'Booked' },
            vehicle: { id: 'Kendaraan', en: 'Vehicle' },
            plate: { id: 'Plat', en: 'Plate' },
            sellingPrice: { id: 'Harga Jual', en: 'Selling Price' },
            status: { id: 'Status', en: 'Status' },
            tax: { id: 'Pajak', en: 'Tax' },
            action: { id: 'Aksi', en: 'Action' },
            noResults: { id: 'Tidak ada hasil pencarian', en: 'No search results' },
            noVehicles: { id: 'Belum ada kendaraan', en: 'No vehicles yet' },
            noResultsDesc: { id: 'Tidak ditemukan kendaraan dengan kata kunci', en: 'No vehicles found with keyword' },
            startAdding: { id: 'Mulai tambahkan inventaris kendaraan Anda untuk mengelola stok dengan lebih mudah.', en: 'Start adding your inventory to manage stock easily.' },
            page: { id: 'Halaman', en: 'Page' },
            of: { id: 'dari', en: 'of' },
            vehicleDetail: { id: 'Detail Kendaraan', en: 'Vehicle Detail' },
            year: { id: 'Tahun', en: 'Year' },
            color: { id: 'Warna', en: 'Color' },
            chassisNo: { id: 'No. Rangka', en: 'Chassis No.' },
            engineNo: { id: 'No. Mesin', en: 'Engine No.' },
            costSummary: { id: 'Ringkasan Biaya', en: 'Cost Summary' },
            capital: { id: 'Modal', en: 'Capital' },
            additionalCost: { id: 'Biaya Tambahan', en: 'Additional Cost' },
            totalCost: { id: 'Total Cost', en: 'Total Cost' },
            profit: { id: 'Profit', en: 'Profit' },
            costDetails: { id: 'Rincian Biaya', en: 'Cost Details' },
            addCost: { id: 'Tambah Biaya', en: 'Add Cost' },
            noCostDetails: { id: 'Belum ada rincian biaya', en: 'No cost details yet' },
            exportPdfInternal: { id: 'Export PDF (Internal)', en: 'Export PDF (Internal)' },
            exportPdfCustomer: { id: 'Export PDF (Customer)', en: 'Export PDF (Customer)' },
            transferSuccess: { id: 'Transfer stok berhasil diajukan', en: 'Stock transfer requested successfully' },
            addCostTitle: { id: 'Tambah Biaya', en: 'Add Cost' },
            costType: { id: 'Jenis Biaya', en: 'Cost Type' },
            amount: { id: 'Jumlah', en: 'Amount' },
            description: { id: 'Keterangan', en: 'Description' },
            date: { id: 'Tanggal', en: 'Date' },
            cancel: { id: 'Batal', en: 'Cancel' },
            save: { id: 'Simpan', en: 'Save' },
            editVehicle: { id: 'Edit Kendaraan', en: 'Edit Vehicle' },
            category: { id: 'Kategori', en: 'Category' },
            make: { id: 'Merk', en: 'Make' },
            model: { id: 'Model', en: 'Model' },
            variant: { id: 'Varian', en: 'Variant' },
            condition: { id: 'Kondisi', en: 'Condition' },
            ready: { id: 'Siap Jual', en: 'Ready' },
            repair: { id: 'Perlu Perbaikan', en: 'Needs Repair' },
            purchasePrice: { id: 'Harga Beli', en: 'Purchase Price' },
            bpkbOwner: { id: 'Identitas Pemilik BPKB', en: 'BPKB Owner Identity' },
            sameAsKtp: { id: 'Sama dengan KTP?', en: 'Same as KTP?' },
            different: { id: 'BERBEDA', en: 'DIFFERENT' },
            same: { id: 'SAMA', en: 'SAME' },
            bpkbName: { id: 'Nama Pemilik di BPKB', en: 'BPKB Owner Name' },
            requiredDiff: { id: 'Wajib diisi karena berbeda dengan identitas pemilik.', en: 'Required because it differs from owner identity.' },
            deleteVehicle: { id: 'Hapus Kendaraan?', en: 'Delete Vehicle?' },
            deleteConfirm: { id: 'Apakah Anda yakin ingin menghapus', en: 'Are you sure you want to delete' },
            deleteUndo: { id: 'Tindakan ini tidak dapat dibatalkan.', en: 'This action cannot be undone.' },
            yesDelete: { id: 'Ya, Hapus', en: 'Yes, Delete' },
            car: { id: 'Mobil', en: 'Car' },
            motorcycle: { id: 'Motor', en: 'Motorcycle' },
            truck: { id: 'Truk', en: 'Truck' },
            selectMake: { id: 'Pilih Merk...', en: 'Select Make...' },
            selectModel: { id: 'Pilih Model...', en: 'Select Model...' },
            emptyMasterData: { id: 'Master Data kosong. Tambahkan di menu Master.', en: 'Master Data empty. Add in Master menu.' },
            exampleVariant: { id: 'Contoh: 1.5 G AT', en: 'Example: 1.5 G AT' },
            saving: { id: 'Menyimpan...', en: 'Saving...' },
            saveChanges: { id: 'Simpan Perubahan', en: 'Save Changes' },
            costPurchase: { id: 'Modal (Beli)', en: 'Capital (Purchase)' },
            costMaintenance: { id: 'Perawatan/Service', en: 'Maintenance/Service' },
            costTax: { id: 'Pajak', en: 'Tax' },
            costInsurance: { id: 'Asuransi', en: 'Insurance' },
            costOther: { id: 'Lainnya', en: 'Other' },
            exampleDesc: { id: 'Contoh: Service rutin', en: 'Example: Routine service' },
            choose: { id: 'Pilih', en: 'Choose' },
            stnkExpiry: { id: 'Masa Berlaku STNK (5 Thn)', en: 'STNK Expiry (5 Yr)' },
            taxExpiry: { id: 'Masa Berlaku Pajak (1 Thn)', en: 'Tax Expiry (1 Yr)' },
            reserved: { id: 'Terpesan', en: 'Reserved' },
        };
        return labels[key]?.[language === 'id' ? 'id' : 'en'] || labels[key]?.['en'] || key;
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showAddCostModal, setShowAddCostModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
    const [showCopyConfirm, setShowCopyConfirm] = useState(false); // New state
    const [copyTarget, setCopyTarget] = useState<Vehicle | null>(null); // New state

    // Transfer Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferVehicle, setTransferVehicle] = useState<Vehicle | null>(null);

    // Page-level tab: INVENTORY, TRANSFERS, GROUP
    const [pageTab, setPageTab] = useState<'INVENTORY' | 'TRANSFERS' | 'GROUP'>('INVENTORY');



    const [costForm, setCostForm] = useState({
        costType: 'MAINTENANCE',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    // const getToken = () => localStorage.getItem('access_token'); // Removed



    // ...

    const fetchGroupVehicles = async () => {
        setGroupLoading(true);

        // Construct params for search term
        const params = new URLSearchParams();
        if (searchTerm) {
            params.append('search', searchTerm);
        }

        try {
            const res = await fetchApi(`/vehicles/group/stock?${params}`);
            if (!res.ok) throw new Error('Failed to fetch group vehicles');
            const data = await res.json();
            setGroupVehicles(data);

            // Fetch Analytics
            const resAnalytics = await fetchApi('/analytics/group/stock');
            if (resAnalytics.ok) {
                const analyticsData = await resAnalytics.json();
                setGroupAnalytics(analyticsData);
            }
        } catch (error) {
            console.error('Error fetching group data:', error);
            toast.error('Gagal mengambil data stok grup');
        } finally {
            setGroupLoading(false);
        }
    };

    const handleCopyVehicle = async () => {
        if (!copyTarget) return;

        try {
            const res = await fetchApi(`/vehicles/copy/${copyTarget.id}`, {
                method: 'POST',
            });

            if (res.ok) {
                toast.success(getLabel('copySuccess'));
                setShowCopyConfirm(false);
                setCopyTarget(null);
                setPageTab('INVENTORY');
                fetchVehicles();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menyalin kendaraan');
            }
        } catch (error) {
            toast.error('Gagal menyalin kendaraan');
        }
    };

    const fetchVehicles = async () => {
        setLoading(true);

        try {
            const res = await fetchApi('/vehicles');
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
        setDetailLoading(true);
        try {
            const res = await fetchApi(`/vehicles/${vehicleId}/costs`);
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
        if (!selectedVehicle) return;

        try {
            const res = await fetchApi(`/vehicles/${selectedVehicle.id}/costs`, {
                method: 'POST',
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




const handleDeleteVehicle = async () => {
    if (!deleteTarget) return;

    try {
        const res = await fetchApi(`/vehicles/${deleteTarget.id}`, {
            method: 'DELETE',
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

const filteredGroupData = groupVehicles.filter(item => {
    return `${item.make} ${item.model} ${item.licensePlate || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
});

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        AVAILABLE: 'bg-green-100 text-green-700',
        SOLD: 'bg-red-100 text-red-700',
        BOOKED: 'bg-yellow-100 text-yellow-700',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
            {status === 'AVAILABLE' ? getLabel('available') : status === 'SOLD' ? getLabel('sold') : status === 'BOOKED' ? getLabel('booked') : status}
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
            {condition === 'READY' ? getLabel('ready') : condition === 'REPAIR' ? getLabel('repair') : condition === 'RESERVED' ? getLabel('reserved') : condition}
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

if (loading && pageTab === 'INVENTORY') {
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
                <h1 className="text-2xl font-bold text-gray-800">{getLabel('inventoryTitle')}</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {pageTab === 'GROUP' ? `${groupVehicles.length} ${getLabel('groupStock')}` : `${vehicles.length} ${getLabel('vehiclesCount')}`}
                </p>
            </div>
            {pageTab === 'INVENTORY' && (
                <button
                    onClick={() => router.push('/app/inventory/new')}
                    className="px-6 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] transition-all flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    {getLabel('addVehicle')}
                </button>
            )}
        </div>

        {/* PAGE-LEVEL TABS */}
        <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button
                onClick={() => setPageTab('INVENTORY')}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${pageTab === 'INVENTORY'
                    ? 'bg-[#00bfa5] text-white shadow-lg'
                    : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5]'
                    }`}
            >
                <FontAwesomeIcon icon={faCar} />
                {getLabel('unit')}
            </button>
            <button
                onClick={() => setPageTab('GROUP')}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${pageTab === 'GROUP'
                    ? 'bg-[#00bfa5] text-white shadow-lg'
                    : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5]'
                    }`}
            >
                <FontAwesomeIcon icon={faExchangeAlt} />
                {getLabel('groupStock')}
            </button>
            <button
                onClick={() => setPageTab('TRANSFERS')}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${pageTab === 'TRANSFERS'
                    ? 'bg-[#00bfa5] text-white shadow-lg'
                    : 'bg-[#ecf0f3] text-gray-600 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5]'
                    }`}
            >
                <FontAwesomeIcon icon={faInbox} />
                {getLabel('transferStock')}
            </button>
        </div>

        {/* TRANSFERS TAB CONTENT */}
        {pageTab === 'TRANSFERS' && <IncomingTransfers />}

        {/* ==================== GROUP STOCK TAB ==================== */}
        {pageTab === 'GROUP' && (
            <div className="space-y-6">
                {/* Analytics Summary */}
                {groupAnalytics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 mb-1">Total Unit Grup</p>
                            <p className="text-2xl font-bold text-slate-900">{groupAnalytics.totalVehicles} Unit</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 mb-1">Total Nilai Aset</p>
                            <p className="text-2xl font-bold text-slate-900">{fmt(groupAnalytics.totalValue)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-sm text-slate-500 mb-1">Top Dealer (Stok)</p>
                            <div className="space-y-1 mt-1">
                                {groupAnalytics.topDealers.slice(0, 2).map((d: any, i: number) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-700 truncate max-w-[120px]">{d.name}</span>
                                        <span className="text-slate-500">{d.count} unit</span>
                                    </div>
                                ))}
                                {groupAnalytics.topDealers.length === 0 && <span className="text-slate-400 text-sm">-</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Search & Filter */}
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={getLabel('searchPlaceholder')}
                        className="w-full bg-[#ecf0f3] h-12 pl-12 pr-4 rounded-xl text-sm text-gray-600 outline-none shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] focus:ring-2 focus:ring-[#00bfa5] transition-all"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                {groupLoading ? (
                    <div className="flex items-center justify-center min-h-[300px]">
                        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-[#00bfa5] animate-spin" />
                    </div>
                ) : filteredGroupData.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px] bg-[#ecf0f3] rounded-2xl shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff]">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <FontAwesomeIcon icon={faExchangeAlt} className="text-5xl text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">
                            {language === 'id' ? 'Tidak Ada Stok Grup' : 'No Group Stock'}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            {language === 'id'
                                ? 'Bergabung ke Dealer Group terlebih dahulu untuk melihat stok dari dealer lain dalam grup Anda.'
                                : 'Join a Dealer Group first to see stock from other dealers in your group.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-[#ecf0f3] rounded-2xl shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff] overflow-hidden">
                        {/* DESKTOP TABLE */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#e0e4e8]">
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('vehicle')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('dealer')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('sellingPrice')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('year')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('color')}</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">{getLabel('action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredGroupData.map((item) => (
                                        <tr key={item.id} className="hover:bg-[#e8ecef] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center text-[#00bfa5]">
                                                        <FontAwesomeIcon icon={item.category === 'CAR' ? faCar : faMotorcycle} />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-700">{item.make} {item.model}</span>
                                                        <div className="text-xs text-gray-400">{item.variant || ''} {item.licensePlate ? `â€¢ ${item.licensePlate}` : ''}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-700">{item.tenant?.name || '-'}</div>
                                                <div className="text-xs text-gray-400">{item.tenant?.phone || ''}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 font-semibold">{fmt(Number(item.price))}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.year}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.color}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => {
                                                            setCopyTarget(item);
                                                            setShowCopyConfirm(true);
                                                        }}
                                                        className="px-4 py-2 rounded-xl bg-[#00bfa5] text-white text-xs font-medium shadow-lg hover:bg-[#00a891] transition-all flex items-center gap-2"
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} />
                                                        {getLabel('copyUnit')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARD VIEW */}
                        <div className="md:hidden p-4 space-y-4">
                            {filteredGroupData.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#00bfa5]">
                                                <FontAwesomeIcon icon={item.category === 'CAR' ? faCar : faMotorcycle} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{item.make} {item.model}</h4>
                                                <p className="text-xs text-slate-500">{item.variant} â€¢ {item.year}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-600">
                                            {item.color}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Harga Jual</span>
                                            <span className="font-bold text-slate-900">{fmt(Number(item.price))}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Dealer</span>
                                            <span className="text-slate-700">{item.tenant?.name || '-'}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setCopyTarget(item);
                                            setShowCopyConfirm(true);
                                        }}
                                        className="w-full py-2.5 rounded-lg bg-[#00bfa5] text-white text-sm font-medium shadow hover:bg-[#00a891] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                        {getLabel('copyUnit')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Copy Confirmation Modal */}
        {showCopyConfirm && copyTarget && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-[#ecf0f3] rounded-2xl shadow-xl max-w-sm w-full p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                            <FontAwesomeIcon icon={faExchangeAlt} className="text-teal-600 text-2xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{getLabel('copyUnit')}</h3>
                        <p className="text-gray-500 mb-1">
                            {getLabel('copyConfirm')}
                        </p>
                        <p className="font-semibold text-gray-700 mb-1">{copyTarget.make} {copyTarget.model} ({copyTarget.year})</p>
                        <p className="text-sm text-gray-400 mb-6">
                            {language === 'id' ? 'Dari' : 'From'}: {copyTarget.tenant?.name || '-'}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowCopyConfirm(false); setCopyTarget(null); }} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                                {getLabel('cancel')}
                            </button>
                            <button onClick={handleCopyVehicle} className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] transition-all">
                                {getLabel('copyUnit')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* INVENTORY TAB CONTENT */}
        {pageTab === 'INVENTORY' && (<>

            {/* FILTERS & SEARCH */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[250px]">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={getLabel('searchPlaceholder')}
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
                            {status === 'all' ? getLabel('all') : status === 'available' ? getLabel('available') : status === 'sold' ? getLabel('sold') : getLabel('booked')}
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
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('vehicle')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('plate')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('sellingPrice')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('status')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">{getLabel('tax')}</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">{getLabel('action')}</th>
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
                                                <div className="text-xs text-gray-400">{item.year} â€¢ {item.color}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-mono">{item.licensePlate || '-'}</td>
                                    <td className="px-6 py-4 text-gray-700 font-semibold">{fmt(Number(item.price))}</td>
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
                                                onClick={() => router.push(`/app/inventory/${item.id}/edit`)}
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
                            {searchTerm ? getLabel('noResults') : getLabel('noVehicles')}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8">
                            {searchTerm
                                ? `${getLabel('noResultsDesc')} "${searchTerm}".`
                                : getLabel('startAdding')}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => { resetVehicleForm(); setShowVehicleModal(true); }}
                                className="px-8 py-3 rounded-xl bg-[#00bfa5] text-white font-bold shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] transition-all"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                {getLabel('addVehicle')}
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
                            <h2 className="text-xl font-bold text-gray-800">{getLabel('vehicleDetail')}</h2>
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
                                        <div className="text-xs text-gray-400">{getLabel('vehicle')}</div>
                                        <div className="font-bold text-gray-800">{selectedVehicle.make} {selectedVehicle.model}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">{getLabel('year')}</div>
                                        <div className="font-bold text-gray-800">{selectedVehicle.year}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">{getLabel('color')}</div>
                                        <div className="font-bold text-gray-800">{selectedVehicle.color}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">{getLabel('plate')}</div>
                                        <div className="font-bold text-gray-800 font-mono">{selectedVehicle.licensePlate || '-'}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">{getLabel('chassisNo')}</div>
                                        <div className="font-bold text-gray-800 font-mono text-sm">{selectedVehicle.chassisNumber || '-'}</div>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-xl">
                                        <div className="text-xs text-gray-400">{getLabel('engineNo')}</div>
                                        <div className="font-bold text-gray-800 font-mono text-sm">{selectedVehicle.engineNumber || '-'}</div>
                                    </div>
                                </div>

                                {/* COST SUMMARY */}
                                {selectedVehicle.costSummary && (
                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500" />
                                            {getLabel('costSummary')}
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-400">{getLabel('capital')}</div>
                                                <div className="font-bold text-gray-800">{fmt(selectedVehicle.costSummary.purchasePrice)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">{getLabel('additionalCost')}</div>
                                                <div className="font-bold text-orange-600">{fmt(selectedVehicle.costSummary.additionalCosts)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">{getLabel('totalCost')}</div>
                                                <div className="font-bold text-red-600">{fmt(selectedVehicle.costSummary.totalCost)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400">{getLabel('profit')}</div>
                                                <div className={`font-bold ${selectedVehicle.costSummary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {fmt(selectedVehicle.costSummary.profitMargin)} ({selectedVehicle.costSummary.profitPercentage}%)
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
                                            {getLabel('costDetails')}
                                        </h3>
                                        <button
                                            onClick={() => setShowAddCostModal(true)}
                                            className="px-4 py-2 rounded-lg bg-[#00bfa5] text-white text-sm font-medium hover:bg-[#00a891]"
                                        >
                                            <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                            {getLabel('addCost')}
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
                                                        <div className="font-bold text-gray-800">{fmt(cost.amount)}</div>
                                                        <div className="text-xs text-gray-400">{new Date(cost.date).toLocaleDateString('id-ID')}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">{getLabel('noCostDetails')}</div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await fetchApi(`/pdf/vehicle/${selectedVehicle.id}/internal`);
                                                if (!res.ok) throw new Error('Download failed');
                                                const blob = await res.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                window.open(url, '_blank');
                                            } catch (e) {
                                                toast.error('Gagal mendownload PDF');
                                            }
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faFileExport} />
                                        {getLabel('exportPdfInternal')}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await fetchApi(`/pdf/vehicle/${selectedVehicle.id}/customer`);
                                                if (!res.ok) throw new Error('Download failed');
                                                const blob = await res.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                window.open(url, '_blank');
                                            } catch (e) {
                                                toast.error('Gagal mendownload PDF');
                                            }
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faFileExport} />
                                        {getLabel('exportPdfCustomer')}
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
                            <h2 className="text-xl font-bold text-gray-800">{getLabel('addCostTitle')}</h2>
                            <button onClick={() => setShowAddCostModal(false)}>
                                <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{getLabel('costType')}</label>
                                <select
                                    value={costForm.costType}
                                    onChange={(e) => setCostForm({ ...costForm, costType: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                >
                                    <option value="PURCHASE">{getLabel('costPurchase')}</option>
                                    <option value="MAINTENANCE">{getLabel('costMaintenance')}</option>
                                    <option value="TAX">{getLabel('costTax')}</option>
                                    <option value="INSURANCE">{getLabel('costInsurance')}</option>
                                    <option value="OTHER">{getLabel('costOther')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{getLabel('amount')}</label>
                                <input
                                    type="number"
                                    value={costForm.amount}
                                    onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                    placeholder="Rp"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{getLabel('description')}</label>
                                <input
                                    type="text"
                                    value={costForm.description}
                                    onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                    placeholder={getLabel('exampleDesc')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">{getLabel('date')}</label>
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
                                    {getLabel('cancel')}
                                </button>
                                <button
                                    onClick={handleAddCost}
                                    className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891]"
                                >
                                    {getLabel('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}





    </>)}{/* END INVENTORY TAB */ }

{/* Delete Confirmation */ }
{
    showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#ecf0f3] rounded-2xl shadow-xl max-w-sm w-full p-6">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faTrash} className="text-red-500 text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{getLabel('deleteVehicle')}</h3>
                    <p className="text-gray-500 mb-6">
                        {getLabel('deleteConfirm')} <strong>{deleteTarget.make} {deleteTarget.model}</strong>? {getLabel('deleteUndo')}
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                            {getLabel('cancel')}
                        </button>
                        <button onClick={handleDeleteVehicle} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium shadow-lg hover:bg-red-600 transition-all">
                            {getLabel('yesDelete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
        </div >
    );
}
