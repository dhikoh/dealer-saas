import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from './ThemeContext';

interface GlassViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default' | 'transparent';
    borderRadius?: number;
}

export default function GlassView({
    children,
    style,
    intensity = 50,
    tint,
    borderRadius = 24
}: GlassViewProps) {
    const { mode } = useTheme();

    const activeTint = tint || (mode === 'dark' ? 'dark' : 'light');

    // Android fallback: BlurView doesn't work reliably on Android < API 31.
    // Use a semi-transparent background instead to maintain the glass look.
    const androidFallbackBg = mode === 'dark'
        ? 'rgba(42, 45, 50, 0.92)'
        : 'rgba(224, 229, 236, 0.92)';

    const borderColor = mode === 'dark'
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(255,255,255,0.6)';

    if (Platform.OS === 'android') {
        return (
            <View style={[
                styles.container,
                { borderRadius, backgroundColor: androidFallbackBg, borderColor, borderWidth: 1 },
                style
            ]}>
                <View style={styles.content}>
                    {children}
                </View>
            </View>
        );
    }

    // iOS: Full BlurView glass effect
    return (
        <View style={[styles.container, { borderRadius }, style]}>
            <BlurView
                intensity={intensity}
                tint={activeTint}
                style={[StyleSheet.absoluteFill, { borderRadius }]}
            />
            <View style={[
                StyleSheet.absoluteFill,
                styles.glassBorder,
                { borderRadius, borderColor }
            ]} />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
    glassBorder: {
        borderWidth: 1,
        zIndex: 1,
        pointerEvents: 'none',
    },
    content: {
        flex: 1,
        zIndex: 2,
    }
});
