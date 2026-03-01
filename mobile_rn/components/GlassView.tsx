import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
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

    // Auto tint based on theme if not specified
    const activeTint = tint || (mode === 'dark' ? 'dark' : 'light');

    return (
        <View style={[styles.container, { borderRadius }, style]}>
            <BlurView
                intensity={intensity}
                tint={activeTint}
                style={[StyleSheet.absoluteFill, { borderRadius }]}
            />
            {/* Subtle border to give the "glass edge" effect */}
            <View style={[
                StyleSheet.absoluteFill,
                styles.glassBorder,
                {
                    borderRadius,
                    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'
                }
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
        // Slight shadow to separate glass from background
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    glassBorder: {
        borderWidth: 1,
        zIndex: 1,
        pointerEvents: 'none', // Allow clicks to pass through border
    },
    content: {
        flex: 1,
        zIndex: 2,
    }
});
