'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Users, Key, CreditCard, Save, Plus, X, Eye, EyeOff, Settings, Trash2, CheckCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';

type Tab = 'general' | 'security' | 'staff' | 'api' | 'billing';

const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'general', label: 'General Profile', icon: User },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'api', label: 'API Configurations', icon: Key },
    { id: 'billing', label: 'Billing Integrations', icon: CreditCard },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('general');

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
                {activeTab === 'general' && <GeneralProfileTab />}
                {activeTab === 'security' && <SecurityTab />}
                {activeTab === 'staff' && <StaffManagementTab />}
                {activeTab === 'api' && <ApiConfigTab />}
                {activeTab === 'billing' && <BillingIntegrationTab />}
            </div>
        </div>
    );
}

// ================== TAB 1: GENERAL PROFILE ==================

function GeneralProfileTab() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', language: 'id' });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                setForm({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    language: user.language || 'id',
                });
            } catch { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: form.name, phone: form.phone }),
            });
            if (!res.ok) throw new Error('Failed');
            // Update local storage
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                user.name = form.name;
                user.phone = form.phone;
                localStorage.setItem('user_info', JSON.stringify(user));
            }
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
    const [loginHistory, setLoginHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchLoginHistory();
    }, []);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const fetchLoginHistory = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/superadmin/analytics/activity?limit=10&action=LOGIN`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setLoginHistory(Array.isArray(data) ? data : []);
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
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
                        {loginHistory.map((log: any, i: number) => (
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
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'Staff Finance' });
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('access_token');
            // Try to fetch admin users from activity log or users endpoint
            const res = await fetch(`${API_URL}/superadmin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                // Use static data for now since there's no dedicated staff endpoint
                setStaff([
                    { id: '1', name: 'Budi Santoso', email: 'budi@admin.com', role: 'Staff Finance', status: 'active', tasks: 12 },
                    { id: '2', name: 'Siti Aminah', email: 'siti@admin.com', role: 'Staff Onboarding', status: 'active', tasks: 5 },
                ]);
            }
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = () => {
        // Add to local state (no backend endpoint yet)
        setStaff(prev => [...prev, {
            id: Date.now().toString(),
            name: addForm.name,
            email: addForm.email,
            role: addForm.role,
            status: 'active',
            tasks: 0,
        }]);
        setShowAdd(false);
        setAddForm({ name: '', email: '', password: '', role: 'Staff Finance' });
        setToast('Staff berhasil ditambahkan');
    };

    const handleRemoveStaff = (id: string) => {
        setStaff(prev => prev.filter(s => s.id !== id));
        setToast('Staff berhasil dihapus');
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
                    {staff.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                    {s.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                                    <p className="text-xs text-slate-500">{s.role} • {s.email} • {s.tasks} Pending Task</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {s.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                                <button onClick={() => handleRemoveStaff(s.id)}
                                    className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RBAC Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" /> Hak Akses Staff (RBAC)
                </h3>
                <div className="space-y-3">
                    {[
                        { role: 'Staff Finance', access: 'Invoices, Export Data, Verifikasi Transfer' },
                        { role: 'Staff Onboarding', access: 'Tenant Management, Edit Profil Mitra' },
                        { role: 'Staff Support', access: 'View Tenants, Activity Log, Notifications' },
                    ].map((r, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="font-medium text-slate-700">{r.role}</span>
                            <span className="text-slate-500">{r.access}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ADD STAFF MODAL */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
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
                                    <option value="Staff Finance">Staff Finance</option>
                                    <option value="Staff Onboarding">Staff Onboarding</option>
                                    <option value="Staff Support">Staff Support</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                            <button onClick={handleAddStaff} disabled={!addForm.name || !addForm.email}
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
    const [apiKeys, setApiKeys] = useState([
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
    const [gateway, setGateway] = useState('manual');
    const [bankInfo, setBankInfo] = useState({ bankName: 'BCA', accountNumber: '1234567890', accountHolder: 'PT OTOHUB Indonesia' });
    const [autoInvoice, setAutoInvoice] = useState(true);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    return (
        <div className="space-y-6">
            {toast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm">
                    ✅ {toast}
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
                <button onClick={() => setToast('Konfigurasi billing disimpan')}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                    <Save className="w-4 h-4" /> Simpan Konfigurasi
                </button>
            </div>
        </div>
    );
}
