'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Building, Phone, Users, X, Check, Crown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

interface Branch {
    id: string;
    name: string;
    address: string;
    phone: string | null;
    staffCount: number;
    vehicleCount: number;
    createdAt: string;
}

export default function BranchesPage() {
    const { t, language } = useLanguage();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isPro, setIsPro] = useState(false);

    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
    });

    const getLabel = (key: string) => {
        const labels: Record<string, Record<string, string>> = {
            totalBranches: { id: 'Total Cabang', en: 'Total Branches' },
            totalStaff: { id: 'Total Staff', en: 'Total Staff' },
            totalVehicles: { id: 'Total Kendaraan', en: 'Total Vehicles' },
            searchBranch: { id: 'Cari cabang...', en: 'Search branches...' },
            noBranches: { id: 'Belum ada cabang', en: 'No branches found' },
            addBranch: { id: 'Tambah Cabang', en: 'Add Branch' },
            editBranch: { id: 'Edit Cabang', en: 'Edit Branch' },
            branchName: { id: 'Nama Cabang', en: 'Branch Name' },
            fullAddress: { id: 'Alamat Lengkap', en: 'Full Address' },
            phone: { id: 'No. Telepon', en: 'Phone Number' },
            exampleBranch: { id: 'Contoh: Cabang Bandung', en: 'Example: Bandung Branch' },
            exampleAddress: { id: 'Jl. Contoh No. 123, Kota', en: '123 Example St, City' },
            examplePhone: { id: '021-1234567', en: '021-1234567' },
            saveChanges: { id: 'Simpan Perubahan', en: 'Save Changes' },
            deleteBranchTitle: { id: 'Hapus Cabang?', en: 'Delete Branch?' },
            deleteBranchDesc: { id: 'Apakah Anda yakin ingin menghapus cabang ini? Tindakan ini tidak dapat dibatalkan.', en: 'Are you sure you want to delete this branch? This action cannot be undone.' },
            cancel: { id: 'Batal', en: 'Cancel' },
            yesDelete: { id: 'Ya, Hapus', en: 'Yes, Delete' },
            created: { id: 'Dibuat', en: 'Created' },
            multiBranchFeature: { id: 'Fitur Multi-Cabang', en: 'Multi-Branch Feature' },
            multiBranchDesc: { id: 'Kelola beberapa cabang dealer dalam satu dashboard. Pantau inventaris, staff, dan performa setiap cabang secara terpisah.', en: 'Manage multiple dealer branches in one dashboard. Monitor inventory, staff, and performance for each branch separately.' },
            whatYouGet: { id: 'Yang Anda dapatkan:', en: 'What you get:' },
            unlimitedBranches: { id: 'Kelola unlimited cabang', en: 'Manage unlimited branches' },
            branchReports: { id: 'Laporan per cabang', en: 'Reports per branch' },
            staffAssignment: { id: 'Assignment staff ke cabang', en: 'Staff assignment to branches' },
            vehicleTransfer: { id: 'Transfer kendaraan antar cabang', en: 'Vehicle transfer between branches' },
            upgradeToPro: { id: 'Upgrade ke Pro', en: 'Upgrade to Pro' },
        };
        return labels[key]?.[language === 'id' ? 'id' : 'en'] || labels[key]?.['en'] || key;
    };

    useEffect(() => {
        fetchBranches();
        checkPlanStatus();
    }, []);

    const checkPlanStatus = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/tenant/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsPro(data.planTier === 'PRO' || data.planTier === 'UNLIMITED');
            }
        } catch (err) {
            // Default to showing PRO upgrade prompt
            setIsPro(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/tenant/branches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map API response to component format
                setBranches(data.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    address: b.address,
                    phone: b.phone,
                    staffCount: b._count?.users || 0,
                    vehicleCount: b._count?.vehicles || 0,
                    createdAt: b.createdAt,
                })));
            }
        } catch (err) {
            console.error('Error fetching branches:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const url = editingBranch
                ? `${API_URL}/tenant/branches/${editingBranch.id}`
                : `${API_URL}/tenant/branches`;

            const res = await fetch(url, {
                method: editingBranch ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                toast.success(editingBranch ? t.success : t.success);
                setShowModal(false);
                resetForm();
                fetchBranches();
            } else {
                const error = await res.json();
                toast.error(error.message || t.error);
            }
        } catch (err) {
            console.error('Error saving branch:', err);
            toast.error(t.error);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteTargetId(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/tenant/branches/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success(t.success);
                fetchBranches();
            } else {
                const error = await res.json();
                toast.error(error.message || t.error);
            }
        } catch (err) {
            console.error('Error deleting branch:', err);
            toast.error(t.error);
        }
    };

    const resetForm = () => {
        setForm({ name: '', address: '', phone: '' });
        setEditingBranch(null);
    };

    const openEditModal = (branch: Branch) => {
        setEditingBranch(branch);
        setForm({
            name: branch.name,
            address: branch.address,
            phone: branch.phone || '',
        });
        setShowModal(true);
    };

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.address.toLowerCase().includes(search.toLowerCase())
    );

    // Show upgrade prompt if not PRO
    if (!isPro && !loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-8 shadow-xl">
                    <Crown className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    {getLabel('multiBranchFeature')}
                </h1>

                <p className="text-gray-500 max-w-md mb-6">
                    {getLabel('multiBranchDesc')}
                </p>

                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 max-w-md mb-8">
                    <h3 className="font-semibold text-purple-800 mb-3">{getLabel('whatYouGet')}</h3>
                    <ul className="text-left space-y-2">
                        <li className="flex items-center gap-2 text-sm text-purple-700">
                            <Check className="w-4 h-4 text-purple-500" />
                            {getLabel('unlimitedBranches')}
                        </li>
                        <li className="flex items-center gap-2 text-sm text-purple-700">
                            <Check className="w-4 h-4 text-purple-500" />
                            {getLabel('branchReports')}
                        </li>
                        <li className="flex items-center gap-2 text-sm text-purple-700">
                            <Check className="w-4 h-4 text-purple-500" />
                            {getLabel('staffAssignment')}
                        </li>
                        <li className="flex items-center gap-2 text-sm text-purple-700">
                            <Check className="w-4 h-4 text-purple-500" />
                            {getLabel('vehicleTransfer')}
                        </li>
                    </ul>
                </div>

                <Link
                    href="/app/billing"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                >
                    <Crown className="w-5 h-5" />
                    {getLabel('upgradeToPro')}
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t.branchTitle}</h1>
                    <p className="text-gray-500 mt-1">{language === 'id' ? 'Kelola lokasi dealer Anda' : 'Manage your dealer locations'}</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-[#00bfa5] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#00a896] transition-colors shadow-lg"
                >
                    <Plus className="w-5 h-5" /> {t.addBranch}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                    <p className="text-sm text-gray-500">{getLabel('totalBranches')}</p>
                    <p className="text-2xl font-bold text-gray-800">{branches.length}</p>
                </div>
                <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                    <p className="text-sm text-gray-500">{getLabel('totalStaff')}</p>
                    <p className="text-2xl font-bold text-blue-600">{branches.reduce((a, b) => a + b.staffCount, 0)}</p>
                </div>
                <div className="bg-[#ecf0f3] rounded-xl p-4 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">
                    <p className="text-sm text-gray-500">{getLabel('totalVehicles')}</p>
                    <p className="text-2xl font-bold text-emerald-600">{branches.reduce((a, b) => a + b.vehicleCount, 0)}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={getLabel('searchBranch')}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                />
            </div>

            {/* Branch Cards */}
            <div className="grid md:grid-cols-2 gap-4">
                {filteredBranches.map((branch) => (
                    <div key={branch.id} className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00bfa5] to-emerald-400 flex items-center justify-center text-white">
                                    <Building className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{branch.name}</h3>
                                    <p className="text-xs text-gray-500">
                                        {getLabel('created')} {new Date(branch.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => openEditModal(branch)}
                                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-[#00bfa5] transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteTargetId(branch.id)}
                                    className="p-2 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                                <span>{branch.address}</span>
                            </div>
                            {branch.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{branch.phone}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700">{branch.staffCount} Staff</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-medium text-gray-700">{branch.vehicleCount} {t.unit || 'Unit'}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredBranches.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        {getLabel('noBranches')}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {editingBranch ? getLabel('editBranch') : getLabel('addBranch')}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-200 rounded">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">{getLabel('branchName')}</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder={getLabel('exampleBranch')}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">{getLabel('fullAddress')}</label>
                                <textarea
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    placeholder={getLabel('exampleAddress')}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">{getLabel('phone')}</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder={getLabel('examplePhone')}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                className="w-full bg-[#00bfa5] text-white py-3 rounded-xl font-medium hover:bg-[#00a896] transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                {editingBranch ? getLabel('saveChanges') : getLabel('addBranch')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteTargetId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#ecf0f3] rounded-2xl shadow-xl max-w-sm w-full p-6">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{getLabel('deleteBranchTitle')}</h3>
                            <p className="text-gray-500 mb-6">
                                {getLabel('deleteBranchDesc')}
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTargetId(null)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">{getLabel('cancel')}</button>
                                <button onClick={() => handleDelete(deleteTargetId)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium shadow-lg hover:bg-red-600 transition-all">{getLabel('yesDelete')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
