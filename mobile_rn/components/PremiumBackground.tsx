import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';

export default function PremiumBackground({ children }: { children: React.ReactNode }) {
    const { mode } = useTheme();

    // Base color matches Neumorphism base color
    const bgColor = mode === 'dark' ? '#1E2228' : '#E0E5EC';
    const accentGlow = mode === 'dark' ? 'rgba(0, 191, 165, 0.08)' : 'rgba(0, 191, 165, 0.05)';
    const secondaryGlow = mode === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)';

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Top Right Glow */}
            <View style={[
                styles.glow,
                styles.topRight,
                { backgroundColor: accentGlow }
            ]} />

            {/* Bottom Left Glow */}
            <View style={[
                styles.glow,
                styles.bottomLeft,
                { backgroundColor: secondaryGlow }
            ]} />

            <View style={StyleSheet.absoluteFill}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        // High spread radius (blur) is simulated by scaling and absolute positioning
        transform: [{ scale: 1.5 }],
    },
    topRight: {
        top: -100,
        right: -100,
    },
    bottomLeft: {
        bottom: -100,
        left: -100,
    }
});
