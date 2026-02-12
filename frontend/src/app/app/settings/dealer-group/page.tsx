'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faPlus, faSignInAlt, faCopy, faSignOutAlt, faInfoCircle, faCheck, faCrown, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import Link from 'next/link';

interface DealerGroup {
    id: string;
    name: string;
    code: string;
    role: 'OWNER' | 'MEMBER';
    adminTenant?: {
        id: string;
        name: string;
    };
    members: {
        id: string;
        name: string;
        phone?: string;
        address?: string;
        planName?: string;
    }[];
}

interface UserProfile {
    id: string;
    name: string;
    tenant?: {
        id: string;
        planTier: string;
        plan?: {
            id: string;
            name: string;
            canCreateGroup: boolean;
        };
    };
}

export default function DealerGroupPage() {
    const [groupData, setGroupData] = useState<{ role: string, group: DealerGroup } | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Form States
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [formName, setFormName] = useState('');
    const [formCode, setFormCode] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        initData();
    }, []);

    const getToken = () => localStorage.getItem('access_token');

    const initData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Fetch Profile (to check Plan)
            const resProfile = await fetch(`${API_URL}/auth/profile`, { headers });
            const profileData = await resProfile.json();
            setProfile(profileData);

            // 2. Fetch Group Status
            const resGroup = await fetch(`${API_URL}/dealer-groups/my`, { headers });
            if (resGroup.ok) {
                const groupResult = await resGroup.json();
                setGroupData(groupResult || null);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Gagal memuat data dealer group');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/dealer-groups/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ name: formName })
            });

            if (res.ok) {
                toast.success('Grup berhasil dibuat');
                setIsCreating(false);
                initData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal membuat grup');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/dealer-groups/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ code: formCode })
            });

            if (res.ok) {
                toast.success('Berhasil bergabung ke grup');
                setIsJoining(false);
                initData();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Kode salah atau gagal bergabung');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm('Apakah Anda yakin ingin keluar dari grup ini? Akses data akan terputus.')) return;
        try {
            const res = await fetch(`${API_URL}/dealer-groups/leave`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });

            if (res.ok) {
                toast.success('Berhasil keluar dari grup');
                setGroupData(null);
                initData(); // Refresh to update UI state
            } else {
                toast.error('Gagal keluar dari grup');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        }
    };

    const handleKick = async (memberTenantId: string) => {
        if (!confirm('Keluarkan member ini dari grup?')) return;
        try {
            const res = await fetch(`${API_URL}/dealer-groups/members/${memberTenantId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });

            if (res.ok) {
                toast.success('Member berhasil dikeluarkan');
                initData();
            } else {
                toast.error('Gagal mengeluarkan member');
            }
        } catch {
            toast.error('Terjadi kesalahan');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Kode disalin');
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Memuat data grup...</div>;

    // --- DETERMINE STATE ---
    const isOwner = groupData?.role === 'OWNER';
    const isMember = groupData?.role === 'MEMBER';
    // Check local plan or profile data for capability
    // Note: profile.tenant.plan might be null if using legacy planTier, assume legacy tiers except DEMO/BASIC can't create
    const canCreateGroup = profile?.tenant?.plan?.canCreateGroup || ['ENTERPRISE', 'UNLIMITED'].includes(profile?.tenant?.planTier || '');

    // === STATE 3: GROUP OWNER ===
    if (isOwner && groupData) {
        return (
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FontAwesomeIcon icon={faCrown} className="text-9xl text-orange-500" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">PRINCIPAL / INDUK</span>
                                <h2 className="text-2xl font-bold text-gray-800">{groupData.group.name}</h2>
                            </div>
                            <p className="text-gray-500 text-sm">Anda adalah pemilik grup ini. Kelola member dan pantau performa jaringan dealer Anda.</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center min-w-[200px]">
                            <span className="text-xs text-gray-500 font-bold uppercase mb-1">Kode Undangan Member</span>
                            <div className="flex items-center gap-2">
                                <code className="text-xl font-mono font-bold text-orange-600">{groupData.group.code}</code>
                                <button onClick={() => copyToClipboard(groupData.group.code)} className="text-gray-400 hover:text-orange-600 transition-colors">
                                    <FontAwesomeIcon icon={faCopy} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MEMBER MANAGEMENT */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FontAwesomeIcon icon={faUsers} className="text-gray-400" />
                            Daftar Member ({groupData.group.members.length})
                        </h3>
                        <div className="text-sm text-gray-500">
                            Kuota: {groupData.group.members.length} / ∞
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {groupData.group.members.map(member => (
                            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">{member.name}</div>
                                        <div className="text-xs text-gray-500">Plan: {member.planName || '-'} • {member.phone || 'No Phone'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {member.id === profile?.tenant?.id ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">Anda</span>
                                    ) : (
                                        <button
                                            onClick={() => handleKick(member.id)}
                                            className="px-3 py-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            Keluarkan
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {groupData.group.members.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Belum ada member yang bergabung. Bagikan kode undangan Anda.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // === STATE 4: GROUP MEMBER ===
    if (isMember && groupData) {
        return (
            <div className="max-w-3xl mx-auto p-6 space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-blue-100 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 text-3xl">
                        <FontAwesomeIcon icon={faBuilding} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Anggota Grup Dealer</h2>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                        Anda terdaftar sebagai member dari grup <span className="font-bold text-gray-900">{groupData.group.name}</span>.
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 mt-8 flex items-center justify-between max-w-md mx-auto">
                        <div className="text-left">
                            <div className="text-xs text-gray-400 uppercase font-bold">Induk / Principal</div>
                            <div className="font-bold text-gray-800">{groupData.group.adminTenant?.name || 'Unknown'}</div>
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400 uppercase font-bold">Status</div>
                            <div className="text-green-600 font-bold flex items-center gap-1 justify-end">
                                <FontAwesomeIcon icon={faCheck} /> Aktif
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <button onClick={handleLeave} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2 mx-auto">
                            <FontAwesomeIcon icon={faSignOutAlt} />
                            Keluar dari Grup
                        </button>
                        <p className="text-xs text-gray-400 mt-2">
                            Akses data sharing akan dihentikan, namun data historis tetap tersimpan.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // === STATE 1 & 2: NO GROUP (BASIC/PRO/ENTERPRISE) ===
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dealer Group Network</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    Bangun jaringan dealer Anda sendiri atau bergabung dengan grup yang sudah ada untuk kolaborasi stok dan laporan.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* OPTION A: CREATE GROUP (Only if capable) */}
                <div className={`rounded-2xl p-8 border-2 transition-all ${canCreateGroup
                        ? 'border-indigo-100 bg-white hover:border-indigo-300 shadow-sm'
                        : 'border-dashed border-gray-200 bg-gray-50 opacity-70'
                    }`}>
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                        <FontAwesomeIcon icon={faCrown} className="text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Buat Grup Baru</h3>
                    <p className="text-gray-500 text-sm mb-6 min-h-[60px]">
                        Jadilah Principal (Induk). Undang dealer lain, pantau omzet gabungan, dan kelola jaringan distribusi Anda.
                    </p>

                    {canCreateGroup ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
                        >
                            Mulai Buat Grup
                        </button>
                    ) : (
                        <div>
                            <button disabled className="w-full py-3 bg-gray-200 text-gray-400 rounded-xl font-bold cursor-not-allowed mb-2">
                                Fitur Terkunci
                            </button>
                            <Link href="/app/billing" className="text-xs text-indigo-600 hover:underline block text-center">
                                Upgrade ke Enterprise untuk membuka
                            </Link>
                        </div>
                    )}
                </div>

                {/* OPTION B: JOIN GROUP (Always Available) */}
                <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-300 shadow-sm transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                        <FontAwesomeIcon icon={faSignInAlt} className="text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Gabung Grup</h3>
                    <p className="text-gray-500 text-sm mb-6 min-h-[60px]">
                        Sudah punya mitra? Masukkan kode undangan untuk bergabung ke jaringan dealer partner.
                    </p>
                    <button
                        onClick={() => setIsJoining(true)}
                        className="w-full py-3 bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-50 rounded-xl font-bold transition-colors"
                    >
                        Masukkan Kode
                    </button>
                </div>
            </div>

            {/* MODALS */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Setup Nama Grup</h3>
                        <form onSubmit={handleCreate}>
                            <input
                                autoFocus
                                type="text"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="Contoh: Maju Jaya Network"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none mb-6"
                                required
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Batal</button>
                                <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold disabled:opacity-50">
                                    {submitting ? 'Memproses...' : 'Buat Grup'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isJoining && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold mb-4">Input Kode Undangan</h3>
                        <form onSubmit={handleJoin}>
                            <input
                                autoFocus
                                type="text"
                                value={formCode}
                                onChange={e => setFormCode(e.target.value.toUpperCase())}
                                placeholder="XXX-0000"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none mb-2 font-mono uppercase tracking-widest text-center text-lg"
                                required
                            />
                            <p className="text-xs text-center text-gray-500 mb-6">Pastikan kode yang Anda masukkan benar.</p>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsJoining(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Batal</button>
                                <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50">
                                    {submitting ? 'Memproses...' : 'Gabung'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
