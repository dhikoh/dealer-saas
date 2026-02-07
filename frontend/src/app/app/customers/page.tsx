'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faPlus,
    faSearch,
    faBan,
    faPhone,
    faMapMarkerAlt,
    faIdCard,
    faSpinner,
    faExclamationTriangle,
    faTimes,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';

interface Customer {
    id: string;
    ktpNumber: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    createdAt: string;
}

interface BlacklistEntry {
    dealerName: string;
    dealerAddress: string;
    reason: string;
    createdAt: string;
}

interface BlacklistCheck {
    isBlacklisted: boolean;
    customerName?: string;
    customerAddress?: string;
    entries: BlacklistEntry[];
}

export default function CustomersPage() {
    const { t } = useLanguage();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBlacklistModal, setShowBlacklistModal] = useState(false);
    const [showCheckModal, setShowCheckModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [blacklistCheck, setBlacklistCheck] = useState<BlacklistCheck | null>(null);
    const [checkLoading, setCheckLoading] = useState(false);
    const [checkKtp, setCheckKtp] = useState('');

    // Form states
    const [form, setForm] = useState({
        ktpNumber: '',
        name: '',
        phone: '',
        email: '',
        address: '',
    });
    const [blacklistReason, setBlacklistReason] = useState('');

    const getToken = () => localStorage.getItem('token');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setCustomers(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setShowAddModal(false);
                setForm({ ktpNumber: '', name: '', phone: '', email: '', address: '' });
                fetchCustomers();
            }
        } catch (error) {
            console.error('Failed to add customer:', error);
        }
    };

    const handleCheckBlacklist = async (ktp: string) => {
        const token = getToken();
        if (!token || !ktp) return;

        setCheckLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blacklist/check/${ktp}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setBlacklistCheck(await res.json());
            }
        } catch (error) {
            console.error('Failed to check blacklist:', error);
        } finally {
            setCheckLoading(false);
        }
    };

    const handleAddToBlacklist = async () => {
        const token = getToken();
        if (!token || !selectedCustomer) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blacklist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ktpNumber: selectedCustomer.ktpNumber,
                    customerName: selectedCustomer.name,
                    customerAddress: selectedCustomer.address,
                    reason: blacklistReason,
                }),
            });

            if (res.ok) {
                setShowBlacklistModal(false);
                setBlacklistReason('');
                alert('Customer berhasil ditambahkan ke blacklist');
            }
        } catch (error) {
            console.error('Failed to add to blacklist:', error);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ktpNumber.includes(searchTerm) ||
        c.phone.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-[#00bfa5] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t.customer}</h1>
                    <p className="text-sm text-gray-500">Kelola data customer dan cek blacklist</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCheckModal(true)}
                        className="px-4 py-2 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-yellow-600 transition-all flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faBan} />
                        Cek Blacklist
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891] transition-all flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Tambah Customer
                    </button>
                </div>
            </div>

            {/* SEARCH */}
            <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari nama, KTP, atau telepon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                />
            </div>

            {/* CUSTOMER LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer) => (
                    <div
                        key={customer.id}
                        className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[9px_9px_16px_#cbced1,-9px_-9px_16px_#ffffff] hover:shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00bfa5] to-[#00a891] flex items-center justify-center text-white font-bold text-lg">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{customer.name}</h3>
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <FontAwesomeIcon icon={faIdCard} />
                                        {customer.ktpNumber}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedCustomer(customer);
                                    handleCheckBlacklist(customer.ktpNumber);
                                    setShowBlacklistModal(true);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Blacklist"
                            >
                                <FontAwesomeIcon icon={faBan} />
                            </button>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faPhone} className="text-[#00bfa5] w-4" />
                                {customer.phone}
                            </div>
                            {customer.address && (
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#00bfa5] w-4" />
                                    <span className="truncate">{customer.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredCustomers.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <FontAwesomeIcon icon={faUsers} className="text-4xl mb-4" />
                    <p>Belum ada customer</p>
                </div>
            )}

            {/* ADD CUSTOMER MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Tambah Customer</h2>
                            <button onClick={() => setShowAddModal(false)}>
                                <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={handleAddCustomer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">No. KTP *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.ktpNumber}
                                    onChange={(e) => setForm({ ...form, ktpNumber: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                    placeholder="3201234567890001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Nama *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Telepon *</label>
                                <input
                                    type="tel"
                                    required
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Alamat</label>
                                <textarea
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891]"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CHECK BLACKLIST MODAL */}
            {showCheckModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Cek Blacklist</h2>
                            <button onClick={() => { setShowCheckModal(false); setBlacklistCheck(null); setCheckKtp(''); }}>
                                <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Masukkan No. KTP</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={checkKtp}
                                        onChange={(e) => setCheckKtp(e.target.value)}
                                        className="flex-1 px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                                        placeholder="3201234567890001"
                                    />
                                    <button
                                        onClick={() => handleCheckBlacklist(checkKtp)}
                                        disabled={checkLoading}
                                        className="px-4 py-3 rounded-xl bg-[#00bfa5] text-white font-medium shadow-lg hover:bg-[#00a891]"
                                    >
                                        {checkLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Cek'}
                                    </button>
                                </div>
                            </div>

                            {blacklistCheck && (
                                <div className={`p-4 rounded-xl ${blacklistCheck.isBlacklisted ? 'bg-red-50' : 'bg-green-50'}`}>
                                    {blacklistCheck.isBlacklisted ? (
                                        <div>
                                            <div className="flex items-center gap-2 text-red-600 font-bold mb-3">
                                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                                BLACKLISTED
                                            </div>
                                            <div className="text-sm text-gray-700 mb-2">
                                                <strong>{blacklistCheck.customerName}</strong>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-3">{blacklistCheck.customerAddress}</div>
                                            <div className="space-y-2">
                                                {blacklistCheck.entries.map((entry, i) => (
                                                    <div key={i} className="bg-white p-3 rounded-lg text-sm">
                                                        <div className="font-medium text-gray-800">{entry.dealerName}</div>
                                                        <div className="text-xs text-gray-400">{entry.dealerAddress}</div>
                                                        <div className="text-red-600 mt-1">Alasan: {entry.reason}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-600 font-bold">
                                            <FontAwesomeIcon icon={faCheck} />
                                            TIDAK ADA DI BLACKLIST
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* BLACKLIST CUSTOMER MODAL */}
            {showBlacklistModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#ecf0f3] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Blacklist Customer</h2>
                            <button onClick={() => { setShowBlacklistModal(false); setBlacklistCheck(null); }}>
                                <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>

                        <div className="bg-gray-100 p-4 rounded-xl mb-4">
                            <div className="font-bold text-gray-800">{selectedCustomer.name}</div>
                            <div className="text-sm text-gray-500">{selectedCustomer.ktpNumber}</div>
                        </div>

                        {checkLoading ? (
                            <div className="text-center py-4">
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#00bfa5]" />
                            </div>
                        ) : blacklistCheck?.isBlacklisted ? (
                            <div className="bg-red-50 p-4 rounded-xl mb-4">
                                <div className="text-red-600 font-bold mb-2">Sudah di-blacklist oleh:</div>
                                {blacklistCheck.entries.map((entry, i) => (
                                    <div key={i} className="text-sm text-gray-700">
                                        • {entry.dealerName} - {entry.reason}
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Alasan Blacklist *</label>
                                <textarea
                                    value={blacklistReason}
                                    onChange={(e) => setBlacklistReason(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                                    rows={3}
                                    placeholder="Contoh: Tidak membayar cicilan selama 3 bulan"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowBlacklistModal(false); setBlacklistCheck(null); }}
                                    className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAddToBlacklist}
                                    disabled={!blacklistReason}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium shadow-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                    Tambah ke Blacklist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
