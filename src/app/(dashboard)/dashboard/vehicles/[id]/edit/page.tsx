"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Input, Button, Select, Alert } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import {
    Car,
    Save,
    ArrowLeft,
    Upload,
    X,
    Image as ImageIcon,
    Trash2
} from "lucide-react";

interface Brand {
    id: string;
    name: string;
}

interface Model {
    id: string;
    name: string;
    brandId: string;
}

interface Variant {
    id: string;
    name: string;
    modelId: string;
    engineCc: number;
    transmission: string;
}

interface VehiclePhoto {
    id: string;
    filePath: string;
    category: string;
    isPrimary: boolean;
}

interface Vehicle {
    id: string;
    variantId: string;
    stockCode: string;
    year: number;
    color: string;
    condition: string;
    vinNumber: string | null;
    engineNumber: string | null;
    plateNumber: string | null;
    purchasePrice: number | null;
    sellingPrice: number;
    status: string;
    notes: string | null;
    photos: VehiclePhoto[];
    variant: {
        id: string;
        modelId: string;
        model: {
            id: string;
            brandId: string;
        };
    };
}

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Master data
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        brandId: "",
        modelId: "",
        variantId: "",
        stockCode: "",
        year: new Date().getFullYear().toString(),
        color: "",
        condition: "baru",
        vinNumber: "",
        engineNumber: "",
        plateNumber: "",
        purchasePrice: "",
        sellingPrice: "",
        status: "available",
        notes: ""
    });

    // Photo upload state
    const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
    const [uploading, setUploading] = useState(false);

    // Fetch vehicle and master data
    useEffect(() => {
        async function fetchData() {
            try {
                const [vehicleRes, masterRes] = await Promise.all([
                    fetch(`/api/vehicles/${id}`),
                    fetch("/api/vehicles/master")
                ]);

                if (!vehicleRes.ok) {
                    throw new Error("Kendaraan tidak ditemukan");
                }

                const vehicleData = await vehicleRes.json();
                const masterData = await masterRes.json();

                setVehicle(vehicleData);
                setBrands(masterData.brands);
                setModels(masterData.models);
                setVariants(masterData.variants);
                setPhotos(vehicleData.photos || []);

                // Set form data from vehicle
                setFormData({
                    brandId: vehicleData.variant.model.brandId,
                    modelId: vehicleData.variant.modelId,
                    variantId: vehicleData.variantId,
                    stockCode: vehicleData.stockCode,
                    year: vehicleData.year.toString(),
                    color: vehicleData.color,
                    condition: vehicleData.condition,
                    vinNumber: vehicleData.vinNumber || "",
                    engineNumber: vehicleData.engineNumber || "",
                    plateNumber: vehicleData.plateNumber || "",
                    purchasePrice: vehicleData.purchasePrice?.toString() || "",
                    sellingPrice: vehicleData.sellingPrice.toString(),
                    status: vehicleData.status,
                    notes: vehicleData.notes || ""
                });

            } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal memuat data");
            } finally {
                setLoadingData(false);
            }
        }

        fetchData();
    }, [id]);

    // Filter models and variants based on selection
    const filteredModels = models.filter(m => m.brandId === formData.brandId);
    const filteredVariants = variants.filter(v => v.modelId === formData.modelId);

    // Handle brand change
    const handleBrandChange = (brandId: string) => {
        setFormData(prev => ({
            ...prev,
            brandId,
            modelId: "",
            variantId: ""
        }));
    };

    // Handle model change
    const handleModelChange = (modelId: string) => {
        setFormData(prev => ({
            ...prev,
            modelId,
            variantId: ""
        }));
    };

    // Format number
    const formatNumber = (value: string): string => {
        const num = value.replace(/\D/g, "");
        return num ? parseInt(num).toLocaleString("id-ID") : "";
    };

    const parseNumber = (value: string): string => {
        return value.replace(/\D/g, "");
    };

    // Handle photo upload
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append("photos", files[i]);
            }
            formData.append("vehicleId", id);

            const response = await fetch("/api/vehicles/photos", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal upload foto");
            }

            setPhotos(prev => [...prev, ...data.photos]);
            setSuccess("Foto berhasil diupload");

        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal upload foto");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    // Delete photo
    const handleDeletePhoto = async (photoId: string) => {
        if (!confirm("Hapus foto ini?")) return;

        try {
            const response = await fetch(`/api/vehicles/photos/${photoId}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Gagal menghapus foto");
            }

            setPhotos(prev => prev.filter(p => p.id !== photoId));

        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal menghapus foto");
        }
    };

    // Set primary photo
    const handleSetPrimary = async (photoId: string) => {
        try {
            const response = await fetch(`/api/vehicles/photos/${photoId}/primary`, {
                method: "PUT"
            });

            if (!response.ok) {
                throw new Error("Gagal mengubah foto utama");
            }

            setPhotos(prev => prev.map(p => ({
                ...p,
                isPrimary: p.id === photoId
            })));

        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal mengubah foto utama");
        }
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const payload = {
                variantId: formData.variantId,
                stockCode: formData.stockCode,
                year: parseInt(formData.year),
                color: formData.color,
                condition: formData.condition,
                vinNumber: formData.vinNumber || undefined,
                engineNumber: formData.engineNumber || undefined,
                plateNumber: formData.plateNumber || undefined,
                purchasePrice: parseFloat(parseNumber(formData.purchasePrice)) || undefined,
                sellingPrice: parseFloat(parseNumber(formData.sellingPrice)),
                status: formData.status,
                notes: formData.notes || undefined
            };

            const response = await fetch(`/api/vehicles/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal menyimpan");
            }

            setSuccess("Kendaraan berhasil diperbarui!");
            setTimeout(() => {
                router.push("/dashboard/vehicles");
            }, 1500);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

    if (loadingData) {
        return (
            <div className="space-y-6 max-w-4xl">
                <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
                <Card className="animate-pulse">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-12 bg-slate-200 rounded" />
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="space-y-6">
                <Alert variant="error" message={error || "Kendaraan tidak ditemukan"} />
                <Link href="/dashboard/vehicles">
                    <Button variant="outline" leftIcon={<ArrowLeft className="h-5 w-5" />}>
                        Kembali
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/vehicles">
                    <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-5 w-5" />}>
                        Kembali
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Car className="h-7 w-7 text-primary-500" />
                        Edit Kendaraan
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {vehicle.stockCode}
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {error && <Alert variant="error" message={error} onClose={() => setError("")} />}
            {success && <Alert variant="success" message={success} />}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photos */}
                <Card>
                    <CardHeader title="Foto Kendaraan" icon={<ImageIcon className="h-5 w-5" />} />

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                        {photos.map(photo => (
                            <div key={photo.id} className="relative group">
                                <div className={`aspect-video rounded-lg overflow-hidden border-2 ${photo.isPrimary ? "border-primary-500" : "border-slate-200"}`}>
                                    <img
                                        src={photo.filePath}
                                        alt="Vehicle"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                    {!photo.isPrimary && (
                                        <button
                                            type="button"
                                            className="p-2 bg-white rounded-full text-primary-600 hover:bg-primary-50"
                                            onClick={() => handleSetPrimary(photo.id)}
                                            title="Jadikan foto utama"
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                                        onClick={() => handleDeletePhoto(photo.id)}
                                        title="Hapus foto"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                {photo.isPrimary && (
                                    <span className="absolute top-2 left-2 badge badge-success text-xs">
                                        Utama
                                    </span>
                                )}
                            </div>
                        ))}

                        {/* Upload button */}
                        <label className="aspect-video rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handlePhotoUpload}
                                disabled={uploading}
                            />
                            {uploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-500">Upload Foto</span>
                                </>
                            )}
                        </label>
                    </div>
                </Card>

                {/* Vehicle Selection */}
                <Card>
                    <CardHeader title="Data Kendaraan" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            label="Merek"
                            value={formData.brandId}
                            onChange={(e) => handleBrandChange(e.target.value)}
                            options={[
                                { value: "", label: "-- Pilih Merek --" },
                                ...brands.map(b => ({ value: b.id, label: b.name }))
                            ]}
                            required
                        />
                        <Select
                            label="Model"
                            value={formData.modelId}
                            onChange={(e) => handleModelChange(e.target.value)}
                            options={[
                                { value: "", label: "-- Pilih Model --" },
                                ...filteredModels.map(m => ({ value: m.id, label: m.name }))
                            ]}
                            disabled={!formData.brandId}
                            required
                        />
                        <Select
                            label="Varian"
                            value={formData.variantId}
                            onChange={(e) => setFormData(prev => ({ ...prev, variantId: e.target.value }))}
                            options={[
                                { value: "", label: "-- Pilih Varian --" },
                                ...filteredVariants.map(v => ({
                                    value: v.id,
                                    label: `${v.name} (${v.engineCc}cc - ${v.transmission})`
                                }))
                            ]}
                            disabled={!formData.modelId}
                            required
                        />
                    </div>
                </Card>

                {/* Vehicle Details */}
                <Card>
                    <CardHeader title="Detail Kendaraan" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Kode Stok"
                            value={formData.stockCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, stockCode: e.target.value }))}
                            required
                        />
                        <Select
                            label="Tahun"
                            value={formData.year}
                            onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                            options={years.map(y => ({ value: y.toString(), label: y.toString() }))}
                            required
                        />
                        <Input
                            label="Warna"
                            value={formData.color}
                            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                            required
                        />
                        <Select
                            label="Kondisi"
                            value={formData.condition}
                            onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                            options={[
                                { value: "baru", label: "Baru" },
                                { value: "bekas", label: "Bekas" }
                            ]}
                            required
                        />
                        <Input
                            label="No. Rangka (VIN)"
                            value={formData.vinNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, vinNumber: e.target.value.toUpperCase() }))}
                        />
                        <Input
                            label="No. Mesin"
                            value={formData.engineNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, engineNumber: e.target.value.toUpperCase() }))}
                        />
                        <Input
                            label="No. Polisi"
                            value={formData.plateNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                        />
                        <Select
                            label="Status"
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            options={[
                                { value: "available", label: "Tersedia" },
                                { value: "reserved", label: "Dipesan" },
                                { value: "sold", label: "Terjual" },
                                { value: "maintenance", label: "Maintenance" }
                            ]}
                        />
                    </div>
                </Card>

                {/* Pricing */}
                <Card>
                    <CardHeader title="Harga" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Harga Beli (Modal)"
                            value={formatNumber(formData.purchasePrice)}
                            onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseNumber(e.target.value) }))}
                            hint="Untuk perhitungan profit"
                        />
                        <Input
                            label="Harga Jual (OTR)"
                            value={formatNumber(formData.sellingPrice)}
                            onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseNumber(e.target.value) }))}
                            required
                        />
                    </div>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader title="Catatan Internal" />
                    <textarea
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={3}
                        placeholder="Catatan internal..."
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Link href="/dashboard/vehicles">
                        <Button variant="outline" type="button">
                            Batal
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        leftIcon={<Save className="h-5 w-5" />}
                    >
                        Simpan Perubahan
                    </Button>
                </div>
            </form>
        </div>
    );
}
