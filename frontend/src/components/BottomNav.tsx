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

// Combined menu items for the bottom nav
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
    { icon: faUserTie, labelKey: 'staff', href: '/app/staff', roles: ['OWNER', 'ADMIN', 'SUPERADMIN'] },
    { icon: faBuilding, labelKey: 'branch', href: '/app/branches', premium: true, roles: ['OWNER', 'ADMIN', 'SUPERADMIN'] },
    { icon: faReceipt, labelKey: 'billing', href: '/app/billing', roles: ['OWNER', 'SUPERADMIN'] },
    { icon: faBell, labelKey: 'activity', href: '/app/activity', roles: ['OWNER', 'ADMIN', 'SUPERADMIN'] },
    { icon: faUsers, labelKey: 'dealerGroup', href: '/app/settings/dealer-group', roles: ['OWNER', 'SUPERADMIN'] },
    { icon: faCog, labelKey: 'settings', href: '/app/settings', roles: ['OWNER', 'ADMIN', 'SUPERADMIN'] },
    { icon: faQuestionCircle, labelKey: 'helpCenter', href: '/app/help' },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isLogoutHovered, setIsLogoutHovered] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user_info');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserRole(user.role?.toUpperCase());
            } catch {
                // ignore
            }
        }
    }, []);

    const filterByRole = (items: MenuItem[]) => {
        return items.filter(item => {
            if (!item.roles) return true;
            if (!userRole) return false;
            return item.roles.includes(userRole);
        });
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            try {
                await fetchApi('/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
            } catch { /* ignore */ }
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        // Clear cookie manually just in case
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.modula.click; secure; samesite=none';
        window.location.href = '/auth';
    };

    const filteredItems = filterByRole(MENU_ITEMS);

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-[95vw]">
            {/* Glassmorphism Container */}
            <div
                className="flex items-center gap-2 px-2 py-2 rounded-full bg-gray-900/80 backdrop-blur-md border border-white/10 shadow-2xl overflow-x-auto no-scrollbar"
                style={{
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                }}
            >
                {filteredItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    const isItemHovered = hoveredIndex === index;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div
                                className={`
                                    relative flex items-center justify-center h-10 rounded-full cursor-pointer overflow-hidden
                                    ${isActive
                                        ? 'bg-[#00bfa5] text-white'
                                        : 'bg-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                                    }
                                `}
                                style={{
                                    // Use explicit flex-basis or width transition
                                    width: isItemHovered ? 'auto' : '40px',
                                    minWidth: '40px',
                                    paddingLeft: isItemHovered ? '12px' : '0',
                                    paddingRight: isItemHovered ? '16px' : '0',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy effect
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={item.icon}
                                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isItemHovered ? 'scale-110' : 'scale-100'}`}
                                />

                                <span
                                    className="font-medium text-xs whitespace-nowrap overflow-hidden"
                                    style={{
                                        maxWidth: isItemHovered ? '200px' : '0px',
                                        opacity: isItemHovered ? 1 : 0,
                                        marginLeft: isItemHovered ? '8px' : '0px',
                                        transform: isItemHovered ? 'translateY(0)' : 'translateY(10px)',
                                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    }}
                                >
                                    {t[item.labelKey]}
                                </span>
                            </div>
                        </Link>
                    );
                })}

                {/* Separator */}
                <div className="w-px h-6 bg-white/20 mx-1 flex-shrink-0" />

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    onMouseEnter={() => setIsLogoutHovered(true)}
                    onMouseLeave={() => setIsLogoutHovered(false)}
                    className="relative flex items-center justify-center h-10 rounded-full cursor-pointer overflow-hidden bg-transparent text-red-400 hover:bg-red-500/20 hover:text-red-500"
                    style={{
                        width: isLogoutHovered ? 'auto' : '40px',
                        minWidth: '40px',
                        paddingLeft: isLogoutHovered ? '12px' : '0',
                        paddingRight: isLogoutHovered ? '16px' : '0',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}
                >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 flex-shrink-0" />
                    <span
                        className="font-medium text-xs whitespace-nowrap overflow-hidden"
                        style={{
                            maxWidth: isLogoutHovered ? '100px' : '0px',
                            opacity: isLogoutHovered ? 1 : 0,
                            marginLeft: isLogoutHovered ? '8px' : '0px',
                            transform: isLogoutHovered ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        }}
                    >
                        {t.logout}
                    </span>
                </button>
            </div>
        </div>
    );
}
