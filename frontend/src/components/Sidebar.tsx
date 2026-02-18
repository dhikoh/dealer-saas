'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fetchApi } from '@/lib/api';
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
    faWallet,
    faTachometerAlt,

    faBars,
    faTimes,
    faBell,
    faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/hooks/useLanguage';

interface MenuItem {
    icon: any;
    labelKey: keyof ReturnType<typeof useLanguage>['t'];
    href: string;
    premium?: boolean;
    roles?: string[]; // Allowed roles
}

const MENU_ITEMS: MenuItem[] = [
    { icon: faThLarge, labelKey: 'dashboard', href: '/app' },
    { icon: faCar, labelKey: 'listing', href: '/app/inventory' },
    { icon: faMoneyBillWave, labelKey: 'transaction', href: '/app/transactions' },
    { icon: faCreditCard, labelKey: 'credit', href: '/app/credit' },
    { icon: faUsers, labelKey: 'customer', href: '/app/customers' },
    { icon: faCalendarAlt, labelKey: 'calendar', href: '/app/calendar' },
    { icon: faDatabase, labelKey: 'masterData', href: '/app/master' },
    { icon: faWallet, labelKey: 'finance', href: '/app/finance', roles: ['OWNER', 'ADMIN'] },
    { icon: faChartBar, labelKey: 'reports', href: '/app/reports', roles: ['OWNER'] },
    { icon: faTachometerAlt, labelKey: 'statistics', href: '/app/stats', roles: ['OWNER'] },
];

const OTHER_MENU_ITEMS: MenuItem[] = [
    { icon: faUserTie, labelKey: 'staff', href: '/app/staff', roles: ['OWNER', 'ADMIN', 'SUPERADMIN'] },
    { icon: faBuilding, labelKey: 'branch', href: '/app/branches', premium: true, roles: ['OWNER', 'ADMIN', 'SUPERADMIN'] },
    { icon: faReceipt, labelKey: 'billing', href: '/app/billing', roles: ['OWNER', 'SUPERADMIN'] },
    { icon: faBell, labelKey: 'activity', href: '/app/activity', roles: ['OWNER', 'ADMIN', 'SUPERADMIN'] },
    { icon: faUsers, labelKey: 'dealerGroup', href: '/app/settings/dealer-group', roles: ['OWNER', 'SUPERADMIN'] },
    { icon: faCog, labelKey: 'settings', href: '/app/settings', roles: ['OWNER', 'ADMIN', 'SUPERADMIN'] },
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
    const [isHovered, setIsHovered] = useState(false);

    // Use prop or internal state for mobile
    const sidebarOpen = isOpen !== undefined ? isOpen : mobileOpen;
    const toggleSidebar = onToggle || (() => setMobileOpen(!mobileOpen));

    // Desktop: collapsed by default, expanded on hover
    const isExpanded = isHovered;

    useEffect(() => {
        const storedTheme = localStorage.getItem('otohub_theme') as 'light' | 'dark' | null;
        if (storedTheme) setTheme(storedTheme);

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'otohub_theme' && e.newValue) {
                setTheme(e.newValue as 'light' | 'dark');
            }
        };

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
                <div
                    className={`
                        flex items-center gap-4 py-3 mb-1 rounded-xl cursor-pointer
                        ${isExpanded ? 'px-4' : 'px-0 justify-center'}
                        ${isActive
                            ? theme === 'dark'
                                ? 'text-[#00bfa5] bg-gray-700/50'
                                : 'text-[#00bfa5] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                            : theme === 'dark'
                                ? 'text-gray-400 hover:text-[#00bfa5] hover:bg-gray-700/30'
                                : 'text-gray-500 hover:text-[#00bfa5] hover:shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                        }
                    `}
                    style={{ transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                    title={!isExpanded ? String(t[item.labelKey]) : undefined}
                >
                    <FontAwesomeIcon icon={item.icon} className="w-5 h-5 flex-shrink-0" />
                    <span
                        className="font-medium text-sm whitespace-nowrap overflow-hidden"
                        style={{
                            opacity: isExpanded ? 1 : 0,
                            maxWidth: isExpanded ? '160px' : '0px',
                            transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                            transition: 'opacity 0.25s ease, max-width 0.3s ease, transform 0.3s ease',
                        }}
                    >
                        {t[item.labelKey]}
                    </span>
                    {item.premium && isExpanded && (
                        <span
                            className="ml-auto text-[10px] bg-gradient-to-r from-amber-400 to-amber-600 text-white px-2 py-0.5 rounded-full font-bold"
                            style={{
                                opacity: isExpanded ? 1 : 0,
                                transition: 'opacity 0.2s ease 0.1s',
                            }}
                        >
                            PRO
                        </span>
                    )}
                </div>
            </Link>
        );
    };

    const filterByRole = (items: MenuItem[]) => {
        return items.filter(item => {
            if (!item.roles) return true;
            try {
                const userStr = localStorage.getItem('user_info');
                if (!userStr) return false;
                const user = JSON.parse(userStr || '{}');
                return item.roles.includes(user.role?.toUpperCase());
            } catch {
                return false;
            }
        });
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
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    h-screen fixed left-0 top-0 flex flex-col z-50 overflow-y-auto no-scrollbar overflow-x-hidden
                    ${theme === 'dark'
                        ? 'bg-gray-900 border-r border-gray-800'
                        : 'bg-[#ecf0f3]'
                    }
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
                style={{
                    width: sidebarOpen ? '256px' : (isExpanded ? '256px' : '72px'),
                    padding: isExpanded || sidebarOpen ? '24px' : '24px 12px',
                    transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), padding 0.3s ease, box-shadow 0.3s ease',
                    boxShadow: isExpanded
                        ? theme === 'dark'
                            ? '8px 0 30px rgba(0,0,0,0.5)'
                            : '8px 0 30px rgba(0,0,0,0.1)'
                        : theme === 'dark'
                            ? 'none'
                            : '5px 0 10px #cbced1',
                }}
            >
                {/* LOGO AREA */}
                <div className="flex items-center gap-3 mb-10 px-2" style={{ minHeight: '40px' }}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[#00bfa5] flex-shrink-0 ${theme === 'dark'
                        ? 'bg-gray-800 border border-gray-700'
                        : 'bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                        }`}>
                        <FontAwesomeIcon icon={faCar} size="lg" />
                    </div>
                    <h1
                        className={`text-2xl font-bold tracking-wide whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}
                        style={{
                            opacity: isExpanded ? 1 : 0,
                            maxWidth: isExpanded ? '200px' : '0px',
                            transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                            transition: 'opacity 0.25s ease 0.1s, max-width 0.3s ease, transform 0.3s ease',
                            overflow: 'hidden',
                        }}
                    >
                        OTOHUB
                    </h1>
                </div>

                {/* MENU SECTION */}
                <div className="mb-6">
                    <h3
                        className={`text-xs font-bold uppercase mb-4 px-2 tracking-wider whitespace-nowrap ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                        style={{
                            opacity: isExpanded ? 1 : 0,
                            maxHeight: isExpanded ? '20px' : '0px',
                            marginBottom: isExpanded ? '16px' : '8px',
                            transition: 'opacity 0.2s ease, max-height 0.3s ease, margin 0.3s ease',
                            overflow: 'hidden',
                        }}
                    >
                        {t.menu}
                    </h3>
                    <nav>
                        {filterByRole(MENU_ITEMS).map((item) => (
                            <NavItem key={item.href} item={item} />
                        ))}
                    </nav>
                </div>

                {/* OTHER MENU SECTION */}
                <div className="mb-auto">
                    <h3
                        className={`text-xs font-bold uppercase mb-4 px-2 tracking-wider whitespace-nowrap ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                        style={{
                            opacity: isExpanded ? 1 : 0,
                            maxHeight: isExpanded ? '20px' : '0px',
                            marginBottom: isExpanded ? '16px' : '8px',
                            transition: 'opacity 0.2s ease, max-height 0.3s ease, margin 0.3s ease',
                            overflow: 'hidden',
                        }}
                    >
                        {t.otherMenu}
                    </h3>
                    <nav>
                        {filterByRole(OTHER_MENU_ITEMS).map((item) => (
                            <NavItem key={item.href} item={item} />
                        ))}
                    </nav>
                </div>

                {/* LOGOUT BUTTON */}
                <div className={`mt-6 pt-6 ${theme === 'dark' ? 'border-t border-gray-800' : 'border-t border-gray-300'}`}>
                    <button
                        onClick={async () => {
                            const refreshToken = localStorage.getItem('refresh_token');

                            if (refreshToken) {
                                try {
                                    await fetchApi('/auth/logout', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ refresh_token: refreshToken }),
                                    });
                                } catch { /* ignore */ }
                            }

                            localStorage.removeItem('access_token');
                            localStorage.removeItem('refresh_token');
                            localStorage.removeItem('user_info');
                            document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.modula.click; secure; samesite=none';

                            window.location.href = '/auth';
                        }}
                        className={`w-full flex items-center gap-3 py-3 rounded-xl text-red-500 ${isExpanded ? 'px-4' : 'justify-center px-0'}`}
                        style={{ transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                        title={!isExpanded ? String(t.logout) : undefined}
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} className="flex-shrink-0" />
                        <span
                            className="font-medium text-sm whitespace-nowrap overflow-hidden"
                            style={{
                                opacity: isExpanded ? 1 : 0,
                                maxWidth: isExpanded ? '100px' : '0px',
                                transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                                transition: 'opacity 0.25s ease, max-width 0.3s ease, transform 0.3s ease',
                            }}
                        >
                            {t.logout}
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
