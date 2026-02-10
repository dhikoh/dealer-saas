'use client';

import React, { useEffect, useState } from 'react';
import { Save, Building2, Phone, Mail, MapPin, AlertCircle, CheckCircle, Lock, Bell, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface TenantProfile {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    planTier: string;
    subscriptionStatus: string;
}

import { API_URL } from '@/lib/api';

const TABS = [
    { id: 'profile', name: 'Profil', icon: Building2 },
    { id: 'security', name: 'Keamanan', icon: Lock },
    { id: 'notifications', name: 'Notifikasi', icon: Bell },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState<TenantProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const [notificationSettings, setNotificationSettings] = useState({
        emailReminders: true,
        paymentAlerts: true,
        systemUpdates: false,
        marketingEmails: false,
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/tenant/profile`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch profile');

            const data = await res.json();
            setProfile(data);
            setFormData({
                name: data.name || '',
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || '',
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/tenant/profile`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to update profile');

            toast.success('Profil berhasil diperbarui!');
            fetchProfile();
        } catch (err) {
            toast.error('Gagal menyimpan perubahan');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Password baru tidak cocok');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to change password');
            }

            toast.success('Password berhasil diubah!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            toast.error(err.message || 'Gagal mengubah password');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        // Simulating save - in real app would call API
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('Pengaturan notifikasi disimpan!');
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#00bfa5] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Pengaturan</h1>
                <p className="text-gray-500 mt-1">Kelola profil, keamanan, dan preferensi notifikasi</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-[#ecf0f3] rounded-xl shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] text-[#00bfa5]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="hidden sm:inline">{tab.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-[#ecf0f3] rounded-2xl p-6 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff]">

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleSubmitProfile} className="space-y-5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-[#00bfa5]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Profil Perusahaan</h2>
                                <p className="text-sm text-gray-500">Informasi ini akan tampil di kop invoice</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Nama Dealer / Perusahaan</label>
                            <div className="relative">
                                <Building2 className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Alamat Lengkap</label>
                            <div className="relative">
                                <MapPin className="w-5 h-5 absolute left-4 top-4 text-gray-400" />
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={3}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700 resize-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Nomor Telepon</label>
                                <div className="relative">
                                    <Phone className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Email Bisnis</label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Account Info */}
                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Informasi Akun</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Slug</span>
                                    <p className="font-medium text-gray-700">{profile?.slug}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Paket</span>
                                    <p className="font-medium text-gray-700">{profile?.planTier}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Status</span>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${profile?.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                        profile?.subscriptionStatus === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {profile?.subscriptionStatus}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#00bfa5] text-white font-medium hover:bg-[#00a896] transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <form onSubmit={handleChangePassword} className="space-y-5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center">
                                <Key className="w-6 h-6 text-[#00bfa5]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Ubah Password</h2>
                                <p className="text-sm text-gray-500">Pastikan password baru minimal 6 karakter</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Password Saat Ini</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Password Baru</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Konfirmasi Password Baru</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-[#ecf0f3] border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-700"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
                                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#00bfa5] text-white font-medium hover:bg-[#00a896] transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Key className="w-5 h-5" />
                                )}
                                Ubah Password
                            </button>
                        </div>
                    </form>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center">
                                <Bell className="w-6 h-6 text-[#00bfa5]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Preferensi Notifikasi</h2>
                                <p className="text-sm text-gray-500">Atur notifikasi yang ingin Anda terima</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: 'emailReminders', title: 'Pengingat Email', desc: 'Terima pengingat pembayaran dan jatuh tempo' },
                                { key: 'paymentAlerts', title: 'Alert Pembayaran', desc: 'Notifikasi saat ada pembayaran masuk atau tagihan baru' },
                                { key: 'systemUpdates', title: 'Update Sistem', desc: 'Informasi fitur baru dan maintenance' },
                                { key: 'marketingEmails', title: 'Email Marketing', desc: 'Promo dan penawaran khusus' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.title}</p>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => setNotificationSettings({
                                            ...notificationSettings,
                                            [item.key]: !notificationSettings[item.key as keyof typeof notificationSettings]
                                        })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${notificationSettings[item.key as keyof typeof notificationSettings]
                                            ? 'bg-[#00bfa5]'
                                            : 'bg-gray-300'
                                            }`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notificationSettings[item.key as keyof typeof notificationSettings]
                                            ? 'translate-x-7'
                                            : 'translate-x-1'
                                            }`} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSaveNotifications}
                                disabled={saving}
                                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#00bfa5] text-white font-medium hover:bg-[#00a896] transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Simpan Pengaturan
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
