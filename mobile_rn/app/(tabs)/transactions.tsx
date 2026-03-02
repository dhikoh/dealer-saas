import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator,
    Alert, Modal, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Search, Plus, Check, Clock, XCircle, DollarSign, X, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { transactionService } from '../../services/transaction.service';
import { vehicleService } from '../../services/vehicle.service';
import { customerService } from '../../services/customer.service';
import NeuBox from '../../components/NeuBox';
import GlassView from '../../components/GlassView';
import clsx from 'clsx';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: 'Menunggu', color: '#F59E0B', icon: Clock },
    PAID: { label: 'Dibayar', color: '#10B981', icon: DollarSign },
    COMPLETED: { label: 'Selesai', color: '#22C55E', icon: Check },
    CANCELLED: { label: 'Dibatalkan', color: '#EF4444', icon: XCircle },
};

export default function TransactionsScreen() {
    const { colors, mode } = useTheme();
    const isDark = mode === 'dark';
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);

    const loadTransactions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await transactionService.getTransactions();
            setTransactions(data);
        } catch { setError('Gagal memuat transaksi'); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { loadTransactions(); }, [loadTransactions]);

    const filteredTx = transactions.filter(tx => {
        if (filter !== 'all' && tx.status !== filter) return false;
        if (search) {
            const q = search.toLowerCase();
            return tx.invoiceNumber?.toLowerCase().includes(q) || tx.customer?.name?.toLowerCase().includes(q) || tx.vehicle?.make?.toLowerCase().includes(q) || tx.vehicle?.model?.toLowerCase().includes(q);
        }
        return true;
    });

    const handleStatusUpdate = (tx: any) => {
        const nextStatus = tx.status === 'PENDING' ? 'PAID' : tx.status === 'PAID' ? 'COMPLETED' : null;
        if (!nextStatus) return;
        Alert.alert('Update Status', `Ubah ke ${statusConfig[nextStatus]?.label}?`, [
            { text: 'Batal', style: 'cancel' },
            { text: 'Ya', onPress: async () => { try { await transactionService.updateStatus(tx.id, nextStatus); loadTransactions(); } catch { Alert.alert('Error', 'Gagal update status'); } } }
        ]);
    };

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: isDark ? '#E5E7EB' : '#1F2937' }}>Transaksi</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#6B7280' : '#94A3B8', marginTop: 2 }}>{transactions.length} total transaksi</Text>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                <NeuBox pressed borderRadius={16} style={{ height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                    <Search size={16} color={isDark ? '#6B7280' : '#94A3B8'} style={{ marginRight: 10 }} />
                    <TextInput placeholder="Cari invoice, customer, kendaraan..." placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'} value={search} onChangeText={setSearch}
                        style={{ flex: 1, fontSize: 13, fontWeight: '700', color: isDark ? '#E5E7EB' : '#1E293B' }} />
                </NeuBox>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 8, flexGrow: 0 }}>
                {[{ key: 'all', label: 'Semua' }, { key: 'PENDING', label: 'Pending' }, { key: 'PAID', label: 'Dibayar' }, { key: 'COMPLETED', label: 'Selesai' }].map(f => (
                    <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={{ marginRight: 8 }}>
                        <NeuBox pressed={filter === f.key} borderRadius={14} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: filter === f.key ? (isDark ? '#60A5FA' : '#2563EB') : (isDark ? '#6B7280' : '#94A3B8') }}>{f.label}</Text>
                        </NeuBox>
                    </TouchableOpacity>
                ))}
                <View style={{ width: 20 }} />
            </ScrollView>

            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#2563EB'} />
                </View>
            ) : error ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
                    <Text style={{ textAlign: 'center', fontWeight: '700', color: isDark ? '#6B7280' : '#94A3B8' }}>{error}</Text>
                </View>
            ) : (
                <FlatList data={filteredTx} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 4 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const sc = statusConfig[item.status] || statusConfig.PENDING;
                        const StatusIcon = sc.icon;
                        return (
                            <TouchableOpacity onPress={() => handleStatusUpdate(item)} style={{ marginBottom: 12 }}>
                                <NeuBox borderRadius={22} style={{ padding: 18 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#6B7280' : '#94A3B8', marginBottom: 4 }}>{item.invoiceNumber}</Text>
                                            <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#E5E7EB' : '#1F2937' }}>{item.vehicle?.make} {item.vehicle?.model}</Text>
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#9CA3AF' : '#64748B', marginTop: 2 }}>{item.customer?.name}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: sc.color + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                                                <StatusIcon size={10} color={sc.color} />
                                                <Text style={{ fontSize: 9, fontWeight: '900', color: sc.color }}>{sc.label}</Text>
                                            </View>
                                            <Text style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#60A5FA' : '#2563EB', marginTop: 8 }}>Rp {fmt(Number(item.finalPrice))}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#E2E8F0' }}>
                                        <Text style={{ fontSize: 9, fontWeight: '900', color: isDark ? '#6B7280' : '#94A3B8' }}>{item.type === 'SALE' ? 'PENJUALAN' : 'PEMBELIAN'} • {item.paymentType}</Text>
                                        <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#94A3B8' }}>{new Date(item.date).toLocaleDateString('id-ID')}</Text>
                                    </View>
                                </NeuBox>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingTop: 60 }}>
                            <NeuBox borderRadius={40} style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                <FileText size={36} color={isDark ? '#4B5563' : '#9CA3AF'} />
                            </NeuBox>
                            <Text style={{ fontWeight: '700', color: isDark ? '#6B7280' : '#94A3B8' }}>Belum ada transaksi</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity onPress={() => setShowForm(true)} style={{ position: 'absolute', bottom: 110, right: 24, zIndex: 99 }}>
                <NeuBox borderRadius={28} style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={24} color={isDark ? '#60A5FA' : '#2563EB'} />
                </NeuBox>
            </TouchableOpacity>

            <CreateTransactionModal
                visible={showForm}
                onClose={() => setShowForm(false)}
                onCreated={() => { setShowForm(false); loadTransactions(); }}
                mode={mode}
                isDark={isDark}
                colors={colors}
            />
        </SafeAreaView>
    );
}

// ── Create Transaction Modal ───────────────────────────────────────────────────
function CreateTransactionModal({ visible, onClose, onCreated, mode, isDark, colors }: any) {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        type: 'SALE',
        vehicleId: '',
        customerId: '',
        paymentType: 'CASH',
        finalPrice: '',
        notes: '',
        creditType: 'REGULAR',
        leasingCompany: '',
        downPayment: '',
        interestRate: '',
        tenorMonths: '12',
    });

    const [vehicleSearch, setVehicleSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [pickVehicle, setPickVehicle] = useState(false);
    const [pickCustomer, setPickCustomer] = useState(false);

    useEffect(() => {
        if (visible) {
            setLoading(true);
            Promise.all([vehicleService.getVehicles(), customerService.getCustomers()])
                .then(([v, c]) => { setVehicles(Array.isArray(v) ? v : []); setCustomers(Array.isArray(c) ? c : []); })
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [visible]);

    const handleSave = async () => {
        if (!form.vehicleId || !form.customerId || !form.finalPrice) {
            return Alert.alert('Error', 'Kendaraan, customer, dan harga wajib diisi');
        }
        setSaving(true);
        try {
            const payload: any = {
                type: form.type,
                vehicleId: form.vehicleId,
                customerId: form.customerId,
                paymentType: form.paymentType,
                finalPrice: Number(form.finalPrice),
                notes: form.notes,
            };
            if (form.paymentType === 'CREDIT') {
                payload.creditData = {
                    creditType: form.creditType,
                    leasingCompany: form.leasingCompany,
                    downPayment: Number(form.downPayment),
                    interestRate: Number(form.interestRate),
                    tenorMonths: Number(form.tenorMonths),
                };
            }
            await transactionService.createTransaction(payload);
            onCreated();
        } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Gagal menyimpan transaksi'); }
        finally { setSaving(false); }
    };

    const filteredVehicles = vehicles.filter(v =>
        !vehicleSearch || `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(vehicleSearch.toLowerCase())
    ).filter(v => v.status === 'AVAILABLE');

    const filteredCustomers = customers.filter(c =>
        !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)
    );

    const SelectPicker = ({ data, search, onSearch, onSelect, renderItem, visible, onClose, title }: any) => (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <GlassView intensity={90} borderRadius={32} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '70%', padding: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#E5E7EB' : '#1F2937' }}>{title}</Text>
                        <TouchableOpacity onPress={onClose}><X size={20} color={isDark ? '#9CA3AF' : '#64748B'} /></TouchableOpacity>
                    </View>
                    <NeuBox pressed borderRadius={14} style={{ height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 12 }}>
                        <Search size={14} color={isDark ? '#6B7280' : '#94A3B8'} style={{ marginRight: 8 }} />
                        <TextInput value={search} onChangeText={onSearch} placeholder="Cari..." placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                            style={{ flex: 1, fontSize: 13, fontWeight: '700', color: isDark ? '#E5E7EB' : '#1E293B' }} />
                    </NeuBox>
                    <FlatList data={data} keyExtractor={(_: any, i: number) => String(i)} renderItem={renderItem}
                        onScrollBeginDrag={() => { }} keyboardShouldPersistTaps="handled" />
                </GlassView>
            </View>
        </Modal>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                    <GlassView intensity={80} borderRadius={32} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '90%' }}>
                        <View style={{ padding: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#E5E7EB' : '#1F2937' }}>Transaksi Baru</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <NeuBox borderRadius={20} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={18} color={isDark ? '#9CA3AF' : '#64748B'} />
                                    </NeuBox>
                                </TouchableOpacity>
                            </View>

                            {loading ? <ActivityIndicator color={isDark ? '#60A5FA' : '#2563EB'} style={{ marginVertical: 40 }} /> : (
                                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    {/* Tipe Transaksi */}
                                    <Text style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8, marginLeft: 4, opacity: 0.6, color: isDark ? '#D1D5DB' : '#374151' }}>TIPE TRANSAKSI</Text>
                                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                                        {['SALE', 'PURCHASE'].map(t => (
                                            <TouchableOpacity key={t} onPress={() => setForm(p => ({ ...p, type: t }))} style={{ flex: 1 }}>
                                                <NeuBox pressed={form.type === t} borderRadius={14} style={{ height: 46, alignItems: 'center', justifyContent: 'center' }}>
                                                    <Text style={{ fontSize: 11, fontWeight: '900', color: form.type === t ? (isDark ? '#60A5FA' : '#2563EB') : (isDark ? '#6B7280' : '#94A3B8') }}>{t === 'SALE' ? '🚗 PENJUALAN' : '🏪 PEMBELIAN'}</Text>
                                                </NeuBox>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Pilih Kendaraan */}
                                    <Text style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8, marginLeft: 4, opacity: 0.6, color: isDark ? '#D1D5DB' : '#374151' }}>KENDARAAN *</Text>
                                    <TouchableOpacity onPress={() => setPickVehicle(true)} style={{ marginBottom: 16 }}>
                                        <NeuBox pressed borderRadius={16} style={{ height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: selectedVehicle ? (isDark ? '#E5E7EB' : '#1E293B') : (isDark ? '#4B5563' : '#94A3B8') }}>
                                                {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.year}` : 'Pilih kendaraan tersedia...'}
                                            </Text>
                                            <ChevronDown size={16} color={isDark ? '#6B7280' : '#94A3B8'} />
                                        </NeuBox>
                                    </TouchableOpacity>

                                    {/* Pilih Customer */}
                                    <Text style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8, marginLeft: 4, opacity: 0.6, color: isDark ? '#D1D5DB' : '#374151' }}>CUSTOMER *</Text>
                                    <TouchableOpacity onPress={() => setPickCustomer(true)} style={{ marginBottom: 16 }}>
                                        <NeuBox pressed borderRadius={16} style={{ height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: selectedCustomer ? (isDark ? '#E5E7EB' : '#1E293B') : (isDark ? '#4B5563' : '#94A3B8') }}>
                                                {selectedCustomer ? `${selectedCustomer.name} — ${selectedCustomer.phone}` : 'Pilih customer...'}
                                            </Text>
                                            <ChevronDown size={16} color={isDark ? '#6B7280' : '#94A3B8'} />
                                        </NeuBox>
                                    </TouchableOpacity>

                                    {/* Harga */}
                                    <Text style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8, marginLeft: 4, opacity: 0.6, color: isDark ? '#D1D5DB' : '#374151' }}>HARGA FINAL (Rp) *</Text>
                                    <NeuBox pressed borderRadius={16} style={{ height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                                        <TextInput value={form.finalPrice} onChangeText={v => setForm(p => ({ ...p, finalPrice: v }))} keyboardType="numeric" placeholder="250000000"
                                            placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                                            style={{ flex: 1, fontSize: 14, fontWeight: '700', color: isDark ? '#E5E7EB' : '#1E293B' }} />
                                    </NeuBox>

                                    {/* Tipe Pembayaran */}
                                    <Text style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8, marginLeft: 4, opacity: 0.6, color: isDark ? '#D1D5DB' : '#374151' }}>TIPE PEMBAYARAN</Text>
                                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                                        {['CASH', 'CREDIT', 'INDENT'].map(t => (
                                            <TouchableOpacity key={t} onPress={() => setForm(p => ({ ...p, paymentType: t }))} style={{ flex: 1 }}>
                                                <NeuBox pressed={form.paymentType === t} borderRadius={14} style={{ height: 46, alignItems: 'center', justifyContent: 'center' }}>
                                                    <Text style={{ fontSize: 10, fontWeight: '900', color: form.paymentType === t ? (isDark ? '#60A5FA' : '#2563EB') : (isDark ? '#6B7280' : '#94A3B8') }}>{t}</Text>
                                                </NeuBox>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Kredit Section */}
                                    {form.paymentType === 'CREDIT' && (
                                        <NeuBox pressed borderRadius={20} style={{ padding: 16, marginBottom: 16 }}>
                                            <Text style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12, opacity: 0.7, color: isDark ? '#D1D5DB' : '#374151', fontWeight: '900' }}>DATA KREDIT</Text>
                                            {[
                                                { label: 'Leasing Company', key: 'leasingCompany', placeholder: 'BAF, FIF, Adira...' },
                                                { label: 'Uang Muka (Rp)', key: 'downPayment', placeholder: '50000000', keyboardType: 'numeric' },
                                                { label: 'Bunga / Tahun (%)', key: 'interestRate', placeholder: '5', keyboardType: 'numeric' },
                                                { label: 'Tenor (Bulan)', key: 'tenorMonths', placeholder: '24', keyboardType: 'numeric' },
                                            ].map(field => (
                                                <View key={field.key} style={{ marginBottom: 10 }}>
                                                    <Text style={{ fontSize: 9, letterSpacing: 1.5, marginBottom: 6, marginLeft: 2, opacity: 0.6, color: isDark ? '#D1D5DB' : '#374151' }}>{field.label.toUpperCase()}</Text>
                                                    <TextInput
                                                        value={(form as any)[field.key]}
                                                        onChangeText={v => setForm(p => ({ ...p, [field.key]: v }))}
                                                        placeholder={field.placeholder}
                                                        placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                                                        keyboardType={(field as any).keyboardType || 'default'}
                                                        style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#E5E7EB' : '#1E293B', borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#E2E8F0', paddingVertical: 8 }}
                                                    />
                                                </View>
                                            ))}
                                        </NeuBox>
                                    )}

                                    <TouchableOpacity onPress={handleSave} disabled={saving} style={{ marginBottom: 16 }}>
                                        <NeuBox borderRadius={20} style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
                                            {saving ? <ActivityIndicator color={isDark ? '#60A5FA' : '#2563EB'} />
                                                : <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 2, color: isDark ? '#60A5FA' : '#2563EB' }}>SIMPAN TRANSAKSI</Text>}
                                        </NeuBox>
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                        </View>
                    </GlassView>
                </View>
            </KeyboardAvoidingView>

            {/* Vehicle Picker */}
            <SelectPicker visible={pickVehicle} onClose={() => setPickVehicle(false)} title="Pilih Kendaraan"
                search={vehicleSearch} onSearch={setVehicleSearch} data={filteredVehicles}
                renderItem={({ item }: any) => (
                    <TouchableOpacity onPress={() => { setSelectedVehicle(item); setForm(p => ({ ...p, vehicleId: item.id })); setPickVehicle(false); }}
                        style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#F1F5F9' }}>
                        <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#E5E7EB' : '#1F2937' }}>{item.make} {item.model} {item.year}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#22C55E', marginTop: 2 }}>Rp {fmt(Number(item.sellingPrice || item.purchasePrice || 0))}</Text>
                    </TouchableOpacity>
                )}
            />

            {/* Customer Picker */}
            <SelectPicker visible={pickCustomer} onClose={() => setPickCustomer(false)} title="Pilih Customer"
                search={customerSearch} onSearch={setCustomerSearch} data={filteredCustomers}
                renderItem={({ item }: any) => (
                    <TouchableOpacity onPress={() => { setSelectedCustomer(item); setForm(p => ({ ...p, customerId: item.id })); setPickCustomer(false); }}
                        style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#F1F5F9' }}>
                        <Text style={{ fontWeight: '900', fontSize: 14, color: isDark ? '#E5E7EB' : '#1F2937' }}>{item.name}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#64748B', marginTop: 2 }}>{item.phone}</Text>
                    </TouchableOpacity>
                )}
            />
        </Modal>
    );
}
