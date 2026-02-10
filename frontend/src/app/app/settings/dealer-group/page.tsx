'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faPlus, faSignInAlt, faCopy, faSignOutAlt, faInfoCircle, faCheck } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

interface DealerGroup {
    id: string;
    name: string;
    code: string;
    adminTenant: {
        id: string;
        name: string;
    };
    members: {
        id: string;
        name: string;
        phone?: string;
        address?: string;
    }[];
}

export default function DealerGroupPage() {
    const [group, setGroup] = useState<DealerGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [formName, setFormName] = useState('');
    const [formCode, setFormCode] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchGroup();
    }, []);

    const fetchGroup = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/dealer-groups/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGroup(data || null); // API returns null if no group
            }
        } catch (error) {
            console.error('Failed to fetch group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/dealer-groups/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: formName })
            });

            if (res.ok) {
                toast.success('Grup berhasil dibuat');
                setIsCreating(false);
                fetchGroup();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal membuat grup');
            }
        } catch (error) {
            toast.error('Gagal membuat grup');
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/dealer-groups/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ code: formCode })
            });

            if (res.ok) {
                toast.success('Berhasil bergabung ke grup');
                setIsJoining(false);
                fetchGroup();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Kode salah atau gagal bergabung');
            }
        } catch (error) {
            toast.error('Gagal bergabung');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm('Apakah Anda yakin ingin keluar dari grup ini?')) return;

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/dealer-groups/leave`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Berhasil keluar dari grup');
                setGroup(null);
            } else {
                toast.error('Gagal keluar dari grup');
            }
        } catch (error) {
            toast.error('Gagal keluar dari grup');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Kode disalin');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat data grup...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <FontAwesomeIcon icon={faUsers} className="text-[#00bfa5]" />
                    Dealer Group
                </h1>
                <p className="text-gray-500 mt-2">
                    Bergabung dengan Dealer Group untuk berbagi database pelanggan dan transfer stok antar dealer.
                </p>
            </div>

            {!group ? (
                // EMPTY STATE
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FontAwesomeIcon icon={faUsers} className="text-4xl text-blue-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Anda belum tergabung dalam grup</h2>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Buat grup baru untuk mengundang dealer lain, atau gabung ke grup yang sudah ada menggunakan kode undangan.
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-6 py-3 rounded-xl bg-[#00bfa5] text-white font-bold hover:bg-[#00a891] transition-all flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Buat Grup Baru
                        </button>
                        <button
                            onClick={() => setIsJoining(true)}
                            className="px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold hover:border-gray-300 transition-all flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faSignInAlt} />
                            Gabung Grup
                        </button>
                    </div>

                    {/* CREATE MODAL */}
                    {isCreating && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                                <h3 className="text-lg font-bold mb-4">Buat Dealer Group Baru</h3>
                                <form onSubmit={handleCreate}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Nama Grup</label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="Contoh: Paguyuban Dealer Jakarta"
                                            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#00bfa5] outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#00bfa5] text-white rounded-lg hover:bg-[#00a891] disabled:opacity-50">
                                            {submitting ? 'Memproses...' : 'Buat Grup'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* JOIN MODAL */}
                    {isJoining && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                                <h3 className="text-lg font-bold mb-4">Gabung ke Dealer Group</h3>
                                <form onSubmit={handleJoin}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Kode Undangan</label>
                                        <input
                                            type="text"
                                            value={formCode}
                                            onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                            placeholder="Masukkan 6 digit kode"
                                            className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#00bfa5] outline-none font-mono uppercase"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Dapatkan kode dari Admin grup Anda.</p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setIsJoining(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#00bfa5] text-white rounded-lg hover:bg-[#00a891] disabled:opacity-50">
                                            {submitting ? 'Memproses...' : 'Gabung'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // ACTIVE GROUP STATE
                <div className="space-y-6">
                    {/* HEADER CARD */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Grup Aktif</div>
                            <h2 className="text-2xl font-bold text-gray-800">{group.name}</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Admin: <span className="font-medium text-gray-900">{group.adminTenant.name}</span>
                            </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center">
                            <div className="text-xs text-blue-600 font-bold uppercase mb-1">Kode Undangan</div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-mono font-bold text-blue-700 tracking-wider">{group.code}</span>
                                <button
                                    onClick={() => copyToClipboard(group.code)}
                                    className="w-8 h-8 rounded-full bg-white text-blue-600 shadow-sm flex items-center justify-center hover:bg-blue-100 transition-colors"
                                    title="Salin Kode"
                                >
                                    <FontAwesomeIcon icon={faCopy} size="sm" />
                                </button>
                            </div>
                            <a
                                href={`https://wa.me/?text=Halo, silakan gabung ke Dealer Group "${group.name}" di OTOHUB menggunakan kode: *${group.code}*`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 mt-2 hover:underline"
                            >
                                Kirim via WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* MEMBERS LIST */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Anggota Grup ({group.members.length})</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {group.members.map((member) => (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <FontAwesomeIcon icon={faUsers} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{member.name}</div>
                                            <div className="text-xs text-gray-500">{member.address || 'Alamat belum diatur'}</div>
                                        </div>
                                    </div>
                                    {member.id === group.adminTenant.id && (
                                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                                            Admin
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DANGER ZONE */}
                    <div className="pt-8">
                        <button
                            onClick={handleLeave}
                            className="px-6 py-3 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-all flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} />
                            Keluar dari Grup
                        </button>
                        <p className="text-xs text-gray-400 mt-2 ml-1">
                            {group.adminTenant.id === group.members.find(m => true)?.id // logic check later 
                                ? 'Jika Admin keluar, grup akan dibubarkan.'
                                : 'Anda akan kehilangan akses ke database shared customer.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
