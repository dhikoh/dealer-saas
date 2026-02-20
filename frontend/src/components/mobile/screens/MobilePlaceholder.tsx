'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';

const TAB_LABELS: Record<string, string> = {
    reports: 'Laporan',
    finance: 'Keuangan',
    leasing: 'Leasing',
    settings: 'Pengaturan',
    subscriptions: 'Langganan',
    invoices: 'Tagihan',
    plans: 'Paket Harga',
    users: 'Pengguna',
    cms: 'CMS',
    approvals: 'Persetujuan',
    activity: 'Aktivitas',
};

export default function MobilePlaceholder({ tabId }: { tabId: string }) {
    const { theme } = useMobileContext();
    const label = TAB_LABELS[tabId] ?? tabId.replace(/_/g, ' ');

    return (
        <div className={`min-h-full ${theme.bgFrame} flex flex-col no-select`}>
            <div className={`${theme.bgHeader} pt-12 pb-4 px-6 sticky top-0 z-10`}>
                <h2 className={`text-2xl font-black ${theme.textMain} capitalize`}>{label}</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 ${theme.iconContainer}`}>
                    <AlertCircle className="h-10 w-10 opacity-50" />
                </div>
                <h3 className={`text-xl font-black tracking-tight mb-3 ${theme.textMain}`}>Segera Hadir</h3>
                <p className={`text-sm font-bold leading-relaxed ${theme.textMuted}`}>
                    Modul <span className={theme.textHighlight}>{label}</span> sedang dioptimalkan untuk tampilan mobile.
                    Silakan akses fitur ini melalui aplikasi web utama.
                </p>
            </div>
        </div>
    );
}
