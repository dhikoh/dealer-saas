"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, Input, Button, Select, Alert } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import {
    FileText,
    Save,
    ArrowLeft,
    User,
    Car,
    Calculator,
    CreditCard,
    Banknote,
    Search,
    Plus
} from "lucide-react";

interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string | null;
}

interface Vehicle {
    id: string;
    stockCode: string;
    year: number;
    color: string;
    sellingPrice: number;
    condition: string;
    status: string;
    variant: {
        name: string;
        model: {
            name: string;
            brand: { name: string };
        };
    };
}

interface LeasingPartner {
    id: string;
    name: string;
    code: string;
}

export default function NewSalesDraftPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Data
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [leasingPartners, setLeasingPartners] = useState<LeasingPartner[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Search
    const [customerSearch, setCustomerSearch] = useState("");
    const [vehicleSearch, setVehicleSearch] = useState("");

    // Form state
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
    const [notes, setNotes] = useState("");

    // Pricing
    const [discount, setDiscount] = useState("");
    const [downPayment, setDownPayment] = useState("");
    const [tenor, setTenor] = useState("12");
    const [interestRate, setInterestRate] = useState("2.5");
    const [leasingPartnerId, setLeasingPartnerId] = useState("");

    // Fetch initial data
    useEffect(() => {
        async function fetchData() {
            try {
                const [customersRes, vehiclesRes, leasingRes] = await Promise.all([
                    fetch("/api/customers"),
                    fetch("/api/vehicles?status=available"),
                    fetch("/api/leasing")
                ]);

                if (customersRes.ok) {
                    const data = await customersRes.json();
                    setCustomers(data.customers || []);
                }

                if (vehiclesRes.ok) {
                    const data = await vehiclesRes.json();
                    setVehicles(data.vehicles || []);
                }

                if (leasingRes.ok) {
                    const data = await leasingRes.json();
                    setLeasingPartners(data.partners || []);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoadingData(false);
            }
        }

        fetchData();
    }, []);

    // Calculate pricing
    const vehiclePrice = selectedVehicle?.sellingPrice || 0;
    const discountAmount = parseFloat(discount.replace(/\D/g, "")) || 0;
    const netPrice = vehiclePrice - discountAmount;
    const dpAmount = parseFloat(downPayment.replace(/\D/g, "")) || 0;
    const tenorMonths = parseInt(tenor) || 12;
    const rate = parseFloat(interestRate) || 0;

    // Credit calculation
    const principalAmount = netPrice - dpAmount;
    const totalInterest = (principalAmount * rate * tenorMonths) / 100;
    const monthlyPayment = Math.round((principalAmount + totalInterest) / tenorMonths);
    const totalAmount = paymentMethod === "cash" ? netPrice : dpAmount + (monthlyPayment * tenorMonths);

    // Filter data
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );

    const filteredVehicles = vehicles.filter(v => {
        const searchText = `${v.variant.model.brand.name} ${v.variant.model.name} ${v.stockCode}`.toLowerCase();
        return searchText.includes(vehicleSearch.toLowerCase());
    });

    // Format number
    const formatNumber = (value: string): string => {
        const num = value.replace(/\D/g, "");
        return num ? parseInt(num).toLocaleString("id-ID") : "";
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCustomer) {
            setError("Pilih customer terlebih dahulu");
            return;
        }

        if (!selectedVehicle) {
            setError("Pilih kendaraan terlebih dahulu");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const payload = {
                customerId: selectedCustomer.id,
                vehicleId: selectedVehicle.id,
                notes: notes || undefined,
                pricing: {
                    paymentMethod,
                    vehiclePrice,
                    discount: discountAmount || undefined,
                    downPayment: paymentMethod === "credit" ? dpAmount : undefined,
                    tenor: paymentMethod === "credit" ? tenorMonths : undefined,
                    interestRate: paymentMethod === "credit" ? rate : undefined,
                    monthlyPayment: paymentMethod === "credit" ? monthlyPayment : undefined,
                    totalAmount,
                    leasingPartnerId: paymentMethod === "credit" && leasingPartnerId ? leasingPartnerId : undefined
                }
            };

            const response = await fetch("/api/sales/drafts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal menyimpan");
            }

            setSuccess("Draft penjualan berhasil dibuat!");
            setTimeout(() => {
                router.push("/dashboard/sales");
            }, 1500);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="space-y-6 max-w-4xl">
                <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
                <Card className="animate-pulse">
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
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
                <Link href="/dashboard/sales">
                    <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-5 w-5" />}>
                        Kembali
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="h-7 w-7 text-primary-500" />
                        Buat Draft Penjualan
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Buat draft untuk proses penjualan kendaraan
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {error && <Alert variant="error" message={error} onClose={() => setError("")} />}
            {success && <Alert variant="success" message={success} />}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Selection */}
                <Card>
                    <CardHeader title="Pilih Customer" icon={<User className="h-5 w-5" />} />

                    {selectedCustomer ? (
                        <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-slate-900">{selectedCustomer.name}</p>
                                <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>
                                {selectedCustomer.address && (
                                    <p className="text-sm text-slate-500">{selectedCustomer.address}</p>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCustomer(null)}
                            >
                                Ganti
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Input
                                placeholder="Cari nama atau nomor HP..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                leftIcon={<Search className="h-5 w-5 text-slate-400" />}
                            />
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {filteredCustomers.length === 0 ? (
                                    <div className="text-center py-4 text-slate-500">
                                        <p>Customer tidak ditemukan</p>
                                        <Link href="/dashboard/customers/new">
                                            <Button type="button" variant="outline" size="sm" className="mt-2" leftIcon={<Plus className="h-4 w-4" />}>
                                                Tambah Customer Baru
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    filteredCustomers.slice(0, 5).map(customer => (
                                        <div
                                            key={customer.id}
                                            className="p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                                            onClick={() => setSelectedCustomer(customer)}
                                        >
                                            <p className="font-medium text-slate-900">{customer.name}</p>
                                            <p className="text-sm text-slate-500">{customer.phone}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Vehicle Selection */}
                <Card>
                    <CardHeader title="Pilih Kendaraan" icon={<Car className="h-5 w-5" />} />

                    {selectedVehicle ? (
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {selectedVehicle.variant.model.brand.name} {selectedVehicle.variant.model.name}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {selectedVehicle.variant.name} • {selectedVehicle.year} • {selectedVehicle.color}
                                </p>
                                <p className="text-lg font-bold text-primary-600 mt-1">
                                    {formatRupiah(selectedVehicle.sellingPrice)}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedVehicle(null)}
                            >
                                Ganti
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Input
                                placeholder="Cari merek, model, atau kode stok..."
                                value={vehicleSearch}
                                onChange={(e) => setVehicleSearch(e.target.value)}
                                leftIcon={<Search className="h-5 w-5 text-slate-400" />}
                            />
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {filteredVehicles.length === 0 ? (
                                    <div className="text-center py-4 text-slate-500">
                                        Tidak ada kendaraan tersedia
                                    </div>
                                ) : (
                                    filteredVehicles.slice(0, 5).map(vehicle => (
                                        <div
                                            key={vehicle.id}
                                            className="p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                                            onClick={() => setSelectedVehicle(vehicle)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        {vehicle.variant.model.brand.name} {vehicle.variant.model.name}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {vehicle.variant.name} • {vehicle.year} • {vehicle.color}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{vehicle.stockCode}</p>
                                                </div>
                                                <p className="font-bold text-primary-600">
                                                    {formatRupiah(vehicle.sellingPrice)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Payment Method */}
                {selectedVehicle && (
                    <Card>
                        <CardHeader title="Metode Pembayaran" icon={<CreditCard className="h-5 w-5" />} />

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                type="button"
                                className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${paymentMethod === "cash"
                                        ? "border-primary-500 bg-primary-50"
                                        : "border-slate-200 hover:border-slate-300"
                                    }`}
                                onClick={() => setPaymentMethod("cash")}
                            >
                                <Banknote className={`h-6 w-6 ${paymentMethod === "cash" ? "text-primary-500" : "text-slate-400"}`} />
                                <div className="text-left">
                                    <p className={`font-semibold ${paymentMethod === "cash" ? "text-primary-700" : "text-slate-700"}`}>
                                        Tunai
                                    </p>
                                    <p className="text-xs text-slate-500">Bayar langsung</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${paymentMethod === "credit"
                                        ? "border-primary-500 bg-primary-50"
                                        : "border-slate-200 hover:border-slate-300"
                                    }`}
                                onClick={() => setPaymentMethod("credit")}
                            >
                                <Calculator className={`h-6 w-6 ${paymentMethod === "credit" ? "text-primary-500" : "text-slate-400"}`} />
                                <div className="text-left">
                                    <p className={`font-semibold ${paymentMethod === "credit" ? "text-primary-700" : "text-slate-700"}`}>
                                        Kredit
                                    </p>
                                    <p className="text-xs text-slate-500">Cicilan via leasing</p>
                                </div>
                            </button>
                        </div>

                        {/* Pricing Details */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Harga Kendaraan (OTR)
                                    </label>
                                    <p className="text-xl font-bold text-slate-900">
                                        {formatRupiah(vehiclePrice)}
                                    </p>
                                </div>
                                <Input
                                    label="Diskon (opsional)"
                                    value={formatNumber(discount)}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    placeholder="0"
                                />
                            </div>

                            {paymentMethod === "credit" && (
                                <div className="pt-4 border-t border-slate-200 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Uang Muka (DP)"
                                            value={formatNumber(downPayment)}
                                            onChange={(e) => setDownPayment(e.target.value)}
                                            placeholder="5.000.000"
                                            required
                                        />
                                        <Select
                                            label="Tenor"
                                            value={tenor}
                                            onChange={(e) => setTenor(e.target.value)}
                                            options={[
                                                { value: "12", label: "12 Bulan" },
                                                { value: "18", label: "18 Bulan" },
                                                { value: "24", label: "24 Bulan" },
                                                { value: "30", label: "30 Bulan" },
                                                { value: "36", label: "36 Bulan" }
                                            ]}
                                        />
                                        <Input
                                            label="Bunga (%/bulan)"
                                            value={interestRate}
                                            onChange={(e) => setInterestRate(e.target.value)}
                                            placeholder="2.5"
                                        />
                                        <Select
                                            label="Leasing Partner"
                                            value={leasingPartnerId}
                                            onChange={(e) => setLeasingPartnerId(e.target.value)}
                                            options={[
                                                { value: "", label: "-- Pilih Leasing --" },
                                                ...leasingPartners.map(lp => ({ value: lp.id, label: lp.name }))
                                            ]}
                                        />
                                    </div>

                                    {/* Credit Summary */}
                                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Harga Setelah Diskon</span>
                                            <span className="font-medium">{formatRupiah(netPrice)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Uang Muka</span>
                                            <span className="font-medium">{formatRupiah(dpAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Pokok Hutang</span>
                                            <span className="font-medium">{formatRupiah(principalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Total Bunga ({tenorMonths} bulan)</span>
                                            <span className="font-medium">{formatRupiah(totalInterest)}</span>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-slate-700">Cicilan/Bulan</span>
                                            <span className="text-xl font-bold text-primary-600">{formatRupiah(monthlyPayment)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Notes */}
                <Card>
                    <CardHeader title="Catatan" />
                    <textarea
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={3}
                        placeholder="Catatan internal untuk draft ini..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </Card>

                {/* Summary & Submit */}
                {selectedCustomer && selectedVehicle && (
                    <Card className="bg-primary-50 border-primary-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <p className="text-sm text-primary-600 font-medium">Total Pembayaran</p>
                                <p className="text-3xl font-bold text-primary-700">
                                    {formatRupiah(totalAmount)}
                                </p>
                                <p className="text-sm text-primary-600">
                                    {paymentMethod === "cash" ? "Tunai" : `DP ${formatRupiah(dpAmount)} + ${tenorMonths}x ${formatRupiah(monthlyPayment)}`}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Link href="/dashboard/sales">
                                    <Button variant="outline" type="button">
                                        Batal
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    leftIcon={<Save className="h-5 w-5" />}
                                >
                                    Simpan Draft
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </form>
        </div>
    );
}
