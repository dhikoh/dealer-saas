'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Shield, Users, Key, CreditCard, Save, Plus, X, Eye, EyeOff, Settings, Trash2, CheckCircle } from 'lucide-react';
import { API_URL, fetchApi } from '@/lib/api';
import { sanitizePayload } from '@/lib/utils';
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
                body: JSON.stringify(sanitizePayload({ name: form.name, phone: form.phone })),
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
    const [addForm, setAddForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [toast, setToast] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    // Password validation helpers
    const passwordChecks = {
        minLength: addForm.password.length >= 8,
        hasUpper: /[A-Z]/.test(addForm.password),
        hasLower: /[a-z]/.test(addForm.password),
        hasDigit: /\d/.test(addForm.password),
    };
    const isPasswordValid = passwordChecks.minLength && passwordChecks.hasUpper && passwordChecks.hasLower && passwordChecks.hasDigit;

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
        setAddError(null);
        try {
            const res = await fetchApi('/superadmin/staff', {
                method: 'POST',
                body: JSON.stringify(addForm),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                const msg = err?.message;
                throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || 'Gagal menambahkan staff');
            }
            setToast('Staff berhasil ditambahkan');
            setShowAdd(false);
            setAddForm({ name: '', email: '', password: '', phone: '' });
            fetchStaff();
        } catch (e: any) {
            setAddError(e.message || 'Gagal menambahkan staff');
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
                            <button onClick={() => { setShowAdd(false); setAddError(null); }} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {addError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                                    ❌ {addError}
                                </div>
                            )}
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
                                {addForm.password && (
                                    <div className="mt-2 space-y-1">
                                        {[
                                            { ok: passwordChecks.minLength, label: 'Minimal 8 karakter' },
                                            { ok: passwordChecks.hasUpper, label: 'Mengandung huruf besar (A-Z)' },
                                            { ok: passwordChecks.hasLower, label: 'Mengandung huruf kecil (a-z)' },
                                            { ok: passwordChecks.hasDigit, label: 'Mengandung angka (0-9)' },
                                        ].map(c => (
                                            <div key={c.label} className={`text-xs flex items-center gap-1.5 ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {c.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />}
                                                {c.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon <span className="text-slate-400 font-normal">(opsional)</span></label>
                                <input type="tel" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="+62..." />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                            <button onClick={() => { setShowAdd(false); setAddError(null); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleAddStaff} disabled={!addForm.name || !addForm.email || !isPasswordValid}
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
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [webhookUrl, setWebhookUrl] = useState('https://example.com/webhook');
    const [rateLimit, setRateLimit] = useState('100');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const res = await fetchApi('/superadmin/api-keys');
            if (res.ok) {
                const data = await res.json();
                setApiKeys(data);
            }
        } catch { /* ignore */ }
        setLoading(false);
    };

    const generateKey = async () => {
        try {
            const res = await fetchApi('/superadmin/api-keys', {
                method: 'POST',
                body: JSON.stringify({ name: `API Key ${new Date().toLocaleDateString()}`, scopes: [] }),
            });
            if (res.ok) {
                const data = await res.json();
                setNewKey({ key: data.key, name: data.name }); // Show the full key once
                setToast({ msg: 'API Key baru berhasil dibuat', type: 'success' });
                fetchKeys();
            } else {
                throw new Error('Failed');
            }
        } catch {
            setToast({ msg: 'Gagal membuat API Key', type: 'error' });
        }
    };

    const revokeKey = async (id: string) => {
        if (!confirm('Apakah Anda yakin? Key yang dihapus tidak dapat dikembalikan.')) return;
        try {
            const res = await fetchApi(`/superadmin/api-keys/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setToast({ msg: 'API Key berhasil dihapus', type: 'success' });
                fetchKeys();
            } else {
                throw new Error('Failed');
            }
        } catch {
            setToast({ msg: 'Gagal menghapus API Key', type: 'error' });
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`px-4 py-2 rounded-lg text-sm ${toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                    {toast.msg}
                </div>
            )}

            {/* NEW KEY DISPLAY */}
            {newKey && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-lg font-bold text-amber-800 flex items-center gap-2">
                                <Key className="w-5 h-5" /> API Key Berhasil Dibuat
                            </h4>
                            <p className="text-sm text-amber-700 mt-1">
                                Salin key ini sekarang. Key tidak akan ditampilkan lagi setelah Anda menutup halaman ini.
                            </p>
                        </div>
                        <button onClick={() => setNewKey(null)} className="text-amber-600 hover:text-amber-800"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="bg-white border border-amber-200 p-4 rounded-lg flex items-center justify-between gap-4">
                        <code className="font-mono text-lg text-slate-800 break-all">{newKey.key}</code>
                        <button
                            onClick={() => { navigator.clipboard.writeText(newKey.key); setToast({ msg: 'Copied to clipboard', type: 'success' }); }}
                            className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 uppercase tracking-wider"
                        >
                            Copy
                        </button>
                    </div>
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
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading keys...</div>
                    ) : apiKeys.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 italic">Belum ada API Key aktif.</div>
                    ) : (
                        apiKeys.map(k => (
                            <div key={k.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{k.name}</p>
                                    <p className="text-xs font-mono text-slate-500 mt-0.5">{k.prefix}...</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Dibuat: {new Date(k.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                        Active
                                    </span>
                                    <button onClick={() => revokeKey(k.id)}
                                        className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                                        title="Revoke Key"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
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
                    <button onClick={() => setToast({ msg: 'Konfigurasi disimpan', type: 'success' })}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}

// ================== TAB 5: BILLING INTEGRATION ==================

interface PaymentMethodItem {
    id: string;
    provider: string;
    accountName: string;
    accountNumber: string;
    description?: string;
    isActive: boolean;
}

interface BillingPeriodConfig {
    months: number;
    discountPercent: number;
    label: string;
}

function BillingIntegrationTab() {
    // Gateway & Auto-Invoice (saved to PlatformSetting)
    const [gateway, setGateway] = useState('manual');
    const [autoInvoice, setAutoInvoice] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Payment Methods (CRUD via /payment-methods API)
    const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMethod, setNewMethod] = useState({ provider: '', accountName: '', accountNumber: '', description: '' });
    const [addingMethod, setAddingMethod] = useState(false);

    // Billing Periods (saved to PlatformSetting)
    const [periods, setPeriods] = useState<BillingPeriodConfig[]>([
        { months: 1, discountPercent: 0, label: '1 Bulan' },
        { months: 6, discountPercent: 10, label: '6 Bulan' },
        { months: 12, discountPercent: 20, label: '12 Bulan' },
    ]);

    // Load all configs on mount
    useEffect(() => {
        (async () => {
            try {
                const [configRes, methodsRes, periodsRes] = await Promise.all([
                    fetchApi('/superadmin/platform-settings/billing_config'),
                    fetchApi('/payment-methods'),
                    fetchApi('/superadmin/platform-settings/billing_periods'),
                ]);

                if (configRes.ok) {
                    const data = await configRes.json();
                    if (data.value) {
                        setGateway(data.value.gateway || 'manual');
                        setAutoInvoice(data.value.autoInvoice ?? true);
                    }
                }

                if (methodsRes.ok) {
                    setMethods(await methodsRes.json());
                }

                if (periodsRes.ok) {
                    const data = await periodsRes.json();
                    if (data.value) {
                        try {
                            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                setPeriods(parsed);
                            }
                        } catch { /* ignore parse error, use defaults */ }
                    }
                }
            } catch { /* ignore - use defaults */ }
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    // Save gateway + auto-invoice config
    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetchApi('/superadmin/platform-settings/billing_config', {
                method: 'PATCH',
                body: JSON.stringify({ value: JSON.stringify(sanitizePayload({ gateway, autoInvoice })) }),
            });
            if (!res.ok) throw new Error('Failed');
            setToast('Konfigurasi billing berhasil disimpan!');
        } catch {
            setToast('Gagal menyimpan konfigurasi');
        } finally {
            setSaving(false);
        }
    };

    // Save billing periods config
    const handleSavePeriods = async () => {
        setSaving(true);
        try {
            const res = await fetchApi('/superadmin/platform-settings/billing_periods', {
                method: 'PATCH',
                body: JSON.stringify({ value: JSON.stringify(periods) }),
            });
            if (!res.ok) throw new Error('Failed');
            setToast('Konfigurasi diskon periode berhasil disimpan!');
        } catch {
            setToast('Gagal menyimpan konfigurasi periode');
        } finally {
            setSaving(false);
        }
    };

    // Payment Method CRUD
    const handleAddMethod = async () => {
        if (!newMethod.provider || !newMethod.accountName || !newMethod.accountNumber) {
            setToast('Gagal: Semua field wajib diisi');
            return;
        }
        setAddingMethod(true);
        try {
            const res = await fetchApi('/payment-methods', {
                method: 'POST',
                body: JSON.stringify(newMethod),
            });
            if (res.ok) {
                const created = await res.json();
                setMethods(prev => [...prev, created]);
                setNewMethod({ provider: '', accountName: '', accountNumber: '', description: '' });
                setShowAddForm(false);
                setToast('Metode pembayaran berhasil ditambahkan!');
            } else {
                throw new Error('Failed');
            }
        } catch {
            setToast('Gagal menambahkan metode pembayaran');
        } finally {
            setAddingMethod(false);
        }
    };

    const handleToggleMethod = async (id: string, isActive: boolean) => {
        try {
            const res = await fetchApi(`/payment-methods/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !isActive }),
            });
            if (res.ok) {
                setMethods(prev => prev.map(m => m.id === id ? { ...m, isActive: !isActive } : m));
            }
        } catch {
            setToast('Gagal mengubah status');
        }
    };

    const handleDeleteMethod = async (id: string) => {
        if (!confirm('Hapus metode pembayaran ini?')) return;
        try {
            const res = await fetchApi(`/payment-methods/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMethods(prev => prev.filter(m => m.id !== id));
                setToast('Metode pembayaran dihapus');
            }
        } catch {
            setToast('Gagal menghapus');
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

            {/* Payment Gateway Selection */}
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

            {/* Payment Methods Management */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Metode Pembayaran</h3>
                    <button onClick={() => setShowAddForm(!showAddForm)}
                        className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Tambah
                    </button>
                </div>
                <p className="text-sm text-slate-500">Metode ini ditampilkan ke tenant saat pembayaran. Tenant memilih salah satu untuk transfer.</p>

                {/* Add Form */}
                {showAddForm && (
                    <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Provider (Bank/E-Wallet)</label>
                                <input type="text" placeholder="BCA, BNI, Dana, QRIS..."
                                    value={newMethod.provider} onChange={e => setNewMethod({ ...newMethod, provider: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nama Akun</label>
                                <input type="text" placeholder="PT. OTOHUB Indonesia"
                                    value={newMethod.accountName} onChange={e => setNewMethod({ ...newMethod, accountName: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nomor Rekening</label>
                                <input type="text" placeholder="1234567890"
                                    value={newMethod.accountNumber} onChange={e => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Keterangan (opsional)</label>
                                <input type="text" placeholder="Rekening utama"
                                    value={newMethod.description} onChange={e => setNewMethod({ ...newMethod, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleAddMethod} disabled={addingMethod}
                                className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1">
                                {addingMethod ? 'Menyimpan...' : <><CheckCircle className="w-4 h-4" /> Simpan</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* Methods List */}
                {methods.length > 0 ? (
                    <div className="space-y-2">
                        {methods.map(m => (
                            <div key={m.id} className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${m.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{m.provider}</p>
                                    <p className="text-xs text-slate-500">{m.accountNumber} &middot; {m.accountName}</p>
                                    {m.description && <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleToggleMethod(m.id, m.isActive)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${m.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${m.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </button>
                                    <button onClick={() => handleDeleteMethod(m.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-400 text-sm">Belum ada metode pembayaran. Tambahkan minimal satu.</div>
                )}
            </div>

            {/* Billing Periods & Discounts */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Diskon Periode Langganan</h3>
                <p className="text-sm text-slate-500">Atur diskon untuk tenant yang berlangganan lebih dari 1 bulan.</p>
                <div className="space-y-3">
                    {periods.map((p, i) => (
                        <div key={p.months} className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl bg-slate-50">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">{p.label}</p>
                                <p className="text-xs text-slate-500">{p.months} bulan</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-600 whitespace-nowrap">Diskon:</label>
                                <input
                                    type="number" min="0" max="50"
                                    value={p.discountPercent}
                                    onChange={e => {
                                        const updated = [...periods];
                                        updated[i] = { ...p, discountPercent: Math.max(0, Math.min(50, Number(e.target.value))) };
                                        setPeriods(updated);
                                    }}
                                    className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <span className="text-sm text-slate-500">%</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSavePeriods} disabled={saving}
                        className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1">
                        <Save className="w-4 h-4" /> Simpan Periode
                    </button>
                </div>
            </div>

            {/* Auto-Invoice */}
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
                <button onClick={handleSaveConfig} disabled={saving}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
            </div>
        </div>
    );
}
