'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBell, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

export default function Header() {
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <header className="fixed top-0 left-64 right-0 h-20 bg-[#ecf0f3] flex items-center justify-between px-8 z-40 bg-opacity-90 backdrop-blur-sm">
            {/* SEARCH BAR */}
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Type here to search..."
                        className="w-full bg-[#ecf0f3] h-10 pl-12 pr-4 rounded-full text-sm text-gray-600 outline-none
                                   shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff]
                                   focus:shadow-[inset_1px_1px_2px_#cbced1,inset_-1px_-1px_2px_#ffffff] transition-all"
                    />
                    <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#00bfa5] transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400 border border-gray-300 rounded px-1.5 py-0.5">
                        <span>⌘</span><span>K</span>
                    </div>
                </div>
            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-6">
                {/* THEME TOGGLE (Visual Only for now) */}
                <div className="flex items-center bg-[#ecf0f3] rounded-full p-1 shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff]">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#00bfa5] bg-[#ecf0f3] shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff]">
                        <FontAwesomeIcon icon={faSun} size="sm" />
                    </button>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <FontAwesomeIcon icon={faMoon} size="sm" />
                    </button>
                </div>

                {/* NOTIFICATION */}
                <button className="w-10 h-10 rounded-full bg-[#ecf0f3] flex items-center justify-center text-gray-500 shadow-[3px_3px_6px_#cbced1,-3px_-3px_6px_#ffffff] hover:text-[#00bfa5] active:shadow-[inset_2px_2px_5px_#cbced1,inset_-2px_-2px_5px_#ffffff] transition-all relative">
                    <FontAwesomeIcon icon={faBell} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#ecf0f3]"></span>
                </button>

                {/* USER PROFILE */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-300">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff]">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=00bfa5&color=fff`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="hidden md:block">
                        <div className="text-sm font-bold text-gray-700 leading-tight">{user?.name || 'Loading...'}</div>
                        <div className="text-xs text-gray-500">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                    </div>
                </div>
            </div>
        </header>
    );
}
