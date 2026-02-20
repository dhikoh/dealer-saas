'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Shield, Users, Globe, CreditCard, Save, X, Plus, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

const TABS = [
    { id: 'general', label: 'Umum', icon: Globe },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
];

interface SuperadminStaff { id: string; name: string; email: string; role: string; }
interface BillingIntegration { provider: string; apiKey?: string; webhookUrl?: string; enabled: boolean; }

export default function MobileSuperadminSettings() {
    const [activeTab, setActiveTab] = useState('general');
    const [saving, setSaving] = useState(false);

    // General
    const [general, setGeneral] = useState({
        platformName: 'OTOHUB',
        supportEmail: '',
        supportPhone: '',
        maintenanceMode: false,
    });

    // Security
    const [security, setSecurity] = useState({
        sessionTimeoutMinutes: 60,
        forcePasswordChangeMonths: 6,
        maxLoginAttempts: 5,
        require2FA: false,
    });

    // Staff
    const [staffList, setStaffList] = useState<SuperadminStaff[]>([]);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [newStaffEmail, setNewStaffEmail] = useState('');
    const [newStaffName, setNewStaffName] = useState('');

    // Billing integrations
    const [billingIntegrations, setBillingIntegrations] = useState<BillingIntegration[]>([
        { provider: 'Stripe', apiKey: '', webhookUrl: '', enabled: false },
        { provider: 'Midtrans', apiKey: '', webhookUrl: '', enabled: false },
        { provider: 'Xendit', apiKey: '', webhookUrl: '', enabled: false },
    ]);

    useEffect(() => { fetchSettings(); fetchStaff(); }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetchApi('/superadmin/settings');
            if (res.ok) {
                const d = await res.json();
                if (d.general) setGeneral(g => ({ ...g, ...d.general }));
                if (d.security) setSecurity(s => ({ ...s, ...d.security }));
                if (d.billingIntegrations) setBillingIntegrations(d.billingIntegrations);
            }
        } catch { }
    };

    const fetchStaff = async () => {
        try {
            const res = await fetchApi('/superadmin/users?role=SUPERADMIN&limit=50');
            if (res.ok) { const d = await res.json(); setStaffList(d?.data ?? d ?? []); }
        } catch { }
    };

    const handleSaveGeneral = async () => {
        setSaving(true);
        try {
            const res = await fetchApi('/superadmin/settings/general', { method: 'PATCH', body: JSON.stringify(general) });
            if (res.ok) toast.success('Pengaturan umum disimpan');
            else toast.error('Gagal menyimpan');
        } catch { toast.error('Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleSaveSecurity = async () => {
        setSaving(true);
        try {
            const res = await fetchApi('/superadmin/settings/security', { method: 'PATCH', body: JSON.stringify(security) });
            if (res.ok) toast.success('Pengaturan keamanan disimpan');
            else toast.error('Gagal menyimpan');
        } catch { toast.error('Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleAddStaff = async () => {
        if (!newStaffEmail || !newStaffName) { toast.error('Isi nama dan email'); return; }
        setSaving(true);
        try {
            const res = await fetchApi('/superadmin/users/invite', {
                method: 'POST',
                body: JSON.stringify({ name: newStaffName, email: newStaffEmail, role: 'SUPERADMIN' }),
            });
            if (res.ok) {
                toast.success('Staff superadmin ditambahkan');
                setShowAddStaff(false);
                setNewStaffEmail(''); setNewStaffName('');
                fetchStaff();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Gagal menambahkan');
            }
        } catch { toast.error('Gagal menambahkan'); }
        finally { setSaving(false); }
    };

    const handleDeleteStaff = async (id: string) => {
        try {
            const res = await fetchApi(`/superadmin/users/${id}`, { method: 'DELETE' });
            if (res.ok) { toast.success('Staff dihapus'); fetchStaff(); }
            else toast.error('Gagal menghapus');
        } catch { toast.error('Gagal menghapus'); }
    };

    const handleSaveBilling = async (integration: BillingIntegration) => {
        setSaving(true);
        try {
            const res = await fetchApi(`/superadmin/settings/billing/${integration.provider.toLowerCase()}`, {
                method: 'PATCH',
                body: JSON.stringify(integration),
            });
            if (res.ok) toast.success(`${integration.provider} disimpan`);
            else toast.error('Gagal menyimpan');
        } catch { toast.error('Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const updateBilling = (provider: string, key: string, value: string | boolean) => {
        setBillingIntegrations(list => list.map(b => b.provider === provider ? { ...b, [key]: value } : b));
    };

    return (
        <div className="p-4 space-y-4 pb-24">
            <div>
                <h1 className="text-xl font-bold text-gray-800">Pengaturan Platform</h1>
                <p className="text-sm text-gray-500">Konfigurasi global sistem OTOHUB</p>
            </div>

            {/* Tab bar */}
            <div className="grid grid-cols-4 gap-1.5 bg-[#ecf0f3] rounded-xl p-1 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]">
                {TABS.map(t => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`py-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${activeTab === t.id ? 'bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] text-[#00bfa5]' : 'text-gray-400'}`}>
                            <Icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] space-y-4">
                    <h2 className="font-bold text-gray-800">Informasi Platform</h2>
                    {[
                        { label: 'Nama Platform', key: 'platformName', type: 'text' },
                        { label: 'Email Support', key: 'supportEmail', type: 'email' },
                        { label: 'Telepon Support', key: 'supportPhone', type: 'tel' },
                    ].map(({ label, key, type }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                            <input type={type} value={(general as any)[key]} onChange={e => setGeneral({ ...general, [key]: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                        </div>
                    ))}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-800 text-sm">Mode Maintenance</p>
                            <p className="text-xs text-gray-500">Nonaktifkan akses tenant sementara</p>
                        </div>
                        <button onClick={() => setGeneral({ ...general, maintenanceMode: !general.maintenanceMode })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${general.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${general.maintenanceMode ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <button onClick={handleSaveGeneral} disabled={saving} className="w-full py-3 rounded-xl bg-[#00bfa5] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                        <Save className="w-4 h-4" /> Simpan Pengaturan
                    </button>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="bg-[#ecf0f3] rounded-2xl p-5 shadow-[5px_5px_10px_#cbced1,-5px_-5px_10px_#ffffff] space-y-4">
                    <h2 className="font-bold text-gray-800">Keamanan & Akses</h2>
                    {[
                        { label: 'Session Timeout (menit)', key: 'sessionTimeoutMinutes', min: 5, max: 1440 },
                        { label: 'Paksa Ganti Password (bulan)', key: 'forcePasswordChangeMonths', min: 1, max: 24 },
                        { label: 'Maks Percobaan Login', key: 'maxLoginAttempts', min: 3, max: 20 },
                    ].map(({ label, key, min, max }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                            <input type="number" min={min} max={max} value={(security as any)[key]}
                                onChange={e => setSecurity({ ...security, [key]: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                        </div>
                    ))}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-800 text-sm">Wajib 2FA</p>
                            <p className="text-xs text-gray-500">Semua superadmin wajib pakai 2FA</p>
                        </div>
                        <button onClick={() => setSecurity({ ...security, require2FA: !security.require2FA })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${security.require2FA ? 'bg-[#00bfa5]' : 'bg-gray-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${security.require2FA ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <button onClick={handleSaveSecurity} disabled={saving} className="w-full py-3 rounded-xl bg-[#00bfa5] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                        <Save className="w-4 h-4" /> Simpan Keamanan
                    </button>
                </div>
            )}

            {/* Staff Tab */}
            {activeTab === 'staff' && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-gray-800">Tim Superadmin</h2>
                        <button onClick={() => setShowAddStaff(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00bfa5] text-white text-xs font-bold shadow-lg">
                            <Plus className="w-3.5 h-3.5" /> Invite
                        </button>
                    </div>
                    {staffList.map(s => (
                        <div key={s.id} className="bg-[#ecf0f3] rounded-xl p-3 shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {s.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                                <p className="text-xs text-gray-500 truncate">{s.email}</p>
                            </div>
                            <button onClick={() => handleDeleteStaff(s.id)} className="p-1.5 rounded-lg bg-red-100 text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {staffList.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Belum ada staff superadmin</div>}

                    {showAddStaff && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
                            <div className="bg-[#ecf0f3] rounded-t-3xl w-full max-w-lg mx-auto p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-800">Invite Superadmin</h3>
                                    <button onClick={() => setShowAddStaff(false)}><X className="w-5 h-5 text-gray-400" /></button>
                                </div>
                                <div className="space-y-3">
                                    {[{ label: 'Nama', value: newStaffName, onChange: setNewStaffName, type: 'text' },
                                    { label: 'Email', value: newStaffEmail, onChange: setNewStaffEmail, type: 'email' }].map(({ label, value, onChange, type }) => (
                                        <div key={label}>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                                            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl bg-[#ecf0f3] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00bfa5] text-gray-800 text-sm" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={() => setShowAddStaff(false)} className="flex-1 py-3 rounded-xl bg-[#ecf0f3] text-gray-600 font-medium shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]">Batal</button>
                                    <button onClick={handleAddStaff} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#00bfa5] text-white font-bold disabled:opacity-50">Invite</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
                <div className="space-y-4">
                    <h2 className="font-bold text-gray-800">Integrasi Payment Gateway</h2>
                    {billingIntegrations.map(integration => (
                        <div key={integration.provider} className="bg-[#ecf0f3] rounded-2xl p-4 shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">{integration.provider}</h3>
                                <button onClick={() => updateBilling(integration.provider, 'enabled', !integration.enabled)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${integration.enabled ? 'bg-[#00bfa5]' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${integration.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {integration.enabled && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
                                        <input type="password" value={integration.apiKey || ''} placeholder="sk_live_..."
                                            onChange={e => updateBilling(integration.provider, 'apiKey', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-gray-800 text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Webhook URL</label>
                                        <input type="url" value={integration.webhookUrl || ''} placeholder="https://..."
                                            onChange={e => updateBilling(integration.provider, 'webhookUrl', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-[#ecf0f3] shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] focus:outline-none text-gray-800 text-xs" />
                                    </div>
                                    <button onClick={() => handleSaveBilling(integration)} disabled={saving}
                                        className="w-full py-2 rounded-xl bg-[#00bfa5] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                                        <Save className="w-3.5 h-3.5" /> Simpan {integration.provider}
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
