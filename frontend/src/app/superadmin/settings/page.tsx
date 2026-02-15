'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Shield, Users, Key, CreditCard, Save, Plus, X, Eye, EyeOff, Settings, Trash2, CheckCircle } from 'lucide-react';
import { API_URL, fetchApi } from '@/lib/api';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuthProtection } from '@/hooks/useAuthProtection';

import { SuperadminStaff, ApiKey, BillingConfig, ActivityLog } from '@/types/superadmin';

type Tab = 'general' | 'security' | 'staff' | 'api' | 'billing';

const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'general', label: 'General Profile', icon: User },
    // { id: 'security', label: 'Security & Access', icon: Shield }, // Security tab handles its own password change
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'api', label: 'API Configurations', icon: Key },
    { id: 'billing', label: 'Billing Integrations', icon: CreditCard },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const { user, refreshUser } = useAuthProtection();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-1">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
                {activeTab === 'general' && <GeneralProfileTab user={user} refreshUser={refreshUser} />}
                {activeTab === 'security' && <SecurityTab />}
                {activeTab === 'staff' && <StaffManagementTab />}
                {activeTab === 'api' && <ApiConfigTab />}
                {activeTab === 'billing' && <BillingIntegrationTab />}
            </div>
        </div>
    );
}

// ================== TAB 1: GENERAL PROFILE ==================

function GeneralProfileTab({ user, refreshUser }: { user: any; refreshUser: () => void }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '', language: 'id' });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                language: user.language || 'id',
            });
        }
    }, [user]);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ name: form.name, phone: form.phone }),
            });

            if (!res.ok) throw new Error('Failed');

            // Refresh user data globally
            await refreshUser();

            setToast('Profile berhasil diperbarui');
        } catch {
            setToast('Gagal memperbarui profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            {toast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {toast}
                </div>
            )}
            <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-900">General Profile</h3>
            </div>
            <p className="text-sm text-slate-500">Kelola informasi profil akun superadmin Anda.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400">(read-only)</span></label>
                    <input type="email" value={form.email} disabled
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bahasa</label>
                    <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={loading}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
            </div>
        </div>
    );
}

// ================== TAB 2: SECURITY & ACCESS ==================

function SecurityTab() {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const [loginHistory, setLoginHistory] = useState<ActivityLog[]>([]);

    useEffect(() => {
        fetchLoginHistory();
    }, []);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const fetchLoginHistory = async () => {
        try {
            const res = await fetchApi('/superadmin/activity/full?limit=10&action=LOGIN');
            if (res.ok) {
                const data = await res.json();
                // getActivityLog returns { data: [], pagination: {} }
                const logs = Array.isArray(data) ? data : (data.data || []);
                setLoginHistory(logs);
            }
        } catch { /* ignore */ }
    };

    const handleChangePassword = async () => {
        if (form.newPassword !== form.confirmPassword) {
            setToast({ msg: 'Password baru tidak cocok!', type: 'error' });
            return;
        }
        if (form.newPassword.length < 8) {
            setToast({ msg: 'Password minimal 8 karakter', type: 'error' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetchApi('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || 'Failed');
            }
            setToast({ msg: 'Password berhasil diubah', type: 'success' });
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setToast({ msg: err.message || 'Gagal mengubah password', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const PasswordInput = ({ label, value, onChange, show, onToggle }: any) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div className="relative">
                <input type={show ? 'text' : 'password'} value={value} onChange={onChange}
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`px-4 py-2 rounded-lg text-sm ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                    {toast.msg}
                </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Ubah Password</h3>
                </div>
                <PasswordInput label="Password Saat Ini" value={form.currentPassword}
                    onChange={(e: any) => setForm({ ...form, currentPassword: e.target.value })}
                    show={showPw.current} onToggle={() => setShowPw({ ...showPw, current: !showPw.current })} />
                <PasswordInput label="Password Baru" value={form.newPassword}
                    onChange={(e: any) => setForm({ ...form, newPassword: e.target.value })}
                    show={showPw.new} onToggle={() => setShowPw({ ...showPw, new: !showPw.new })} />
                <PasswordInput label="Konfirmasi Password Baru" value={form.confirmPassword}
                    onChange={(e: any) => setForm({ ...form, confirmPassword: e.target.value })}
                    show={showPw.confirm} onToggle={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} />
                <div className="flex justify-end">
                    <button onClick={handleChangePassword} disabled={loading}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                        {loading ? 'Mengubah...' : 'Ubah Password'}
                    </button>
                </div>
            </div>

            {/* Login History */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" /> Login History
                </h3>
                {loginHistory.length > 0 ? (
                    <div className="space-y-3">
                        {loginHistory.map((log: ActivityLog, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <span className="font-medium text-slate-700">{log.entityName || 'Login'}</span>
                                    {log.details && <span className="text-slate-400 ml-2 text-xs">{log.details}</span>}
                                </div>
                                <span className="text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 text-center py-4">Belum ada riwayat login</p>
                )}
            </div>
        </div>
    );
}

// ================== TAB 3: STAFF MANAGEMENT ==================

function StaffManagementTab() {
    const [staff, setStaff] = useState<SuperadminStaff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'Admin', phone: '' });
    const [toast, setToast] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // const getToken = () => localStorage.getItem('access_token'); // Removed

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/superadmin/staff');
            if (res.ok) {
                const data = await res.json();
                setStaff(data);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const handleAddStaff = async () => {
        try {
            const res = await fetchApi('/superadmin/staff', {
                method: 'POST',
                body: JSON.stringify(addForm),
            });
            if (!res.ok) throw new Error('Failed to create staff');
            setToast('Staff berhasil ditambahkan');
            setShowAdd(false);
            setAddForm({ name: '', email: '', password: '', role: 'Admin', phone: '' });
            fetchStaff();
        } catch {
            setToast('Gagal menambahkan staff');
        }
    };

    const handleRemoveStaff = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);
        try {
            const res = await fetchApi(`/superadmin/staff/${deleteId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');
            setToast('Staff berhasil dihapus');
            fetchStaff();
        } catch {
            setToast('Gagal menghapus staff');
        } finally {
            setDeleteLoading(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm">
                    ✅ {toast}
                </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" /> Staff Admin Management
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Kelola akses staff admin yang membantu operasional.</p>
                    </div>
                    <button onClick={() => setShowAdd(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Tambah Staff
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <p className="text-center text-slate-500 py-4">Loading staff...</p>
                    ) : staff.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">Belum ada staff admin.</p>
                    ) : (
                        staff.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                                        <p className="text-xs text-slate-500">{s.role} • {s.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {s.subscriptionStatus || 'Active'}
                                    </span>
                                    <button onClick={() => setDeleteId(s.id)}
                                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CONFIRM DELETE DIALOG */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleRemoveStaff}
                title="Hapus Staff?"
                message="Apakah Anda yakin ingin menghapus staff ini? Akses mereka akan dicabut permanen."
                confirmText="Ya, Hapus"
                variant="danger"
                isLoading={deleteLoading}
            />

            {/* ADD STAFF MODAL */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900">Tambah Staff Baru</h3>
                            <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                                <input type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="Admin">Admin</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Support">Support</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleAddStaff} disabled={!addForm.name || !addForm.email || !addForm.password}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                Tambah Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ================== TAB 4: API CONFIGURATION ==================

function ApiConfigTab() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([
        { id: '1', name: 'Production Key', key: 'otohub_pk_live_*****', created: '2026-01-15', status: 'active' },
        { id: '2', name: 'Test Key', key: 'otohub_pk_test_*****', created: '2026-02-01', status: 'active' },
    ]);
    const [webhookUrl, setWebhookUrl] = useState('https://example.com/webhook');
    const [rateLimit, setRateLimit] = useState('100');
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const generateKey = () => {
        const newKey = `otohub_pk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
        setApiKeys(prev => [...prev, {
            id: Date.now().toString(),
            name: 'New API Key',
            key: newKey,
            created: new Date().toISOString().split('T')[0],
            status: 'active',
        }]);
        setToast('API Key baru berhasil dibuat');
    };

    const revokeKey = (id: string) => {
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
        setToast('API Key berhasil di-revoke');
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm">
                    ✅ {toast}
                </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Key className="w-5 h-5 text-indigo-600" /> API Keys
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Kelola API keys untuk integrasi pihak ketiga.</p>
                    </div>
                    <button onClick={generateKey}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Generate Key
                    </button>
                </div>

                <div className="space-y-3">
                    {apiKeys.map(k => (
                        <div key={k.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{k.name}</p>
                                <p className="text-xs font-mono text-slate-500 mt-0.5">{k.key}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Dibuat: {k.created}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${k.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500 line-through'}`}>
                                    {k.status}
                                </span>
                                {k.status === 'active' && (
                                    <button onClick={() => revokeKey(k.id)} className="text-xs text-rose-600 hover:underline">Revoke</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* API DOCUMENTATION */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center rounded bg-indigo-100 text-indigo-600 text-xs font-bold">API</div>
                    Documentation
                </h3>
                <p className="text-sm text-slate-500">
                    Gunakan API Key di header <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">x-api-key</code> untuk mengakses endpoint berikut.
                </p>

                <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">GET</span>
                            <code className="text-sm text-slate-700 font-mono">{API_URL}/public/vehicles</code>
                        </div>
                        <p className="text-xs text-slate-500">Mengambil data semua kendaraan (Marketplace Feed).</p>
                        <div className="mt-2 text-xs text-slate-400 font-mono pl-4 border-l-2 border-slate-200">
                            Params: page, limit, category, minPrice, maxPrice, make, location
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">GET</span>
                            <code className="text-sm text-slate-700 font-mono">{API_URL}/public/dealers</code>
                        </div>
                        <p className="text-xs text-slate-500">Mengambil daftar dealer aktif.</p>
                        <div className="mt-2 text-xs text-slate-400 font-mono pl-4 border-l-2 border-slate-200">
                            Params: page, limit, search
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">GET</span>
                            <code className="text-sm text-slate-700 font-mono">{API_URL}/public/blacklist</code>
                        </div>
                        <p className="text-xs text-slate-500">Mengambil data customer blacklist (Shared Database).</p>
                        <div className="mt-2 text-xs text-slate-400 font-mono pl-4 border-l-2 border-slate-200">
                            Params: page, limit, search (KTP/Name)
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" /> Webhook & Rate Limits
                </h3>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Webhook URL</label>
                    <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://your-app.com/webhook" />
                    <p className="text-xs text-slate-400 mt-1">Events: tenant.created, invoice.paid, subscription.changed</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rate Limit (requests/minute)</label>
                    <input type="number" value={rateLimit} onChange={e => setRateLimit(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs" />
                </div>
                <div className="flex justify-end">
                    <button onClick={() => setToast('Konfigurasi disimpan')}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}

// ================== TAB 5: BILLING INTEGRATION ==================

function BillingIntegrationTab() {
    // const getToken = () => localStorage.getItem('access_token') || '';
    const [gateway, setGateway] = useState('manual');
    const [bankInfo, setBankInfo] = useState({ bankName: 'BCA', accountNumber: '', accountHolder: '' });
    const [autoInvoice, setAutoInvoice] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load saved config on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await fetchApi('/superadmin/platform-settings/billing_config');
                if (res.ok) {
                    const data = await res.json();
                    if (data.value) {
                        setGateway(data.value.gateway || 'manual');
                        setBankInfo(data.value.bankInfo || { bankName: 'BCA', accountNumber: '', accountHolder: '' });
                        setAutoInvoice(data.value.autoInvoice ?? true);
                    }
                }
            } catch { /* ignore - use defaults */ }
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetchApi('/superadmin/platform-settings/billing_config', {
                method: 'PATCH',
                body: JSON.stringify({ value: { gateway, bankInfo, autoInvoice } }),
            });
            if (!res.ok) throw new Error('Failed to save');
            setToast('Konfigurasi billing berhasil disimpan!');
        } catch {
            setToast('Gagal menyimpan konfigurasi');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-12 text-slate-500">Memuat konfigurasi...</div>;

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`${toast.includes('Gagal') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} border px-4 py-2 rounded-lg text-sm`}>
                    {toast.includes('Gagal') ? '❌' : '✅'} {toast}
                </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" /> Payment Gateway
                </h3>
                <div className="space-y-3">
                    {[
                        { id: 'manual', label: 'Transfer Manual', desc: 'Bukti transfer diupload tenant, admin verifikasi manual' },
                        { id: 'midtrans', label: 'Midtrans', desc: 'Payment gateway otomatis (Coming Soon)' },
                        { id: 'xendit', label: 'Xendit', desc: 'Payment gateway otomatis (Coming Soon)' },
                    ].map(gw => (
                        <label key={gw.id} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${gateway === gw.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input type="radio" name="gateway" value={gw.id} checked={gateway === gw.id}
                                onChange={e => setGateway(e.target.value)}
                                className="w-4 h-4 text-indigo-600" />
                            <div>
                                <p className="text-sm font-medium text-slate-900">{gw.label}</p>
                                <p className="text-xs text-slate-500">{gw.desc}</p>
                            </div>
                            {gw.id !== 'manual' && (
                                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Soon</span>
                            )}
                        </label>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Informasi Rekening Bank</h3>
                <p className="text-sm text-slate-500">Rekening ini akan ditampilkan ke tenant saat pembayaran manual.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bank</label>
                        <select value={bankInfo.bankName} onChange={e => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>BCA</option>
                            <option>BNI</option>
                            <option>BRI</option>
                            <option>Mandiri</option>
                            <option>CIMB Niaga</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Rekening</label>
                        <input type="text" value={bankInfo.accountNumber} onChange={e => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pemilik</label>
                        <input type="text" value={bankInfo.accountHolder} onChange={e => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Auto-Invoice Bulanan</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-700">Generate invoice secara otomatis setiap awal bulan</p>
                        <p className="text-xs text-slate-500 mt-1">Invoice akan dibuat berdasarkan plan tier masing-masing tenant aktif</p>
                    </div>
                    <button
                        onClick={() => setAutoInvoice(!autoInvoice)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoInvoice ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoInvoice ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
            </div>
        </div>
    );
}
