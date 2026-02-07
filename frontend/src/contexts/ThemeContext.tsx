'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'otohub_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (stored && (stored === 'light' || stored === 'dark')) {
            setThemeState(stored);
            applyTheme(stored);
        }
    }, []);

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;
        if (newTheme === 'dark') {
            root.classList.add('dark');
            root.style.setProperty('--bg-main', '#1a1d21');
            root.style.setProperty('--bg-card', '#22262b');
            root.style.setProperty('--shadow-light', '#2a2f35');
            root.style.setProperty('--shadow-dark', '#12141a');
            root.style.setProperty('--text-primary', '#f0f0f0');
            root.style.setProperty('--text-secondary', '#9ca3af');
        } else {
            root.classList.remove('dark');
            root.style.setProperty('--bg-main', '#ecf0f3');
            root.style.setProperty('--bg-card', '#ecf0f3');
            root.style.setProperty('--shadow-light', '#ffffff');
            root.style.setProperty('--shadow-dark', '#cbced1');
            root.style.setProperty('--text-primary', '#374151');
            root.style.setProperty('--text-secondary', '#6b7280');
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    // Prevent flash
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
