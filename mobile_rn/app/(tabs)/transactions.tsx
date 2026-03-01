import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Search, Plus, ChevronRight, Check, Clock, XCircle, DollarSign } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { transactionService } from '../../services/transaction.service';
import clsx from 'clsx';
import { Transaction } from '../../constants/types';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: 'Menunggu', color: '#F59E0B', icon: Clock },
    PAID: { label: 'Dibayar', color: '#10B981', icon: DollarSign },
    COMPLETED: { label: 'Selesai', color: '#22C55E', icon: Check },
    CANCELLED: { label: 'Dibatalkan', color: '#EF4444', icon: XCircle },
};

export default function TransactionsScreen() {
    const { colors, mode } = useTheme();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const loadTransactions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await transactionService.getTransactions();
            setTransactions(data);
        } catch (err) {
            console.error(err);
            setError('Gagal memuat transaksi');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadTransactions(); }, [loadTransactions]);

    const filteredTx = transactions.filter(tx => {
        if (filter !== 'all' && tx.status !== filter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                tx.invoiceNumber?.toLowerCase().includes(q) ||
                tx.customer?.name?.toLowerCase().includes(q) ||
                tx.vehicle?.make?.toLowerCase().includes(q) ||
                tx.vehicle?.model?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const handleStatusUpdate = (tx: Transaction) => {
        const nextStatus = tx.status === 'PENDING' ? 'PAID' : tx.status === 'PAID' ? 'COMPLETED' : null;
        if (!nextStatus) return;

        Alert.alert(
            'Update Status',
            `Ubah status ke ${statusConfig[nextStatus]?.label}?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Ya', onPress: async () => {
                        try {
                            await transactionService.updateStatus(tx.id, nextStatus);
                            loadTransactions();
                        } catch (err) {
                            Alert.alert('Error', 'Gagal update status');
                        }
                    }
                },
            ]
        );
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <View className="px-6 pt-4 pb-2">
                <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>Transaksi</Text>
            </View>

            {/* Search */}
            <View className="px-6 mt-4">
                <View className="relative justify-center">
                    <View className="absolute left-4 z-10">
                        <Search size={20} color={mode === 'dark' ? '#9CA3AF' : '#64748B'} />
                    </View>
                    <TextInput
                        placeholder="Cari invoice, customer..."
                        placeholderTextColor={mode === 'dark' ? '#6B7280' : '#94A3B8'}
                        value={search}
                        onChangeText={setSearch}
                        className={clsx(
                            "w-full pl-12 pr-6 py-4 rounded-2xl text-sm font-bold",
                            colors.shadowIncome,
                            mode === 'dark' ? 'bg-[#2A2D32] text-gray-200' : 'bg-[#E0E5EC] text-slate-700'
                        )}
                    />
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="px-6 mt-6 pb-2">
                <View className="flex-row gap-3">
                    {[
                        { key: 'all', label: 'Semua' },
                        { key: 'PENDING', label: 'Pending' },
                        { key: 'COMPLETED', label: 'Selesai' },
                    ].map(f => (
                        <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
                            className={clsx("px-6 py-3 rounded-xl", filter === f.key ? colors.btnPrimary : colors.shadowOutcome)}>
                            <Text className={clsx("text-[10px] font-black uppercase tracking-widest",
                                filter === f.key ? colors.textHighlight : colors.textMuted)}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Transaction List */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                    <Text className={clsx("mt-3 text-sm font-bold", colors.textMuted)}>Memuat transaksi...</Text>
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-10">
                    <Text className={clsx("text-center font-bold", colors.textMuted)}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTx}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const sc = statusConfig[item.status] || statusConfig.PENDING;
                        const StatusIcon = sc.icon;
                        return (
                            <TouchableOpacity
                                className={clsx("p-4 mb-4 rounded-3xl", colors.iconContainer)}
                                onPress={() => handleStatusUpdate(item)}
                            >
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1">
                                        <Text className={clsx("font-black text-xs", colors.textMuted)}>
                                            {item.invoiceNumber}
                                        </Text>
                                        <Text className={clsx("font-black text-base mt-1", colors.textMain)}>
                                            {item.vehicle?.make} {item.vehicle?.model}
                                        </Text>
                                        <Text className={clsx("text-xs font-bold mt-1", colors.textMuted)}>
                                            {item.customer?.name}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <View className="flex-row items-center gap-1">
                                            <StatusIcon size={12} color={sc.color} />
                                            <Text style={{ color: sc.color }} className="text-[10px] font-black uppercase">
                                                {sc.label}
                                            </Text>
                                        </View>
                                        <Text className={clsx("font-black text-base mt-2", colors.textHighlight)}>
                                            Rp {fmt(Number(item.finalPrice))}
                                        </Text>
                                    </View>
                                </View>
                                <View className={clsx("mt-3 pt-3 border-t flex-row justify-between", mode === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
                                    <Text className={clsx("text-[10px] font-black uppercase tracking-wider", colors.textMuted)}>
                                        {item.type === 'SALE' ? 'Penjualan' : 'Pembelian'} • {item.paymentType}
                                    </Text>
                                    <Text className={clsx("text-[10px] font-bold", colors.textMuted)}>
                                        {new Date(item.date).toLocaleDateString('id-ID')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View className="items-center justify-center pt-20">
                            <FileText size={48} color={mode === 'dark' ? '#4B5563' : '#9CA3AF'} />
                            <Text className={clsx("mt-4 font-bold", colors.textMuted)}>Belum ada transaksi</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
