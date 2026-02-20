'use client';

import React from 'react';
import { X, FileText, Users, TrendingUp, HandCoins, CreditCard, Settings, CheckCircle, LayoutDashboard, Building2 } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';
import type { MobileTab } from './MobileBottomNav';

interface MoreBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onChangeTab: (tab: MobileTab) => void;
    isSuperadmin?: boolean;
}

interface SheetItem {
    id: MobileTab;
    icon: React.ReactNode;
    label: string;
    subtitle: string;
}

export default function MoreBottomSheet({ isOpen, onClose, onChangeTab, isSuperadmin }: MoreBottomSheetProps) {
    const { theme } = useMobileContext();

    const dealerItems: SheetItem[] = [
        { id: 'customers', icon: <Users className="h-5 w-5" />, label: 'Pelanggan', subtitle: 'Kelola data pelanggan' },
        { id: 'transactions', icon: <FileText className="h-5 w-5" />, label: 'Transaksi', subtitle: 'Riwayat & buat transaksi' },
        { id: 'reports', icon: <TrendingUp className="h-5 w-5" />, label: 'Laporan', subtitle: 'Laporan penjualan' },
        { id: 'finance', icon: <HandCoins className="h-5 w-5" />, label: 'Keuangan', subtitle: 'Manajemen keuangan' },
        { id: 'leasing', icon: <CreditCard className="h-5 w-5" />, label: 'Leasing', subtitle: 'Data perusahaan leasing' },
        { id: 'settings', icon: <Settings className="h-5 w-5" />, label: 'Pengaturan', subtitle: 'Konfigurasi sistem' },
    ];

    const superadminItems: SheetItem[] = [
        { id: 'subscriptions', icon: <CheckCircle className="h-5 w-5" />, label: 'Langganan', subtitle: 'Kelola paket berlangganan' },
        { id: 'invoices', icon: <FileText className="h-5 w-5" />, label: 'Tagihan', subtitle: 'Invoice global platform' },
        { id: 'plans', icon: <TrendingUp className="h-5 w-5" />, label: 'Paket Harga', subtitle: 'Atur pricing plan' },
        { id: 'users', icon: <Users className="h-5 w-5" />, label: 'Pengguna', subtitle: 'Manajemen user global' },
        { id: 'cms', icon: <LayoutDashboard className="h-5 w-5" />, label: 'CMS', subtitle: 'Konten dan landing page' },
        { id: 'settings', icon: <Settings className="h-5 w-5" />, label: 'Pengaturan', subtitle: 'Konfigurasi platform' },
    ];

    const items = isSuperadmin ? superadminItems : dealerItems;

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-[80] backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            <div className={`fixed bottom-0 left-0 right-0 z-[90] ${theme.drawerBg} rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] animate-slide-up-modal`}>
                <div className="w-full flex justify-center pt-4 pb-2">
                    <div className={`w-12 h-1.5 rounded-full ${theme.name === 'dark-neu' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                </div>

                <div className="px-6 pb-4 flex justify-between items-center">
                    <h2 className={`text-xl font-black ${theme.textMain}`}>
                        {isSuperadmin ? 'Menu Superadmin' : 'Menu Lainnya'}
                    </h2>
                    <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.iconContainer}`}>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-5 pb-[calc(2rem+env(safe-area-inset-bottom,20px))] grid grid-cols-3 gap-4">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { onChangeTab(item.id as MobileTab); onClose(); }}
                            className={`flex flex-col items-center gap-3 py-5 rounded-2xl active:scale-95 transition-all no-select ${theme.drawerItem}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.iconContainer}`}>
                                {item.icon}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest text-center ${theme.textMain}`}>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
