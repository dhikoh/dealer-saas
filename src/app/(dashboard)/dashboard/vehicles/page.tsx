"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, Button, Input, Select, Alert } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import {
    Car,
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    MoreVertical,
    FileText,
    AlertCircle
} from "lucide-react";

interface Vehicle {
    id: string;
    stockCode: string;
    year: number;
    color: string;
    condition: string;
    plateNumber: string | null;
    sellingPrice: number;
    status: string;
    photos: { filePath: string }[];
    legal: { legalStatus: string; stnkExpiry: Date | null } | null;
    variant: {
        name: string;
        model: {
            name: string;
            brand: {
                name: string;
            };
        };
    };
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const statusColors: Record<string, string> = {
    available: "badge-success",
    reserved: "badge-warning",
    sold: "badge-neutral",
    maintenance: "badge-info"
};

const statusLabels: Record<string, string> = {
    available: "Tersedia",
    reserved: "Dipesan",
    sold: "Terjual",
    maintenance: "Maintenance"
};

const conditionLabels: Record<string, string> = {
    baru: "Baru",
    bekas: "Bekas"
};

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);

    const fetchVehicles = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20"
            });

            if (search) params.append("search", search);
            if (statusFilter !== "all") params.append("status", statusFilter);

            const response = await fetch(`/api/vehicles?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal memuat data");
            }

            setVehicles(data.vehicles);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchVehicles();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus kendaraan ini?")) return;

        try {
            const response = await fetch(`/api/vehicles/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Gagal menghapus");
            }

            fetchVehicles();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal menghapus");
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Car className="h-8 w-8 text-primary-500" />
                        Daftar Kendaraan
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Kelola stok kendaraan di showroom Anda
                    </p>
                </div>
                <Link href="/dashboard/vehicles/new">
                    <Button leftIcon={<Plus className="h-5 w-5" />}>
                        Tambah Kendaraan
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Cari kode stok, plat, atau model..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftIcon={<Search className="h-5 w-5 text-slate-400" />}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            options={[
                                { value: "all", label: "Semua Status" },
                                { value: "available", label: "Tersedia" },
                                { value: "reserved", label: "Dipesan" },
                                { value: "sold", label: "Terjual" },
                                { value: "maintenance", label: "Maintenance" }
                            ]}
                            className="w-40"
                        />
                        <Button type="submit" variant="outline" leftIcon={<Filter className="h-5 w-5" />}>
                            Filter
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="error" message={error} onClose={() => setError("")} />
            )}

            {/* Vehicles Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="aspect-video bg-slate-200 rounded-lg mb-4" />
                            <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
                            <div className="h-8 bg-slate-200 rounded" />
                        </Card>
                    ))}
                </div>
            ) : vehicles.length === 0 ? (
                <Card className="text-center py-12">
                    <Car className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Belum ada kendaraan</h3>
                    <p className="text-slate-500 mb-4">
                        Mulai tambahkan kendaraan ke showroom Anda
                    </p>
                    <Link href="/dashboard/vehicles/new">
                        <Button leftIcon={<Plus className="h-5 w-5" />}>
                            Tambah Kendaraan Pertama
                        </Button>
                    </Link>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {vehicles.map((vehicle) => (
                            <Card key={vehicle.id} className="card-hover overflow-hidden">
                                {/* Image */}
                                <div className="aspect-video bg-slate-100 rounded-lg mb-4 relative overflow-hidden">
                                    {vehicle.photos.length > 0 ? (
                                        <img
                                            src={vehicle.photos[0].filePath}
                                            alt={`${vehicle.variant.model.brand.name} ${vehicle.variant.model.name}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Car className="h-12 w-12 text-slate-300" />
                                        </div>
                                    )}
                                    <span className={`badge ${statusColors[vehicle.status]} absolute top-2 right-2`}>
                                        {statusLabels[vehicle.status]}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-slate-900 truncate">
                                        {vehicle.variant.model.brand.name} {vehicle.variant.model.name}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {vehicle.variant.name} • {vehicle.year} • {vehicle.color}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {vehicle.stockCode} {vehicle.plateNumber && `• ${vehicle.plateNumber}`}
                                    </p>

                                    {/* Price */}
                                    <p className="text-lg font-bold text-primary-600">
                                        {formatRupiah(vehicle.sellingPrice)}
                                    </p>

                                    {/* Condition Badge */}
                                    <div className="flex items-center gap-2">
                                        <span className={`badge ${vehicle.condition === "baru" ? "badge-info" : "badge-neutral"}`}>
                                            {conditionLabels[vehicle.condition]}
                                        </span>
                                        {vehicle.legal?.legalStatus === "incomplete" && (
                                            <span className="badge badge-warning flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Dokumen
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                    <Link href={`/dashboard/vehicles/${vehicle.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full" leftIcon={<Eye className="h-4 w-4" />}>
                                            Detail
                                        </Button>
                                    </Link>
                                    <Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
                                        <Button variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />} />
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(vehicle.id)}
                                        className="text-red-500 hover:bg-red-50"
                                        leftIcon={<Trash2 className="h-4 w-4" />}
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Menampilkan {vehicles.length} dari {pagination.total} kendaraan
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Sebelumnya
                                </Button>
                                <span className="px-4 py-2 text-sm text-slate-600">
                                    {page} / {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === pagination.totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
