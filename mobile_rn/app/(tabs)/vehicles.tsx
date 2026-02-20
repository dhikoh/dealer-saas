import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Car, Info } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { vehicleService } from '../../services/vehicle.service';
import clsx from 'clsx';
import { Vehicle } from '../../constants/types';

export default function VehiclesScreen() {
    const { colors, mode } = useTheme();
    const [filter, setFilter] = useState('all');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadVehicles = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await vehicleService.getVehicles();
                setVehicles(data);
            } catch (err) {
                console.error(err);
                setError('Gagal memuat data kendaraan. Periksa koneksi internet.');
            } finally {
                setIsLoading(false);
            }
        };
        loadVehicles();
    }, []);

    const filteredVehicles = vehicles.filter(v => {
        if (filter === 'all') return true;
        // FIX: Normalize status comparison — backend likely uses uppercase enum values
        return v.condition?.toLowerCase() === filter;
    });

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <View className="px-6 pt-4 pb-2">
                <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>Inventaris</Text>
            </View>

            {/* Search Bar */}
            <View className="px-6 mt-4">
                <View className="relative justify-center">
                    <View className="absolute left-4 z-10">
                        <Search size={20} color={mode === 'dark' ? '#9CA3AF' : '#64748B'} />
                    </View>
                    <TextInput
                        placeholder="Cari merek, model..."
                        placeholderTextColor={mode === 'dark' ? '#6B7280' : '#94A3B8'}
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
                    <FilterBadge label="Semua" active={filter === 'all'} onPress={() => setFilter('all')} colors={colors} />
                    <FilterBadge label="Baru" active={filter === 'baru'} onPress={() => setFilter('baru')} colors={colors} />
                    <FilterBadge label="Bekas" active={filter === 'bekas'} onPress={() => setFilter('bekas')} colors={colors} />
                </View>
            </View>

            {/* Vehicle List — FIX: Use FlatList instead of ScrollView for performance & keyExtractor */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                    <Text className={clsx("mt-3 text-sm font-bold", colors.textMuted)}>Memuat data...</Text>
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-10">
                    <Text className={clsx("text-center font-bold", colors.textMuted)}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredVehicles}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <VehicleCard vehicle={item} colors={colors} mode={mode} />
                    )}
                    ListEmptyComponent={
                        <View className="items-center justify-center pt-20">
                            <Car size={48} color={mode === 'dark' ? '#4B5563' : '#9CA3AF'} />
                            <Text className={clsx("mt-4 font-bold", colors.textMuted)}>Tidak ada kendaraan</Text>
                        </View>
                    }
                />
            )}

        </SafeAreaView>
    );
}

const FilterBadge = ({ label, active, onPress, colors }: { label: string, active: boolean, onPress: () => void, colors: any }) => (
    <TouchableOpacity
        onPress={onPress}
        className={clsx(
            "px-6 py-3 rounded-xl",
            active ? colors.btnPrimary : colors.shadowOutcome
        )}
    >
        <Text className={clsx(
            "text-[10px] font-black uppercase tracking-widest",
            active ? colors.textHighlight : colors.textMuted
        )}>
            {label}
        </Text>
    </TouchableOpacity>
);

const VehicleCard = ({ vehicle, colors, mode }: { vehicle: Vehicle, colors: any, mode: any }) => (
    <TouchableOpacity className={clsx("p-4 mb-5 rounded-3xl", colors.iconContainer)}>
        <View className="flex-row gap-4">
            {/* Image Placeholder */}
            <View className={clsx("w-24 h-24 rounded-2xl items-center justify-center overflow-hidden", colors.shadowIncome)}>
                {vehicle.image ? (
                    <Image source={{ uri: vehicle.image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <Car size={32} color={mode === 'dark' ? '#4B5563' : '#9CA3AF'} />
                )}
            </View>

            <View className="flex-1 justify-center">
                <Text className={clsx("font-black text-lg leading-tight", colors.textMain)}>{vehicle.brand} {vehicle.model}</Text>
                <Text className={clsx("text-xs font-bold mt-1.5", colors.textMuted)}>{vehicle.variant} • {vehicle.year}</Text>
                <View className="flex-row items-center mt-2 gap-2">
                    <View className={clsx("px-2 py-1 rounded-md", colors.shadowIncome)}>
                        <Text className={clsx("text-[9px] font-mono font-bold uppercase", colors.textMuted)}>{vehicle.stock}</Text>
                    </View>
                </View>
            </View>
        </View>

        <View className={clsx("mt-4 pt-3 border-t flex-row justify-between items-center", mode === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
            <Text className={clsx("font-black text-lg", colors.textHighlight)}>
                Rp {(vehicle.price ?? 0).toLocaleString('id-ID')}
            </Text>
            <View className={clsx("px-3 py-1.5 rounded-lg", colors.shadowOutcome)}>
                <Text className={clsx("text-[9px] font-black uppercase tracking-widest", colors.textMuted)}>
                    {['AVAILABLE', 'available'].includes(vehicle.status) ? 'Tersedia' : 'Booked'}
                </Text>
            </View>
        </View>
    </TouchableOpacity>
);
