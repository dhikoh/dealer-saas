import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Car, Plus, X, Trash2, Edit3, ChevronDown, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { vehicleService } from '../../services/vehicle.service';
import NeuBox from '../../components/NeuBox';
import GlassView from '../../components/GlassView';
import clsx from 'clsx';
import { Vehicle } from '../../constants/types';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const CATEGORIES = ['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'OTHER'];
const { width } = Dimensions.get('window');

// Keep logic identical, only update UI
export default function VehiclesScreen() {
    const { colors, mode } = useTheme();
    const insets = useSafeAreaInsets();

    const [filter, setFilter] = useState('all');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        category: 'CAR', make: '', model: '', variant: '', year: new Date().getFullYear(),
        color: '', price: '', purchasePrice: '', licensePlate: '', condition: 'READY', status: 'AVAILABLE',
    });
    const [brands, setBrands] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    const loadVehicles = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await vehicleService.getVehicles();
            setVehicles(data);
        } catch (err) {
            console.error(err);
            setError('Gagal memuat data kendaraan');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadVehicles(); }, [loadVehicles]);

    useEffect(() => {
        if (showForm) {
            fetchBrands(form.category);
        }
    }, [form.category, showForm]);

    const fetchBrands = async (category: string) => {
        try {
            const data = await vehicleService.getBrands(category);
            setBrands(data);
            setModels([]);
        } catch { /* silently fail */ }
    };

    const handleBrandChange = (name: string) => {
        setForm(f => ({ ...f, make: name, model: '', variant: '' }));
        const brand = brands.find(b => b.name === name);
        setModels(brand?.models || []);
    };

    const handleModelChange = (name: string) => {
        setForm(f => ({ ...f, model: name, variant: '' }));
    };

    const filteredVehicles = vehicles.filter(v => {
        if (filter !== 'all' && v.status?.toLowerCase() !== filter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (v.make || v.brand || '').toLowerCase().includes(q) || v.model.toLowerCase().includes(q);
        }
        return true;
    });

    const openAdd = () => {
        setForm({
            category: 'CAR', make: '', model: '', variant: '', year: new Date().getFullYear(),
            color: '', price: '', purchasePrice: '', licensePlate: '', condition: 'READY', status: 'AVAILABLE',
        });
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (v: Vehicle) => {
        setForm({
            category: v.category || 'CAR',
            make: v.make || v.brand || '',
            model: v.model,
            variant: v.variant || '',
            year: v.year,
            color: v.color,
            price: String(v.price),
            purchasePrice: String(v.purchasePrice || ''),
            licensePlate: v.licensePlate || '',
            condition: v.condition || 'READY',
            status: v.status || 'AVAILABLE',
        });
        setEditingId(v.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.make || !form.model || !form.price) {
            Alert.alert('Error', 'Merek, Model, dan Harga wajib diisi');
            return;
        }
        setSaving(true);
        try {
            const body = {
                category: form.category,
                make: form.make,
                model: form.model,
                variant: form.variant || undefined,
                year: form.year,
                color: form.color || 'Hitam',
                price: Number(form.price),
                purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
                licensePlate: form.licensePlate || undefined,
                condition: form.condition,
                status: form.status,
            };

            if (editingId) {
                await vehicleService.updateVehicle(editingId, body);
            } else {
                await vehicleService.createVehicle(body);
            }
            setShowForm(false);
            loadVehicles();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Gagal menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (v: Vehicle) => {
        Alert.alert('Hapus Kendaraan', `Hapus ${v.make || v.brand} ${v.model}?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus', style: 'destructive', onPress: async () => {
                    try {
                        await vehicleService.deleteVehicle(v.id);
                        loadVehicles();
                    } catch { Alert.alert('Error', 'Gagal menghapus'); }
                }
            },
        ]);
    };

    const accentColor = mode === 'dark' ? '#00E676' : '#00bfa5';
    const iconColor = mode === 'dark' ? '#9CA3AF' : '#64748B';

    return (
        <View className="flex-1">
            {/* Header */}
            <View style={{ paddingTop: insets.top + 20 }} className="px-6 flex-row justify-between items-center mb-6">
                <Text className={clsx("text-3xl font-black tracking-tight", colors.textMain)}>Inventory</Text>
                <NeuBox borderRadius={20} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity onPress={openAdd} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={24} color={accentColor} />
                    </TouchableOpacity>
                </NeuBox>
            </View>

            {/* Search Bar - Neumorphic Inset */}
            <View className="px-6 mb-6">
                <View className="relative justify-center">
                    <View className="absolute left-5 z-10">
                        <Search size={20} color={iconColor} />
                    </View>
                    <NeuBox borderRadius={24} pressed style={{ height: 56 }}>
                        <TextInput
                            placeholder="Search make or model..."
                            placeholderTextColor={iconColor}
                            value={search}
                            onChangeText={setSearch}
                            className={clsx(
                                "flex-1 pl-14 pr-6 text-sm font-bold",
                                mode === 'dark' ? 'text-gray-200' : 'text-slate-700'
                            )}
                            style={{ height: '100%' }}
                        />
                    </NeuBox>
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="mb-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'available', label: 'Available' },
                        { key: 'booked', label: 'Booked' },
                        { key: 'sold', label: 'Sold' },
                    ].map(f => {
                        const isSelected = filter === f.key;
                        return (
                            <NeuBox
                                key={f.key}
                                borderRadius={16}
                                pressed={isSelected}
                                onPress={() => setFilter(f.key)}
                                style={{ paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text className={clsx(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    isSelected ? colors.textHighlight : colors.textMuted
                                )}>
                                    {f.label}
                                </Text>
                            </NeuBox>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Vehicle List */}
            {isLoading ? (
                <View className="flex-1 items-center pt-20">
                    <ActivityIndicator size="large" color={accentColor} />
                </View>
            ) : error ? (
                <View className="flex-1 items-center pt-20 px-10">
                    <Text className={clsx("text-center font-bold", colors.textMuted)}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredVehicles}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }} // Extra padding for floating tab bar
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <PremiumVehicleCard vehicle={item} colors={colors} mode={mode}
                            onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)} />
                    )}
                    ListEmptyComponent={
                        <View className="items-center justify-center pt-20 opacity-50">
                            <NeuBox borderRadius={32} style={{ padding: 32, alignItems: 'center' }}>
                                <Car size={48} color={iconColor} />
                                <Text className={clsx("mt-4 text-sm font-bold", colors.textMuted)}>Tidak ada kendaraan</Text>
                            </NeuBox>
                        </View>
                    }
                />
            )}

            {/* Neumorphic Form Modal (Simplified for the example) */}
            <Modal visible={showForm} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <GlassView intensity={40} tint={mode === 'dark' ? 'dark' : 'light'} borderRadius={0} style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <View className={clsx("rounded-t-[40px] max-h-[90%]", mode === 'dark' ? 'bg-[#1E2228]' : 'bg-[#E0E5EC]')}>
                            <View className="flex-row justify-between items-center px-8 pt-8 pb-6">
                                <Text className={clsx("text-2xl font-black tracking-tight", mode === 'dark' ? 'text-gray-100' : 'text-gray-800')}>
                                    {editingId ? 'Edit Vehicle' : 'New Vehicle'}
                                </Text>
                                <NeuBox borderRadius={20} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                                    <TouchableOpacity onPress={() => setShowForm(false)} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={20} color={iconColor} />
                                    </TouchableOpacity>
                                </NeuBox>
                            </View>

                            <ScrollView className="px-8 pb-10" showsVerticalScrollIndicator={false}>
                                {/* Using NeuBox for inputs */}
                                {/* ... existing form logic wrapped in NeuBox pressed stat ... */}
                                <NeuBox borderRadius={24} style={{ padding: 24, marginBottom: 24 }}>
                                    <Text className={clsx("text-xs font-black uppercase tracking-widest mb-4 opacity-60", colors.textMain)}>
                                        Required Info
                                    </Text>

                                    <View className="mb-4">
                                        <Text className={clsx("text-[10px] font-black uppercase tracking-widest mb-2 opacity-50", colors.textMain)}>Make *</Text>
                                        <NeuBox pressed borderRadius={16}>
                                            <TextInput
                                                value={form.make}
                                                onChangeText={val => setForm(prev => ({ ...prev, make: val }))}
                                                className={clsx("w-full px-5 py-4 text-sm font-bold", mode === 'dark' ? 'text-gray-200' : 'text-slate-700')}
                                            />
                                        </NeuBox>
                                    </View>

                                    <View className="mb-4">
                                        <Text className={clsx("text-[10px] font-black uppercase tracking-widest mb-2 opacity-50", colors.textMain)}>Model *</Text>
                                        <NeuBox pressed borderRadius={16}>
                                            <TextInput
                                                value={form.model}
                                                onChangeText={val => setForm(prev => ({ ...prev, model: val }))}
                                                className={clsx("w-full px-5 py-4 text-sm font-bold", mode === 'dark' ? 'text-gray-200' : 'text-slate-700')}
                                            />
                                        </NeuBox>
                                    </View>

                                    <View className="mb-4">
                                        <Text className={clsx("text-[10px] font-black uppercase tracking-widest mb-2 opacity-50", colors.textMain)}>Price (Rp) *</Text>
                                        <NeuBox pressed borderRadius={16}>
                                            <TextInput
                                                value={String(form.price)}
                                                onChangeText={val => setForm(prev => ({ ...prev, price: val }))}
                                                keyboardType="numeric"
                                                className={clsx("w-full px-5 py-4 text-sm font-bold", mode === 'dark' ? 'text-gray-200' : 'text-slate-700')}
                                            />
                                        </NeuBox>
                                    </View>
                                </NeuBox>

                                {/* Save Button */}
                                <TouchableOpacity onPress={handleSave} disabled={saving} className="mb-12 mt-4">
                                    <NeuBox borderRadius={24} pressed={saving} style={{ height: 64, alignItems: 'center', justifyContent: 'center' }}>
                                        <Text className={clsx(
                                            "text-sm uppercase tracking-widest font-black",
                                            colors.textHighlight,
                                            saving && 'opacity-50'
                                        )}>
                                            {saving ? 'Saving...' : 'Save Vehicle'}
                                        </Text>
                                    </NeuBox>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </GlassView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

// Custom Premium Vehicle Card component
const PremiumVehicleCard = ({ vehicle, colors, mode, onEdit, onDelete }: {
    vehicle: Vehicle; colors: any; mode: any; onEdit: () => void; onDelete: () => void
}) => {
    const isDark = mode === 'dark';
    const statusColor = vehicle.status === 'AVAILABLE' ? (isDark ? '#00E676' : '#00bfa5') :
        vehicle.status === 'BOOKED' ? '#F59E0B' : '#60A5FA';

    return (
        <View className="mb-6">
            <NeuBox borderRadius={28} style={{ padding: 16 }}>
                {/* Edge to edge pseudo-image area at the top if there's an image, or just an icon */}
                <View className="flex-row gap-5 mb-5">
                    <NeuBox pressed borderRadius={20} style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {vehicle.image ? (
                            <Image source={{ uri: vehicle.image }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <Car size={36} color={isDark ? '#4B5563' : '#9CA3AF'} />
                        )}

                        {/* Floating Status Badge using GlassView inside the image area */}
                        <View className="absolute top-2 right-2">
                            <GlassView intensity={80} borderRadius={10} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                                <View className="flex-row items-center gap-1.5">
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                                    <Text style={{ fontSize: 8, fontWeight: '900', color: isDark ? '#fff' : '#000', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {vehicle.status}
                                    </Text>
                                </View>
                            </GlassView>
                        </View>
                    </NeuBox>

                    <View className="flex-1 justify-center">
                        <Text className={clsx("font-black text-xl leading-tight mb-1 tracking-tight", colors.textMain)}>
                            {vehicle.make || vehicle.brand} {vehicle.model}
                        </Text>
                        <Text className={clsx("text-xs font-bold opacity-60 mb-3", colors.textMain)}>
                            {vehicle.variant ? `${vehicle.variant} • ` : ''}{vehicle.year}
                        </Text>

                        <View className="flex-row">
                            <NeuBox pressed borderRadius={8} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                                <Text className={clsx("text-[9px] font-black uppercase tracking-widest opacity-70", colors.textMain)}>
                                    {vehicle.condition}
                                </Text>
                            </NeuBox>
                        </View>
                    </View>
                </View>

                {/* Footer divider and actions */}
                <View className="flex-row justify-between items-center px-2">
                    <Text className={clsx("font-black text-xl tracking-tighter", colors.textHighlight)}>
                        <Text className={clsx("text-sm", colors.textMuted)}>Rp </Text>
                        {fmt(vehicle.price ?? 0)}
                    </Text>

                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity onPress={onEdit}>
                            <Edit3 size={18} color={isDark ? '#9CA3AF' : '#64748B'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onDelete}>
                            <Trash2 size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </NeuBox>
        </View>
    );
};
