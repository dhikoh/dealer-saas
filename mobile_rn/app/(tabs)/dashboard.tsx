import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../components/AuthContext';
import { vehicleService } from '../../services/vehicle.service';
import { transactionService } from '../../services/transaction.service';
import NeuBox from '../../components/NeuBox';
import GlassView from '../../components/GlassView';
import { Bell, Search, TrendingUp, Users, Plus, FileText, ArrowRight, Car, Calculator, DollarSign } from 'lucide-react-native';
import clsx from 'clsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export default function Dashboard() {
    const { colors, mode } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [vehicleStats, setVehicleStats] = useState<any>({ total: 0, available: 0, sold: 0, booked: 0 });
    const [txStats, setTxStats] = useState<any>(null);
    const [recentTx, setRecentTx] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchAll = async () => {
            try {
                const [vStats, tStats, txList] = await Promise.all([
                    vehicleService.getVehicleStats(),
                    transactionService.getStats().catch(() => null),
                    transactionService.getTransactions().catch(() => []),
                ]);
                if (isMounted) {
                    setVehicleStats(vStats);
                    setTxStats(tStats);
                    setRecentTx(txList.slice(0, 3));
                    setLoading(false);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
                if (isMounted) setLoading(false);
            }
        };
        fetchAll();
        return () => { isMounted = false; };
    }, []);

    const iconColor = mode === 'dark' ? '#E5E7EB' : '#4B5563';
    const accentColor = mode === 'dark' ? '#00E676' : '#00bfa5';

    return (
        <View className="flex-1">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="px-6 flex-row justify-between items-center mb-8">
                    <View>
                        <Text className={clsx("text-sm font-medium tracking-wide opacity-70 mb-1", colors.textMain)}>
                            Welcome back,
                        </Text>
                        <Text className={clsx("text-3xl font-black tracking-tight", colors.textMain)}>
                            {user?.name || 'User'}
                        </Text>
                    </View>
                    <NeuBox borderRadius={24} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={20} color={iconColor} />
                        <View className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1E2228]" />
                    </NeuBox>
                </View>

                {/* Main Glass Summary (Revenue/Total) */}
                <View className="px-6 mb-8">
                    <GlassView intensity={60} borderRadius={32} style={{ padding: 24, overflow: 'hidden' }}>
                        <Text className={clsx("text-sm font-semibold opacity-80 mb-2", colors.textMain)}>
                            Total Revenue
                        </Text>
                        <Text className={clsx("text-4xl font-black tracking-tighter mb-6", colors.textMain)}>
                            <Text className={clsx("text-2xl", colors.textMuted)}>Rp </Text>
                            {fmt(Number(txStats?.totalSalesAmount ?? 0))}
                        </Text>

                        <View className="flex-row justify-between items-center opacity-90">
                            <View className="flex-row items-center gap-2">
                                <TrendingUp size={16} color={accentColor} />
                                <Text className={clsx("text-xs font-bold", colors.textMain)}>
                                    {txStats?.totalSalesCount ?? vehicleStats.sold ?? 0} Transaksi
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Car size={16} color={mode === 'dark' ? '#60A5FA' : '#3B82F6'} />
                                <Text className={clsx("text-xs font-bold", colors.textMain)}>
                                    {vehicleStats.available ?? 0} Stok
                                </Text>
                            </View>
                        </View>
                    </GlassView>
                </View>

                {/* Quick Actions - Neumorphic Buttons */}
                <View className="mb-10">
                    <Text className={clsx("px-8 text-xs font-black uppercase tracking-widest mb-5 opacity-60", colors.textMain)}>
                        Quick Actions
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                    >
                        <ActionBtn icon={Plus} label="Tambah" />
                        <ActionBtn icon={Calculator} label="Simulasi" />
                        <ActionBtn icon={FileText} label="Transaksi" />
                        <ActionBtn icon={Users} label="Customer" />
                    </ScrollView>
                </View>

                {/* Recent Transactions */}
                <View className="px-6">
                    <View className="flex-row justify-between items-end mb-6 pl-2">
                        <Text className={clsx("text-xs font-black uppercase tracking-widest opacity-60", colors.textMain)}>
                            Recent Transactions
                        </Text>
                        <View className="flex-row items-center gap-1">
                            <Text className={clsx("text-xs font-bold", colors.textHighlight)}>Lihat Semua</Text>
                            <ArrowRight size={14} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                        </View>
                    </View>

                    <View className="gap-5">
                        {loading ? (
                            <ActivityIndicator size="large" color={accentColor} style={{ marginTop: 20 }} />
                        ) : recentTx.length > 0 ? (
                            recentTx.map((tx, idx) => (
                                <RecentItem
                                    key={tx.id}
                                    tx={tx}
                                    isFirst={idx === 0}
                                />
                            ))
                        ) : (
                            <NeuBox borderRadius={24} style={{ padding: 32, alignItems: 'center' }}>
                                <FileText size={40} color={iconColor} opacity={0.3} style={{ marginBottom: 16 }} />
                                <Text className={clsx("text-sm font-bold opacity-50", colors.textMain)}>
                                    Belum ada transaksi
                                </Text>
                            </NeuBox>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const ActionBtn = ({ icon: Icon, label }: { icon: any, label: string }) => {
    const { colors, mode } = useTheme();
    const iconColor = mode === 'dark' ? '#00E676' : '#00bfa5';

    return (
        <View className="items-center gap-3">
            <NeuBox borderRadius={20} style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={iconColor} strokeWidth={2.5} />
            </NeuBox>
            <Text className={clsx("text-[10px] font-black uppercase tracking-widest opacity-80", colors.textMain)}>
                {label}
            </Text>
        </View>
    );
};

const RecentItem = ({ tx, isFirst }: { tx: any, isFirst: boolean }) => {
    const { colors, mode } = useTheme();
    const customerName = tx.customer?.name || 'Unknown';
    const vehicleName = `${tx.vehicle?.make || ''} ${tx.vehicle?.model || ''}`.trim();

    // For first item, use Glass effect to highlight it. Otherwise use NeuBox inset.
    if (isFirst) {
        return (
            <GlassView intensity={40} borderRadius={24} style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <NeuBox borderRadius={16} pressed style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color={mode === 'dark' ? '#F59E0B' : '#D97706'} />
                </NeuBox>
                <View className="flex-1">
                    <Text className={clsx("font-black text-base mb-1", colors.textMain)}>{customerName}</Text>
                    <Text className={clsx("text-xs font-bold opacity-60", colors.textMain)}>{vehicleName}</Text>
                </View>
                <View className="items-end">
                    <Text className={clsx("text-sm font-black mb-2", colors.textHighlight)}>
                        Rp {fmt(Number(tx.finalPrice))}
                    </Text>
                    <StatusBadge status={tx.status} />
                </View>
            </GlassView>
        );
    }

    return (
        <NeuBox borderRadius={24} style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <NeuBox borderRadius={16} pressed style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color={mode === 'dark' ? '#60A5FA' : '#3B82F6'} />
            </NeuBox>
            <View className="flex-1">
                <Text className={clsx("font-black text-base mb-1", colors.textMain)}>{customerName}</Text>
                <Text className={clsx("text-xs font-bold opacity-60", colors.textMain)}>{vehicleName}</Text>
            </View>
            <View className="items-end">
                <Text className={clsx("text-sm font-black mb-2", colors.textMain)}>
                    Rp {fmt(Number(tx.finalPrice))}
                </Text>
                <StatusBadge status={tx.status} />
            </View>
        </NeuBox>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const { colors, mode } = useTheme();
    // Use an inset box for badge
    return (
        <NeuBox pressed borderRadius={8} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text className={clsx("text-[9px] font-black uppercase tracking-widest opacity-70", colors.textMain)}>
                {status}
            </Text>
        </NeuBox>
    );
};
