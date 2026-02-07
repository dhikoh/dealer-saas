'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBell, faMoon, faSun, faGlobe, faTimes, faCar, faUser, faCalendar, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { useLanguage, Language } from '@/hooks/useLanguage';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    createdAt?: string;
    time?: string;
    read: boolean;
    link?: string;
}

interface SearchResult {
    type: 'vehicle' | 'customer' | 'transaction';
    id: string;
    title: string;
    subtitle: string;
    href: string;
}

export default function Header() {
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showLanguage, setShowLanguage] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const { t, language, setLanguage } = useLanguage();
    const searchRef = useRef<HTMLInputElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const res = await fetch(`${API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Map API response to component format
                const mapped = (data.notifications || []).map((n: any) => ({
                    ...n,
                    time: n.createdAt ? formatTimeAgo(new Date(n.createdAt)) : 'Baru saja',
                }));
                setNotifications(mapped);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    }, []);

    // Format time ago helper
    const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        return `${diffDays} hari lalu`;
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const storedTheme = localStorage.getItem('otohub_theme') as 'light' | 'dark' | null;
        if (storedTheme) {
            setTheme(storedTheme);
            applyTheme(storedTheme);
        }

        // Initial fetch
        fetchNotifications();

        // Keyboard shortcut for search
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(true);
                setTimeout(() => searchRef.current?.focus(), 100);
            }
            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowNotifications(false);
                setShowLanguage(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fetchNotifications]);

    // Refetch when notifications panel opens
    useEffect(() => {
        if (showNotifications) {
            fetchNotifications();
        }
    }, [showNotifications, fetchNotifications]);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setShowLanguage(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const applyTheme = (newTheme: 'light' | 'dark') => {
        const root = document.documentElement;
        if (newTheme === 'dark') {
            root.classList.add('dark');
            document.body.style.backgroundColor = '#1a1d21';
        } else {
            root.classList.remove('dark');
            document.body.style.backgroundColor = '#ecf0f3';
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('otohub_theme', newTheme);
        applyTheme(newTheme);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        // Mock search results - in production, this would call the API
        const mockResults: SearchResult[] = [
            { type: 'vehicle', id: '1', title: 'Toyota Avanza 2024', subtitle: 'B 1234 CD - Rp 250.000.000', href: '/app/inventory' },
            { type: 'vehicle', id: '2', title: 'Honda Jazz RS 2023', subtitle: 'B 5678 EF - Rp 275.000.000', href: '/app/inventory' },
            { type: 'customer', id: '3', title: 'Budi Santoso', subtitle: '081234567890', href: '/app/customers' },
            { type: 'transaction', id: '4', title: 'TRX-2024-001', subtitle: 'Penjualan - Rp 250.000.000', href: '/app/transactions' },
        ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()));

        setSearchResults(mockResults);
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_URL}/notifications/mark-all-read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const LANGUAGES: { code: Language; name: string; flag: string }[] = [
        { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'th', name: 'ไทย', flag: '🇹🇭' },
        { code: 'ph', name: 'Filipino', flag: '🇵🇭' },
        { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    ];

    const getResultIcon = (type: string) => {
        switch (type) {
            case 'vehicle': return faCar;
            case 'customer': return faUser;
            case 'transaction': return faMoneyBill;
            default: return faSearch;
        }
    };

    return (
        <>
            <header className={`fixed top-0 left-64 right-0 h-20 flex items-center justify-between px-8 z-40 backdrop-blur-sm transition-colors ${theme === 'dark' ? 'bg-gray-900/90' : 'bg-[#ecf0f3]/90'
                }`}>
                {/* SEARCH BAR */}
                <div className="flex-1 max-w-xl">
                    <button
                        onClick={() => setShowSearch(true)}
                        className={`w-full h-10 pl-12 pr-4 rounded-full text-sm text-left transition-all flex items-center ${theme === 'dark'
                            ? 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-[#00bfa5]'
                            : 'bg-[#ecf0f3] text-gray-400 shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] hover:shadow-[inset_1px_1px_2px_#cbced1,inset_-1px_-1px_2px_#ffffff]'
                            }`}
                    >
                        <FontAwesomeIcon icon={faSearch} className="absolute left-4 text-gray-400" />
                        <span className="ml-8">{t.searchPlaceholder}</span>
                        <div className={`ml-auto flex items-center gap-1 text-xs border rounded px-1.5 py-0.5 ${theme === 'dark' ? 'text-gray-500 border-gray-600' : 'text-gray-400 border-gray-300'
                            }`}>
                            <span>⌘</span><span>K</span>
                        </div>
                    </button>
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex items-center gap-4">
                    {/* LANGUAGE SELECTOR */}
                    <div className="relative" ref={langRef}>
                        <button
                            onClick={() => setShowLanguage(!showLanguage)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${theme === 'dark'
                                ? 'bg-gray-800 text-gray-400 hover:text-[#00bfa5] border border-gray-700'
                                : 'bg-[#ecf0f3] text-gray-500 hover:text-[#00bfa5] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                                }`}
                        >
                            <FontAwesomeIcon icon={faGlobe} />
                        </button>

                        {showLanguage && (
                            <div className={`absolute right-0 top-12 w-48 rounded-xl shadow-xl overflow-hidden z-50 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                                }`}>
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setLanguage(lang.code);
                                            setShowLanguage(false);
                                        }}
                                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${language === lang.code
                                            ? 'bg-[#00bfa5]/10 text-[#00bfa5]'
                                            : theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="font-medium">{lang.name}</span>
                                        {language === lang.code && <span className="ml-auto">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* THEME TOGGLE */}
                    <div className={`flex items-center rounded-full p-1 ${theme === 'dark'
                        ? 'bg-gray-800 border border-gray-700'
                        : 'bg-[#ecf0f3] shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff]'
                        }`}>
                        <button
                            onClick={() => { if (theme !== 'light') toggleTheme(); }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme === 'light'
                                ? 'text-[#00bfa5] bg-[#ecf0f3] shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff]'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <FontAwesomeIcon icon={faSun} size="sm" />
                        </button>
                        <button
                            onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme === 'dark'
                                ? 'text-[#00bfa5] bg-gray-700'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <FontAwesomeIcon icon={faMoon} size="sm" />
                        </button>
                    </div>

                    {/* NOTIFICATION */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${theme === 'dark'
                                ? 'bg-gray-800 text-gray-400 hover:text-[#00bfa5] border border-gray-700'
                                : 'bg-[#ecf0f3] text-gray-500 hover:text-[#00bfa5] shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff]'
                                }`}
                        >
                            <FontAwesomeIcon icon={faBell} />
                            {unreadCount > 0 && (
                                <span className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center border-2 ${theme === 'dark' ? 'border-gray-800' : 'border-[#ecf0f3]'
                                    }`}>{unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className={`absolute right-0 top-12 w-80 rounded-xl shadow-xl overflow-hidden z-50 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                                }`}>
                                <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                                    }`}>
                                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Notifikasi</h3>
                                    <button
                                        onClick={markAllRead}
                                        className="text-xs text-[#00bfa5] hover:underline"
                                    >
                                        Tandai semua dibaca
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b transition-colors ${!notif.read ? (theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50/50') : ''
                                                } ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-2 ${notif.type === 'warning' ? 'bg-yellow-500' :
                                                    notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                                    }`} />
                                                <div className="flex-1">
                                                    <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{notif.title}</p>
                                                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{notif.message}</p>
                                                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{notif.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Link
                                    href="/app/notifications"
                                    className={`block text-center py-3 text-sm font-medium ${theme === 'dark' ? 'text-[#00bfa5] hover:bg-gray-700' : 'text-[#00bfa5] hover:bg-gray-50'
                                        }`}
                                >
                                    Lihat semua notifikasi
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* USER PROFILE */}
                    <div className={`flex items-center gap-3 pl-4 border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                        }`}>
                        <div className={`w-10 h-10 rounded-full bg-gray-300 overflow-hidden ${theme === 'dark' ? '' : 'shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff]'
                            }`}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=00bfa5&color=fff`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="hidden md:block">
                            <div className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-700'
                                }`}>{user?.name || t.loading}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* GLOBAL SEARCH MODAL */}
            {showSearch && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
                    <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                        }`}>
                        <div className={`flex items-center gap-4 p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Cari kendaraan, customer, transaksi..."
                                className={`flex-1 bg-transparent outline-none text-lg ${theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
                                    }`}
                                autoFocus
                            />
                            <button
                                onClick={() => setShowSearch(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-gray-400" />
                            </button>
                        </div>

                        {searchQuery.length > 0 && (
                            <div className="max-h-96 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    searchResults.map((result) => (
                                        <Link
                                            key={result.id}
                                            href={result.href}
                                            onClick={() => setShowSearch(false)}
                                            className={`flex items-center gap-4 p-4 transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${result.type === 'vehicle' ? 'bg-blue-100 text-blue-600' :
                                                result.type === 'customer' ? 'bg-green-100 text-green-600' :
                                                    'bg-purple-100 text-purple-600'
                                                }`}>
                                                <FontAwesomeIcon icon={getResultIcon(result.type)} />
                                            </div>
                                            <div>
                                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{result.title}</p>
                                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{result.subtitle}</p>
                                            </div>
                                            <span className={`ml-auto text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {result.type === 'vehicle' ? 'Kendaraan' : result.type === 'customer' ? 'Customer' : 'Transaksi'}
                                            </span>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-400">
                                        Tidak ada hasil untuk "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        )}

                        {searchQuery.length === 0 && (
                            <div className={`p-4 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                <p className="mb-2">Pencarian cepat:</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Toyota', 'Honda', 'Tersedia', 'Terjual'].map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => handleSearch(tag)}
                                            className={`px-3 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
