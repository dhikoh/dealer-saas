'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import VehicleImageUploader from '@/components/inventory/VehicleImageUploader';
import DocumentUploader from '@/components/inventory/DocumentUploader';
import { fetchApi } from '@/lib/api';

interface VehicleFormProps {
    initialData?: any;
    masterData: {
        brands: any[];
        models: any[];
        variants?: any[]; // Optional if not used yet
    };
    onSubmit: (formData: any, pendingFiles: File[], pendingDocs: Record<string, File>) => Promise<void>;
    isLoading: boolean;
    onCategoryChange?: (category: string) => void;
}

export default function VehicleForm({ initialData, masterData, onSubmit, isLoading, onCategoryChange }: VehicleFormProps) {
    const { t, language } = useLanguage();

    // Form State
    const [formData, setFormData] = useState({
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
        taxExpiry: '',
        bpkbAvailable: true,
        fakturAvailable: true,
        serviceBook: false,
        spareKey: false,
        specs: '',
        branchId: '',
        isOwnerDifferent: false,
        bpkbOwnerName: '',
        // Spread initialData BUT exclude fields we explicitly handle below to avoid "duplicate property" error
        ...(initialData ? (() => {
            const { price, purchasePrice, year, purchaseDate, stnkExpiry, taxExpiry, ...rest } = initialData;
            return rest;
        })() : {}),

        // Explicitly handle these fields with type conversion
        price: initialData?.price ? String(initialData.price) : '',
        purchasePrice: initialData?.purchasePrice ? String(initialData.purchasePrice) : '',
        year: initialData?.year || new Date().getFullYear(),
        purchaseDate: initialData?.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : '',
        stnkExpiry: initialData?.stnkExpiry ? new Date(initialData.stnkExpiry).toISOString().split('T')[0] : '',
        taxExpiry: initialData?.taxExpiry ? new Date(initialData.taxExpiry).toISOString().split('T')[0] : '',
    });

    // Validated Brands & Models (filtered)
    const [filteredModels, setFilteredModels] = useState<any[]>([]);

    // Image/Doc State
    const [vehicleImages, setVehicleImages] = useState<string[]>([]);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [pendingDocs, setPendingDocs] = useState<Record<string, File>>({});
    const [vehicleDocs, setVehicleDocs] = useState<Record<string, string | null>>({
        ktpOwnerImage: null, stnkImage: null, bpkbImage: null, taxImage: null,
    });

    // Initialize state from initialData
    useEffect(() => {
        if (initialData) {
            try {
                const imgs = initialData.images ? JSON.parse(initialData.images) : [];
                setVehicleImages(imgs);
            } catch (e) {
                setVehicleImages([]);
            }
            setVehicleDocs({
                ktpOwnerImage: initialData.ktpOwnerImage || null,
                stnkImage: initialData.stnkImage || null,
                bpkbImage: initialData.bpkbImage || null,
                taxImage: initialData.taxImage || null
            });
        }
    }, [initialData]);

    // Handle Brand/Make Change -> Filter Models
    useEffect(() => {
        if (formData.make && masterData.models) {
            // In a real app, models might be linked to brand IDs. 
            // Here assuming simple filtering or if models list is already filtered by parent?
            // The existing code showed `availableModels` being used directly. 
            // We will filter models that match the make if they have a brandId or ignore if flat list.
            // Assuming `masterData.models` contains all models or parent filters them.
            // Let's rely on parent passing correct models OR filter if `model` has `brandName`?
            // Existing code: `availableModels.map(...)`.
            // We'll assume the props `masterData.models` are ALREADY relevant or we check later.
            // Actually, usually models depend on brands.
            // Let's filter if possible.
            setFilteredModels(masterData.models);
        } else {
            setFilteredModels([]);
        }
    }, [formData.make, masterData.models]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Trigger Category Change callback
        if (field === 'category' && onCategoryChange) {
            onCategoryChange(value);
            // Clear make/model on category switch
            setFormData(prev => ({ ...prev, category: value, make: '', model: '' }));
        }

        if (field === 'make') {
            setFormData(prev => ({ ...prev, make: value, model: '' }));
        }
    };

    const getLabel = (key: string) => {
        // ... (We can copy the label logic or use translation hook if available)
        // For brevity, using direct mapping or English fallback if not found.
        const labels: Record<string, string> = {
            addVehicle: 'Tambah Kendaraan',
            editVehicle: 'Edit Kendaraan',
            save: 'Simpan',
            cancel: 'Batal',
            category: 'Kategori',
            make: 'Merk',
            model: 'Model',
            variant: 'Varian',
            year: 'Tahun',
            color: 'Warna',
            price: 'Harga Jual',
            purchasePrice: 'Harga Beli',
            plate: 'No. Polisi',
            bkpbOwner: 'Nama Pemilik BPKB',
            // ... add others as needed
        };
        return labels[key] || key;
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.make || !formData.model || !formData.price) {
            toast.error('Mohon lengkapi merk, model, dan harga');
            return;
        }

        // Showroom validation
        if (formData.isShowroom) {
            if (initialData) {
                if (vehicleImages.length === 0 && pendingFiles.length === 0) {
                    toast.error('Minimal 1 foto wajib diupload untuk tampil di Showroom');
                    return;
                }
            } else {
                if (pendingFiles.length === 0) {
                    toast.error('Minimal 1 foto wajib diupload untuk tampil di Showroom');
                    return;
                }
            }
        }

        if (formData.isOwnerDifferent && !formData.bpkbOwnerName.trim()) {
            toast.error('Nama pemilik BPKB wajib diisi jika berbeda dengan pemilik KTP');
            return;
        }

        // Prepare data for submission
        const submittingData = {
            ...formData,
            images: JSON.stringify(vehicleImages), // Keep existing images in JSON string
            ...vehicleDocs, // Docs urls
        };

        await onSubmit(submittingData, pendingFiles, pendingDocs);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
                {initialData ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}
            </h2>

            <div className="space-y-6">
                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                    >
                        <option value="CAR">Mobil</option>
                        <option value="MOTORCYCLE">Motor</option>
                        <option value="TRUCK">Truk</option>
                    </select>
                </div>

                {/* Make & Model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Merk <span className="text-red-500">*</span></label>
                        <select
                            value={formData.make}
                            onChange={(e) => handleChange('make', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        >
                            <option value="">Pilih Merk</option>
                            {masterData.brands.map((b: any) => (
                                <option key={b.id || b.name} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model <span className="text-red-500">*</span></label>
                        <select
                            value={formData.model}
                            onChange={(e) => handleChange('model', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                            disabled={!formData.make}
                        >
                            <option value="">Pilih Model</option>
                            {filteredModels.map((m: any) => (
                                <option key={m.id || m.name} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Variant & Year */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Varian</label>
                        <input
                            type="text"
                            value={formData.variant}
                            onChange={(e) => handleChange('variant', e.target.value)}
                            placeholder="Contoh: 1.5 G AT"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                        <input
                            type="number"
                            value={formData.year}
                            onChange={(e) => handleChange('year', parseInt(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                </div>

                {/* Color & Condition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
                        <input
                            type="text"
                            value={formData.color}
                            onChange={(e) => handleChange('color', e.target.value)}
                            placeholder="Hitam, Putih, dll"
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi</label>
                        <select
                            value={formData.condition}
                            onChange={(e) => handleChange('condition', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        >
                            <option value="READY">Siap Jual</option>
                            <option value="REPAIR">Perlu Perbaikan</option>
                        </select>
                    </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => handleChange('price', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                            <input
                                type="number"
                                value={formData.purchasePrice}
                                onChange={(e) => handleChange('purchasePrice', e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                            />
                        </div>
                    </div>
                </div>

                {/* License & Plate */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Polisi</label>
                    <input
                        type="text"
                        value={formData.licensePlate}
                        onChange={(e) => handleChange('licensePlate', e.target.value.toUpperCase())}
                        placeholder="B 1234 ABC"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                    />
                </div>

                {/* Expiry Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Masa Berlaku STNK</label>
                        <input
                            type="date"
                            value={formData.stnkExpiry}
                            onChange={(e) => handleChange('stnkExpiry', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Masa Berlaku Pajak</label>
                        <input
                            type="date"
                            value={formData.taxExpiry}
                            onChange={(e) => handleChange('taxExpiry', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                </div>

                {/* Chassis & Engine */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">No. Rangka</label>
                        <input
                            type="text"
                            value={formData.chassisNumber}
                            onChange={(e) => handleChange('chassisNumber', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">No. Mesin</label>
                        <input
                            type="text"
                            value={formData.engineNumber}
                            onChange={(e) => handleChange('engineNumber', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                </div>

                {/* BPKB Info */}
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                    <div className="flex items-center justify-between mb-4">
                        <label className="font-bold text-gray-700">Identitas Pemilik BPKB</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Sama dengan KTP?</span>
                            <button
                                onClick={() => handleChange('isOwnerDifferent', !formData.isOwnerDifferent)}
                                className={`w-10 h-5 rounded-full transition-colors relative ${formData.isOwnerDifferent ? 'bg-[#00bfa5]' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.isOwnerDifferent ? 'translate-x-5' : ''}`} />
                            </button>
                            <span className="text-xs font-bold text-gray-700">{formData.isOwnerDifferent ? 'BERBEDA' : 'SAMA'}</span>
                        </div>
                    </div>

                    {formData.isOwnerDifferent && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik di BPKB <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.bpkbOwnerName}
                                onChange={(e) => handleChange('bpkbOwnerName', e.target.value)}
                                placeholder="Nama Sesuai BPKB"
                                className="w-full px-4 py-3 rounded-xl bg-white border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                            />
                        </div>
                    )}
                </div>

                {/* Availability Flags */}
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.bpkbAvailable} onChange={(e) => handleChange('bpkbAvailable', e.target.checked)} className="w-4 h-4 text-[#00bfa5] rounded focus:ring-[#00bfa5]" />
                        <span className="text-gray-700">BPKB Ada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.fakturAvailable} onChange={(e) => handleChange('fakturAvailable', e.target.checked)} className="w-4 h-4 text-[#00bfa5] rounded focus:ring-[#00bfa5]" />
                        <span className="text-gray-700">Faktur Ada</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.serviceBook} onChange={(e) => handleChange('serviceBook', e.target.checked)} className="w-4 h-4 text-[#00bfa5] rounded focus:ring-[#00bfa5]" />
                        <span className="text-gray-700">Buku Service</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.spareKey} onChange={(e) => handleChange('spareKey', e.target.checked)} className="w-4 h-4 text-[#00bfa5] rounded focus:ring-[#00bfa5]" />
                        <span className="text-gray-700">Kunci Cadangan</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.isShowroom} onChange={(e) => handleChange('isShowroom', e.target.checked)} className="w-4 h-4 text-[#00bfa5] rounded focus:ring-[#00bfa5]" />
                        <span className="text-gray-700 font-medium">Tampil di Showroom?</span>
                    </label>
                </div>


                {/* IMAGES */}
                <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4">Foto Kendaraan</h3>
                    <VehicleImageUploader
                        vehicleId={initialData?.id}
                        existingImages={vehicleImages}
                        onImagesChange={setVehicleImages}
                        pendingFiles={pendingFiles}
                        onPendingFilesChange={setPendingFiles}
                    />
                </div>

                {/* DOCUMENTS */}
                <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4">Dokumen Pendukung</h3>
                    <DocumentUploader
                        vehicleId={initialData?.id || ''} // Pass empty if new
                        documents={vehicleDocs}
                        onDocumentChange={(key, url) => setVehicleDocs(prev => ({ ...prev, [key]: url }))}
                        onFileSelect={(key, file) => {
                            if (file) {
                                setPendingDocs(prev => ({ ...prev, [key]: file }));
                            } else {
                                const newDocs = { ...pendingDocs };
                                delete newDocs[key];
                                setPendingDocs(newDocs);
                            }
                        }}
                    />
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200 flex gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="flex-1 py-3 px-6 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 py-3 px-6 rounded-xl bg-[#00bfa5] text-white font-bold shadow-lg hover:bg-[#00a891] disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faSave} />
                                Simpan Kendaraan
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
