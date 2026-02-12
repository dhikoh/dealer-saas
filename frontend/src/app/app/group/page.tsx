'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faCar, faMoneyBillWave, faUsers, faCrown, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '@/lib/api';
import Link from 'next/link';

interface GroupData {
    role: string;
    group: {
        id: string;
        name: string;
        code: string;
        members: {
            id: string;
            name: string;
            stats: {
                vehicles: number;
                transactions: number;
            }
        }[];
    };
}

export default function GroupDashboardPage() {
    const [data, setData] = useState<GroupData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${API_URL}/dealer-groups/my`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500">Memuat data grup...</div>;

    if (!data || data.role !== 'OWNER') {
        return (
            <div className="p-12 text-center">
                <FontAwesomeIcon icon={faCrown} className="text-4xl text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-700">Akses Ditolak</h2>
                <p className="text-gray-500">Hanya Group Owner yang dapat melihat halaman ini.</p>
                <Link href="/app" className="text-blue-500 hover:underline mt-4 block">Kembali ke Dashboard</Link>
            </div>
        );
    }

    // CALCULATE AGGREGATES
    const totalMembers = data.group.members.length;
    const totalVehicles = data.group.members.reduce((sum, m) => sum + (m.stats?.vehicles || 0), 0);
    const totalTransactions = data.group.members.reduce((sum, m) => sum + (m.stats?.transactions || 0), 0);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-600 p-2 rounded-lg text-lg">
                            <FontAwesomeIcon icon={faChartLine} />
                        </span>
                        <span>Group Overview: {data.group.name}</span>
                    </h1>
                    <p className="text-gray-500 mt-1 ml-12">
                        Statistik gabungan dari {totalMembers} dealer dalam jaringan Anda.
                    </p>
                </div>
            </div>

            {/* KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                        <FontAwesomeIcon icon={faUsers} className="text-8xl text-blue-500" />
                    </div>
                    <div className="text-gray-500 font-medium mb-1">Total Member</div>
                    <div className="text-3xl font-bold text-gray-800">{totalMembers}</div>
                    <div className="text-xs text-green-500 mt-2 font-bold">+ Dealer Network</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                        <FontAwesomeIcon icon={faCar} className="text-8xl text-[#00bfa5]" />
                    </div>
                    <div className="text-gray-500 font-medium mb-1">Total Stok Unit</div>
                    <div className="text-3xl font-bold text-gray-800">{totalVehicles}</div>
                    <div className="text-xs text-gray-400 mt-2">Gabungan seluruh inventaris</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-8xl text-purple-500" />
                    </div>
                    <div className="text-gray-500 font-medium mb-1">Total Transaksi</div>
                    <div className="text-3xl font-bold text-gray-800">{totalTransactions}</div>
                    <div className="text-xs text-gray-400 mt-2">Penjualan kumulatif grup</div>
                </div>
            </div>

            {/* MEMBER BREAKDOWN TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Performa Member</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Dealer</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stok Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Transaksi</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.group.members.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{member.name}</div>
                                        {member.id === data.group.members.find(m => m.stats)?.id /* Simplified check for self */ && (
                                            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">Induk/Anda</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-mono font-medium">
                                        {member.stats?.vehicles || 0}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-mono font-medium">
                                        {member.stats?.transactions || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
