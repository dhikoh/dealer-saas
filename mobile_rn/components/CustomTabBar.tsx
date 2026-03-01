import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Car, FileText, Calculator, MoreHorizontal, User, Shield } from 'lucide-react-native';
import { useTheme } from '../components/ThemeContext';
import { useAuth } from '../components/AuthContext';
import clsx from 'clsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

    return (
        <View className="absolute bottom-0 w-full items-center z-50 pointer-events-box-none">
            <View
                className={clsx(
                    "flex-row items-center justify-between px-2 py-2 rounded-[32px] w-[92%]",
                    colors.iconContainer
                )}
                style={{ marginBottom: insets.bottom + 10 }}
            >
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const IconComponent = icons[route.name as keyof typeof icons];

                    // Hide superadmin tab for non-superadmin users
                    if (route.name === 'superadmin' && !isSuperadmin) return null;

                    if (!IconComponent) return null;

                    const isSATab = route.name === 'superadmin';
                    const activeColor = isSATab
                        ? (mode === 'dark' ? '#F59E0B' : '#D97706')
                        : (mode === 'dark' ? '#60A5FA' : '#2563EB');
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
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            className={clsx(
                                "w-12 h-12 rounded-full items-center justify-center",
                                isFocused && colors.shadowIncome
                            )}
                        >
                            <IconComponent
                                size={20}
                                color={isFocused ? activeColor : inactiveColor}
                                strokeWidth={isFocused ? 2.5 : 2}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
