"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Input, Button, Select, Alert } from "@/components/ui";
import Link from "next/link";
import {
    Car,
    Save,
    ArrowLeft,
    FileText,
    AlertTriangle,
    CheckCircle,
    Calendar
} from "lucide-react";

interface VehicleLegal {
    id: string;
    stnkNumber: string | null;
    stnkExpiry: string | null;
    stnkName: string | null;
    bpkbNumber: string | null;
    bpkbStatus: string;
    bpkbName: string | null;
    taxExpiry: string | null;
    legalStatus: string;
    notes: string | null;
}

interface VehicleCondition {
    id: string;
    mileage: number | null;
    engineCondition: string | null;
    bodyCondition: string | null;
    interiorCondition: string | null;
    electricalCondition: string | null;
    tireCondition: string | null;
    serviceHistory: boolean;
    repairNotes: string | null;
    grade: string | null;
}

interface Vehicle {
    id: string;
    stockCode: string;
    variant: {
        model: {
            name: string;
            brand: { name: string };
        };
    };
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeTab, setActiveTab] = useState<"legal" | "condition">("legal");

    // Legal form
    const [legal, setLegal] = useState({
        stnkNumber: "",
        stnkExpiry: "",
        stnkName: "",
        bpkbNumber: "",
        bpkbStatus: "ada",
        bpkbName: "",
        taxExpiry: "",
        legalStatus: "lengkap",
        notes: ""
    });

    // Condition form
    const [condition, setCondition] = useState({
        mileage: "",
        engineCondition: "",
        bodyCondition: "",
        interiorCondition: "",
        electricalCondition: "",
        tireCondition: "",
        serviceHistory: false,
        repairNotes: "",
        grade: ""
    });

    // Fetch data
    useEffect(() => {
        async function fetchData() {
            try {
                const [vehicleRes, legalRes, conditionRes] = await Promise.all([
                    fetch(`/api/vehicles/${id}`),
                    fetch(`/api/vehicles/${id}/legal`),
                    fetch(`/api/vehicles/${id}/condition`)
                ]);

                if (!vehicleRes.ok) {
                    throw new Error("Kendaraan tidak ditemukan");
                }

                const vehicleData = await vehicleRes.json();
                setVehicle(vehicleData);

                if (legalRes.ok) {
                    const legalData = await legalRes.json();
                    if (legalData) {
                        setLegal({
                            stnkNumber: legalData.stnkNumber || "",
                            stnkExpiry: legalData.stnkExpiry ? legalData.stnkExpiry.split("T")[0] : "",
                            stnkName: legalData.stnkName || "",
                            bpkbNumber: legalData.bpkbNumber || "",
                            bpkbStatus: legalData.bpkbStatus || "ada",
                            bpkbName: legalData.bpkbName || "",
                            taxExpiry: legalData.taxExpiry ? legalData.taxExpiry.split("T")[0] : "",
                            legalStatus: legalData.legalStatus || "lengkap",
                            notes: legalData.notes || ""
                        });
                    }
                }

                if (conditionRes.ok) {
                    const conditionData = await conditionRes.json();
                    if (conditionData) {
                        setCondition({
                            mileage: conditionData.mileage?.toString() || "",
                            engineCondition: conditionData.engineCondition || "",
                            bodyCondition: conditionData.bodyCondition || "",
                            interiorCondition: conditionData.interiorCondition || "",
                            electricalCondition: conditionData.electricalCondition || "",
                            tireCondition: conditionData.tireCondition || "",
                            serviceHistory: conditionData.serviceHistory || false,
                            repairNotes: conditionData.repairNotes || "",
                            grade: conditionData.grade || ""
                        });
                    }
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal memuat data");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id]);

    // Save legal
    const saveLegal = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`/api/vehicles/${id}/legal`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(legal)
            });

            if (!response.ok) {
                throw new Error("Gagal menyimpan");
            }

            setSuccess("Data legalitas berhasil disimpan!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    };

    // Save condition
    const saveCondition = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`/api/vehicles/${id}/condition`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...condition,
                    mileage: condition.mileage ? parseInt(condition.mileage) : null
                })
            });

            if (!response.ok) {
                throw new Error("Gagal menyimpan");
            }

            setSuccess("Data kondisi berhasil disimpan!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    };

    const conditionOptions = [
        { value: "", label: "-- Pilih --" },
        { value: "baik", label: "Baik" },
        { value: "cukup", label: "Cukup" },
        { value: "kurang", label: "Kurang" }
    ];

    if (loading) {
        return (
            <div className="space-y-6 max-w-4xl">
                <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
                <Card className="animate-pulse">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
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
                        {vehicle.variant.model.brand.name} {vehicle.variant.model.name}
                    </h1>
                    <p className="text-slate-500 mt-1">{vehicle.stockCode}</p>
                </div>
            </div>

            {/* Alerts */}
            {error && <Alert variant="error" message={error} onClose={() => setError("")} />}
            {success && <Alert variant="success" message={success} />}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "legal"
                            ? "text-primary-600 border-b-2 border-primary-500"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                    onClick={() => setActiveTab("legal")}
                >
                    <FileText className="h-4 w-4 inline mr-2" />
                    Legalitas
                </button>
                <button
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "condition"
                            ? "text-primary-600 border-b-2 border-primary-500"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                    onClick={() => setActiveTab("condition")}
                >
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Kondisi
                </button>
            </div>

            {/* Legal Form */}
            {activeTab === "legal" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="STNK" icon={<FileText className="h-5 w-5" />} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nomor STNK"
                                value={legal.stnkNumber}
                                onChange={(e) => setLegal(prev => ({ ...prev, stnkNumber: e.target.value }))}
                                placeholder="12345678"
                            />
                            <Input
                                label="Masa Berlaku STNK"
                                type="date"
                                value={legal.stnkExpiry}
                                onChange={(e) => setLegal(prev => ({ ...prev, stnkExpiry: e.target.value }))}
                            />
                            <Input
                                label="Atas Nama STNK"
                                value={legal.stnkName}
                                onChange={(e) => setLegal(prev => ({ ...prev, stnkName: e.target.value }))}
                                placeholder="Nama pemilik di STNK"
                            />
                            <Input
                                label="Masa Berlaku Pajak"
                                type="date"
                                value={legal.taxExpiry}
                                onChange={(e) => setLegal(prev => ({ ...prev, taxExpiry: e.target.value }))}
                            />
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="BPKB" icon={<FileText className="h-5 w-5" />} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nomor BPKB"
                                value={legal.bpkbNumber}
                                onChange={(e) => setLegal(prev => ({ ...prev, bpkbNumber: e.target.value }))}
                                placeholder="A-12345678"
                            />
                            <Select
                                label="Status BPKB"
                                value={legal.bpkbStatus}
                                onChange={(e) => setLegal(prev => ({ ...prev, bpkbStatus: e.target.value }))}
                                options={[
                                    { value: "ada", label: "Ada" },
                                    { value: "proses", label: "Dalam Proses" },
                                    { value: "hilang", label: "Hilang" },
                                    { value: "kosong", label: "Belum Ada" }
                                ]}
                            />
                            <Input
                                label="Atas Nama BPKB"
                                value={legal.bpkbName}
                                onChange={(e) => setLegal(prev => ({ ...prev, bpkbName: e.target.value }))}
                                placeholder="Nama pemilik di BPKB"
                            />
                            <Select
                                label="Status Legalitas"
                                value={legal.legalStatus}
                                onChange={(e) => setLegal(prev => ({ ...prev, legalStatus: e.target.value }))}
                                options={[
                                    { value: "lengkap", label: "Lengkap" },
                                    { value: "tidak_lengkap", label: "Tidak Lengkap" },
                                    { value: "proses", label: "Dalam Proses" }
                                ]}
                            />
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Catatan Legalitas" />
                        <textarea
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            rows={3}
                            placeholder="Catatan terkait dokumen kendaraan..."
                            value={legal.notes}
                            onChange={(e) => setLegal(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            onClick={saveLegal}
                            isLoading={saving}
                            leftIcon={<Save className="h-5 w-5" />}
                        >
                            Simpan Legalitas
                        </Button>
                    </div>
                </div>
            )}

            {/* Condition Form */}
            {activeTab === "condition" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Informasi Umum" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Kilometer (ODO)"
                                type="number"
                                value={condition.mileage}
                                onChange={(e) => setCondition(prev => ({ ...prev, mileage: e.target.value }))}
                                placeholder="50000"
                            />
                            <Select
                                label="Grade Keseluruhan"
                                value={condition.grade}
                                onChange={(e) => setCondition(prev => ({ ...prev, grade: e.target.value }))}
                                options={[
                                    { value: "", label: "-- Pilih Grade --" },
                                    { value: "A", label: "Grade A (Sangat Baik)" },
                                    { value: "B", label: "Grade B (Baik)" },
                                    { value: "C", label: "Grade C (Cukup)" },
                                    { value: "D", label: "Grade D (Kurang)" }
                                ]}
                            />
                        </div>
                        <div className="mt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={condition.serviceHistory}
                                    onChange={(e) => setCondition(prev => ({ ...prev, serviceHistory: e.target.checked }))}
                                    className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Ada Riwayat Service</span>
                            </label>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Kondisi Per Bagian" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <Select
                                label="Mesin"
                                value={condition.engineCondition}
                                onChange={(e) => setCondition(prev => ({ ...prev, engineCondition: e.target.value }))}
                                options={conditionOptions}
                            />
                            <Select
                                label="Body / Eksterior"
                                value={condition.bodyCondition}
                                onChange={(e) => setCondition(prev => ({ ...prev, bodyCondition: e.target.value }))}
                                options={conditionOptions}
                            />
                            <Select
                                label="Interior"
                                value={condition.interiorCondition}
                                onChange={(e) => setCondition(prev => ({ ...prev, interiorCondition: e.target.value }))}
                                options={conditionOptions}
                            />
                            <Select
                                label="Kelistrikan"
                                value={condition.electricalCondition}
                                onChange={(e) => setCondition(prev => ({ ...prev, electricalCondition: e.target.value }))}
                                options={conditionOptions}
                            />
                            <Select
                                label="Ban"
                                value={condition.tireCondition}
                                onChange={(e) => setCondition(prev => ({ ...prev, tireCondition: e.target.value }))}
                                options={conditionOptions}
                            />
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Catatan Perbaikan" />
                        <textarea
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            rows={3}
                            placeholder="Catatan perbaikan atau kerusakan yang perlu diperhatikan..."
                            value={condition.repairNotes}
                            onChange={(e) => setCondition(prev => ({ ...prev, repairNotes: e.target.value }))}
                        />
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            onClick={saveCondition}
                            isLoading={saving}
                            leftIcon={<Save className="h-5 w-5" />}
                        >
                            Simpan Kondisi
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
