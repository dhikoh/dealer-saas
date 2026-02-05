"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Input, Button, Select, Alert } from "@/components/ui";
import { Car, Save, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

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

export default function NewVehiclePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Master data
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loadingMaster, setLoadingMaster] = useState(true);

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

    // Fetch master data
    useEffect(() => {
        async function fetchMasterData() {
            try {
                const response = await fetch("/api/vehicles/master");
                const data = await response.json();

                if (!response.ok) throw new Error(data.error);

                setBrands(data.brands);
                setModels(data.models);
                setVariants(data.variants);
            } catch (err) {
                setError("Gagal memuat data master");
            } finally {
                setLoadingMaster(false);
            }
        }

        fetchMasterData();
    }, []);

    // Filter models based on selected brand
    const filteredModels = models.filter(m => m.brandId === formData.brandId);
    const filteredVariants = variants.filter(v => v.modelId === formData.modelId);

    // Handle brand change - reset model and variant
    const handleBrandChange = (brandId: string) => {
        setFormData(prev => ({
            ...prev,
            brandId,
            modelId: "",
            variantId: ""
        }));
    };

    // Handle model change - reset variant
    const handleModelChange = (modelId: string) => {
        setFormData(prev => ({
            ...prev,
            modelId,
            variantId: ""
        }));
    };

    // Generate stock code
    const generateStockCode = () => {
        const prefix = "STK";
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        setFormData(prev => ({
            ...prev,
            stockCode: `${prefix}${date}${random}`
        }));
    };

    // Format number input
    const formatNumber = (value: string): string => {
        const num = value.replace(/\D/g, "");
        return num ? parseInt(num).toLocaleString("id-ID") : "";
    };

    const parseNumber = (value: string): string => {
        return value.replace(/\D/g, "");
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

            const response = await fetch("/api/vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal menyimpan");
            }

            setSuccess("Kendaraan berhasil ditambahkan!");
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

    if (loadingMaster) {
        return (
            <div className="space-y-6">
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
                        Tambah Kendaraan Baru
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Lengkapi informasi kendaraan untuk ditambahkan ke stok
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {error && <Alert variant="error" message={error} onClose={() => setError("")} />}
            {success && <Alert variant="success" message={success} />}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vehicle Selection */}
                <Card>
                    <CardHeader title="Pilih Kendaraan" />
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
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    label="Kode Stok"
                                    value={formData.stockCode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, stockCode: e.target.value }))}
                                    placeholder="STK240205ABCD"
                                    required
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={generateStockCode}
                                className="self-end"
                            >
                                Generate
                            </Button>
                        </div>
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
                            placeholder="Hitam Metalik"
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
                            placeholder="MH1JFP217KK000000"
                        />
                        <Input
                            label="No. Mesin"
                            value={formData.engineNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, engineNumber: e.target.value.toUpperCase() }))}
                            placeholder="JFP2E1000000"
                        />
                        <Input
                            label="No. Polisi"
                            value={formData.plateNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                            placeholder="B 1234 ABC"
                        />
                        <Select
                            label="Status"
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            options={[
                                { value: "available", label: "Tersedia" },
                                { value: "reserved", label: "Dipesan" },
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
                            placeholder="20.000.000"
                            hint="Untuk perhitungan profit, tidak ditampilkan"
                        />
                        <Input
                            label="Harga Jual (OTR)"
                            value={formatNumber(formData.sellingPrice)}
                            onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseNumber(e.target.value) }))}
                            placeholder="25.000.000"
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
                        placeholder="Catatan internal (tidak ditampilkan ke pembeli)..."
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
                        Simpan Kendaraan
                    </Button>
                </div>
            </form>
        </div>
    );
}
