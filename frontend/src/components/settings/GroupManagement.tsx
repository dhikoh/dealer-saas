
"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import {
    Users,
    Plus,
    LogIn,
    ShieldCheck,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Copy,
    LogOut,
    Trash2,
    Activity
} from "lucide-react";

interface GroupData {
    role: 'OWNER' | 'MEMBER';
    group: {
        id: string;
        name: string;
        code: string;
        adminTenant?: { name: string };
        members?: GroupMember[];
    };
}

interface GroupMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    subscriptionStatus: string;
    nextBillingDate: string;
    planName: string;
    stats: {
        vehicles: number;
        transactions: number;
    };
}

export default function GroupManagement() {
    const [data, setData] = useState<GroupData | null>(null);
    const [loading, setLoading] = useState(true);
    const [groupName, setGroupName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchGroup();
    }, []);

    const fetchGroup = async () => {
        try {
            setLoading(true);
            const res = await fetchApi('/dealer-groups/my-group');
            if (res.ok) {
                const json = await res.json();
                setData(json); // json can be null if no group
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const res = await fetchApi('/dealer-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: groupName })
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.message || 'Gagal membuat group');
            }

            setSuccess("Group berhasil dibuat!");
            fetchGroup();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleJoinGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const res = await fetchApi('/dealer-groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: inviteCode })
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.message || 'Gagal bergabung');
            }

            setSuccess("Berhasil bergabung ke group!");
            fetchGroup();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleKick = async (memberId: string) => {
        if (!confirm("Hapus member ini dari group?")) return;
        try {
            const res = await fetchApi('/dealer-groups/kick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberTenantId: memberId })
            });
            if (res.ok) fetchGroup();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Memuat data group...</div>;

    // VIEW 1: NO GROUP (CREATE or JOIN)
    if (!data) {
        return (
            <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* CREATE CARD */}
                    <div className="bg-white border text-slate-900 border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">Buat Dealer Group</h3>
                        </div>
                        <p className="text-slate-600 mb-6 text-sm">
                            Khusus paket Enterprise. Buat group induk untuk mengelola banyak cabang stock gabungan.
                        </p>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">NAMA GROUP</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                    placeholder="Contoh: Wijaya Motor Group"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                />
                            </div>
                            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Buat Group Baru
                            </button>
                        </form>
                    </div>

                    {/* JOIN CARD */}
                    <div className="bg-white border text-slate-900 border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <LogIn className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold">Gabung Group</h3>
                        </div>
                        <p className="text-slate-600 mb-6 text-sm">
                            Punya kode undangan? Masukkan di sini untuk bergabung ke jaringan dealer group.
                        </p>
                        <form onSubmit={handleJoinGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">KODE UNDANGAN / INVITE CODE</label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={e => setInviteCode(e.target.value)}
                                    placeholder="Contoh: WJY-8821"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-wider uppercase"
                                    required
                                />
                            </div>
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <LogIn className="w-4 h-4" /> Gabung Sekarang
                            </button>
                        </form>
                    </div>
                </div>
                {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2"><XCircle className="w-4 h-4" /> {error}</div>}
                {success && <div className="p-4 bg-green-50 text-green-600 rounded-lg flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}
            </div>
        );
    }

    // VIEW 2: MEMBER VIEW
    if (data.role === 'MEMBER') {
        return (
            <div className="max-w-2xl">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{data.group.name}</h2>
                            <p className="text-slate-500">Admin Group: <span className="font-semibold text-slate-700">{data.group.adminTenant?.name}</span></p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mb-6">
                        <h4 className="font-semibold text-slate-900 mb-2">Status Keanggotaan</h4>
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span>Aktif - Member Terverifikasi</span>
                        </div>
                    </div>
                    <button className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Keluar dari Group
                    </button>
                </div>
            </div>
        );
    }

    // VIEW 3: OWNER VIEW (DASHBOARD)
    return (
        <div className="space-y-6">
            {/* HEADER WITH CODE */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold mb-1">{data.group.name}</h2>
                    <p className="text-purple-200 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Owner Access</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20 text-center">
                    <div className="text-xs text-purple-200 font-bold mb-1 tracking-wider">KODE INVITE</div>
                    <div className="text-3xl font-mono font-bold tracking-widest flex items-center gap-3">
                        {data.group.code}
                        <button onClick={() => navigator.clipboard.writeText(data.group.code)} className="hover:text-purple-300 transition-colors">
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* HEALTH METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HealthCard
                    label="Total Member"
                    value={data.group.members?.length || 0}
                    icon={<Users className="w-5 h-5 text-blue-500" />}
                />
                <HealthCard
                    label="Total Stok Group"
                    value={(data.group.members?.reduce((sum, m) => sum + (m.stats?.vehicles || 0), 0) || 0) + " Unit"}
                    icon={<Activity className="w-5 h-5 text-green-500" />}
                />
                <HealthCard
                    label="Resiko Tagihan"
                    value={data.group.members?.filter(m => m.subscriptionStatus !== 'ACTIVE').length || 0}
                    icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
                    alert={(data.group.members?.filter(m => m.subscriptionStatus !== 'ACTIVE').length || 0) > 0}
                />
            </div>

            {/* MEMBER TABLE */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Daftar Member & Status</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Nama Dealer</th>
                                <th className="px-6 py-3">Paket</th>
                                <th className="px-6 py-3">Status Tagihan</th>
                                <th className="px-6 py-3 text-right">Stok</th>
                                <th className="px-6 py-3 text-right">Trx/Bln</th>
                                <th className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {data.group.members?.map(member => (
                                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium">
                                        <div className="text-slate-900">{member.name}</div>
                                        <div className="text-xs text-slate-500">{member.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">{member.planName}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {member.subscriptionStatus === 'ACTIVE' ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                <CheckCircle className="w-3 h-3" /> Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                                <AlertTriangle className="w-3 h-3" /> {member.subscriptionStatus}
                                            </span>
                                        )}
                                        {member.subscriptionStatus !== 'ACTIVE' && (
                                            <button className="block mt-1 text-xs text-blue-600 hover:underline">
                                                Bailout (Bayarkan)
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">{member.stats.vehicles}</td>
                                    <td className="px-6 py-4 text-right">{member.stats.transactions}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleKick(member.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Hapus Member">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {data.group.members?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Belum ada member yang bergabung. Bagikan kode invite.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function HealthCard({ label, value, icon, alert }: { label: string, value: string | number, icon: React.ReactNode, alert?: boolean }) {
    return (
        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <div>
                <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${alert ? 'text-red-600' : 'text-slate-500'}`}>{label}</p>
                <p className={`text-2xl font-bold ${alert ? 'text-red-700' : 'text-slate-900'}`}>{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${alert ? 'bg-red-100' : 'bg-slate-50'}`}>
                {icon}
            </div>
        </div>
    );
}
