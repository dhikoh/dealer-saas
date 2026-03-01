import React, { useEffect } from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Car, FileText, Calculator, MoreHorizontal, User, Shield } from 'lucide-react-native';
import { useTheme } from '../components/ThemeContext';
import { useAuth } from '../components/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassView from './GlassView';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Individual Tab Icon Component with Animation
const TabIcon = ({
    isFocused,
    IconComponent,
    onPress,
    activeColor,
    inactiveColor
}: any) => {
    // Animation values
    const scale = useSharedValue(isFocused ? 1.2 : 1);
    const opacity = useSharedValue(isFocused ? 1 : 0.6);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1.2 : 1, { damping: 10, stiffness: 200 });
        opacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{ padding: 10 }} // larger hit area
        >
            <Animated.View style={animatedStyle}>
                <IconComponent
                    size={22}
                    color={isFocused ? activeColor : inactiveColor}
                    strokeWidth={isFocused ? 2.5 : 2}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};


export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { colors, mode } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const isSuperadmin = user?.role === 'SUPERADMIN';

    const icons: Record<string, any> = {
        dashboard: Home,
        vehicles: Car,
        transactions: FileText,
        credit: Calculator,
        more: MoreHorizontal,
        superadmin: Shield,
        profile: User,
    };

    // Filter out superadmin route if not superadmin so we don't render empty spaces
    const visibleRoutes = state.routes.filter(route =>
        route.name !== 'superadmin' || isSuperadmin
    );

    return (
        <View
            style={{
                position: 'absolute',
                bottom: insets.bottom + 16,
                width: width,
                alignItems: 'center',
                zIndex: 50,
                // Pass touches through the transparent outer container
                pointerEvents: 'box-none'
            }}
        >
            {/* The main floating glass container */}
            <GlassView
                intensity={80}
                borderRadius={32}
                style={{
                    width: '90%',
                    height: 64,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                }}
            >
                {/* 
                  Using absoluteFill for a subtle background tint inside the glass. 
                  expo-blur handles the blur, but we want a slight color overlay based on theme.
                */}
                <View
                    style={[
                        { ...StyleSheet.absoluteFillObject },
                        { backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)' }
                    ]}
                    pointerEvents="none"
                />

                {visibleRoutes.map((route, index) => {
                    const isFocused = state.routes[state.index].key === route.key;
                    const IconComponent = icons[route.name as keyof typeof icons];

                    if (!IconComponent) return null;

                    const isSATab = route.name === 'superadmin';
                    const activeColor = isSATab
                        ? (mode === 'dark' ? '#F59E0B' : '#D97706')
                        : (mode === 'dark' ? '#00E676' : '#00bfa5'); // OTOHUB primary color
                    const inactiveColor = mode === 'dark' ? '#9CA3AF' : '#64748B';

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    return (
                        <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
                            <TabIcon
                                isFocused={isFocused}
                                IconComponent={IconComponent}
                                onPress={onPress}
                                activeColor={activeColor}
                                inactiveColor={inactiveColor}
                            />
                        </View>
                    );
                })}
            </GlassView>
        </View>
    );
}

import { StyleSheet } from 'react-native';
