"use client";

import { useState } from "react";
import { Card, CardHeader, Input, Button, Select, Alert } from "@/components/ui";
import {
    calculateCredit,
    formatRupiah,
    CreditCalculationInput,
    CreditCalculationResult
} from "@/lib/kernel";
import {
    getAvailableTenors,
    getDpLimits,
    getDefaultInterestRate,
    calculateDefaultAdminFee,
    calculateDefaultInsuranceFee,
    validateCreditApplication,
    VehicleCategory,
    VehicleCondition
} from "@/lib/kernel";
import { Calculator, Car, Info, Download } from "lucide-react";

export default function CreditSimulationPage() {
    // Form State
    const [vehiclePrice, setVehiclePrice] = useState<string>("25000000");
    const [downPayment, setDownPayment] = useState<string>("5000000");
    const [tenor, setTenor] = useState<string>("24");
    const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>("motor");
    const [vehicleCondition, setVehicleCondition] = useState<VehicleCondition>("baru");
    const [interestRate, setInterestRate] = useState<string>("");

    // Result State
    const [result, setResult] = useState<CreditCalculationResult | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);

    // Available tenors based on category & condition
    const availableTenors = getAvailableTenors(vehicleCategory, vehicleCondition);
    const dpLimits = getDpLimits(vehicleCategory, vehicleCondition);

    // Auto-set interest rate when category/condition/tenor changes
    const getAutoRate = () => {
        if (interestRate) return parseFloat(interestRate);
        return getDefaultInterestRate(vehicleCategory, vehicleCondition, parseInt(tenor) || 12);
    };

    const handleCalculate = () => {
        const price = parseFloat(vehiclePrice) || 0;
        const dp = parseFloat(downPayment) || 0;
        const tenorMonths = parseInt(tenor) || 12;

        // Validate
        const validation = validateCreditApplication(
            price, dp, tenorMonths, vehicleCategory, vehicleCondition
        );

        setErrors(validation.errors);
        setWarnings(validation.warnings);

        if (!validation.isValid) {
            setResult(null);
            return;
        }

        // Calculate fees
        const adminFee = calculateDefaultAdminFee(price, vehicleCategory);
        const insuranceFee = calculateDefaultInsuranceFee(price, vehicleCategory, vehicleCondition, tenorMonths);

        // Calculate credit
        const input: CreditCalculationInput = {
            vehiclePrice: price,
            downPayment: dp,
            tenor: tenorMonths,
            interestRate: getAutoRate(),
            adminFee,
            insuranceFee
        };

        const calculationResult = calculateCredit(input);
        setResult(calculationResult);
    };

    // Format number input
    const formatNumberInput = (value: string): string => {
        const num = value.replace(/\D/g, "");
        return num ? parseInt(num).toLocaleString("id-ID") : "";
    };

    const parseNumberInput = (value: string): string => {
        return value.replace(/\D/g, "");
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Calculator className="h-8 w-8 text-primary-500" />
                    Simulasi Kredit
                </h1>
                <p className="text-slate-500 mt-1">
                    Hitung estimasi cicilan bulanan untuk pembelian kendaraan
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <Card>
                    <CardHeader title="Parameter Kredit" />

                    <div className="space-y-4">
                        {/* Vehicle Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Jenis Kendaraan"
                                value={vehicleCategory}
                                onChange={(e) => setVehicleCategory(e.target.value as VehicleCategory)}
                                options={[
                                    { value: "motor", label: "Motor" },
                                    { value: "mobil", label: "Mobil" }
                                ]}
                            />
                            <Select
                                label="Kondisi"
                                value={vehicleCondition}
                                onChange={(e) => setVehicleCondition(e.target.value as VehicleCondition)}
                                options={[
                                    { value: "baru", label: "Baru" },
                                    { value: "bekas", label: "Bekas" }
                                ]}
                            />
                        </div>

                        {/* Vehicle Price */}
                        <Input
                            label="Harga Kendaraan (OTR)"
                            value={formatNumberInput(vehiclePrice)}
                            onChange={(e) => setVehiclePrice(parseNumberInput(e.target.value))}
                            placeholder="25.000.000"
                            hint="Harga On The Road"
                        />

                        {/* Down Payment */}
                        <Input
                            label="Uang Muka (DP)"
                            value={formatNumberInput(downPayment)}
                            onChange={(e) => setDownPayment(parseNumberInput(e.target.value))}
                            placeholder="5.000.000"
                            hint={`Min ${dpLimits.min}% - Max ${dpLimits.max}% dari harga`}
                        />

                        {/* Tenor */}
                        <Select
                            label="Tenor (Bulan)"
                            value={tenor}
                            onChange={(e) => setTenor(e.target.value)}
                            options={availableTenors.map(t => ({
                                value: t.toString(),
                                label: `${t} Bulan (${(t / 12).toFixed(1)} Tahun)`
                            }))}
                        />

                        {/* Interest Rate */}
                        <Input
                            label="Bunga per Tahun (%)"
                            type="number"
                            step="0.1"
                            value={interestRate || getAutoRate().toString()}
                            onChange={(e) => setInterestRate(e.target.value)}
                            placeholder="15"
                            hint="Rate flat per tahun"
                        />

                        <Button
                            onClick={handleCalculate}
                            className="w-full"
                            leftIcon={<Calculator className="h-5 w-5" />}
                        >
                            Hitung Simulasi
                        </Button>
                    </div>
                </Card>

                {/* Results */}
                <div className="space-y-4">
                    {/* Errors */}
                    {errors.length > 0 && (
                        <Alert
                            variant="error"
                            title="Validasi Gagal"
                            message={errors.join(". ")}
                        />
                    )}

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <Alert
                            variant="warning"
                            title="Perhatian"
                            message={warnings.join(". ")}
                        />
                    )}

                    {/* Result Card */}
                    {result && (
                        <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
                            <CardHeader
                                title="Hasil Simulasi"
                                action={
                                    <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                                        Cetak
                                    </Button>
                                }
                            />

                            {/* Monthly Payment Highlight */}
                            <div className="text-center py-6 mb-4 bg-white rounded-xl border border-primary-100">
                                <p className="text-sm text-slate-500">Cicilan per Bulan</p>
                                <p className="text-4xl font-bold text-primary-600 mt-1">
                                    {formatRupiah(result.monthlyPayment)}
                                </p>
                                <p className="text-sm text-slate-500 mt-2">
                                    Selama {result.tenor} bulan
                                </p>
                            </div>

                            {/* Details */}
                            <div className="space-y-3">
                                <DetailRow label="Harga Kendaraan" value={formatRupiah(result.vehiclePrice)} />
                                <DetailRow label="Uang Muka (DP)" value={formatRupiah(result.downPayment)} />
                                <DetailRow label="Persentase DP" value={`${result.downPaymentPercentage.toFixed(1)}%`} />

                                <div className="border-t border-slate-100 pt-3">
                                    <DetailRow label="Pokok Hutang" value={formatRupiah(result.principalAmount)} />
                                    <DetailRow label="Bunga (%)" value={`${result.interestRate}% / tahun (flat)`} />
                                    <DetailRow label="Total Bunga" value={formatRupiah(result.totalInterest)} />
                                </div>

                                <div className="border-t border-slate-100 pt-3">
                                    <DetailRow label="Biaya Admin" value={formatRupiah(result.adminFee)} />
                                    <DetailRow label="Biaya Asuransi" value={formatRupiah(result.insuranceFee)} />
                                </div>

                                <div className="border-t border-slate-200 pt-3 font-medium">
                                    <DetailRow
                                        label="Total Kredit"
                                        value={formatRupiah(result.totalCredit)}
                                        className="text-lg"
                                    />
                                    <DetailRow
                                        label="Total Pembayaran"
                                        value={formatRupiah(result.totalPayment)}
                                        className="text-lg text-primary-600"
                                    />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-start gap-2 text-sm text-blue-700">
                                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <p>
                                    Simulasi ini menggunakan metode bunga flat. Angka aktual dapat berbeda
                                    tergantung kebijakan leasing partner.
                                </p>
                            </div>
                        </Card>
                    )}

                    {/* Empty State */}
                    {!result && errors.length === 0 && (
                        <Card className="text-center py-12">
                            <Car className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">
                                Masukkan parameter kredit dan klik &quot;Hitung Simulasi&quot;
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailRow({
    label,
    value,
    className = ""
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className={`flex justify-between items-center ${className}`}>
            <span className="text-slate-600">{label}</span>
            <span className="font-medium text-slate-900">{value}</span>
        </div>
    );
}
