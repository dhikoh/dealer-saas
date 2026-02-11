'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard, Users, CreditCard, FileText, Settings, Bell,
    ChevronLeft, ChevronRight, LogOut, Check, CheckCheck, X,
    ShieldCheck, Activity, Globe
} from 'lucide-react';
import { API_URL } from '@/lib/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/superadmin' },
    { id: 'tenants', label: 'Tenants', icon: Users, href: '/superadmin/tenants' },
    { id: 'plans', label: 'Plan Tiers', icon: CreditCard, href: '/superadmin/plans' },
    { id: 'invoices', label: 'Invoices & Billing', icon: FileText, href: '/superadmin/invoices' },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck, href: '/superadmin/approvals' },
    { id: 'cms', label: 'CMS / Landing', icon: Globe, href: '/superadmin/cms' },
    { id: 'activity', label: 'Activity Log', icon: Activity, href: '/superadmin/activity' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/superadmin/settings' },
];

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

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
                if (user.role !== 'SUPERADMIN') {
                    router.push('/app');
                    return;
                }
                setMounted(true);
            } catch {
                router.push('/auth');
            }
        } else {
            router.push('/auth');
        }
    }, [router]);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/notifications?limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [mounted, fetchNotifications]);

    // Close notif when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* ignore */ }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        router.push('/auth');
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return 'Baru saja';
        if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h lalu`;
        return `${Math.floor(diff / 86400)}d lalu`;
    };

    if (!mounted) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* SIDEBAR */}
            <aside className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 shadow-sm z-30 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">O</div>
                            <span className="font-bold text-slate-900">OTOHUB</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Admin</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                {/* Nav */}
                <nav className="p-3 space-y-1">
                    {menuItems.map(item => {
                        const isActive = pathname === item.href || (item.href !== '/superadmin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-4 left-0 right-0 px-3">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-600 hover:bg-rose-50 w-full transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut className="w-5 h-5" />
                        {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                {/* HEADER */}
                <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">
                            {menuItems.find(m => m.href === pathname || (m.href !== '/superadmin' && pathname.startsWith(m.href)))?.label || 'Superadmin'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* NOTIFICATION BELL */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* NOTIFICATION DROPDOWN */}
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="font-semibold text-slate-900">Notifikasi</h3>
                                        <div className="flex items-center gap-2">
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                                    <CheckCheck className="w-3.5 h-3.5" /> Tandai semua dibaca
                                                </button>
                                            )}
                                            <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-100 rounded">
                                                <X className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                        {notifications.length > 0 ? (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-indigo-50/50' : ''}`}
                                                    onClick={() => !n.isRead && markAsRead(n.id)}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm ${!n.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                                {n.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                        </div>
                                                        {!n.isRead && (
                                                            <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5 ml-2" />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-1">{getTimeAgo(n.createdAt)}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400">
                                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">Belum ada notifikasi</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User avatar */}
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            SA
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
