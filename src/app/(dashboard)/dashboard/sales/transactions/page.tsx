"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, Button, Select, Alert } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import {
    CreditCard,
    Eye,
    Download,
    CheckCircle,
    Clock,
    AlertCircle,
    User,
    Car,
    FileText
} from "lucide-react";

interface Transaction {
    id: string;
    transactionDate: string;
    paymentMethod: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
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
    leasingPartner: {
        id: string;
        name: string;
    } | null;
}

const statusConfig: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", badge: "badge-warning", icon: <Clock className="h-4 w-4" /> },
    approved: { label: "Disetujui", badge: "badge-info", icon: <CheckCircle className="h-4 w-4" /> },
    processing: { label: "Proses", badge: "badge-info", icon: <Clock className="h-4 w-4" /> },
    completed: { label: "Selesai", badge: "badge-success", icon: <CheckCircle className="h-4 w-4" /> },
    cancelled: { label: "Dibatalkan", badge: "badge-error", icon: <AlertCircle className="h-4 w-4" /> }
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);

            const response = await fetch(`/api/transactions?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal memuat data");
            }

            setTransactions(data.transactions);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleGenerateSPK = async (transactionId: string) => {
        try {
            const response = await fetch("/api/pdf/spk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal generate SPK");
            }

            // Open HTML in new window for printing
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(data.html);
                printWindow.document.close();
                printWindow.print();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal generate SPK");
        }
    };

    const handleGenerateInvoice = async (transactionId: string) => {
        try {
            const response = await fetch("/api/pdf/invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal generate Invoice");
            }

            // Open HTML in new window for printing
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(data.html);
                printWindow.document.close();
                printWindow.print();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal generate Invoice");
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-primary-500" />
                    Transaksi
                </h1>
                <p className="text-slate-500 mt-1">
                    Kelola transaksi penjualan kendaraan
                </p>
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
                            { value: "approved", label: "Disetujui" },
                            { value: "processing", label: "Proses" },
                            { value: "completed", label: "Selesai" },
                            { value: "cancelled", label: "Dibatalkan" }
                        ]}
                        className="w-48"
                    />
                    <div className="flex-1" />
                    <p className="text-sm text-slate-500">
                        {transactions.length} transaksi
                    </p>
                </div>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="error" message={error} onClose={() => setError("")} />
            )}

            {/* Transactions List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-slate-200 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : transactions.length === 0 ? (
                <Card className="text-center py-12">
                    <CreditCard className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Belum ada transaksi</h3>
                    <p className="text-slate-500">
                        Transaksi akan muncul setelah draft dikonversi
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {transactions.map((tx) => {
                        const status = statusConfig[tx.status] || statusConfig.pending;
                        const paidPercentage = (Number(tx.paidAmount) / Number(tx.totalAmount)) * 100;

                        return (
                            <Card key={tx.id} className="card-hover">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    {/* Vehicle Info */}
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Car className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {tx.vehicle.variant.model.brand.name} {tx.vehicle.variant.model.name}
                                                </h3>
                                                <span className={`badge ${status.badge} flex items-center gap-1`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 truncate">
                                                {tx.vehicle.variant.name} • {tx.vehicle.year} • {tx.vehicle.color}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                                                <span className="flex items-center gap-1 text-slate-500">
                                                    <User className="h-4 w-4" />
                                                    {tx.customer.name}
                                                </span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-500">
                                                    {new Date(tx.transactionDate).toLocaleDateString("id-ID")}
                                                </span>
                                                {tx.leasingPartner && (
                                                    <>
                                                        <span className="text-slate-400">•</span>
                                                        <span className="text-slate-500">{tx.leasingPartner.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price & Actions */}
                                    <div className="flex flex-col lg:items-end gap-3">
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-primary-600">
                                                {formatRupiah(Number(tx.totalAmount))}
                                            </p>
                                            <div className="flex items-center gap-2 justify-end mt-1">
                                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{ width: `${Math.min(paidPercentage, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {paidPercentage.toFixed(0)}% dibayar
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleGenerateSPK(tx.id)}
                                                leftIcon={<FileText className="h-4 w-4" />}
                                            >
                                                SPK
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleGenerateInvoice(tx.id)}
                                                leftIcon={<Download className="h-4 w-4" />}
                                            >
                                                Invoice
                                            </Button>
                                            <Link href={`/dashboard/sales/transactions/${tx.id}`}>
                                                <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                                                    Detail
                                                </Button>
                                            </Link>
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
