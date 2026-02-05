"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, Button, Select, Alert } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import {
    FileText,
    Plus,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    ArrowRight,
    User,
    Car
} from "lucide-react";

interface SalesDraft {
    id: string;
    status: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    customer: {
        id: string;
        name: string;
        phone: string;
    };
    vehicle: {
        id: string;
        stockCode: string;
        year: number;
        color: string;
        sellingPrice: number;
        variant: {
            name: string;
            model: {
                name: string;
                brand: { name: string };
            };
        };
    };
    sales: {
        id: string;
        name: string;
    };
    pricing: {
        paymentMethod: string;
        totalAmount: number;
    } | null;
}

const statusConfig: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
    draft: { label: "Draft", badge: "badge-neutral", icon: <FileText className="h-4 w-4" /> },
    quoted: { label: "Quotation", badge: "badge-info", icon: <FileText className="h-4 w-4" /> },
    submitted: { label: "Diajukan", badge: "badge-warning", icon: <Clock className="h-4 w-4" /> },
    approved: { label: "Disetujui", badge: "badge-success", icon: <CheckCircle className="h-4 w-4" /> },
    converted: { label: "Transaksi", badge: "badge-success", icon: <CheckCircle className="h-4 w-4" /> },
    cancelled: { label: "Dibatalkan", badge: "badge-error", icon: <XCircle className="h-4 w-4" /> }
};

export default function SalesDraftsPage() {
    const { data: session } = useSession();
    const [drafts, setDrafts] = useState<SalesDraft[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchDrafts = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);

            const response = await fetch(`/api/sales/drafts?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal memuat data");
            }

            setDrafts(data.drafts);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    const handleConvert = async (draftId: string) => {
        if (!confirm("Konversi draft ini ke transaksi? Stok kendaraan akan dikunci.")) return;

        try {
            const response = await fetch(`/api/sales/drafts/${draftId}/convert`, {
                method: "POST"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal mengonversi");
            }

            alert("Draft berhasil dikonversi ke transaksi!");
            fetchDrafts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal mengonversi");
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary-500" />
                        Draft Penjualan
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Kelola draft dan proses penjualan kendaraan
                    </p>
                </div>
                <Link href="/dashboard/sales/new">
                    <Button leftIcon={<Plus className="h-5 w-5" />}>
                        Buat Draft Baru
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                            { value: "all", label: "Semua Status" },
                            { value: "draft", label: "Draft" },
                            { value: "quoted", label: "Quotation" },
                            { value: "submitted", label: "Diajukan" },
                            { value: "approved", label: "Disetujui" },
                            { value: "converted", label: "Transaksi" },
                            { value: "cancelled", label: "Dibatalkan" }
                        ]}
                        className="w-48"
                    />
                    <div className="flex-1" />
                    <p className="text-sm text-slate-500">
                        {drafts.length} draft ditemukan
                    </p>
                </div>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="error" message={error} onClose={() => setError("")} />
            )}

            {/* Drafts List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-slate-200 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : drafts.length === 0 ? (
                <Card className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Belum ada draft</h3>
                    <p className="text-slate-500 mb-4">
                        Mulai proses penjualan dengan membuat draft baru
                    </p>
                    <Link href="/dashboard/sales/new">
                        <Button leftIcon={<Plus className="h-5 w-5" />}>
                            Buat Draft Pertama
                        </Button>
                    </Link>
                </Card>
            ) : (
                <div className="space-y-4">
                    {drafts.map((draft) => {
                        const status = statusConfig[draft.status] || statusConfig.draft;
                        const canConvert = draft.status === "submitted" &&
                            ["owner", "finance"].includes(session?.user?.role || "");

                        return (
                            <Card key={draft.id} className="card-hover">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Vehicle Info */}
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Car className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {draft.vehicle.variant.model.brand.name} {draft.vehicle.variant.model.name}
                                                </h3>
                                                <span className={`badge ${status.badge} flex items-center gap-1`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 truncate">
                                                {draft.vehicle.variant.name} • {draft.vehicle.year} • {draft.vehicle.color}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <User className="h-4 w-4" />
                                                    {draft.customer.name}
                                                </span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-500">
                                                    Sales: {draft.sales.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price & Actions */}
                                    <div className="flex flex-col md:items-end gap-3">
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-primary-600">
                                                {draft.pricing ? formatRupiah(Number(draft.pricing.totalAmount)) : formatRupiah(draft.vehicle.sellingPrice)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {draft.pricing?.paymentMethod === "credit" ? "Kredit" : "Tunai"}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/dashboard/sales/${draft.id}`}>
                                                <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                                                    Detail
                                                </Button>
                                            </Link>
                                            {canConvert && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleConvert(draft.id)}
                                                    leftIcon={<ArrowRight className="h-4 w-4" />}
                                                >
                                                    Konversi
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
