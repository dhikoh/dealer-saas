'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    Bell,
    MoreHorizontal,
    LogOut,
    CreditCard
} from 'lucide-react';

export default function SuperadminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const userInfoStr = localStorage.getItem('user_info');

        if (!token) {
            router.push('/auth');
            return;
        }

        if (userInfoStr) {
            try {
                const user = JSON.parse(userInfoStr);

                // Only SUPERADMIN can access this layout
                if (user.role !== 'SUPERADMIN') {
                    router.push('/app');
                    return;
                }

                setMounted(true);
            } catch (e) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_info');
                router.push('/auth');
            }
        } else {
            localStorage.removeItem('access_token');
            router.push('/auth');
        }
    }, [router]);

    const menuItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/superadmin' },
        { id: 'tenants', label: 'Tenants', icon: Users, href: '/superadmin/tenants' },
        { id: 'plans', label: 'Plan Tiers', icon: CreditCard, href: '/superadmin/plans' },
        { id: 'invoices', label: 'Invoices & Billing', icon: FileText, href: '/superadmin/invoices' },
        { id: 'settings', label: 'Settings', icon: Settings, href: '/superadmin/settings' },
    ];

    const isActive = (href: string) => {
        if (href === '/superadmin' && pathname === '/superadmin') return true;
        if (href !== '/superadmin' && pathname.startsWith(href)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; // Clear auth cookie
        router.push('/auth');
    };

    if (!mounted) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
            {/* SIDEBAR */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed h-full z-10 lg:relative shadow-sm`}>
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-3 shadow-indigo-200 shadow-md">
                        <span className="text-white font-bold">S</span>
                    </div>
                    {sidebarOpen && <span className="font-bold text-xl text-slate-800 tracking-tight">SaaS Admin</span>}
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive(item.href)
                                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold border border-slate-300">
                            SA
                        </div>
                        {sidebarOpen && (
                            <div className="overflow-hidden text-left">
                                <p className="text-sm font-medium text-slate-900 truncate">Super Admin</p>
                                <p className="text-xs text-slate-500 truncate">admin@farm-saas.com</p>
                            </div>
                        )}
                        {sidebarOpen && (
                            <button onClick={handleLogout} className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-6 flex-shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden transition-colors">
                            <MoreHorizontal className="w-5 h-5 text-slate-600" />
                        </button>
                        <h1 className="text-xl font-semibold text-slate-800 capitalize hidden sm:block">
                            {pathname === '/superadmin' ? 'Dashboard Overview' : pathname.replace('/superadmin/', '').replace('-', ' ')}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full relative transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                        </button>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-indigo-600 tracking-wider">ROLE: SUPER ADMIN</p>
                            <p className="text-[10px] text-slate-400">Manage all staff & system</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto bg-slate-50 p-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-fadeIn">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
