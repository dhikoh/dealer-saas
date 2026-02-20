import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../components/AuthContext';
import { vehicleService } from '../../services/vehicle.service';
import clsx from 'clsx';
import { Bell, Search, TrendingUp, Users, Plus, FileText, ArrowRight, Car, Calculator } from 'lucide-react-native';

export default function Dashboard() {
    const { colors, mode } = useTheme();
    const { user } = useAuth();
    const [stats, setStats] = useState({ total: 0, available: 0, sold: 0 });

    useEffect(() => {
        let isMounted = true;
        const fetchStats = async () => {
            try {
                const data = await vehicleService.getVehicleStats();
                if (isMounted) setStats(data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            }
        };
        fetchStats();
        return () => { isMounted = false; };
    }, []);

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            {/* Header */}
            <View className={clsx("px-6 pt-4 pb-6 rounded-b-[40px] z-10", colors.bgHeader)}>
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className={clsx("text-sm font-bold opacity-70", colors.textMain)}>Selamat Datang,</Text>
                        <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>{user?.name || 'User'}</Text>
                    </View>
                    <TouchableOpacity className={clsx("w-12 h-12 rounded-full items-center justify-center", colors.iconContainer)}>
                        <Bell size={20} color={mode === 'dark' ? '#E5E7EB' : '#1F2937'} />
                        <View className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                    </TouchableOpacity>
                </View>

                {/* Summary Cards Carousel */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 24 }}>
                    <SummaryCard
                        label="Total Stok"
                        value={stats.total.toString()}
                        trend="+12%"
                        icon={Search}
                        colors={colors}
                        mode={mode}
                    />
                    <SummaryCard
                        label="Terjual Bulan Ini"
                        value={stats.sold.toString()}
                        trend="+8%"
                        icon={TrendingUp}
                        colors={colors}
                        mode={mode}
                    />
                    <SummaryCard
                        label="Tersedia"
                        value={stats.available.toString()}
                        trend=""
                        icon={Users}
                        colors={colors}
                        mode={mode}
                    />
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Quick Actions */}
                <View className="px-6 mt-6">
                    <Text className={clsx("text-[11px] font-black uppercase tracking-widest mb-4 pl-2", colors.textMuted)}>Aksi Cepat</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        <ActionBtn icon={Plus} label="Draft Baru" colors={colors} mode={mode} />
                        <ActionBtn icon={Calculator} label="Simulasi" colors={colors} mode={mode} />
                        <ActionBtn icon={FileText} label="Laporan" colors={colors} mode={mode} />
                        <ActionBtn icon={Users} label="Prospek" colors={colors} mode={mode} />
                    </ScrollView>
                </View>

                {/* Recent Drafts */}
                <View className="px-6 mt-8">
                    <View className="flex-row justify-between items-end mb-4 px-2">
                        <Text className={clsx("text-[11px] font-black uppercase tracking-widest", colors.textMuted)}>Draft Terbaru</Text>
                        <TouchableOpacity className="flex-row items-center gap-1">
                            <Text className={clsx("text-xs font-bold", colors.textHighlight)}>Lihat Semua</Text>
                            <ArrowRight size={12} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                        </TouchableOpacity>
                    </View>
                    <View className="gap-4">
                        <DraftItem customer="Budi Santoso" vehicle="Honda Brio Satya" price="Rp 185.000.000" status="Hot Prospect" colors={colors} mode={mode} />
                        <DraftItem customer="Siti Aminah" vehicle="Toyota Avanza G" price="Rp 245.000.000" status="Follow Up" colors={colors} mode={mode} />
                        <DraftItem customer="Rudi Hermawan" vehicle="Mitsubishi Xpander" price="Rp 290.000.000" status="New Lead" colors={colors} mode={mode} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const ActionBtn = ({ icon: Icon, label, colors, mode }: { icon: any, label: string, colors: any, mode: any }) => (
    <View className="items-center gap-3">
        <TouchableOpacity className={clsx("w-14 h-14 rounded-2xl items-center justify-center", colors.iconContainer)}>
            <Icon size={24} color={mode === 'dark' ? '#E5E7EB' : '#1F2937'} />
        </TouchableOpacity>
        <Text className={clsx("text-[10px] font-black uppercase tracking-widest", colors.textMain)}>{label}</Text>
    </View>
);

const SummaryCard = ({ label, value, trend, icon: Icon, colors, mode }: { label: string, value: string, trend: string, icon: any, colors: any, mode: any }) => (
    <TouchableOpacity className={clsx("p-5 rounded-3xl w-40", colors.iconContainer)}>
        <View className="flex-row justify-between items-start mb-4">
            <View className={clsx("w-10 h-10 rounded-full items-center justify-center", colors.shadowIncome)}>
                <Icon size={18} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
            </View>
            {trend ? (
                <View className={clsx("px-2 py-1 rounded-lg", colors.shadowOutcome)}>
                    <Text className="text-[9px] font-bold text-green-500">{trend}</Text>
                </View>
            ) : null}
        </View>
        <Text className={clsx("text-3xl font-black tracking-tighter", colors.textMain)}>{value}</Text>
        <Text className={clsx("text-[10px] font-black uppercase tracking-widest mt-1", colors.textMuted)}>{label}</Text>
    </TouchableOpacity>
);

const DraftItem = ({ customer, vehicle, price, status, colors, mode }: { customer: string, vehicle: string, price: string, status: string, colors: any, mode: any }) => (
    <TouchableOpacity className={clsx("p-4 flex-row items-center gap-4 rounded-3xl", colors.iconContainer)}>
        <View className={clsx("w-12 h-12 rounded-full items-center justify-center", colors.shadowIncome)}>
            <FileText size={20} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
        </View>
        <View className="flex-1">
            <Text className={clsx("font-black text-sm", colors.textMain)}>{customer}</Text>
            <Text className={clsx("text-xs font-bold mt-1", colors.textMuted)}>{vehicle}</Text>
        </View>
        <View className="items-end">
            <Text className={clsx("text-sm font-black", colors.textHighlight)}>{price}</Text>
            <View className={clsx("px-3 py-1 mt-1.5 rounded-lg", colors.shadowIncome)}>
                <Text className={clsx("text-[9px] font-black uppercase tracking-widest", colors.textMuted)}>{status}</Text>
            </View>
        </View>
    </TouchableOpacity>
);
