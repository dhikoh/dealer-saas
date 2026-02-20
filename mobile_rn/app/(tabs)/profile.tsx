import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Sun, Moon, LogOut, ChevronRight, TrendingUp, CreditCard } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../components/AuthContext';
import { useRouter } from 'expo-router';
import clsx from 'clsx';

export default function ProfileScreen() {
    const { colors, mode, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <View className={clsx("px-6 pt-4 pb-2 flex-row justify-between items-center", colors.bgHeader)}>
                <Text className={clsx("text-xl font-black", colors.textMain)}>Profil</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
                <View className="items-center py-6">
                    <View className={clsx("w-28 h-28 rounded-full items-center justify-center mb-6", colors.iconContainer)}>
                        <User size={48} color={mode === 'dark' ? '#E5E7EB' : '#1F2937'} />
                    </View>
                    <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>{user?.name || 'User'}</Text>
                    <Text className={clsx("text-sm font-bold mt-1", colors.textMuted)}>{user?.email || 'email@example.com'}</Text>

                    <View className={clsx("mt-4 px-5 py-2 rounded-lg", colors.shadowOutcome)}>
                        <Text className={clsx("text-[10px] font-black uppercase tracking-widest", colors.textMuted)}>{user?.role || 'Staff'}</Text>
                    </View>
                </View>

                {/* Theme Toggle Section */}
                <View className="mb-6">
                    <Text className={clsx("text-[11px] font-black uppercase tracking-widest mb-4 pl-2", colors.textMuted)}>Tampilan Tema</Text>
                    <View className="flex-row gap-4">
                        <ThemeBtn
                            active={mode === 'light'}
                            onPress={mode === 'dark' ? toggleTheme : () => { }}
                            icon={Sun}
                            label="Light Mode"
                            colors={colors}
                            mode={mode}
                        />
                        <ThemeBtn
                            active={mode === 'dark'}
                            onPress={mode === 'light' ? toggleTheme : () => { }}
                            icon={Moon}
                            label="Dark Mode"
                            colors={colors}
                            mode={mode}
                        />
                    </View>
                </View>

                {/* Menu List */}
                <View>
                    <Text className={clsx("text-[11px] font-black uppercase tracking-widest mb-4 pl-2 mt-2", colors.textMuted)}>Pengaturan Akun</Text>
                    <View className={clsx("p-2 rounded-3xl", colors.iconContainer)}>
                        <ProfileMenu icon={User} label="Data Pribadi" colors={colors} mode={mode} />
                        <ProfileMenu icon={TrendingUp} label="Target Penjualan" colors={colors} mode={mode} />
                        <ProfileMenu icon={CreditCard} label="Komisi Saya" badge="Rp 2.5Jt" isLast colors={colors} mode={mode} />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleLogout}
                    className={clsx(
                        "w-full py-4 mt-8 rounded-2xl flex-row items-center justify-center gap-3",
                        colors.iconContainer // Base container style
                    )}
                >
                    <LogOut size={20} color="#EF4444" />
                    <Text className="text-sm uppercase tracking-widest font-black text-red-500">Keluar</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const ThemeBtn = ({ active, onPress, icon: Icon, label, colors, mode }: { active: boolean, onPress: () => void, icon: any, label: string, colors: any, mode: any }) => (
    <TouchableOpacity
        onPress={onPress}
        className={clsx(
            "flex-1 items-center justify-center gap-3 py-5 rounded-2xl",
            active ? colors.btnPrimary : colors.shadowOutcome
        )}
    >
        <Icon size={24} color={active ? (mode === 'dark' ? '#60A5FA' : '#2563EB') : (mode === 'dark' ? '#9CA3AF' : '#64748B')} />
        <Text className={clsx("text-[10px] font-black uppercase tracking-widest", colors.textMain)}>{label}</Text>
    </TouchableOpacity>
);

const ProfileMenu = ({ icon: Icon, label, badge, isLast, colors, mode }: { icon: any, label: string, badge?: string, isLast?: boolean, colors: any, mode: any }) => (
    <TouchableOpacity className={clsx(
        "flex-row items-center justify-between p-4",
        !isLast && "border-b",
        mode === 'dark' ? 'border-gray-700' : 'border-gray-200'
    )}>
        <View className="flex-row items-center gap-4">
            <View className={clsx("w-10 h-10 rounded-full items-center justify-center", colors.shadowOutcome)}>
                <Icon size={16} color={mode === 'dark' ? '#E5E7EB' : '#1F2937'} />
            </View>
            <Text className={clsx("font-black text-sm", colors.textMain)}>{label}</Text>
        </View>
        <View className="flex-row items-center gap-3">
            {badge && (
                <View className={clsx("px-3 py-1.5 rounded-lg", colors.shadowOutcome)}>
                    <Text className={clsx("text-[9px] font-black uppercase tracking-widest", colors.textHighlight)}>{badge}</Text>
                </View>
            )}
            <ChevronRight size={16} color={mode === 'dark' ? '#9CA3AF' : '#64748B'} />
        </View>
    </TouchableOpacity>
);
