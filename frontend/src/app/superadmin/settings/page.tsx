'use client';

import React from 'react';
import { Users, Shield, Plus, Settings } from 'lucide-react';

const STAFF_LIST = [
    { id: 1, name: 'Budi Santoso', role: 'Staff Finance', status: 'Online', tasks: 12 },
    { id: 2, name: 'Siti Aminah', role: 'Staff Onboarding', status: 'Offline', tasks: 5 },
];

export default function SettingsPage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Settings */}
            <div className="lg:col-span-1 space-y-1">
                <button className="w-full text-left px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-sm transition-colors">General Profile</button>
                <button className="w-full text-left px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm transition-colors">Security & Access</button>
                <button className="w-full text-left px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm transition-colors">Staff Management</button>
                <button className="w-full text-left px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm transition-colors">API Configurations</button>
                <button className="w-full text-left px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm transition-colors">Billing Integrations</button>
            </div>

            {/* Content Settings */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" /> Staff Admin Management
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">Kelola akses untuk staff admin yang membantu operasional harian.</p>

                    <div className="space-y-4">
                        {STAFF_LIST.map(staff => (
                            <div key={staff.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                        {staff.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{staff.name}</p>
                                        <p className="text-xs text-slate-500">{staff.role} • {staff.tasks} Pending Task</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${staff.status === 'Online' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {staff.status}
                                    </span>
                                    <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
                            <Plus className="w-4 h-4" /> Tambah Staff Baru
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" /> Hak Akses Staff (RBAC)
                    </h3>
                    <div className="space-y-3">
                        {[
                            { role: 'Staff Finance', access: 'Invoices, Export Data, Verifikasi Transfer' },
                            { role: 'Staff Onboarding', access: 'Tenant Management, Edit Profil Mitra' },
                        ].map((r, i) => (
                            <div key={i} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="font-medium text-slate-700">{r.role}</span>
                                <span className="text-slate-500">{r.access}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
