'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';

const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface Result {
    monthly: number;
    principal: number;
    totalInterest: number;
    totalCredit: number;
}

export default function MobileCreditSimulator() {
    const { theme } = useMobileContext();
    const [price, setPrice] = useState('25000000');
    const [dp, setDp] = useState('5000000');
    const [tenor, setTenor] = useState('24');
    const [rate, setRate] = useState('15');
    const [result, setResult] = useState<Result | null>(null);

    const calculate = () => {
        const p = parseFloat(price) || 0;
        const d = parseFloat(dp) || 0;
        const t = parseInt(tenor) || 12;
        const r = parseFloat(rate) || 0;
        const principal = p - d;
        const totalInterest = (principal * (r / 100) * t) / 12;
        const totalCredit = principal + totalInterest;
        const monthly = Math.round(totalCredit / t);
        setResult({ monthly, principal, totalInterest, totalCredit });
    };

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-2 px-6 sticky top-0 z-10`}>
                <h2 className={`text-2xl font-black tracking-tight ${theme.textMain}`}>Kalkulator Kredit</h2>
                <p className={`text-xs font-bold mt-1 mb-4 ${theme.textMuted}`}>Simulasi angsuran kendaraan</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Live Price Preview */}
                <div className="text-center py-2">
                    <p className={`text-[11px] font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Harga Kendaraan</p>
                    <h1 className={`text-4xl font-black tracking-tighter ${theme.textMain}`}>
                        Rp {(parseFloat(price) || 0).toLocaleString('id-ID')}
                    </h1>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block pl-2 ${theme.textMuted}`}>OTR Price (Rp)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className={`w-full px-5 py-4 rounded-2xl text-sm font-black outline-none ${theme.bgInput}`}
                        />
                    </div>
                    <div>
                        <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block pl-2 ${theme.textMuted}`}>Uang Muka (Rp)</label>
                        <input
                            type="number"
                            value={dp}
                            onChange={e => setDp(e.target.value)}
                            className={`w-full px-5 py-4 rounded-2xl text-sm font-black outline-none ${theme.bgInput}`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block pl-2 ${theme.textMuted}`}>Tenor</label>
                            <div className="relative">
                                <select
                                    value={tenor}
                                    onChange={e => setTenor(e.target.value)}
                                    className={`w-full px-5 py-4 rounded-2xl text-sm font-black appearance-none outline-none ${theme.bgInput}`}
                                >
                                    {[12, 24, 36, 48, 60].map(t => (
                                        <option key={t} value={t}>{t} Bulan</option>
                                    ))}
                                </select>
                                <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none ${theme.textMuted}`} />
                            </div>
                        </div>
                        <div>
                            <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block pl-2 ${theme.textMuted}`}>Bunga (%/thn)</label>
                            <input
                                type="number"
                                value={rate}
                                onChange={e => setRate(e.target.value)}
                                className={`w-full px-5 py-4 rounded-2xl text-sm font-black outline-none text-center ${theme.bgInput}`}
                            />
                        </div>
                    </div>
                </div>

                <button onClick={calculate} className={`w-full py-4 text-sm uppercase tracking-widest ${theme.btnPrimary}`}>
                    Hitung Cicilan
                </button>

                {result && (
                    <div className={`mt-4 p-6 flex flex-col items-center ${theme.bgCard} animate-fade-in`}>
                        <p className={`text-[11px] font-black uppercase tracking-widest mb-2 ${theme.textMuted}`}>Angsuran Per Bulan</p>
                        <h3 className={`text-3xl font-black tracking-tighter ${theme.textHighlight}`}>{formatRupiah(result.monthly)}</h3>
                        <div className={`w-full space-y-4 pt-6 mt-6 border-t ${theme.divider}`}>
                            {[
                                { label: 'Pokok Hutang', value: result.principal },
                                { label: 'Total Bunga', value: result.totalInterest },
                                { label: 'Total Kredit', value: result.totalCredit },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center">
                                    <span className={`text-xs font-black uppercase tracking-wider ${theme.textMuted}`}>{item.label}</span>
                                    <span className={`font-black text-sm ${theme.textMain}`}>{formatRupiah(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
