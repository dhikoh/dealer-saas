import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/free-solid-svg-icons";

interface CreditSimulatorProps {
    vehiclePrice: number;
    dpAmount: number;
    setDpAmount: (val: number) => void;
    tenor: number;
    setTenor: (val: number) => void;
    interestRate: number;
    setInterestRate: (val: number) => void;
}

const CreditSimulator: React.FC<CreditSimulatorProps> = ({
    vehiclePrice,
    dpAmount,
    setDpAmount,
    tenor,
    setTenor,
    interestRate,
    setInterestRate,
}) => {
    // Internal state for Slider UI (Percent)
    const [dpPercent, setDpPercent] = useState(20);
    const [result, setResult] = useState<{
        monthlyInstallment: number;
        totalDp: number;
        totalPayment: number;
    } | null>(null);

    // Sync Slider changes to Parent dpAmount
    const handleSliderChange = (percent: number) => {
        setDpPercent(percent);
        setDpAmount(Math.round((vehiclePrice * percent) / 100));
    };

    // Calculate whenever inputs change
    useEffect(() => {
        if (vehiclePrice > 0 && dpAmount >= 0 && tenor > 0) {
            const principal = vehiclePrice - dpAmount;
            const years = tenor / 12;
            const totalInterest = principal * (interestRate / 100) * years;
            const totalLoan = principal + totalInterest;
            const monthly = totalLoan / tenor;
            const tdp = dpAmount + monthly; // Simple TDP

            setResult({
                monthlyInstallment: Math.round(monthly),
                totalDp: Math.round(tdp),
                totalPayment: Math.round(dpAmount + totalLoan),
            });
        } else {
            setResult(null);
        }
    }, [vehiclePrice, dpAmount, tenor, interestRate]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-[#00bfa5]">
                <FontAwesomeIcon icon={faCalculator} />
                <h3 className="font-bold text-lg">Simulasi Kredit</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OTR - Read Only / Display */}
                <div>
                    <label className="block text-sm text-gray-500 mb-1">Harga OTR (Rp)</label>
                    <div className="w-full border rounded-lg p-2 font-bold text-gray-800 bg-gray-50">
                        {vehiclePrice.toLocaleString('id-ID')}
                    </div>
                </div>

                {/* DP Slider & Input */}
                <div>
                    <label className="block text-sm text-gray-500 mb-1">Uang Muka (DP)</label>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                            <input
                                type="range"
                                min="10"
                                max="90"
                                step="5"
                                value={dpPercent}
                                onChange={(e) => handleSliderChange(Number(e.target.value))}
                                className="w-full accent-[#00bfa5]"
                            />
                            <span className="font-bold text-sm w-12 text-right">{dpPercent}%</span>
                        </div>
                        <input
                            type="number"
                            value={dpAmount}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setDpAmount(val);
                                setDpPercent(Math.round((val / vehiclePrice) * 100));
                            }}
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#00bfa5] outline-none"
                            placeholder="Nominal DP"
                        />
                    </div>
                </div>

                {/* Tenor */}
                <div>
                    <label className="block text-sm text-gray-500 mb-1">Tenor (Bulan)</label>
                    <select
                        value={tenor}
                        onChange={(e) => setTenor(Number(e.target.value))}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#00bfa5] outline-none"
                    >
                        {[6, 12, 18, 24, 30, 36, 48, 60].map(m => (
                            <option key={m} value={m}>{m} Bulan ({(m / 12).toFixed(1)} Thn)</option>
                        ))}
                    </select>
                </div>

                {/* Interest Rate */}
                <div>
                    <label className="block text-sm text-gray-500 mb-1">Bunga (% / Tahun)</label>
                    <input
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#00bfa5] outline-none"
                    />
                </div>
            </div>

            {/* Result */}
            {result && (
                <div className="mt-6 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Angsuran per Bulan</p>
                            <p className="text-xl font-bold text-[#00bfa5]">
                                Rp {result.monthlyInstallment.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total DP (Est.)</p>
                            <p className="text-xl font-bold text-gray-800">
                                Rp {result.totalDp.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        *Simulasi ini hanya estimasi & tidak mengikat. DP sudah termasuk angsuran pertama.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CreditSimulator;
