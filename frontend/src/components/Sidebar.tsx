'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faThLarge,
    faList,
    faCalendarAlt,
    faTags,
    faTruck,
    faGavel,
    faChartLine,
    faExchangeAlt,
    faSearch,
    faCog,
    faQuestionCircle,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

interface MenuItem {
    icon: any;
    label: string;
    href: string;
}

const MENU_ITEMS: MenuItem[] = [
    { icon: faThLarge, label: 'Dashboard', href: '/app' },
    { icon: faList, label: 'Listing', href: '/app/inventory' },
    { icon: faCalendarAlt, label: 'Calendar', href: '/app/calendar' },
    { icon: faTags, label: 'Deals', href: '/app/deals' },
    { icon: faTruck, label: 'Tracking', href: '/app/tracking' },
    { icon: faGavel, label: 'Active Bids', href: '/app/bids' },
    { icon: faChartLine, label: 'Statistics', href: '/app/stats' },
    { icon: faExchangeAlt, label: 'Transaction', href: '/app/transactions' },
];

const OTHER_MENU_ITEMS: MenuItem[] = [
    { icon: faSearch, label: 'Search', href: '/app/search' },
    { icon: faCog, label: 'Settings', href: '/app/settings' },
    { icon: faQuestionCircle, label: 'Help Center', href: '/app/help' },
];

export default function Sidebar() {
    const pathname = usePathname();

    const NavItem = ({ item }: { item: MenuItem }) => {
        const isActive = pathname === item.href;
        return (
            <Link href={item.href}>
                <div className={`
                    flex items-center gap-4 px-5 py-3 mb-2 rounded-xl cursor-pointer transition-all duration-300
                    ${isActive
                        ? 'text-[#00bfa5] shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff]'
                        : 'text-gray-500 hover:text-[#00bfa5] hover:shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                    }
                `}>
                    <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                </div>
            </Link>
        );
    };

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 bg-[#ecf0f3] flex flex-col p-6 shadow-[5px_0_10px_#cbced1] z-50 overflow-y-auto no-scrollbar">
            {/* LOGO AREA */}
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-full bg-[#ecf0f3] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] flex items-center justify-center text-[#00bfa5]">
                    <FontAwesomeIcon icon={faTruck} size="lg" />
                </div>
                <h1 className="text-2xl font-bold text-gray-700 tracking-wide">OTOHUB</h1>
            </div>

            {/* MENU SECTION */}
            <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 px-2 tracking-wider">Menu</h3>
                <nav>
                    {MENU_ITEMS.map((item) => (
                        <NavItem key={item.href} item={item} />
                    ))}
                </nav>
            </div>

            {/* OTHER MENU SECTION */}
            <div className="mb-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 px-2 tracking-wider">Other Menu</h3>
                <nav>
                    {OTHER_MENU_ITEMS.map((item) => (
                        <NavItem key={item.href} item={item} />
                    ))}
                </nav>
            </div>

            {/* LOGOUT BUTTON */}
            <div className="mt-6 border-t border-gray-300 pt-6">
                <button
                    onClick={() => {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('user_info');
                        window.location.href = '/auth';
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-red-500 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] transition-all duration-300"
                >
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    <span className="font-medium text-sm">Log Out</span>
                </button>
            </div>
        </aside>
    );
}
