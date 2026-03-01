import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { useTheme } from './ThemeContext';

interface NeuBoxProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    borderRadius?: number;
    pressed?: boolean; // For inset (pressed) effect
    onPress?: () => void;
}

export default function NeuBox({
    children,
    style,
    borderRadius = 16,
    pressed = false,
    onPress
}: NeuBoxProps) {
    const { mode } = useTheme();

    // The core concept of Neumorphism:
    // Background matches the app body background perfectly.
    // Top-Left shadow is light (highlight).
    // Bottom-Right shadow is dark (shadow).

    const bgColor = mode === 'dark' ? '#1E2228' : '#E0E5EC';
    const lightShadow = mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
    const darkShadow = mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : '#a3b1c6';

    const renderContent = () => {
        if (pressed) {
            // Inset effect (pressed state) - Simplified approach for RN without full inner shadow support
            // We use a darker background and border to simulate being pushed in
            return (
                <View style={[
                    styles.box,
                    {
                        backgroundColor: mode === 'dark' ? '#1A1E24' : '#d1d9e6',
                        borderRadius,
                        borderColor: darkShadow,
                        borderWidth: 1,
                    },
                    style
                ]}>
                    {children}
                </View>
            );
        }

        // Outset effect (floating / extruded state)
        return (
            <View style={[styles.outerShadow, { shadowColor: darkShadow }]}>
                <View style={[styles.innerShadow, { shadowColor: lightShadow }]}>
                    <View style={[
                        styles.box,
                        {
                            backgroundColor: bgColor,
                            borderRadius
                        },
                        style
                    ]}>
                        {children}
                    </View>
                </View>
            </View>
        );
    };

    if (onPress) {
        return (
            <Pressable onPress={onPress}>
                {renderContent()}
            </Pressable>
        );
    }

    return renderContent();
}

const styles = StyleSheet.create({
    outerShadow: {
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 8, // For Android
    },
    innerShadow: {
        shadowOffset: { width: -6, height: -6 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 8, // For Android (though RN Android shadowing is limited)
    },
    box: {
        overflow: 'hidden',
    }
});
