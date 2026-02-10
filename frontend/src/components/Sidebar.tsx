'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faThLarge,
    faCar,
    faMoneyBillWave,
    faCreditCard,
    faUsers,
    faDatabase,
    faChartBar,
    faUserTie,
    faBuilding,
    faCog,
    faQuestionCircle,
    faSignOutAlt,
    faReceipt,
    faCalendarAlt,
    faBars,
    faTimes,
    faBell,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';

interface MenuItem {
    icon: any;
    labelKey: keyof ReturnType<typeof useLanguage>['t'];
    href: string;
    premium?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
    { icon: faThLarge, labelKey: 'dashboard', href: '/app' },
    { icon: faCar, labelKey: 'listing', href: '/app/inventory' },
    { icon: faMoneyBillWave, labelKey: 'transaction', href: '/app/transactions' },
    { icon: faCreditCard, labelKey: 'credit', href: '/app/credit' },
    { icon: faUsers, labelKey: 'customer', href: '/app/customers' },
    { icon: faCalendarAlt, labelKey: 'calendar', href: '/app/calendar' },
    { icon: faDatabase, labelKey: 'masterData', href: '/app/master' },
    { icon: faChartBar, labelKey: 'reports', href: '/app/reports' },
];

const OTHER_MENU_ITEMS: MenuItem[] = [
    { icon: faUserTie, labelKey: 'staff', href: '/app/staff' },
    { icon: faBuilding, labelKey: 'branch', href: '/app/branches', premium: true },
    { icon: faReceipt, labelKey: 'billing', href: '/app/billing' },
    { icon: faBell, labelKey: 'activity', href: '/app/activity' },
    { icon: faUsers, labelKey: 'dealerGroup', href: '/app/settings/dealer-group' },
    { icon: faCog, labelKey: 'settings', href: '/app/settings' },
    { icon: faQuestionCircle, labelKey: 'helpCenter', href: '/app/help' },
];

interface SidebarProps {
    isOpen?: boolean;
    onToggle?: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mobileOpen, setMobileOpen] = useState(false);

    // Use prop or internal state for mobile
    const sidebarOpen = isOpen !== undefined ? isOpen : mobileOpen;
    const toggleSidebar = onToggle || (() => setMobileOpen(!mobileOpen));

    useEffect(() => {
        const storedTheme = localStorage.getItem('otohub_theme') as 'light' | 'dark' | null;
        if (storedTheme) setTheme(storedTheme);

        // Listen for theme changes from other components via storage events
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'otohub_theme' && e.newValue) {
                setTheme(e.newValue as 'light' | 'dark');
            }
        };

        // Also listen for custom theme change events within the same tab
        const handleCustomTheme = () => {
            const currentTheme = localStorage.getItem('otohub_theme') as 'light' | 'dark' | null;
            if (currentTheme && currentTheme !== theme) {
                setTheme(currentTheme);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('otohub-theme-change', handleCustomTheme);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('otohub-theme-change', handleCustomTheme);
        };
    }, [theme]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const NavItem = ({ item }: { item: MenuItem }) => {
        const isActive = pathname === item.href;
        return (
            <Link href={item.href} onClick={() => setMobileOpen(false)}>
                <div className={`
                    flex items-center gap-4 px-5 py-3 mb-2 rounded-xl cursor-pointer transition-all duration-300
                    ${isActive
                        ? theme === 'dark'
                            ? 'text-[#00bfa5] bg-gray-700/50'
                            : 'text-[#00bfa5] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                        : theme === 'dark'
                            ? 'text-gray-400 hover:text-[#00bfa5] hover:bg-gray-700/30'
                            : 'text-gray-500 hover:text-[#00bfa5] hover:shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                    }
                `}>
                    <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                    <span className="font-medium text-sm">{t[item.labelKey]}</span>
                    {item.premium && (
                        <span className="ml-auto text-[10px] bg-gradient-to-r from-amber-400 to-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
                            PRO
                        </span>
                    )}
                </div>
            </Link>
        );
    };

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={toggleSidebar}
                className={`lg:hidden fixed top-4 left-4 z-[60] p-3 rounded-xl transition-all ${theme === 'dark'
                    ? 'bg-gray-800 text-white'
                    : 'bg-[#ecf0f3] text-gray-700 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                    }`}
            >
                <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} className="w-5 h-5" />
            </button>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 h-screen fixed left-0 top-0 flex flex-col p-6 z-50 overflow-y-auto no-scrollbar transition-all duration-300
                ${theme === 'dark'
                    ? 'bg-gray-900 border-r border-gray-800'
                    : 'bg-[#ecf0f3] shadow-[5px_0_10px_#cbced1]'
                }
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* LOGO AREA */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[#00bfa5] ${theme === 'dark'
                        ? 'bg-gray-800 border border-gray-700'
                        : 'bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                        }`}>
                        <FontAwesomeIcon icon={faCar} size="lg" />
                    </div>
                    <h1 className={`text-2xl font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                        OTOHUB
                    </h1>
                </div>

                {/* MENU SECTION */}
                <div className="mb-6">
                    <h3 className={`text-xs font-bold uppercase mb-4 px-2 tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t.menu}
                    </h3>
                    <nav>
                        {MENU_ITEMS.map((item) => (
                            <NavItem key={item.href} item={item} />
                        ))}
                    </nav>
                </div>

                {/* OTHER MENU SECTION */}
                <div className="mb-auto">
                    <h3 className={`text-xs font-bold uppercase mb-4 px-2 tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {t.otherMenu}
                    </h3>
                    <nav>
                        {OTHER_MENU_ITEMS.map((item) => (
                            <NavItem key={item.href} item={item} />
                        ))}
                    </nav>
                </div>

                {/* LOGOUT BUTTON */}
                <div className={`mt-6 pt-6 ${theme === 'dark' ? 'border-t border-gray-800' : 'border-t border-gray-300'}`}>
                    <button
                        onClick={async () => {
                            // Invalidate refresh token on server
                            const refreshToken = localStorage.getItem('refresh_token');
                            const accessToken = localStorage.getItem('access_token');
                            if (refreshToken) {
                                try {
                                    await fetch(`${(await import('@/lib/api')).API_URL}/auth/logout`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                                        },
                                        body: JSON.stringify({ refresh_token: refreshToken }),
                                    });
                                } catch { /* ignore */ }
                            }
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('refresh_token');
                            localStorage.removeItem('user_info');
                            document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                            window.location.href = '/auth';
                        }}
                        className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-red-500 transition-all duration-300 ${theme === 'dark'
                            ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                            : 'shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff]'
                            }`}
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        <span className="font-medium text-sm">{t.logout}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
