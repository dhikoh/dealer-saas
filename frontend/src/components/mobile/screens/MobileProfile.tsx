'use client';

import React from 'react';
import { User, Moon, Sun, LogOut, ChevronRight, Settings, TrendingUp, Phone } from 'lucide-react';
import { useMobileContext } from '@/context/MobileContext';

interface Props {
    user: { name?: string; email?: string; role?: string; tenant?: { name?: string };[key: string]: unknown };
    onLogout: () => void;
    onTabChange?: (tab: any) => void;
}

export default function MobileProfile({ user, onLogout, onTabChange }: Props) {
    const { theme, themeMode, setThemeMode } = useMobileContext();

    const displayName = (user?.name as string) ?? 'User';
    const email = (user?.email as string) ?? '';
    const role = user?.role ?? '';
    const tenantName = (user?.tenant as { name?: string })?.name ?? '';
    const initial = displayName.charAt(0).toUpperCase();
    const isSuperadmin = role === 'SUPERADMIN';

    const menuItems = [
        { icon: <User className="h-4 w-4" />, label: 'Data Pribadi', tabId: 'settings' },
        { icon: <Settings className="h-4 w-4" />, label: 'Pengaturan', tabId: 'settings' },
        ...(!isSuperadmin ? [{ icon: <TrendingUp className="h-4 w-4" />, label: 'Langganan', tabId: 'subscriptions' }] : []),
    ];

    return (
        <div className={`min-h-full ${theme.bgFrame} no-select`}>
            {/* Header */}
            <div className={`${theme.bgHeader} pt-12 pb-2 px-6 sticky top-0 z-10`}>
                <h2 className={`text-2xl font-black ${theme.textMain}`}>Profil</h2>
            </div>

            {/* Avatar and Info */}
            <div className="px-6 py-8 flex flex-col items-center text-center">
                <div className={`w-28 h-28 rounded-full mb-6 flex items-center justify-center font-black text-5xl ${theme.iconContainer}`}>
                    {initial}
                </div>
                <h2 className={`text-2xl font-black tracking-tight ${theme.textMain}`}>{displayName}</h2>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>{email}</p>
                {tenantName && (
                    <div className={`mt-3 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${theme.btnSecondary}`}>
                        {tenantName}
                    </div>
                )}
                {role && (
                    <div className={`mt-2 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${theme.iconContainer}`}>
                        {role}
                    </div>
                )}
            </div>

            <div className="px-6 space-y-6">
                {/* Theme Toggle */}
                <div>
                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 pl-2 ${theme.textMuted}`}>Tampilan Tema</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { mode: 'light-neu' as const, icon: <Sun className="h-6 w-6" />, label: 'Light' },
                            { mode: 'dark-neu' as const, icon: <Moon className="h-6 w-6" />, label: 'Dark' },
                        ].map(t => (
                            <button
                                key={t.mode}
                                onClick={() => setThemeMode(t.mode)}
                                className={`flex flex-col items-center justify-center gap-3 py-5 rounded-2xl transition-all ${themeMode === t.mode ? theme.btnPrimary : theme.drawerItem}`}
                            >
                                {t.icon}
                                <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu */}
                <div>
                    <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 pl-2 ${theme.textMuted}`}>Pengaturan Akun</h3>
                    <div className={`${theme.bgCard} p-2`}>
                        {menuItems.map((item, idx) => (
                            <button
                                key={item.label}
                                onClick={() => onTabChange && onTabChange(item.tabId)}
                                className={`w-full flex items-center justify-between p-4 transition-colors ${idx < menuItems.length - 1 ? `border-b ${theme.divider}` : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme.iconContainer}`}>
                                        {item.icon}
                                    </div>
                                    <span className={`font-black text-sm ${theme.textMain}`}>{item.label}</span>
                                </div>
                                <ChevronRight className={`h-4 w-4 ${theme.textMuted}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className={`w-full py-4 mt-2 text-sm uppercase tracking-widest font-black rounded-2xl flex items-center justify-center gap-3 ${theme.bgCard} text-red-500 active:scale-95 transition-all`}
                >
                    <LogOut className="h-5 w-5" />
                    Keluar
                </button>
            </div>
        </div>
    );
}
