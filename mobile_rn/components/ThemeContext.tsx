import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { theme } from '../constants/theme';
import { ThemeMode } from '../constants/types';

interface ThemeContextType {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    colors: typeof theme.light;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>('light');

    // Initialize with system theme ONCE
    useEffect(() => {
        if (systemScheme === 'dark' || systemScheme === 'light') {
            setMode(systemScheme);
        }
    }, []); // FIX: empty dep array — only run once. systemScheme changes are handled by user toggle.

    const toggleTheme = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const colors = theme[mode];

    // FIX: Memoize the context value to prevent re-creating the object on every render.
    // Without this, any parent re-render causes all ThemeContext consumers to re-render.
    const value = useMemo(() => ({ mode, setMode, colors, toggleTheme }), [mode, colors]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
