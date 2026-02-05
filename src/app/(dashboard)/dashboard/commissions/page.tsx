"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, Button, Select, Alert } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import {
    DollarSign,
    Clock,
    CheckCircle,
    User,
    Car,
    Calendar
} from "lucide-react";

interface Commission {
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    notes: string | null;
    createdAt: string;
    sales: {
        id: string;
        name: string;
    };
    transaction: {
        id: string;
        transactionDate: string;
        totalAmount: number;
        vehicle: {
            stockCode: string;
            variant: {
                model: {
                    name: string;
                    brand: { name: string };
                };
            };
        };
        customer: {
            name: string;
        };
    };
}

const statusConfig: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", badge: "badge-warning", icon: <Clock className="h-4 w-4" /> },
    paid: { label: "Dibayar", badge: "badge-success", icon: <CheckCircle className="h-4 w-4" /> },
    cancelled: { label: "Batal", badge: "badge-error", icon: <Clock className="h-4 w-4" /> }
};

export default function CommissionsPage() {
    const { data: session } = useSession();
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [totals, setTotals] = useState({ pending: 0, paid: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const canManage = ["owner", "finance"].includes(session?.user?.role || "");

    const fetchCommissions = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);

            const response = await fetch(`/api/commissions?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal memuat data");
            }

            setCommissions(data.commissions);
            setTotals(data.totals);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchCommissions();
    }, [fetchCommissions]);

    const handlePayout = async (commissionId: string) => {
        if (!confirm("Tandai komisi ini sebagai sudah dibayar?")) return;

        try {
            const response = await fetch(`/api/commissions/${commissionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "paid" })
            });

            if (!response.ok) {
                throw new Error("Gagal update status");
            }

            setSuccess("Komisi berhasil dibayarkan!");
            fetchCommissions();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal update");
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-primary-500" />
                    Komisi & Payout
                </h1>
                <p className="text-slate-500 mt-1">
                    {canManage ? "Kelola komisi sales" : "Lihat komisi Anda"}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-yellow-50 border-yellow-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-yellow-600 font-medium">Pending</p>
                            <p className="text-2xl font-bold text-yellow-700">{formatRupiah(totals.pending)}</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-green-600 font-medium">Sudah Dibayar</p>
                            <p className="text-2xl font-bold text-green-700">{formatRupiah(totals.paid)}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                            { value: "all", label: "Semua Status" },
                            { value: "pending", label: "Pending" },
                            { value: "paid", label: "Sudah Dibayar" }
                        ]}
                        className="w-48"
                    />
                    <div className="flex-1" />
                    <p className="text-sm text-slate-500">
                        {commissions.length} komisi
                    </p>
                </div>
            </Card>

            {/* Alerts */}
            {error && <Alert variant="error" message={error} onClose={() => setError("")} />}
            {success && <Alert variant="success" message={success} />}

            {/* Commissions List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-slate-200 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : commissions.length === 0 ? (
                <Card className="text-center py-12">
                    <DollarSign className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Belum ada komisi</h3>
                    <p className="text-slate-500">
                        Komisi akan muncul setelah transaksi selesai
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {commissions.map((comm) => {
                        const status = statusConfig[comm.status] || statusConfig.pending;

                        return (
                            <Card key={comm.id} className="card-hover">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Car className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {comm.transaction.vehicle.variant.model.brand.name} {comm.transaction.vehicle.variant.model.name}
                                                </h3>
                                                <span className={`badge ${status.badge} flex items-center gap-1`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                Customer: {comm.transaction.customer.name}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <User className="h-4 w-4" />
                                                    {comm.sales.name}
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(comm.transaction.transactionDate).toLocaleDateString("id-ID")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:items-end gap-3">
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-primary-600">
                                                {formatRupiah(Number(comm.amount))}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Dari transaksi {formatRupiah(Number(comm.transaction.totalAmount))}
                                            </p>
                                        </div>
                                        {canManage && comm.status === "pending" && (
                                            <Button
                                                size="sm"
                                                onClick={() => handlePayout(comm.id)}
                                                leftIcon={<CheckCircle className="h-4 w-4" />}
                                            >
                                                Bayar Komisi
                                            </Button>
                                        )}
                                        {comm.paidAt && (
                                            <p className="text-xs text-green-600">
                                                Dibayar: {new Date(comm.paidAt).toLocaleDateString("id-ID")}
                                            </p>
                                        )}
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
