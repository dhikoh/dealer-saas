'use client';

import React from 'react';
import { Home, Car, Calculator, User, LayoutGrid } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';

export type MobileTab =
    | 'home' | 'vehicles' | 'credit' | 'profile' | 'more'
    | 'customers' | 'transactions' | 'reports' | 'finance' | 'leasing' | 'settings'
    | 'subscriptions' | 'invoices' | 'plans' | 'users' | 'cms' | 'approvals' | 'activity';


interface Props {
    activeTab: MobileTab;
    onChange: (tab: MobileTab) => void;
    isSuperadmin?: boolean;
}

export default function MobileBottomNav({ activeTab, onChange, isSuperadmin }: Props) {
    const { theme } = useMobileContext();

    const dealerNavItems: { id: MobileTab; icon: React.ReactNode; label: string }[] = [
        { id: 'home', icon: <Home className="h-5 w-5" />, label: 'Home' },
        { id: 'vehicles', icon: <Car className="h-5 w-5" />, label: 'Stok' },
        { id: 'credit', icon: <Calculator className="h-5 w-5" />, label: 'Kredit' },
        { id: 'more', icon: <LayoutGrid className="h-5 w-5" />, label: 'Lainnya' },
        { id: 'profile', icon: <User className="h-5 w-5" />, label: 'Profil' },
    ];

    const superadminNavItems: { id: MobileTab; icon: React.ReactNode; label: string }[] = [
        { id: 'home', icon: <Home className="h-5 w-5" />, label: 'Dashboard' },
        { id: 'vehicles', icon: <Car className="h-5 w-5" />, label: 'Tenant' },
        { id: 'more', icon: <LayoutGrid className="h-5 w-5" />, label: 'Lainnya' },
        { id: 'profile', icon: <User className="h-5 w-5" />, label: 'Profil' },
    ];

    const navItems = isSuperadmin ? superadminNavItems : dealerNavItems;

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] z-40 ${theme.bottomNav}`}
        >
            <div className="flex justify-around items-center px-2 py-3">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const iconColor = isActive ? theme.textHighlight : theme.textMuted;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            className={`flex flex-col items-center justify-center gap-1.5 w-14 h-14 rounded-2xl transition-all active:scale-90 no-select ${isActive ? theme.navActiveBg : ''
                                }`}
                        >
                            <span className={iconColor}>{item.icon}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${iconColor}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
