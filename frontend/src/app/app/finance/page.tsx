"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMoneyBill, faBuilding, faBolt, faTrash } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface OperatingCost {
    id: string;
    name: string;
    amount: number;
    category: string;
    date: string;

    note?: string;
    proofImage?: string;
}

const CATEGORIES = [
    { id: "SALARY", label: "Gaji Karyawan", icon: faMoneyBill, color: "bg-green-100 text-green-600" },
    { id: "UTILITY", label: "Listrik & Air", icon: faBolt, color: "bg-yellow-100 text-yellow-600" },
    { id: "RENT", label: "Sewa Tempat", icon: faBuilding, color: "bg-blue-100 text-blue-600" },
    { id: "MARKETING", label: "Iklan & Pemasaran", icon: faMoneyBill, color: "bg-purple-100 text-purple-600" },
    { id: "OTHER", label: "Lain-lain", icon: faMoneyBill, color: "bg-gray-100 text-gray-600" },
];

export default function FinancePage() {
    const [costs, setCosts] = useState<OperatingCost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        category: "OTHER",
        date: new Date().toISOString().split("T")[0],
        note: "",
    });
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

    const fetchCosts = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_URL}/finance/costs`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCosts(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCosts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("access_token");
            let proofUrl = "";

            // 1. Upload Proof if exists
            if (proofFile) {
                const formData = new FormData();
                formData.append('proof', proofFile);

                try {
                    const uploadRes = await fetch(`${API_URL}/upload/finance/proof`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData
                    });

                    if (uploadRes.ok) {
                        const data = await uploadRes.json();
                        proofUrl = data.url;
                    } else {
                        toast.error("Gagal upload bukti pembayaran");
                        return;
                    }
                } catch (err) {
                    toast.error("Gagal upload bukti pembayaran");
                    return;
                }
            }

            // 2. Create Cost
            const res = await fetch(`${API_URL}/finance/costs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...formData, proofImage: proofUrl || undefined }),
            });

            if (res.ok) {
                toast.success("Biaya berhasil disimpan");
                setShowModal(false);
                setFormData({ name: "", amount: "", category: "OTHER", date: new Date().toISOString().split("T")[0], note: "" });
                setProofFile(null);
                fetchCosts();
            } else {
                toast.error("Gagal menyimpan biaya");
            }
        } catch (e) {
            toast.error("Terjadi kesalahan");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus biaya ini?")) return;
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_URL}/finance/costs/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success("Terhapus");
                fetchCosts();
            }
        } catch (err) {
            toast.error("Gagal hapus");
        }
    };

    const totalExpense = costs.reduce((sum, c) => sum + Number(c.amount), 0);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Keuangan & Biaya Operasional</h1>
                    <p className="text-gray-500">Kelola pengeluaran rutin kantor (Gaji, Listrik, dll)</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                    <FontAwesomeIcon icon={faPlus} /> Catat Pengeluaran
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                    <h3 className="text-red-600 font-bold mb-2">Total Pengeluaran (Bulan Ini)</h3>
                    <p className="text-3xl font-bold text-gray-900">Rp {totalExpense.toLocaleString("id-ID")}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold text-sm uppercase">
                        <tr>
                            <th className="p-4">Tanggal</th>
                            <th className="p-4">Kategori</th>
                            <th className="p-4">Keterangan</th>
                            <th className="p-4 text-right">Jumlah</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                        ) : costs.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">Belum ada data pengeluaran</td></tr>
                        ) : (
                            costs.map((cost) => {
                                const cat = CATEGORIES.find(c => c.id === cost.category) || CATEGORIES[4];
                                return (
                                    <tr key={cost.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-gray-600">{new Date(cost.date).toLocaleDateString("id-ID")}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${cat.color}`}>
                                                <FontAwesomeIcon icon={cat.icon} className="mr-1" /> {cat.label}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">
                                            {cost.name}
                                            {cost.note && <span className="block text-xs text-gray-400 font-normal">{cost.note}</span>}
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-900">
                                            Rp {Number(cost.amount).toLocaleString("id-ID")}
                                        </td>
                                        <td className="p-4 text-center flex items-center justify-center gap-2">
                                            {cost.proofImage && (
                                                <button
                                                    onClick={() => setViewProofUrl(`${API_URL}${cost.proofImage}`)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                    title="Lihat Bukti"
                                                >
                                                    <FontAwesomeIcon icon={faMoneyBill} />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(cost.id)} className="text-red-400 hover:text-red-600">
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Catat Pengeluaran Baru</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Pengeluaran</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border rounded-lg p-2"
                                    placeholder="Contoh: Token Listrik"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Jumlah (Rp)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full border rounded-lg p-2"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full border rounded-lg p-2"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Catatan (Opsional)</label>
                                <textarea
                                    className="w-full border rounded-lg p-2"
                                    rows={2}
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Bukti Pembayaran (Opsional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full border rounded-lg p-2 text-sm"
                                    onChange={e => setProofFile(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-600 font-bold py-2 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* PROOF MODAL */}
            {
                viewProofUrl && (
                    <div
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
                        onClick={() => setViewProofUrl(null)}
                    >
                        <div className="max-w-3xl max-h-[90vh] overflow-auto bg-white rounded-2xl p-2" onClick={(e) => e.stopPropagation()}>
                            <img src={viewProofUrl} alt="Bukti Pembayaran" className="w-full h-auto rounded-lg" />
                            <button
                                onClick={() => setViewProofUrl(null)}
                                className="mt-2 w-full py-2 text-center text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
