'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Lock, Bell, Users, Save, Eye, EyeOff, Check } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

const TABS = [
    { id: 'profile', label: 'Profil Dealer', icon: Building2 },
    { id: 'security', label: 'Keamanan', icon: Lock },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
];

export default function MobileSettings() {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile
    const [profile, setProfile] = useState({ name: '', address: '', phone: '', email: '', currency: 'IDR' });

    // Security
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

    // Notifications (local only, no API yet)
    const [notif, setNotif] = useState({ emailReminders: true, paymentAlerts: true, systemUpdates: false });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/tenant/profile');
            if (res.ok) {
                const d = await res.json();
                setProfile({ name: d.name || '', address: d.address || '', phone: d.phone || '', email: d.email || '', currency: d.currency || 'IDR' });
            }
        } catch { } finally { setLoading(false); }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await fetchApi('/tenant/profile', { method: 'PATCH', body: JSON.stringify(profile) });
            if (res.ok) toast.success('Profil berhasil disimpan');
            else toast.error('Gagal menyimpan profil');
        } catch { toast.error('Gagal menyimpan profil'); }
        finally { setSaving(false); }
    };

    const handleChangePassword = async () => {
        if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('Isi semua field password'); return; }
        if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Password baru tidak cocok'); return; }
        if (pwForm.newPassword.length < 8) { toast.error('Password minimal 8 karakter'); return; }
        setSaving(true);
        try {
            const res = await fetchApi('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
            });
            if (res.ok) {
                toast.success('Password berhasil diubah');
                setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal mengubah password');
            }
        } catch { toast.error('Gagal mengubah password'); }
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
                <h1 className="text-xl font-bold text-gray-800">Pengaturan</h1>
                <p className="text-sm text-gray-500">Kelola profil dan keamanan akun</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-2 bg-[#ecf0f3] rounded-xl p-1 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]">
                {TABS.map(t => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${activeTab === t.id ? 'bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] text-[#00bfa5]' : 'text-gray-400'}`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] leading-tight text-center">{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[#00bfa5]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">Profil Perusahaan</h2>
                            <p className="text-xs text-gray-500">Informasi dealer Anda</p>
                        </div>
                    </div>
                    {[
                        { label: 'Nama Dealer', key: 'name', placeholder: 'Nama dealer...', type: 'text' },
                        { label: 'No. Telepon', key: 'phone', placeholder: '021-xxxx', type: 'tel' },
                        { label: 'Email Bisnis', key: 'email', placeholder: 'dealer@email.com', type: 'email' },
                        { label: 'Alamat', key: 'address', placeholder: 'Jl. ...', type: 'text' },
                    ].map(({ label, key, placeholder, type }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                            <input type={type} value={(profile as any)[key]}
                                onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                                placeholder={placeholder}
                                className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                        </div>
                    ))}
                    <button onClick={handleSaveProfile} disabled={saving}
                        className="w-full py-3 rounded-xl bg-[#00bfa5] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Profil</>}
                    </button>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center">
                            <Lock className="w-5 h-5 text-[#00bfa5]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">Ubah Password</h2>
                            <p className="text-xs text-gray-500">Minimal 8 karakter</p>
                        </div>
                    </div>
                    {[
                        { label: 'Password Sekarang', key: 'currentPassword', showKey: 'current' as const },
                        { label: 'Password Baru', key: 'newPassword', showKey: 'new' as const },
                        { label: 'Konfirmasi Password Baru', key: 'confirmPassword', showKey: 'confirm' as const },
                    ].map(({ label, key, showKey }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                            <div className="relative">
                                <input type={showPw[showKey] ? 'text' : 'password'}
                                    value={(pwForm as any)[key]}
                                    onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm pr-12" />
                                <button type="button" onClick={() => setShowPw({ ...showPw, [showKey]: !showPw[showKey] })}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPw[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={handleChangePassword} disabled={saving}
                        className="w-full py-3 rounded-xl bg-[#00bfa5] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? 'Menyimpan...' : <><Lock className="w-4 h-4" /> Ubah Password</>}
                    </button>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center">
                            <Bell className="w-5 h-5 text-[#00bfa5]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">Preferensi Notifikasi</h2>
                            <p className="text-xs text-gray-500">Kelola pemberitahuan</p>
                        </div>
                    </div>
                    {[
                        { key: 'emailReminders', label: 'Reminder Email', desc: 'Pengingat cicilan dan pajak' },
                        { key: 'paymentAlerts', label: 'Notif Pembayaran', desc: 'Pemberitahuan transaksi masuk' },
                        { key: 'systemUpdates', label: 'Update Sistem', desc: 'Info fitur dan pembaruan' },
                    ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium text-gray-800 text-sm">{label}</p>
                                <p className="text-xs text-gray-500">{desc}</p>
                            </div>
                            <button onClick={() => setNotif({ ...notif, [key]: !(notif as any)[key] })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${(notif as any)[key] ? 'bg-[#00bfa5]' : 'bg-gray-300'}`}>
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${(notif as any)[key] ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    ))}
                    <button onClick={() => toast.info('Preferensi notifikasi disimpan')}
                        className="w-full py-3 rounded-xl bg-[#00bfa5] text-white font-bold flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> Simpan Preferensi
                    </button>
                </div>
            )}
        </div>
    );
}
