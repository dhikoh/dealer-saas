import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Car, Plus, Calculator, User } from 'lucide-react-native';
import { useTheme } from '../components/ThemeContext';
import clsx from 'clsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { colors, mode } = useTheme();
    const insets = useSafeAreaInsets();

    const icons = {
        dashboard: Home,
        vehicles: Car,
        credit: Calculator,
        profile: User,
    };

    return (
        <View className="absolute bottom-0 w-full items-center z-50 pointer-events-box-none">
            <View
                className={clsx(
                    "flex-row items-center justify-between px-2 py-2 rounded-[32px] w-[90%]",
                    colors.iconContainer
                    // We use iconContainer style here as base for the bar itself
                )}
                style={{ marginBottom: insets.bottom + 10 }}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const IconComponent = icons[route.name as keyof typeof icons];

                    if (!IconComponent) return null;

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

                    // Insert FAB in the middle (after 2nd item)
                    if (index === 2) {
                        return (
                            <React.Fragment key="fab">
                                <TouchableOpacity
                                    className={clsx(
                                        "w-14 h-14 rounded-full items-center justify-center -mt-6 mx-1",
                                        colors.btnPrimary
                                    )}
                                    activeOpacity={0.8}
                                >
                                    {/* FIX: Use a hardcoded hex instead of parsing a Tailwind class string */}
                                    <Plus size={24} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} strokeWidth={3} />
                                </TouchableOpacity>
                                <TabItem
                                    key={route.key}
                                    icon={IconComponent}
                                    isFocused={isFocused}
                                    onPress={onPress}
                                    colors={colors}
                                    mode={mode}
                                />
                            </React.Fragment>
                        );
                    }

                    return (
                        <TabItem
                            key={route.key}
                            icon={IconComponent}
                            isFocused={isFocused}
                            onPress={onPress}
                            colors={colors}
                            mode={mode}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const TabItem = ({ icon: Icon, isFocused, onPress, colors, mode }: { icon: any, isFocused: boolean, onPress: () => void, colors: any, mode: any }) => (
    <TouchableOpacity
        onPress={onPress}
        className={clsx(
            "w-12 h-12 rounded-full items-center justify-center",
            isFocused && colors.shadowIncome // Inner shadow when active
        )}
    >
        <Icon
            size={20}
            color={isFocused ? (mode === 'dark' ? '#60A5FA' : '#2563EB') : (mode === 'dark' ? '#9CA3AF' : '#64748B')}
            strokeWidth={isFocused ? 2.5 : 2}
        />
    </TouchableOpacity>
);
