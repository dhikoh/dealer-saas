'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light-neu' | 'dark-neu';

interface MobileContextProps {
    isMobileView: boolean;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    // Neumorphic Theme Tokens
    theme: {
        name: string;
        bgApp: string;
        bgFrame: string;
        bgCard: string;
        bgInput: string;
        bgHeader: string;
        textMain: string;
        textMuted: string;
        textHighlight: string;
        iconContainer: string;
        bottomNav: string;
        fab: string;
        btnPrimary: string;
        btnSecondary: string;
        navActiveBg: string;
        drawerBg: string; // TBD if we replace with bottom sheet
        drawerItem: string;
        divider: string;
        imagePlaceholder: string;
    };
}

const MobileContext = createContext<MobileContextProps | undefined>(undefined);

export const getTheme = (mode: ThemeMode) => {
    if (mode === 'dark-neu') {
        return {
            name: 'dark-neu',
            bgApp: 'bg-black',
            bgFrame: 'bg-[#2A2D32]',
            bgCard: 'bg-[#2A2D32] shadow-[6px_6px_14px_#1c1e22,-6px_-6px_14px_#383c42] rounded-3xl',
            bgInput: 'bg-[#2A2D32] shadow-[inset_4px_4px_8px_#1c1e22,inset_-4px_-4px_8px_#383c42] text-gray-200 placeholder-gray-500',
            bgHeader: 'bg-[#2A2D32]',
            textMain: 'text-gray-100',
            textMuted: 'text-gray-400',
            textHighlight: 'text-blue-400',
            iconContainer: 'bg-[#2A2D32] shadow-[4px_4px_8px_#1c1e22,-4px_-4px_8px_#383c42] text-blue-400',
            bottomNav: 'bg-[#2A2D32]/85 backdrop-blur-2xl border-t border-white/5 shadow-[0_-20px_40px_-10px_rgba(15,16,18,0.8)]',
            fab: 'bg-[#2A2D32] text-blue-400 shadow-[6px_6px_12px_#1c1e22,-6px_-6px_12px_#383c42]',
            btnPrimary: 'bg-[#2A2D32] text-blue-400 font-bold shadow-[6px_6px_12px_#1c1e22,-6px_-6px_12px_#383c42] rounded-2xl active:shadow-[inset_4px_4px_8px_#1c1e22,inset_-4px_-4px_8px_#383c42] transition-all',
            btnSecondary: 'bg-[#2A2D32] text-gray-300 font-bold shadow-[4px_4px_8px_#1c1e22,-4px_-4px_8px_#383c42] rounded-xl active:shadow-[inset_4px_4px_8px_#1c1e22,inset_-4px_-4px_8px_#383c42] transition-all',
            navActiveBg: 'shadow-[inset_4px_4px_8px_#1c1e22,inset_-4px_-4px_8px_#383c42] text-blue-400',
            drawerBg: 'bg-[#2A2D32]', // Used for BottomSheet
            drawerItem: 'shadow-[4px_4px_10px_#1c1e22,-4px_-4px_10px_#383c42] text-gray-300',
            divider: 'border-gray-600/30',
            imagePlaceholder: 'bg-[#2A2D32] shadow-[inset_4px_4px_8px_#1c1e22,inset_-4px_-4px_8px_#383c42]'
        };
    }
    // light-neu
    return {
        name: 'light-neu',
        bgApp: 'bg-gray-300',
        bgFrame: 'bg-[#E0E5EC]',
        bgCard: 'bg-[#E0E5EC] shadow-[6px_6px_14px_#a3b1c6,-6px_-6px_14px_#ffffff] rounded-3xl',
        bgInput: 'bg-[#E0E5EC] shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] text-slate-700 placeholder-slate-400',
        bgHeader: 'bg-[#E0E5EC]',
        textMain: 'text-slate-800',
        textMuted: 'text-slate-500',
        textHighlight: 'text-blue-600',
        iconContainer: 'bg-[#E0E5EC] shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff] text-blue-600',
        bottomNav: 'bg-[#E0E5EC]/85 backdrop-blur-2xl border-t border-white/60 shadow-[0_-20px_40px_-10px_rgba(163,177,198,0.5)]',
        fab: 'bg-[#E0E5EC] text-blue-600 shadow-[6px_6px_12px_#a3b1c6,-6px_-6px_12px_#ffffff]',
        btnPrimary: 'bg-[#E0E5EC] text-blue-600 font-bold shadow-[6px_6px_12px_#a3b1c6,-6px_-6px_12px_#ffffff] rounded-2xl active:shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] transition-all',
        btnSecondary: 'bg-[#E0E5EC] text-slate-600 font-bold shadow-[4px_4px_8px_#a3b1c6,-4px_-4px_8px_#ffffff] rounded-xl active:shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] transition-all',
        navActiveBg: 'shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff] text-blue-600',
        drawerBg: 'bg-[#E0E5EC]',
        drawerItem: 'shadow-[4px_4px_10px_#a3b1c6,-4px_-4px_10px_#ffffff] text-slate-600',
        divider: 'border-white/40',
        imagePlaceholder: 'bg-[#E0E5EC] shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff]'
    };
};

export function MobileProvider({
    children,
    userAgentStr,
    searchParamsSource
}: {
    children: React.ReactNode;
    userAgentStr?: string;
    searchParamsSource?: string;
}) {
    const [themeMode, setThemeMode] = useState<ThemeMode>('light-neu');
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        // 1. Check URL override ?source=webview
        if (searchParamsSource === 'webview') {
            setIsMobileView(true);
            return;
        }

        // 2. Check LocalStorage preference if any (optional)
        const forcedWebview = localStorage.getItem('force_webview');
        if (forcedWebview === 'true') {
            setIsMobileView(true);
            return;
        }

        // 3. Check User-Agent
        const ua = userAgentStr?.toLowerCase() || navigator.userAgent.toLowerCase();
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|otohub-mobile/i.test(ua);
        // Explicitly check custom header or simple regex
        if (isMobileDevice) {
            setIsMobileView(true);
        }
    }, [userAgentStr, searchParamsSource]);

    useEffect(() => {
        // Load theme from local storage
        const storedTheme = localStorage.getItem('otohub-mobile-theme') as ThemeMode;
        if (storedTheme === 'dark-neu' || storedTheme === 'light-neu') {
            setThemeMode(storedTheme);
        }
    }, []);

    const handleSetTheme = (mode: ThemeMode) => {
        setThemeMode(mode);
        localStorage.setItem('otohub-mobile-theme', mode);
    };

    const theme = getTheme(themeMode);

    return (
        <MobileContext.Provider value={{ isMobileView, themeMode, setThemeMode: handleSetTheme, theme }}>
            {/* Inject Global Mobile CSS if active */}
            {isMobileView && (
                <style dangerouslySetInnerHTML={{
                    __html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .smooth-scroll { -webkit-overflow-scrolling: touch; }
            .no-select { user-select: none; -webkit-user-select: none; }
            
            @keyframes slideUpModal {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .animate-slide-up-modal {
              animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-fade-in {
              animation: fadeIn 0.3s ease-out forwards;
            }
            body { 
              overscroll-behavior-y: none; /* Prevent pull-to-refresh bounce */
              background-color: ${theme.name === 'dark-neu' ? '#000' : '#E0E5EC'} !important;
            }
          `
                }} />
            )}
            {children}
        </MobileContext.Provider>
    );
}

export const useMobileContext = () => {
    const context = useContext(MobileContext);
    if (context === undefined) {
        throw new Error('useMobileContext must be used within a MobileProvider');
    }
    return context;
};
