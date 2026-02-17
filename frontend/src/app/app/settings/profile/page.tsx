'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faCamera,
    faKey,
    faSave,
    faSpinner,
    faCheck,
    faHistory,
    faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

import { API_URL, fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
    const { t } = useLanguage();
    const { refreshUser } = useAuth();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState<'profile' | 'password' | 'activity'>('profile');

    // Profile form
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Activity logs
    const [activities, setActivities] = useState<any[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetchApi('/auth/me');

                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setName(data.name || '');
                    setPhone(data.phone || '');
                    setAddress(data.address || '');
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const fetchActivities = async () => {
        setActivityLoading(true);
        try {
            const res = await fetchApi('/activity-logs?limit=20');
            if (res.ok) {
                const data = await res.json();
                setActivities(data.logs || []);
            }
        } catch (err) {
            console.error('Error fetching activities:', err);
        } finally {
            setActivityLoading(false);
        }
    };

    useEffect(() => {
        if (tab === 'activity') fetchActivities();
    }, [tab]);

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            const res = await fetchApi('/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, phone, address }),
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data);
                // Update localStorage if needed, or rely on future fetches
                // Removed explicit localStorage manipulation for user_info as it might be handled differently now, 
                // but keeping it simple for now as cookie auth is primary.
                await refreshUser();
                toast.success('Profil berhasil diperbarui');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal memperbarui profil');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Password baru tidak cocok');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password minimal 8 karakter');
            return;
        }

        setSaving(true);
        try {
            const res = await fetchApi('/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (res.ok) {
                toast.success('Password berhasil diubah');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal mengubah password');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            LOGIN: 'Login',
            LOGOUT: 'Logout',
            PASSWORD_CHANGE: 'Ubah Password',
            CUSTOMER_CREATE: 'Tambah Customer',
            VEHICLE_CREATE: 'Tambah Kendaraan',
            TRANSACTION_CREATE: 'Buat Transaksi',
            DATA_EXPORT: 'Ekspor Data',
        };
        return labels[action] || action;
    };

    const getActionColor = (action: string) => {
        if (action === 'LOGIN' || action === 'LOGOUT') return 'bg-blue-100 text-blue-600';
        if (action === 'PASSWORD_CHANGE') return 'bg-orange-100 text-orange-600';
        if (action.includes('CREATE')) return 'bg-green-100 text-green-600';
        return 'bg-gray-100 text-gray-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-[#00bfa5]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-[#ecf0f3] shadow-[6px_6px_12px_#cbced1,-6px_-6px_12px_#ffffff]">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&size=80&background=00bfa5&color=fff`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#00bfa5] text-white flex items-center justify-center text-xs shadow-lg">
                        <FontAwesomeIcon icon={faCamera} />
                    </button>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">{user?.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#00bfa5]/10 text-[#00bfa5] font-medium">{user?.role}</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 bg-[#ecf0f3] dark:bg-gray-800 rounded-xl p-1 shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] dark:shadow-none">
                {[
                    { key: 'profile', label: 'Profil', icon: faUser },
                    { key: 'password', label: 'Keamanan', icon: faShieldAlt },
                    { key: 'activity', label: 'Aktivitas', icon: faHistory },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as any)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${tab === t.key
                            ? 'bg-[#ecf0f3] dark:bg-gray-700 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] dark:shadow-none text-[#00bfa5]'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <FontAwesomeIcon icon={t.icon} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {tab === 'profile' && (
                <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl p-6 shadow-[6px_6px_12px_#cbced1,-6px_-6px_12px_#ffffff] dark:shadow-none space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Telepon</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Alamat</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00bfa5] resize-none"
                        />
                    </div>
                    <button
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="w-full py-3 px-6 bg-[#00bfa5] text-white font-bold rounded-xl shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:bg-[#00a894] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <FontAwesomeIcon icon={saving ? faSpinner : faSave} spin={saving} />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            )}

            {/* Password Tab */}
            {tab === 'password' && (
                <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl p-6 shadow-[6px_6px_12px_#cbced1,-6px_-6px_12px_#ffffff] dark:shadow-none space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Password Saat Ini</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Password Baru</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Konfirmasi Password Baru</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700 border-none shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00bfa5]"
                        />
                    </div>
                    <button
                        onClick={handleChangePassword}
                        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                        className="w-full py-3 px-6 bg-[#00bfa5] text-white font-bold rounded-xl shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:bg-[#00a894] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <FontAwesomeIcon icon={saving ? faSpinner : faKey} spin={saving} />
                        {saving ? 'Menyimpan...' : 'Ubah Password'}
                    </button>
                </div>
            )}

            {/* Activity Tab */}
            {tab === 'activity' && (
                <div className="bg-[#ecf0f3] dark:bg-gray-800 rounded-2xl p-6 shadow-[6px_6px_12px_#cbced1,-6px_-6px_12px_#ffffff] dark:shadow-none">
                    {activityLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-[#00bfa5]" />
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FontAwesomeIcon icon={faHistory} className="text-3xl mb-3" />
                            <p>Belum ada aktivitas tercatat</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((activity, idx) => (
                                <div
                                    key={activity.id || idx}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-[#ecf0f3] dark:bg-gray-700/50 shadow-[2px_2px_4px_#cbced1,-2px_-2px_4px_#ffffff] dark:shadow-none"
                                >
                                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${getActionColor(activity.action)}`}>
                                        {getActionLabel(activity.action)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        {activity.entityName && (
                                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{activity.entityName}</p>
                                        )}
                                        <p className="text-xs text-gray-400">{activity.userEmail}</p>
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(activity.createdAt)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
