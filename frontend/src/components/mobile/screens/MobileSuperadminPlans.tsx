'use client';

import React, { useEffect, useState } from 'react';
import { Star, Edit2, Save, X, Check } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

interface Plan {
    id: string;
    name: string;
    price: number;
    yearlyDiscount: number;
    description: string;
    maxVehicles: number;
    maxUsers: number;
    maxCustomers: number;
    maxBranches: number;
    features?: { name: string; enabled: boolean }[];
}

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const PLAN_COLORS = ['from-gray-400 to-gray-600', 'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-amber-400 to-amber-600'];

export default function MobileSuperadminPlans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Plan | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchPlans(); }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/superadmin/plans');
            if (res.ok) { const d = await res.json(); setPlans(d?.data ?? d ?? []); }
        } catch { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            const body = {
                price: Number(editing.price),
                yearlyDiscount: Number(editing.yearlyDiscount),
                description: editing.description,
                maxVehicles: Number(editing.maxVehicles),
                maxUsers: Number(editing.maxUsers),
                maxCustomers: Number(editing.maxCustomers),
                maxBranches: Number(editing.maxBranches),
            };
            const res = await fetchApi(`/superadmin/plans/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
            if (res.ok) {
                toast.success('Plan berhasil diperbarui');
                setEditing(null);
                fetchPlans();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menyimpan');
            }
        } catch { toast.error('Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-4 pb-24 space-y-4">
            <div>
                <h1 className="text-xl font-bold text-gray-800">Kelola Plan</h1>
                <p className="text-sm text-gray-500">Atur harga dan batasan paket berlangganan</p>
            </div>

            {plans.map((plan, idx) => (
                <div key={plan.id} className="bg-[#ecf0f3] rounded-2xl overflow-hidden shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                    {/* Plan header */}
                    <div className={`bg-gradient-to-r ${PLAN_COLORS[idx % PLAN_COLORS.length]} p-4 flex justify-between items-center`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-white" />
                                <h3 className="font-black text-white text-lg">{plan.name}</h3>
                            </div>
                            <p className="text-white/80 text-xl font-black mt-1">{fmt(plan.price)}<span className="text-xs font-medium">/bulan</span></p>
                        </div>
                        <button onClick={() => setEditing({ ...plan })}
                            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Details */}
                    <div className="p-4">
                        <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Max Kendaraan', value: plan.maxVehicles === -1 ? '∞' : plan.maxVehicles },
                                { label: 'Max Users', value: plan.maxUsers === -1 ? '∞' : plan.maxUsers },
                                { label: 'Max Pelanggan', value: plan.maxCustomers === -1 ? '∞' : plan.maxCustomers },
                                { label: 'Max Cabang', value: plan.maxBranches === -1 ? '∞' : plan.maxBranches },
                            ].map(item => (
                                <div key={item.label} className="bg-white/50 rounded-xl p-2 text-center">
                                    <p className="text-xs text-gray-400">{item.label}</p>
                                    <p className="font-bold text-gray-800">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
                    <div className="bg-[#ecf0f3] rounded-t-3xl w-full max-w-lg mx-auto p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Edit Plan: {editing.name}</h3>
                            <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Harga Bulanan (Rp)', key: 'price', type: 'number' },
                                { label: 'Diskon Tahunan (%)', key: 'yearlyDiscount', type: 'number' },
                                { label: 'Deskripsi', key: 'description', type: 'text' },
                                { label: 'Max Kendaraan (-1 = ∞)', key: 'maxVehicles', type: 'number' },
                                { label: 'Max Users (-1 = ∞)', key: 'maxUsers', type: 'number' },
                                { label: 'Max Pelanggan (-1 = ∞)', key: 'maxCustomers', type: 'number' },
                                { label: 'Max Cabang (-1 = ∞)', key: 'maxBranches', type: 'number' },
                            ].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                                    <input type={type} value={(editing as any)[key]}
                                        onChange={e => setEditing({ ...editing, [key]: e.target.value } as any)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
