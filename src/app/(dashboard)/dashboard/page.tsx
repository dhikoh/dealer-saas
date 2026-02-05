"use client";

import { useSession } from "next-auth/react";
import { Card, CardHeader } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import {
    Car,
    Users,
    FileText,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowUpRight
} from "lucide-react";

// Placeholder stats - will be replaced with real data from API
const stats = [
    {
        label: "Total Kendaraan",
        value: "24",
        change: "+3 bulan ini",
        icon: Car,
        color: "bg-blue-500"
    },
    {
        label: "Kendaraan Terjual",
        value: "8",
        change: "+2 dari bulan lalu",
        icon: CheckCircle,
        color: "bg-green-500"
    },
    {
        label: "Total Customer",
        value: "156",
        change: "+12 bulan ini",
        icon: Users,
        color: "bg-purple-500"
    },
    {
        label: "Pendapatan",
        value: formatRupiah(850000000),
        change: "+15%",
        icon: TrendingUp,
        color: "bg-amber-500"
    }
];

const recentDrafts = [
    {
        id: "1",
        customer: "Budi Santoso",
        vehicle: "Honda Beat 2024",
        status: "draft",
        amount: formatRupiah(22500000),
        date: "2 jam lalu"
    },
    {
        id: "2",
        customer: "Siti Rahayu",
        vehicle: "Yamaha NMAX 2024",
        status: "quoted",
        amount: formatRupiah(32000000),
        date: "5 jam lalu"
    },
    {
        id: "3",
        customer: "Ahmad Wijaya",
        vehicle: "Honda Vario 125",
        status: "submitted",
        amount: formatRupiah(24500000),
        date: "1 hari lalu"
    }
];

const statusColors: Record<string, string> = {
    draft: "badge-neutral",
    quoted: "badge-info",
    submitted: "badge-warning",
    approved: "badge-success",
    rejected: "badge-error"
};

const statusLabels: Record<string, string> = {
    draft: "Draft",
    quoted: "Quotation",
    submitted: "Diajukan",
    approved: "Disetujui",
    rejected: "Ditolak"
};

export default function DashboardPage() {
    const { data: session } = useSession();

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        Selamat Datang, {session?.user?.name?.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Ini adalah ringkasan aktivitas dealer Anda hari ini.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    })}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="card-hover">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.color}`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales Drafts */}
                <Card>
                    <CardHeader
                        title="Draft Penjualan Terbaru"
                        action={
                            <a href="/dashboard/sales" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                Lihat Semua
                                <ArrowUpRight className="h-4 w-4" />
                            </a>
                        }
                    />
                    <div className="space-y-3">
                        {recentDrafts.map((draft) => (
                            <div
                                key={draft.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-slate-900 truncate">{draft.customer}</p>
                                    <p className="text-sm text-slate-500 truncate">{draft.vehicle}</p>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="font-medium text-slate-900">{draft.amount}</p>
                                    <span className={`badge ${statusColors[draft.status]}`}>
                                        {statusLabels[draft.status]}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {recentDrafts.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                <p>Belum ada draft penjualan</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader title="Aksi Cepat" />
                    <div className="grid grid-cols-2 gap-3">
                        <a
                            href="/dashboard/vehicles/new"
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border-2 border-transparent transition-all"
                        >
                            <Car className="h-8 w-8 text-primary-500 mb-2" />
                            <span className="text-sm font-medium text-slate-700">Tambah Kendaraan</span>
                        </a>
                        <a
                            href="/dashboard/customers"
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border-2 border-transparent transition-all"
                        >
                            <Users className="h-8 w-8 text-primary-500 mb-2" />
                            <span className="text-sm font-medium text-slate-700">Tambah Customer</span>
                        </a>
                        <a
                            href="/dashboard/sales"
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border-2 border-transparent transition-all"
                        >
                            <FileText className="h-8 w-8 text-primary-500 mb-2" />
                            <span className="text-sm font-medium text-slate-700">Buat Draft</span>
                        </a>
                        <a
                            href="/dashboard/sales/credit-simulation"
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border-2 border-transparent transition-all"
                        >
                            <TrendingUp className="h-8 w-8 text-primary-500 mb-2" />
                            <span className="text-sm font-medium text-slate-700">Simulasi Kredit</span>
                        </a>
                    </div>
                </Card>
            </div>

            {/* Alerts / Notifications */}
            <Card>
                <CardHeader title="Perlu Perhatian" />
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800">3 kendaraan STNK akan habis</p>
                            <p className="text-sm text-amber-600">Perpanjang STNK dalam 30 hari ke depan</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-800">5 draft menunggu follow-up</p>
                            <p className="text-sm text-blue-600">Hubungi customer untuk konfirmasi</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
