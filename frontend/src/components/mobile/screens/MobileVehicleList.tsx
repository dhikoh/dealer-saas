'use client';

import React, { useState, useEffect } from 'react';
import { Car, Search, AlertCircle, Plus, Edit2, Trash2, X, Check, Upload, Filter, Camera, FileText, ChevronDown } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import { fetchApi, API_URL } from '@/lib/api';
import BottomModal from '@/components/mobile/BottomModal';
import { toast } from 'sonner';

const fmt = (n: number) => `Rp ${n?.toLocaleString('id-ID') ?? 0}`;

interface Vehicle {
    id: string; make?: string; brand?: string; model: string; variant?: string;
    year: number; color: string; price: number; purchasePrice?: number;
    condition?: string; status: string; stockCode?: string;
    licensePlate?: string; chassisNumber?: string; imageUrl?: string;
    images?: string;
    // Extended fields
    engineNumber?: string; bpkbNumber?: string; stnkExpiry?: string; taxExpiry?: string;
    purchaseDate?: string; conditionNote?: string; specs?: string; branchId?: string;
    bpkbAvailable?: boolean; fakturAvailable?: boolean; serviceBook?: boolean; spareKey?: boolean;
    isShowroom?: boolean; isOwnerDifferent?: boolean; bpkbOwnerName?: string;
    ktpOwnerImage?: string; stnkImage?: string; bpkbImage?: string; taxImage?: string;
}

const INITIAL_FORM = {
    category: 'CAR', make: '', model: '', variant: '', year: new Date().getFullYear(), color: '',
    licensePlate: '', chassisNumber: '', condition: 'READY',
    purchasePrice: '', price: '', status: 'AVAILABLE',
    // New fields matching desktop VehicleForm
    purchaseDate: '', conditionNote: '', isShowroom: true,
    engineNumber: '', bpkbNumber: '', stnkExpiry: '', taxExpiry: '',
    bpkbAvailable: true, fakturAvailable: true, serviceBook: false, spareKey: false,
    specs: '', branchId: '',
    isOwnerDifferent: false, bpkbOwnerName: '',
};

const CONDITIONS = [
    { value: 'READY', label: 'Siap Jual' },
    { value: 'REPAIR', label: 'Perbaikan' },
    { value: 'RESERVED', label: 'Dipesan' },
];
const STATUSES = ['AVAILABLE', 'BOOKED', 'SOLD'];

const DOC_TYPES = [
    { key: 'ktpOwnerImage', label: 'KTP Pemilik', icon: '🪪' },
    { key: 'stnkImage', label: 'STNK', icon: '📋' },
    { key: 'bpkbImage', label: 'BPKB', icon: '📄' },
    { key: 'taxImage', label: 'Pajak', icon: '🧾' },
];

// Neumorphic input style (consistent with existing mobile theme)
const neuInput = "w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm";
const neuSelect = "w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm";

export default function MobileVehicleList() {
    const { theme } = useMobileContext();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [filtered, setFiltered] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selected, setSelected] = useState<Vehicle | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<typeof INITIAL_FORM>({ ...INITIAL_FORM });
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
    const [uploadingImg, setUploadingImg] = useState(false);

    // Master Data State
    const [brands, setBrands] = useState<any[]>([]);
    const [availableModels, setAvailableModels] = useState<any[]>([]);
    const [availableVariants, setAvailableVariants] = useState<string[]>([]);
    const [branches, setBranches] = useState<any[]>([]);

    // Image & Doc State
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [pendingDocs, setPendingDocs] = useState<Record<string, File>>({});
    const [docPreviews, setDocPreviews] = useState<Record<string, string>>({});
    const [vehicleDocs, setVehicleDocs] = useState<Record<string, string | null>>({
        ktpOwnerImage: null, stnkImage: null, bpkbImage: null, taxImage: null,
    });

    // Collapsed form sections
    const [showDocSection, setShowDocSection] = useState(false);
    const [showBpkbSection, setShowBpkbSection] = useState(false);

    useEffect(() => { fetchVehicles(); fetchBranches(); }, []);

    useEffect(() => { fetchBrands(form.category); }, [form.category]);

    const fetchBrands = async (category: string) => {
        try {
            const res = await fetchApi(`/vehicles/brands/list?category=${category}`);
            if (res.ok) {
                const data = await res.json();
                setBrands(data.data || data || []);
                setAvailableModels([]);
                setAvailableVariants([]);
            }
        } catch { /* silently fail */ }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetchApi('/tenant/branches');
            if (res.ok) {
                const data = await res.json();
                setBranches(Array.isArray(data) ? data : []);
            }
        } catch { /* silently fail */ }
    };

    const handleBrandChange = (brandName: string) => {
        setForm(f => ({ ...f, make: brandName, model: '', variant: '' }));
        const selectedBrand = brands.find(b => b.name === brandName);
        setAvailableModels(selectedBrand?.models || []);
        setAvailableVariants([]);
    };

    const handleModelChange = (modelName: string) => {
        setForm(f => ({ ...f, model: modelName, variant: '' }));
        const selectedModel = availableModels.find((m: any) => m.name === modelName);
        try {
            const variants = selectedModel?.variants ? JSON.parse(selectedModel.variants) : [];
            setAvailableVariants(Array.isArray(variants) ? variants : []);
        } catch { setAvailableVariants([]); }
    };

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/vehicles?limit=100&page=1');
            if (res.ok) {
                const d = await res.json();
                const list = d?.data ?? d ?? [];
                setVehicles(list);
                setFiltered(list);
            }
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => {
        let list = [...vehicles];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(v => `${v.make ?? v.brand ?? ''} ${v.model} ${v.variant ?? ''}`.toLowerCase().includes(q));
        }
        if (statusFilter !== 'ALL') list = list.filter(v => v.status === statusFilter);
        setFiltered(list);
    }, [search, statusFilter, vehicles]);

    const resetFormState = () => {
        setPendingFiles([]);
        setPendingPreviews([]);
        setExistingImages([]);
        setPendingDocs({});
        setDocPreviews({});
        setVehicleDocs({ ktpOwnerImage: null, stnkImage: null, bpkbImage: null, taxImage: null });
        setShowDocSection(false);
        setShowBpkbSection(false);
    };

    const openAdd = () => {
        setForm({ ...INITIAL_FORM });
        setEditingId(null);
        resetFormState();
        setShowForm(true);
        fetchBrands('CAR');
    };

    const openEdit = (v: Vehicle) => {
        const cat = (v as any).category || 'CAR';
        setForm({
            category: cat,
            make: v.make || v.brand || '', model: v.model, variant: v.variant || '',
            year: v.year, color: v.color, licensePlate: v.licensePlate || '',
            chassisNumber: v.chassisNumber || '', condition: v.condition || 'READY',
            purchasePrice: String(v.purchasePrice || ''), price: String(v.price),
            status: v.status,
            // Extended fields
            purchaseDate: v.purchaseDate ? new Date(v.purchaseDate).toISOString().split('T')[0] : '',
            conditionNote: v.conditionNote || '',
            isShowroom: v.isShowroom ?? true,
            engineNumber: v.engineNumber || '',
            bpkbNumber: v.bpkbNumber || '',
            stnkExpiry: v.stnkExpiry ? new Date(v.stnkExpiry).toISOString().split('T')[0] : '',
            taxExpiry: v.taxExpiry ? new Date(v.taxExpiry).toISOString().split('T')[0] : '',
            bpkbAvailable: v.bpkbAvailable ?? true,
            fakturAvailable: v.fakturAvailable ?? true,
            serviceBook: v.serviceBook ?? false,
            spareKey: v.spareKey ?? false,
            specs: v.specs || '',
            branchId: v.branchId || '',
            isOwnerDifferent: v.isOwnerDifferent ?? false,
            bpkbOwnerName: v.bpkbOwnerName || '',
        });
        setEditingId(v.id);
        setSelected(null);

        // Load existing images
        try {
            const imgs = v.images ? JSON.parse(v.images) : [];
            setExistingImages(Array.isArray(imgs) ? imgs : []);
        } catch { setExistingImages([]); }
        setPendingFiles([]);
        setPendingPreviews([]);
        setPendingDocs({});
        setDocPreviews({});
        setVehicleDocs({
            ktpOwnerImage: v.ktpOwnerImage || null,
            stnkImage: v.stnkImage || null,
            bpkbImage: v.bpkbImage || null,
            taxImage: v.taxImage || null,
        });
        setShowDocSection(!!(v.ktpOwnerImage || v.stnkImage || v.bpkbImage || v.taxImage));
        setShowBpkbSection(v.isOwnerDifferent ?? false);

        setShowForm(true);
        fetchBrands(cat).then(() => {
            setTimeout(() => {
                setBrands(prev => {
                    const selectedBrand = prev.find(b => b.name === (v.make || v.brand));
                    if (selectedBrand) {
                        setAvailableModels(selectedBrand.models || []);
                        const selectedModel = (selectedBrand.models || []).find((m: any) => m.name === v.model);
                        if (selectedModel?.variants) {
                            try {
                                const variants = JSON.parse(selectedModel.variants);
                                setAvailableVariants(Array.isArray(variants) ? variants : []);
                            } catch { setAvailableVariants([]); }
                        }
                    }
                    return prev;
                });
            }, 100);
        });
    };

    const handleSave = async () => {
        if (!form.make || !form.model || !form.price) {
            toast.error('Merek, model, dan harga jual wajib diisi');
            return;
        }
        // Showroom validation
        if (form.isShowroom && !editingId && pendingFiles.length === 0) {
            toast.error('Minimal 1 foto wajib diupload untuk tampil di Showroom');
            return;
        }
        if (form.isShowroom && editingId && existingImages.length === 0 && pendingFiles.length === 0) {
            toast.error('Minimal 1 foto wajib diupload untuk tampil di Showroom');
            return;
        }
        if (form.isOwnerDifferent && !form.bpkbOwnerName.trim()) {
            toast.error('Nama pemilik BPKB wajib diisi jika berbeda dengan KTP');
            return;
        }

        setSaving(true);
        try {
            const body: any = {
                category: form.category,
                make: form.make, model: form.model, variant: form.variant,
                year: Number(form.year), color: form.color,
                licensePlate: form.licensePlate || undefined,
                chassisNumber: form.chassisNumber || undefined,
                condition: form.condition,
                purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
                price: Number(form.price),
                status: form.status,
                // Extended fields
                purchaseDate: form.purchaseDate || undefined,
                conditionNote: form.conditionNote || undefined,
                isShowroom: form.isShowroom,
                engineNumber: form.engineNumber || undefined,
                bpkbNumber: form.bpkbNumber || undefined,
                stnkExpiry: form.stnkExpiry || undefined,
                taxExpiry: form.taxExpiry || undefined,
                bpkbAvailable: form.bpkbAvailable,
                fakturAvailable: form.fakturAvailable,
                serviceBook: form.serviceBook,
                spareKey: form.spareKey,
                specs: form.specs || undefined,
                branchId: form.branchId || undefined,
                isOwnerDifferent: form.isOwnerDifferent,
                bpkbOwnerName: form.isOwnerDifferent ? form.bpkbOwnerName : undefined,
                images: JSON.stringify(existingImages),
                ...vehicleDocs,
            };

            const res = await fetchApi(editingId ? `/vehicles/${editingId}` : '/vehicles', {
                method: editingId ? 'PUT' : 'POST',
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                // Show detailed validation errors
                const msg = Array.isArray(err.message) ? err.message.join('\n') : (err.message || 'Gagal menyimpan');
                toast.error(msg);
                return;
            }

            const newVehicle = await res.json();
            const vehicleId = editingId || newVehicle?.data?.id || newVehicle?.id;

            // Upload images
            if (pendingFiles.length > 0 && vehicleId) {
                const imgFd = new FormData();
                pendingFiles.forEach(f => imgFd.append('files', f));
                const uploadRes = await fetchApi(`/vehicles/${vehicleId}/images`, {
                    method: 'POST', body: imgFd,
                });
                if (!uploadRes.ok) toast.error('Beberapa foto gagal diupload');
            }

            // Upload documents
            for (const [key, file] of Object.entries(pendingDocs)) {
                if (file && vehicleId) {
                    const docFd = new FormData();
                    docFd.append('file', file);
                    docFd.append('type', key);
                    await fetchApi(`/vehicles/${vehicleId}/documents`, {
                        method: 'POST', body: docFd,
                    });
                }
            }

            toast.success(editingId ? 'Kendaraan diperbarui' : 'Kendaraan ditambahkan');
            setShowForm(false);
            resetFormState();
            fetchVehicles();
        } catch { toast.error('Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await fetchApi(`/vehicles/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Kendaraan dihapus');
                setDeleteTarget(null);
                fetchVehicles();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menghapus');
            }
        } catch { toast.error('Gagal menghapus'); }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, vehicleId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImg(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetchApi(`/upload/vehicle/${vehicleId}`, { method: 'POST', body: fd });
            if (res.ok) { toast.success('Foto diupload'); fetchVehicles(); }
            else toast.error('Gagal upload foto');
        } catch { toast.error('Gagal upload foto'); }
        finally { setUploadingImg(false); }
    };

    // Handle adding photos in form
    const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setPendingFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setPendingPreviews(prev => [...prev, ...newPreviews]);
    };

    const removePendingPhoto = (idx: number) => {
        URL.revokeObjectURL(pendingPreviews[idx]);
        setPendingFiles(prev => prev.filter((_, i) => i !== idx));
        setPendingPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const removeExistingPhoto = (idx: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== idx));
    };

    // Handle document selection in form
    const handleDocSelect = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingDocs(prev => ({ ...prev, [key]: file }));
        setDocPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
    };

    const statusBadge = (status: string) => {
        if (status === 'AVAILABLE') return 'bg-green-100 text-green-700';
        if (status === 'SOLD') return 'bg-gray-200 text-gray-600';
        if (status === 'REPAIR') return 'bg-amber-100 text-amber-700';
        return 'bg-gray-100 text-gray-500';
    };

    // Neu checkbox
    const NeuCheck = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
        <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <div onClick={() => onChange(!checked)}
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${checked
                    ? 'bg-[#00bfa5] shadow-[inset_2px_2px_4px_#009e87,inset_-1px_-1px_3px_#2ee6c8]'
                    : 'bg-[#ecf0f3] shadow-[2px_2px_4px_#cbced1,-2px_-2px_4px_#ffffff]'
                    }`}>
                {checked && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );

    // Toggle switch
    const NeuToggle = ({ checked, onChange, labelOn, labelOff }: { checked: boolean; onChange: (v: boolean) => void; labelOn: string; labelOff: string }) => (
        <div className="flex items-center gap-2">
            <button onClick={() => onChange(!checked)}
                className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-[#00bfa5]' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${checked ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-xs font-bold text-gray-700">{checked ? labelOn : labelOff}</span>
        </div>
    );

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-2 px-5 sticky top-0 z-10`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-2xl font-black tracking-tight ${theme.textMain}`}>Inventaris</h2>
                    <button onClick={openAdd} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold ${theme.btnPrimary}`}>
                        <Plus className="w-4 h-4" /> Tambah
                    </button>
                </div>
                <div className="relative mb-3">
                    <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.textMuted}`} />
                    <input type="text" placeholder="Cari merek, model..." value={search} onChange={e => setSearch(e.target.value)}
                        className={`w-full pl-12 pr-6 py-3.5 rounded-2xl text-sm font-bold outline-none ${theme.bgInput}`} />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3">
                    {['ALL', 'AVAILABLE', 'BOOKED', 'SOLD'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${statusFilter === s ? theme.btnPrimary : theme.btnSecondary}`}>
                            {s === 'ALL' ? 'Semua' : s === 'AVAILABLE' ? 'Tersedia' : s === 'BOOKED' ? 'Dipesan' : 'Terjual'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="p-5 pt-2 space-y-4 pb-24">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className={`p-4 ${theme.bgCard}`}>
                            <div className="flex gap-4 items-center">
                                <div className={`w-24 h-16 rounded-xl ${theme.imagePlaceholder} animate-pulse`} />
                                <div className="flex-1 space-y-2">
                                    <div className={`h-4 w-3/4 rounded ${theme.imagePlaceholder} animate-pulse`} />
                                    <div className={`h-3 w-1/2 rounded ${theme.imagePlaceholder} animate-pulse`} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className={`p-10 ${theme.bgCard} flex flex-col items-center text-center`}>
                        <AlertCircle className={`h-10 w-10 mb-4 opacity-30 ${theme.textMuted}`} />
                        <p className={`font-black ${theme.textMuted}`}>Tidak ada kendaraan</p>
                    </div>
                ) : filtered.map(v => (
                    <div key={v.id} onClick={() => setSelected(v)}
                        className={`p-4 flex flex-col active:scale-[0.97] transition-transform cursor-pointer ${theme.bgCard}`}>
                        <div className="flex gap-4 items-center">
                            <div className={`w-24 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${theme.imagePlaceholder}`}>
                                {v.imageUrl ? <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover" /> : <Car className="h-7 w-7 opacity-30" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-black text-base leading-tight ${theme.textMain}`}>{v.make || v.brand} {v.model}</h3>
                                <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{v.variant ?? '-'} • {v.year} • {v.color}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${statusBadge(v.status)}`}>
                                        {v.status === 'AVAILABLE' ? 'Tersedia' : v.status === 'SOLD' ? 'Terjual' : 'Servis'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={`pt-3 mt-2 border-t ${theme.divider} flex justify-between items-center`}>
                            <p className={`font-black text-base ${theme.textHighlight}`}>{fmt(v.price)}</p>
                            <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openEdit(v)}
                                    className={`p-2 rounded-xl ${theme.btnSecondary}`}><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => setDeleteTarget(v)}
                                    className="p-2 rounded-xl bg-red-100 text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            <BottomModal isOpen={!!selected} onClose={() => setSelected(null)} title="Detail Kendaraan">
                {selected && (
                    <div className="space-y-5">
                        <div className={`w-full h-44 rounded-2xl overflow-hidden flex items-center justify-center ${theme.imagePlaceholder}`}>
                            {selected.imageUrl ? <img src={selected.imageUrl} alt={selected.model} className="w-full h-full object-cover" /> : <Car className="h-16 w-16 opacity-30" />}
                        </div>
                        <label className={`flex items-center justify-center gap-2 py-2.5 rounded-xl w-full cursor-pointer ${theme.btnSecondary} text-sm font-bold`}>
                            {uploadingImg ? 'Mengupload...' : <><Upload className="w-4 h-4" /> Ganti Foto</>}
                            <input type="file" accept="image/*" className="hidden"
                                onChange={e => handleUploadImage(e, selected.id)} disabled={uploadingImg} />
                        </label>
                        <div className={`rounded-2xl p-4 space-y-3 ${theme.bgFrame} border ${theme.name === 'dark-neu' ? 'border-gray-700' : 'border-white'}`}>
                            {[
                                { label: 'Merek / Model', value: `${selected.make || selected.brand} ${selected.model}` },
                                { label: 'Varian', value: selected.variant || '-' },
                                { label: 'Tahun', value: selected.year },
                                { label: 'Warna', value: selected.color },
                                { label: 'Plat', value: selected.licensePlate || '-' },
                                { label: 'No. Rangka', value: selected.chassisNumber || '-' },
                                { label: 'No. Mesin', value: selected.engineNumber || '-' },
                                { label: 'Kondisi', value: selected.condition || '-' },
                                { label: 'Status', value: selected.status },
                                { label: 'Harga Jual', value: fmt(selected.price) },
                                { label: 'Showroom', value: selected.isShowroom ? 'Ya ✅' : 'Tidak' },
                            ].map((item, idx, arr) => (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs ${theme.textMuted}`}>{item.label}</span>
                                        <span className={`text-sm font-bold ${theme.textMain}`}>{item.value}</span>
                                    </div>
                                    {idx < arr.length - 1 && <div className={`border-t mt-3 ${theme.divider}`} />}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { openEdit(selected); }}
                                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${theme.btnSecondary}`}>
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteTarget(selected); setSelected(null); }}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                        </div>
                    </div>
                )}
            </BottomModal>

            {/* ======================== ADD/EDIT FORM MODAL ======================== */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
                    <div className="bg-[#ecf0f3] rounded-t-3xl w-full max-w-lg mx-auto p-6 max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Kendaraan' : 'Tambah Kendaraan'}</h3>
                            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            {/* ===== SECTION 1: Info Dasar ===== */}
                            <p className="text-xs font-bold text-[#00bfa5] uppercase tracking-wider pt-1">Info Dasar</p>

                            {/* Kategori */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Kategori *</label>
                                <select value={form.category} onChange={e => { setForm({ ...form, category: e.target.value, make: '', model: '', variant: '' }); }}
                                    className={neuSelect}>
                                    <option value="CAR">Mobil (CAR)</option>
                                    <option value="MOTORCYCLE">Motor (MOTORCYCLE)</option>
                                    <option value="TRUCK">Truk (TRUCK)</option>
                                    <option value="BUS">Bus (BUS)</option>
                                    <option value="OTHER">Lainnya (OTHER)</option>
                                </select>
                            </div>

                            {/* Merek */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Merek *</label>
                                <select value={form.make} onChange={e => handleBrandChange(e.target.value)} className={neuSelect}>
                                    <option value="">-- Pilih Merek --</option>
                                    {brands.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>

                            {/* Model */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Model *</label>
                                <select value={form.model} onChange={e => handleModelChange(e.target.value)}
                                    disabled={!form.make} className={`${neuSelect} disabled:opacity-50`}>
                                    <option value="">-- Pilih Model --</option>
                                    {availableModels.map((m: any) => <option key={m.id} value={m.name}>{m.name}</option>)}
                                </select>
                            </div>

                            {/* Varian */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Varian</label>
                                {availableVariants.length > 0 ? (
                                    <select value={form.variant} onChange={e => setForm({ ...form, variant: e.target.value })} className={neuSelect}>
                                        <option value="">-- Pilih Varian --</option>
                                        {availableVariants.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                ) : (
                                    <input type="text" value={form.variant} onChange={e => setForm({ ...form, variant: e.target.value })}
                                        placeholder="Ketik varian manual..." className={neuInput} />
                                )}
                            </div>

                            {/* Warna, Plat, No. Rangka */}
                            {[
                                { label: 'Warna', key: 'color', placeholder: 'Putih, Hitam, Silver...' },
                                { label: 'No. Plat', key: 'licensePlate', placeholder: 'B 1234 XYZ' },
                                { label: 'No. Rangka', key: 'chassisNumber', placeholder: 'MHF...' },
                                { label: 'No. Mesin', key: 'engineNumber', placeholder: 'Nomor mesin...' },
                            ].map(({ label, key, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                                    <input type="text" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                                        placeholder={placeholder} className={neuInput} />
                                </div>
                            ))}

                            {/* Tahun & Kondisi */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Tahun</label>
                                    <input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} className={neuInput} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Kondisi</label>
                                    <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className={neuSelect}>
                                        {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Catatan Kondisi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Catatan Kondisi</label>
                                <textarea value={form.conditionNote} onChange={e => setForm({ ...form, conditionNote: e.target.value })}
                                    rows={2} placeholder="Deskripsi kondisi kendaraan..." className={neuInput + ' resize-none'} />
                            </div>

                            {/* ===== SECTION 2: Harga & Tanggal ===== */}
                            <p className="text-xs font-bold text-[#00bfa5] uppercase tracking-wider pt-3">Harga & Tanggal</p>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Harga Beli (Rp)</label>
                                    <input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} className={neuInput} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Harga Jual (Rp) *</label>
                                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={neuInput} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Tanggal Beli</label>
                                    <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className={neuInput} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={neuSelect}>
                                        {STATUSES.map(s => <option key={s} value={s}>{s === 'AVAILABLE' ? 'Tersedia' : s === 'BOOKED' ? 'Dipesan' : 'Terjual'}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Cabang */}
                            {branches.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Cabang</label>
                                    <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} className={neuSelect}>
                                        <option value="">-- Pilih Cabang --</option>
                                        {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* ===== SECTION 3: Kelengkapan Surat ===== */}
                            <p className="text-xs font-bold text-[#00bfa5] uppercase tracking-wider pt-3">Kelengkapan Surat</p>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">No. BPKB</label>
                                <input type="text" value={form.bpkbNumber} onChange={e => setForm({ ...form, bpkbNumber: e.target.value })}
                                    placeholder="Nomor BPKB..." className={neuInput} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Masa STNK</label>
                                    <input type="date" value={form.stnkExpiry} onChange={e => setForm({ ...form, stnkExpiry: e.target.value })} className={neuInput} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Masa Pajak</label>
                                    <input type="date" value={form.taxExpiry} onChange={e => setForm({ ...form, taxExpiry: e.target.value })} className={neuInput} />
                                </div>
                            </div>

                            {/* Checkboxes */}
                            <div className="bg-[#e4e8eb] rounded-xl p-3 space-y-1">
                                <NeuCheck checked={form.bpkbAvailable} onChange={v => setForm({ ...form, bpkbAvailable: v })} label="BPKB Ada" />
                                <NeuCheck checked={form.fakturAvailable} onChange={v => setForm({ ...form, fakturAvailable: v })} label="Faktur Ada" />
                                <NeuCheck checked={form.serviceBook} onChange={v => setForm({ ...form, serviceBook: v })} label="Buku Service" />
                                <NeuCheck checked={form.spareKey} onChange={v => setForm({ ...form, spareKey: v })} label="Kunci Cadangan" />
                            </div>

                            {/* BPKB Owner */}
                            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-gray-700">Pemilik BPKB</span>
                                    <NeuToggle checked={form.isOwnerDifferent}
                                        onChange={v => { setForm({ ...form, isOwnerDifferent: v }); setShowBpkbSection(v); }}
                                        labelOn="BERBEDA" labelOff="SAMA" />
                                </div>
                                {form.isOwnerDifferent && (
                                    <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Nama Pemilik BPKB *</label>
                                        <input type="text" value={form.bpkbOwnerName} onChange={e => setForm({ ...form, bpkbOwnerName: e.target.value })}
                                            placeholder="Nama sesuai BPKB" className={neuInput} />
                                    </div>
                                )}
                            </div>

                            {/* Showroom toggle */}
                            <div className="flex items-center justify-between bg-[#e4e8eb] rounded-xl p-3">
                                <span className="text-sm font-bold text-gray-700">Tampil di Showroom?</span>
                                <NeuToggle checked={form.isShowroom} onChange={v => setForm({ ...form, isShowroom: v })} labelOn="YA" labelOff="TIDAK" />
                            </div>

                            {/* Spesifikasi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Spesifikasi</label>
                                <textarea value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })}
                                    rows={2} placeholder="Fitur, aksesoris, dll..." className={neuInput + ' resize-none'} />
                            </div>

                            {/* ===== SECTION 4: Foto Kendaraan ===== */}
                            <p className="text-xs font-bold text-[#00bfa5] uppercase tracking-wider pt-3">📷 Foto Kendaraan</p>

                            <div className="grid grid-cols-4 gap-2">
                                {/* Existing images */}
                                {existingImages.map((img, idx) => (
                                    <div key={`ex-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-200">
                                        <img src={img.startsWith('http') ? img : `${API_URL}${img}`} alt="" className="w-full h-full object-cover" />
                                        <button onClick={() => removeExistingPhoto(idx)}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {/* Pending previews */}
                                {pendingPreviews.map((url, idx) => (
                                    <div key={`pend-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 ring-2 ring-[#00bfa5]">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <button onClick={() => removePendingPhoto(idx)}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {/* Add button */}
                                <label className="aspect-square rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex flex-col items-center justify-center cursor-pointer hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] transition-shadow">
                                    <Camera className="w-5 h-5 text-[#00bfa5]" />
                                    <span className="text-[10px] font-bold text-gray-500 mt-1">Tambah</span>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
                                </label>
                            </div>
                            {form.isShowroom && <p className="text-xs text-amber-600 font-medium">⚠️ Minimal 1 foto wajib untuk tampil di Showroom</p>}

                            {/* ===== SECTION 5: Dokumen Pendukung ===== */}
                            <button onClick={() => setShowDocSection(!showDocSection)}
                                className="flex items-center justify-between w-full pt-3">
                                <p className="text-xs font-bold text-[#00bfa5] uppercase tracking-wider">📄 Dokumen Pendukung</p>
                                <ChevronDown className={`w-4 h-4 text-[#00bfa5] transition-transform ${showDocSection ? 'rotate-180' : ''}`} />
                            </button>

                            {showDocSection && (
                                <div className="grid grid-cols-2 gap-3">
                                    {DOC_TYPES.map(doc => {
                                        const existingUrl = vehicleDocs[doc.key];
                                        const previewUrl = docPreviews[doc.key];
                                        const hasDoc = !!previewUrl || !!existingUrl;

                                        return (
                                            <div key={doc.key} className="flex flex-col items-center">
                                                <label className={`w-full aspect-[4/3] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${hasDoc
                                                    ? 'bg-green-50 border-2 border-green-200'
                                                    : 'bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                                                    } overflow-hidden relative`}>
                                                    {(previewUrl || existingUrl) ? (
                                                        <img src={previewUrl || (existingUrl?.startsWith('http') ? existingUrl : `${API_URL}${existingUrl}`)} alt={doc.label} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <>
                                                            <span className="text-2xl">{doc.icon}</span>
                                                            <span className="text-[10px] font-bold text-gray-500 mt-1">Upload</span>
                                                        </>
                                                    )}
                                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleDocSelect(doc.key, e)} />
                                                </label>
                                                <span className="text-[11px] font-bold text-gray-600 mt-1.5">{doc.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Submit buttons */}
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? 'Menyimpan...' : <><Check className="w-4 h-4" /> Simpan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-sm">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="font-bold text-gray-800">Hapus Kendaraan?</h3>
                            <p className="text-sm text-gray-500 mt-1">{deleteTarget.make || deleteTarget.brand} {deleteTarget.model} akan dihapus permanen.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
