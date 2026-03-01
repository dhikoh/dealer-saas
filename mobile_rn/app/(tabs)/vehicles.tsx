import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Car, Plus, X, Trash2, Edit3, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { vehicleService } from '../../services/vehicle.service';
import clsx from 'clsx';
import { Vehicle } from '../../constants/types';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
const CATEGORIES = ['CAR', 'MOTORCYCLE', 'TRUCK', 'BUS', 'OTHER'];

export default function VehiclesScreen() {
    const { colors, mode } = useTheme();
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

    // Fetch brands when form category changes
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

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            {/* Header */}
            <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
                <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>Inventaris</Text>
                <TouchableOpacity onPress={openAdd} className={clsx("w-10 h-10 rounded-xl items-center justify-center", colors.btnPrimary)}>
                    <Plus size={20} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                </TouchableOpacity>
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
                        { key: 'available', label: 'Tersedia' },
                        { key: 'booked', label: 'Dipesan' },
                        { key: 'sold', label: 'Terjual' },
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

            {/* Vehicle List */}
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
                        <VehicleCard vehicle={item} colors={colors} mode={mode}
                            onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)} />
                    )}
                    ListEmptyComponent={
                        <View className="items-center justify-center pt-20">
                            <Car size={48} color={mode === 'dark' ? '#4B5563' : '#9CA3AF'} />
                            <Text className={clsx("mt-4 font-bold", colors.textMuted)}>Tidak ada kendaraan</Text>
                        </View>
                    }
                />
            )}

            {/* Form Modal */}
            <Modal visible={showForm} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <View className="flex-1 justify-end">
                        <View className={clsx("rounded-t-3xl max-h-[90%]",
                            mode === 'dark' ? 'bg-[#1E1E1E]' : 'bg-[#ecf0f3]')}>
                            {/* Modal Header */}
                            <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
                                <Text className={clsx("text-lg font-black", mode === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
                                    {editingId ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
                                </Text>
                                <TouchableOpacity onPress={() => setShowForm(false)}>
                                    <X size={24} color={mode === 'dark' ? '#9CA3AF' : '#64748B'} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="px-6 pb-10" showsVerticalScrollIndicator={false}>
                                {/* Category Picker */}
                                <FormLabel label="Kategori" mode={mode} />
                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    {CATEGORIES.map(c => (
                                        <TouchableOpacity key={c} onPress={() => setForm(f => ({ ...f, category: c, make: '', model: '' }))}
                                            className={clsx("px-4 py-2 rounded-xl", form.category === c ? colors.btnPrimary : colors.shadowOutcome)}>
                                            <Text className={clsx("text-[10px] font-black uppercase", form.category === c ? colors.textHighlight : colors.textMuted)}>
                                                {c}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Brand Picker */}
                                <FormLabel label="Merek *" mode={mode} />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                    <View className="flex-row gap-2">
                                        {brands.map((b: any) => (
                                            <TouchableOpacity key={b.id} onPress={() => handleBrandChange(b.name)}
                                                className={clsx("px-4 py-2.5 rounded-xl", form.make === b.name ? colors.btnPrimary : colors.shadowOutcome)}>
                                                <Text className={clsx("text-xs font-black", form.make === b.name ? colors.textHighlight : colors.textMuted)}>
                                                    {b.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                        {brands.length === 0 && (
                                            <Text className={clsx("text-xs font-bold py-2", colors.textMuted)}>Tidak ada merek untuk kategori ini</Text>
                                        )}
                                    </View>
                                </ScrollView>

                                {/* Model Picker */}
                                <FormLabel label="Model *" mode={mode} />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                    <View className="flex-row gap-2">
                                        {models.map((m: any) => (
                                            <TouchableOpacity key={m.id} onPress={() => handleModelChange(m.name)}
                                                className={clsx("px-4 py-2.5 rounded-xl", form.model === m.name ? colors.btnPrimary : colors.shadowOutcome)}>
                                                <Text className={clsx("text-xs font-black", form.model === m.name ? colors.textHighlight : colors.textMuted)}>
                                                    {m.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                        {!form.make && (
                                            <Text className={clsx("text-xs font-bold py-2", colors.textMuted)}>Pilih merek dulu</Text>
                                        )}
                                    </View>
                                </ScrollView>

                                {/* Text Inputs */}
                                {[
                                    { label: 'Varian', key: 'variant', kbType: 'default' as const },
                                    { label: 'Warna', key: 'color', kbType: 'default' as const },
                                    { label: 'No. Plat', key: 'licensePlate', kbType: 'default' as const },
                                    { label: 'Tahun', key: 'year', kbType: 'numeric' as const },
                                    { label: 'Harga Jual (Rp) *', key: 'price', kbType: 'numeric' as const },
                                    { label: 'Harga Beli (Rp)', key: 'purchasePrice', kbType: 'numeric' as const },
                                ].map(f => (
                                    <View key={f.key} className="mb-4">
                                        <FormLabel label={f.label} mode={mode} />
                                        <TextInput
                                            value={String((form as any)[f.key])}
                                            onChangeText={val => setForm(prev => ({ ...prev, [f.key]: f.kbType === 'numeric' ? val : val }))}
                                            keyboardType={f.kbType}
                                            className={clsx(
                                                "w-full px-5 py-4 rounded-2xl text-sm font-black",
                                                colors.shadowIncome,
                                                mode === 'dark' ? 'bg-[#2A2D32] text-gray-200' : 'bg-[#E0E5EC] text-slate-700'
                                            )}
                                        />
                                    </View>
                                ))}

                                {/* Condition */}
                                <FormLabel label="Kondisi" mode={mode} />
                                <View className="flex-row gap-2 mb-4">
                                    {[
                                        { value: 'READY', label: 'Siap Jual' },
                                        { value: 'REPAIR', label: 'Perbaikan' },
                                        { value: 'RESERVED', label: 'Dipesan' },
                                    ].map(c => (
                                        <TouchableOpacity key={c.value} onPress={() => setForm(f => ({ ...f, condition: c.value }))}
                                            className={clsx("px-4 py-2.5 rounded-xl", form.condition === c.value ? colors.btnPrimary : colors.shadowOutcome)}>
                                            <Text className={clsx("text-xs font-black", form.condition === c.value ? colors.textHighlight : colors.textMuted)}>
                                                {c.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity onPress={handleSave} disabled={saving}
                                    className={clsx("w-full py-5 rounded-2xl items-center mt-4 mb-8", colors.btnPrimary, saving && 'opacity-50')}>
                                    <Text className={clsx("text-sm uppercase tracking-widest font-black", colors.textHighlight)}>
                                        {saving ? 'Menyimpan...' : editingId ? 'Update Kendaraan' : 'Simpan Kendaraan'}
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const FormLabel = ({ label, mode }: { label: string; mode: any }) => (
    <Text className={clsx("text-[10px] font-black uppercase tracking-widest mb-2",
        mode === 'dark' ? 'text-gray-400' : 'text-slate-500')}>
        {label}
    </Text>
);

const VehicleCard = ({ vehicle, colors, mode, onEdit, onDelete }: {
    vehicle: Vehicle; colors: any; mode: any; onEdit: () => void; onDelete: () => void
}) => (
    <TouchableOpacity className={clsx("p-4 mb-5 rounded-3xl", colors.iconContainer)} onPress={onEdit}>
        <View className="flex-row gap-4">
            <View className={clsx("w-24 h-24 rounded-2xl items-center justify-center overflow-hidden", colors.shadowIncome)}>
                {vehicle.image ? (
                    <Image source={{ uri: vehicle.image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <Car size={32} color={mode === 'dark' ? '#4B5563' : '#9CA3AF'} />
                )}
            </View>

            <View className="flex-1 justify-center">
                <Text className={clsx("font-black text-lg leading-tight", colors.textMain)}>
                    {vehicle.make || vehicle.brand} {vehicle.model}
                </Text>
                <Text className={clsx("text-xs font-bold mt-1.5", colors.textMuted)}>
                    {vehicle.variant ? `${vehicle.variant} • ` : ''}{vehicle.year}
                </Text>
                <View className="flex-row items-center mt-2 gap-2">
                    <View className={clsx("px-2 py-1 rounded-md", colors.shadowIncome)}>
                        <Text className={clsx("text-[9px] font-mono font-bold uppercase", colors.textMuted)}>
                            {vehicle.condition === 'READY' ? 'Siap Jual'
                                : vehicle.condition === 'REPAIR' ? 'Perbaikan'
                                    : vehicle.condition === 'RESERVED' ? 'Dipesan' : vehicle.condition}
                        </Text>
                    </View>
                </View>
            </View>
        </View>

        <View className={clsx("mt-4 pt-3 border-t flex-row justify-between items-center", mode === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
            <Text className={clsx("font-black text-lg", colors.textHighlight)}>
                Rp {fmt(vehicle.price ?? 0)}
            </Text>
            <View className="flex-row items-center gap-3">
                <View className={clsx("px-3 py-1.5 rounded-lg", colors.shadowOutcome)}>
                    <Text className={clsx("text-[9px] font-black uppercase tracking-widest", colors.textMuted)}>
                        {vehicle.status === 'AVAILABLE' ? 'Tersedia'
                            : vehicle.status === 'BOOKED' ? 'Dipesan'
                                : 'Terjual'}
                    </Text>
                </View>
                <TouchableOpacity onPress={onDelete} className="p-1">
                    <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    </TouchableOpacity>
);
