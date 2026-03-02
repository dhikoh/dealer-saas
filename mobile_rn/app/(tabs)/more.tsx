import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, FlatList, Alert,
    TextInput, ActivityIndicator, Modal, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Users, DollarSign, Bell, Settings, ChevronRight, Trash2, ArrowLeft,
    BarChart3, UserPlus, Building2, X, Edit3, Plus, Phone, Mail, MapPin,
    Lock, Tag, Calendar
} from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { customerService } from '../../services/customer.service';
import { financeService } from '../../services/finance.service';
import { notificationService } from '../../services/notification.service';
import { staffService } from '../../services/staff.service';
import { branchService } from '../../services/branch.service';
import { transactionService } from '../../services/transaction.service';
import clsx from 'clsx';
import GlassView from '../../components/GlassView';
import NeuBox from '../../components/NeuBox';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

type SubScreen = 'menu' | 'customers' | 'staff' | 'finance' | 'reports' | 'branches' | 'notifications' | 'settings';

// ── Reusable Form Components ──────────────────────────────────────────────────
const FormInput = ({ label, value, onChange, placeholder, keyboardType, secureTextEntry, colors, mode, icon: Icon }: any) => (
    <View className="mb-4">
        <Text style={{ fontSize: 10, letterSpacing: 1.5, marginBottom: 8, marginLeft: 4, opacity: 0.6 }}
            className={colors.textMain}>{label?.toUpperCase()}</Text>
        <NeuBox pressed borderRadius={16} style={{ height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
            {Icon && <Icon size={16} color={mode === 'dark' ? '#6B7280' : '#94A3B8'} style={{ marginRight: 10 }} />}
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={mode === 'dark' ? '#4B5563' : '#94A3B8'}
                keyboardType={keyboardType || 'default'}
                secureTextEntry={secureTextEntry}
                style={{ flex: 1, fontSize: 14, fontWeight: '700', color: mode === 'dark' ? '#E5E7EB' : '#1E293B' }}
            />
        </NeuBox>
    </View>
);

const FormModal = ({ visible, onClose, title, onSave, saving, children, colors, mode }: any) => {
    const isDark = mode === 'dark';
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
                    <GlassView intensity={80} borderRadius={32} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '85%' }}>
                        <View style={{ padding: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#E5E7EB' : '#1F2937' }}>{title}</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <NeuBox borderRadius={20} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={18} color={isDark ? '#9CA3AF' : '#64748B'} />
                                    </NeuBox>
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                {children}
                                <TouchableOpacity onPress={onSave} disabled={saving} style={{ marginTop: 8, marginBottom: 16 }}>
                                    <NeuBox borderRadius={20} style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
                                        {saving
                                            ? <ActivityIndicator color={isDark ? '#60A5FA' : '#2563EB'} />
                                            : <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 2, color: isDark ? '#60A5FA' : '#2563EB' }}>SIMPAN</Text>
                                        }
                                    </NeuBox>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </GlassView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const FAB = ({ onPress, mode }: { onPress: () => void; mode: any }) => (
    <TouchableOpacity onPress={onPress} style={{ position: 'absolute', bottom: 110, right: 24, zIndex: 99 }}>
        <NeuBox borderRadius={28} style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={24} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
        </NeuBox>
    </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MoreScreen() {
    const { colors, mode } = useTheme();
    const [subScreen, setSubScreen] = useState<SubScreen>('menu');

    if (subScreen === 'customers') return <CustomersView colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'staff') return <StaffView colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'finance') return <FinanceView colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'reports') return <ReportsView colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'branches') return <BranchesView colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'notifications') return <NotificationsView colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'settings') return <SettingsView colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;

    const menuItems = [
        { icon: Users, label: 'Customer', desc: 'Kelola data pelanggan', screen: 'customers' as SubScreen },
        { icon: UserPlus, label: 'Staff', desc: 'Manajemen karyawan', screen: 'staff' as SubScreen },
        { icon: DollarSign, label: 'Keuangan', desc: 'Pengeluaran operasional', screen: 'finance' as SubScreen },
        { icon: BarChart3, label: 'Laporan', desc: 'Statistik & grafik penjualan', screen: 'reports' as SubScreen },
        { icon: Building2, label: 'Cabang', desc: 'Kelola cabang dealer', screen: 'branches' as SubScreen },
        { icon: Bell, label: 'Notifikasi', desc: 'Pemberitahuan & alert', screen: 'notifications' as SubScreen },
        { icon: Settings, label: 'Pengaturan', desc: 'Konfigurasi aplikasi', screen: 'settings' as SubScreen },
    ];

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <View className="px-6 pt-6 pb-4">
                <Text className={clsx('text-3xl font-black tracking-tight', colors.textMain)}>Lainnya</Text>
                <Text className={clsx('text-xs font-bold mt-1', colors.textMuted)}>Kelola bisnis dealer Anda</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
                {menuItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <TouchableOpacity key={i} onPress={() => setSubScreen(item.screen)} style={{ marginBottom: 12 }}>
                            <NeuBox borderRadius={24} style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
                                <GlassView intensity={40} borderRadius={16} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                    <Icon size={22} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                                </GlassView>
                                <View style={{ flex: 1 }}>
                                    <Text className={clsx('font-black text-base', colors.textMain)}>{item.label}</Text>
                                    <Text className={clsx('text-xs font-bold mt-0.5', colors.textMuted)}>{item.desc}</Text>
                                </View>
                                <ChevronRight size={18} color={mode === 'dark' ? '#4B5563' : '#CBD5E1'} />
                            </NeuBox>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
function CustomersView({ colors, mode, onBack }: any) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', ktpNumber: '', type: 'INDIVIDUAL', source: '' });

    useEffect(() => { loadCustomers(); }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try { const data = await customerService.getCustomers(); setCustomers(data); }
        catch { } finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditItem(null);
        setForm({ name: '', phone: '', email: '', address: '', ktpNumber: '', type: 'INDIVIDUAL', source: '' });
        setShowForm(true);
    };

    const openEdit = (item: any) => {
        setEditItem(item);
        setForm({ name: item.name || '', phone: item.phone || '', email: item.email || '', address: item.address || '', ktpNumber: item.ktpNumber || '', type: item.type || 'INDIVIDUAL', source: item.source || '' });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.phone) return Alert.alert('Error', 'Nama dan nomor HP wajib diisi');
        setSaving(true);
        try {
            if (editItem) await customerService.updateCustomer(editItem.id, form);
            else await customerService.createCustomer(form);
            setShowForm(false);
            loadCustomers();
        } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert('Hapus Customer', `Hapus ${name}?`, [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: async () => { try { await customerService.deleteCustomer(id); setCustomers(c => c.filter(x => x.id !== id)); } catch { Alert.alert('Error', 'Gagal menghapus'); } } }
        ]);
    };

    const filtered = customers.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <SubHeader title="Customer" onBack={onBack} mode={mode} colors={colors} count={customers.length} />
            <View className="px-5 mb-3">
                <NeuBox pressed borderRadius={16} style={{ height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                    <TextInput placeholder="Cari nama / nomor HP..." value={search} onChangeText={setSearch}
                        placeholderTextColor={mode === 'dark' ? '#4B5563' : '#94A3B8'}
                        style={{ flex: 1, fontSize: 13, fontWeight: '700', color: mode === 'dark' ? '#E5E7EB' : '#1E293B' }} />
                </NeuBox>
            </View>
            {loading ? <Loading mode={mode} /> : (
                <FlatList data={filtered} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 4 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => openEdit(item)} style={{ marginBottom: 10 }}>
                            <NeuBox borderRadius={20} style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                <GlassView intensity={40} borderRadius={22} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '900', color: mode === 'dark' ? '#60A5FA' : '#2563EB' }}>{(item.name || 'U').charAt(0)}</Text>
                                </GlassView>
                                <View style={{ flex: 1 }}>
                                    <Text className={clsx('font-black text-sm', colors.textMain)}>{item.name}</Text>
                                    <Text className={clsx('text-xs font-bold mt-0.5', colors.textMuted)}>{item.phone}</Text>
                                    {item.email && <Text className={clsx('text-[10px] font-bold mt-0.5', colors.textMuted)}>{item.email}</Text>}
                                </View>
                                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                    <NeuBox pressed borderRadius={10} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                                        <Text style={{ fontSize: 8, fontWeight: '900', color: mode === 'dark' ? '#9CA3AF' : '#64748B' }}>{item.type || 'INDIVIDUAL'}</Text>
                                    </NeuBox>
                                    <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ padding: 4 }}>
                                        <Trash2 size={14} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </NeuBox>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<EmptyState icon={Users} text="Belum ada customer" mode={mode} colors={colors} />}
                />
            )}
            <FAB onPress={openCreate} mode={mode} />

            <FormModal visible={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Customer' : 'Tambah Customer'}
                onSave={handleSave} saving={saving} colors={colors} mode={mode}>
                <FormInput label="Nama Lengkap *" value={form.name} onChange={(v: string) => setForm(p => ({ ...p, name: v }))} placeholder="Nama customer" icon={Users} colors={colors} mode={mode} />
                <FormInput label="Nomor HP *" value={form.phone} onChange={(v: string) => setForm(p => ({ ...p, phone: v }))} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" icon={Phone} colors={colors} mode={mode} />
                <FormInput label="Email" value={form.email} onChange={(v: string) => setForm(p => ({ ...p, email: v }))} placeholder="email@example.com" keyboardType="email-address" icon={Mail} colors={colors} mode={mode} />
                <FormInput label="Nomor KTP" value={form.ktpNumber} onChange={(v: string) => setForm(p => ({ ...p, ktpNumber: v }))} placeholder="16 digit NIK" keyboardType="numeric" icon={Tag} colors={colors} mode={mode} />
                <FormInput label="Alamat" value={form.address} onChange={(v: string) => setForm(p => ({ ...p, address: v }))} placeholder="Alamat lengkap" icon={MapPin} colors={colors} mode={mode} />
                <View className="mb-4">
                    <Text style={{ fontSize: 10, letterSpacing: 1.5, marginBottom: 8, marginLeft: 4, opacity: 0.6, color: mode === 'dark' ? '#D1D5DB' : '#374151' }}>TIPE</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {['INDIVIDUAL', 'COMPANY'].map(t => (
                            <TouchableOpacity key={t} onPress={() => setForm(p => ({ ...p, type: t }))} style={{ flex: 1 }}>
                                <NeuBox pressed={form.type === t} borderRadius={14} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 11, fontWeight: '900', color: form.type === t ? (mode === 'dark' ? '#60A5FA' : '#2563EB') : (mode === 'dark' ? '#6B7280' : '#94A3B8') }}>{t}</Text>
                                </NeuBox>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <FormInput label="Sumber" value={form.source} onChange={(v: string) => setForm(p => ({ ...p, source: v }))} placeholder="Referral, Instagram, Walk-in..." icon={Tag} colors={colors} mode={mode} />
            </FormModal>
        </SafeAreaView>
    );
}

// ── STAFF ──────────────────────────────────────────────────────────────────────
function StaffView({ colors, mode, onBack }: any) {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SALES', phone: '' });

    const ROLES = ['OWNER', 'MANAGER', 'SALES', 'ADMIN', 'STAFF'];

    useEffect(() => { loadStaff(); }, []);

    const loadStaff = async () => {
        setLoading(true);
        try { const data = await staffService.getStaff(); setStaff(data); }
        catch { } finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditItem(null);
        setForm({ name: '', email: '', password: '', role: 'SALES', phone: '' });
        setShowForm(true);
    };

    const openEdit = (item: any) => {
        setEditItem(item);
        setForm({ name: item.name || '', email: item.email || '', password: '', role: item.role || 'SALES', phone: item.phone || '' });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.email) return Alert.alert('Error', 'Nama dan email wajib diisi');
        if (!editItem && !form.password) return Alert.alert('Error', 'Password wajib diisi untuk staff baru');
        setSaving(true);
        try {
            if (editItem) {
                const payload: any = { name: form.name, role: form.role, phone: form.phone };
                if (form.password) payload.password = form.password;
                await staffService.updateStaff(editItem.id, payload);
            } else {
                await staffService.createStaff(form);
            }
            setShowForm(false);
            loadStaff();
        } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert('Hapus Staff', `Hapus ${name}?`, [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: async () => { try { await staffService.deleteStaff(id); setStaff(s => s.filter(x => x.id !== id)); } catch { Alert.alert('Error', 'Gagal menghapus'); } } }
        ]);
    };

    const roleColors: Record<string, string> = { OWNER: '#F59E0B', MANAGER: '#8B5CF6', SALES: '#22C55E', ADMIN: '#3B82F6', STAFF: '#94A3B8' };

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <SubHeader title="Staff" onBack={onBack} mode={mode} colors={colors} count={staff.length} />
            {loading ? <Loading mode={mode} /> : (
                <FlatList data={staff} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => item.role !== 'OWNER' && openEdit(item)} style={{ marginBottom: 10 }}>
                            <NeuBox borderRadius={20} style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                <GlassView intensity={40} borderRadius={22} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '900', color: roleColors[item.role] || '#94A3B8' }}>{(item.name || 'U').charAt(0)}</Text>
                                </GlassView>
                                <View style={{ flex: 1 }}>
                                    <Text className={clsx('font-black text-sm', colors.textMain)}>{item.name}</Text>
                                    <Text className={clsx('text-xs font-bold mt-0.5', colors.textMuted)}>{item.email}</Text>
                                    {item.phone && <Text className={clsx('text-[10px] font-bold mt-0.5', colors.textMuted)}>{item.phone}</Text>}
                                </View>
                                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: (roleColors[item.role] || '#94A3B8') + '22' }}>
                                        <Text style={{ fontSize: 8, fontWeight: '900', color: roleColors[item.role] || '#94A3B8' }}>{item.role}</Text>
                                    </View>
                                    {item.role !== 'OWNER' && (
                                        <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ padding: 4 }}>
                                            <Trash2 size={14} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </NeuBox>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<EmptyState icon={UserPlus} text="Belum ada staff" mode={mode} colors={colors} />}
                />
            )}
            <FAB onPress={openCreate} mode={mode} />

            <FormModal visible={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Staff' : 'Tambah Staff'}
                onSave={handleSave} saving={saving} colors={colors} mode={mode}>
                <FormInput label="Nama Lengkap *" value={form.name} onChange={(v: string) => setForm(p => ({ ...p, name: v }))} placeholder="Nama staff" icon={Users} colors={colors} mode={mode} />
                <FormInput label="Email *" value={form.email} onChange={(v: string) => setForm(p => ({ ...p, email: v }))} placeholder="email@example.com" keyboardType="email-address" icon={Mail} colors={colors} mode={mode} />
                <FormInput label={editItem ? "Password Baru (kosongkan jika tidak diubah)" : "Password *"} value={form.password} onChange={(v: string) => setForm(p => ({ ...p, password: v }))} placeholder="Min. 8 karakter" secureTextEntry icon={Lock} colors={colors} mode={mode} />
                <FormInput label="Nomor HP" value={form.phone} onChange={(v: string) => setForm(p => ({ ...p, phone: v }))} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" icon={Phone} colors={colors} mode={mode} />
                <View className="mb-4">
                    <Text style={{ fontSize: 10, letterSpacing: 1.5, marginBottom: 8, marginLeft: 4, opacity: 0.6, color: mode === 'dark' ? '#D1D5DB' : '#374151' }}>ROLE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {ROLES.filter(r => r !== 'OWNER').map(r => (
                            <TouchableOpacity key={r} onPress={() => setForm(p => ({ ...p, role: r }))}>
                                <NeuBox pressed={form.role === r} borderRadius={12} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '900', color: form.role === r ? (roleColors[r] || '#2563EB') : (mode === 'dark' ? '#6B7280' : '#94A3B8') }}>{r}</Text>
                                </NeuBox>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </FormModal>
        </SafeAreaView>
    );
}

// ── FINANCE ────────────────────────────────────────────────────────────────────
function FinanceView({ colors, mode, onBack }: any) {
    const [costs, setCosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterCat, setFilterCat] = useState('ALL');
    const [form, setForm] = useState({ name: '', amount: '', category: 'OPERASIONAL', date: new Date().toISOString().split('T')[0], note: '' });

    const CATEGORIES = ['OPERASIONAL', 'GAJI', 'SEWA', 'LISTRIK', 'BBM', 'PERAWATAN', 'MARKETING', 'LAIN-LAIN'];

    useEffect(() => { loadCosts(); }, []);

    const loadCosts = async () => {
        setLoading(true);
        try { const data = await financeService.getCosts(); setCosts(data); }
        catch { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!form.name || !form.amount) return Alert.alert('Error', 'Nama dan jumlah wajib diisi');
        setSaving(true);
        try {
            await financeService.createCost({ name: form.name, amount: Number(form.amount), category: form.category, date: form.date, note: form.note });
            setShowForm(false);
            setForm({ name: '', amount: '', category: 'OPERASIONAL', date: new Date().toISOString().split('T')[0], note: '' });
            loadCosts();
        } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Hapus', 'Hapus pengeluaran ini?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: async () => { try { await financeService.deleteCost(id); setCosts(c => c.filter(x => x.id !== id)); } catch { Alert.alert('Error', 'Gagal menghapus'); } } }
        ]);
    };

    const filtered = costs.filter(c => filterCat === 'ALL' || c.category === filterCat);
    const total = filtered.reduce((s, c) => s + Number(c.amount), 0);

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <SubHeader title="Keuangan" onBack={onBack} mode={mode} colors={colors} count={costs.length} />
            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                <NeuBox borderRadius={24} style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6, color: mode === 'dark' ? '#D1D5DB' : '#374151' }}>TOTAL PENGELUARAN</Text>
                    <Text style={{ fontSize: 28, fontWeight: '900', marginTop: 8, color: '#EF4444' }}>Rp {fmt(total)}</Text>
                </NeuBox>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginBottom: 8, flexGrow: 0 }}>
                {['ALL', ...CATEGORIES].map(cat => (
                    <TouchableOpacity key={cat} onPress={() => setFilterCat(cat)} style={{ marginRight: 8 }}>
                        <NeuBox pressed={filterCat === cat} borderRadius={12} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: filterCat === cat ? (mode === 'dark' ? '#60A5FA' : '#2563EB') : (mode === 'dark' ? '#6B7280' : '#94A3B8') }}>{cat}</Text>
                        </NeuBox>
                    </TouchableOpacity>
                ))}
                <View style={{ width: 20 }} />
            </ScrollView>
            {loading ? <Loading mode={mode} /> : (
                <FlatList data={filtered} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 4 }}
                    renderItem={({ item }) => (
                        <NeuBox borderRadius={20} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10 }}>
                            <GlassView intensity={40} borderRadius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <DollarSign size={20} color="#EF4444" />
                            </GlassView>
                            <View style={{ flex: 1 }}>
                                <Text className={clsx('font-black text-sm', colors.textMain)}>{item.name}</Text>
                                <Text style={{ fontSize: 9, fontWeight: '900', marginTop: 2, color: mode === 'dark' ? '#6B7280' : '#94A3B8' }}>{item.category} • {new Date(item.date).toLocaleDateString('id-ID')}</Text>
                                {item.note && <Text className={clsx('text-[10px] font-bold mt-0.5', colors.textMuted)}>{item.note}</Text>}
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                <Text style={{ fontSize: 14, fontWeight: '900', color: '#EF4444' }}>Rp {fmt(Number(item.amount))}</Text>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                                    <Trash2 size={14} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </NeuBox>
                    )}
                    ListEmptyComponent={<EmptyState icon={DollarSign} text="Belum ada pengeluaran" mode={mode} colors={colors} />}
                />
            )}
            <FAB onPress={() => setShowForm(true)} mode={mode} />

            <FormModal visible={showForm} onClose={() => setShowForm(false)} title="Tambah Pengeluaran"
                onSave={handleSave} saving={saving} colors={colors} mode={mode}>
                <FormInput label="Nama Pengeluaran *" value={form.name} onChange={(v: string) => setForm(p => ({ ...p, name: v }))} placeholder="Gaji karyawan, Listrik..." icon={Tag} colors={colors} mode={mode} />
                <FormInput label="Jumlah (Rp) *" value={form.amount} onChange={(v: string) => setForm(p => ({ ...p, amount: v }))} placeholder="500000" keyboardType="numeric" icon={DollarSign} colors={colors} mode={mode} />
                <FormInput label="Tanggal" value={form.date} onChange={(v: string) => setForm(p => ({ ...p, date: v }))} placeholder="YYYY-MM-DD" icon={Calendar} colors={colors} mode={mode} />
                <View className="mb-4">
                    <Text style={{ fontSize: 10, letterSpacing: 1.5, marginBottom: 8, marginLeft: 4, opacity: 0.6, color: mode === 'dark' ? '#D1D5DB' : '#374151' }}>KATEGORI</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {CATEGORIES.map(c => (
                            <TouchableOpacity key={c} onPress={() => setForm(p => ({ ...p, category: c }))}>
                                <NeuBox pressed={form.category === c} borderRadius={12} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', color: form.category === c ? (mode === 'dark' ? '#60A5FA' : '#2563EB') : (mode === 'dark' ? '#6B7280' : '#94A3B8') }}>{c}</Text>
                                </NeuBox>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <FormInput label="Catatan" value={form.note} onChange={(v: string) => setForm(p => ({ ...p, note: v }))} placeholder="Keterangan tambahan..." colors={colors} mode={mode} />
            </FormModal>
        </SafeAreaView>
    );
}

// ── REPORTS ────────────────────────────────────────────────────────────────────
function ReportsView({ colors, mode, onBack }: any) {
    const [monthlySales, setMonthlySales] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [salesData, txStats] = await Promise.all([
                    transactionService.getMonthlySales(6).catch(() => []),
                    transactionService.getStats().catch(() => null),
                ]);
                setMonthlySales(salesData);
                setStats(txStats);
            } catch { } finally { setLoading(false); }
        };
        load();
    }, []);

    const maxRevenue = Math.max(...monthlySales.map(m => m.revenue || 0), 1);

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <SubHeader title="Laporan" onBack={onBack} mode={mode} colors={colors} />
            {loading ? <Loading mode={mode} /> : (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 16 }}>
                    {stats && (
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                            {[
                                { label: 'Total Transaksi', value: stats.totalSalesCount, color: '#3B82F6' },
                                { label: 'Pending', value: stats.pendingCount, color: '#F59E0B' },
                                { label: 'Bulan Ini', value: stats.completedThisMonth, color: '#22C55E' },
                            ].map((s, i) => (
                                <NeuBox key={i} borderRadius={20} style={{ flex: 1, padding: 16, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 1, opacity: 0.6, color: mode === 'dark' ? '#D1D5DB' : '#374151' }}>{s.label.toUpperCase()}</Text>
                                    <Text style={{ fontSize: 22, fontWeight: '900', marginTop: 8, color: s.color }}>{s.value}</Text>
                                </NeuBox>
                            ))}
                        </View>
                    )}
                    {stats && (
                        <NeuBox borderRadius={24} style={{ padding: 20, marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 16, opacity: 0.6, color: mode === 'dark' ? '#D1D5DB' : '#374151' }}>REVENUE TOTAL</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View>
                                    <Text style={{ fontSize: 11, color: mode === 'dark' ? '#9CA3AF' : '#64748B', fontWeight: '700' }}>Penjualan</Text>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#22C55E' }}>Rp {fmt(Number(stats.totalSalesAmount || 0))}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 11, color: mode === 'dark' ? '#9CA3AF' : '#64748B', fontWeight: '700' }}>Pembelian</Text>
                                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#EF4444' }}>Rp {fmt(Number(stats.totalPurchaseAmount || 0))}</Text>
                                </View>
                            </View>
                        </NeuBox>
                    )}
                    <NeuBox borderRadius={24} style={{ padding: 20 }}>
                        <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 16, opacity: 0.6, color: mode === 'dark' ? '#D1D5DB' : '#374151' }}>PENJUALAN 6 BULAN TERAKHIR</Text>
                        {monthlySales.length > 0 ? monthlySales.map((m, i) => (
                            <View key={i} style={{ marginBottom: 14 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text className={clsx('text-xs font-black', colors.textMain)}>{m.month}</Text>
                                    <Text className={clsx('text-xs font-bold', colors.textMuted)}>{m.count} unit</Text>
                                </View>
                                <NeuBox pressed borderRadius={8} style={{ height: 12, overflow: 'hidden' }}>
                                    <View style={{ height: '100%', borderRadius: 8, backgroundColor: '#3B82F6', width: `${Math.max((m.revenue / maxRevenue) * 100, 2)}%` }} />
                                </NeuBox>
                            </View>
                        )) : <Text className={clsx('text-xs font-bold text-center py-4', colors.textMuted)}>Belum ada data</Text>}
                    </NeuBox>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ── BRANCHES ───────────────────────────────────────────────────────────────────
function BranchesView({ colors, mode, onBack }: any) {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', address: '', phone: '' });

    useEffect(() => { loadBranches(); }, []);

    const loadBranches = async () => {
        setLoading(true);
        try { const data = await branchService.getBranches(); setBranches(data); }
        catch { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!form.name) return Alert.alert('Error', 'Nama cabang wajib diisi');
        setSaving(true);
        try {
            await branchService.createBranch(form);
            setShowForm(false);
            setForm({ name: '', address: '', phone: '' });
            loadBranches();
        } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert('Hapus Cabang', `Hapus ${name}?`, [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: async () => { try { await branchService.deleteBranch(id); setBranches(b => b.filter(x => x.id !== id)); } catch { Alert.alert('Error', 'Gagal menghapus'); } } }
        ]);
    };

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <SubHeader title="Cabang" onBack={onBack} mode={mode} colors={colors} count={branches.length} />
            {loading ? <Loading mode={mode} /> : (
                <FlatList data={branches} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8 }}
                    renderItem={({ item }) => (
                        <NeuBox borderRadius={20} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10 }}>
                            <GlassView intensity={40} borderRadius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                <Building2 size={20} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                            </GlassView>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text className={clsx('font-black text-sm', colors.textMain)}>{item.name}</Text>
                                    {item.isMain && <View style={{ backgroundColor: '#3B82F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ fontSize: 8, fontWeight: '900', color: '#fff' }}>PUSAT</Text></View>}
                                </View>
                                {item.address && <Text className={clsx('text-xs font-bold mt-0.5', colors.textMuted)}>{item.address}</Text>}
                                {item.phone && <Text className={clsx('text-[10px] font-bold mt-0.5', colors.textMuted)}>{item.phone}</Text>}
                            </View>
                            {!item.isMain && (
                                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ padding: 8 }}>
                                    <Trash2 size={15} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </NeuBox>
                    )}
                    ListEmptyComponent={<EmptyState icon={Building2} text="Belum ada cabang" mode={mode} colors={colors} />}
                />
            )}
            <FAB onPress={() => setShowForm(true)} mode={mode} />

            <FormModal visible={showForm} onClose={() => setShowForm(false)} title="Tambah Cabang"
                onSave={handleSave} saving={saving} colors={colors} mode={mode}>
                <FormInput label="Nama Cabang *" value={form.name} onChange={(v: string) => setForm(p => ({ ...p, name: v }))} placeholder="Cabang Utara" icon={Building2} colors={colors} mode={mode} />
                <FormInput label="Alamat" value={form.address} onChange={(v: string) => setForm(p => ({ ...p, address: v }))} placeholder="Alamat lengkap cabang" icon={MapPin} colors={colors} mode={mode} />
                <FormInput label="Nomor Telepon" value={form.phone} onChange={(v: string) => setForm(p => ({ ...p, phone: v }))} placeholder="021xxxxxxxx" keyboardType="phone-pad" icon={Phone} colors={colors} mode={mode} />
            </FormModal>
        </SafeAreaView>
    );
}

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────
function NotificationsView({ colors, mode, onBack }: any) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadNotifs(); }, []);

    const loadNotifs = async () => {
        setLoading(true);
        try { const data = await notificationService.getNotifications(); setNotifications(data); }
        catch { } finally { setLoading(false); }
    };

    const handleMarkAllRead = async () => {
        try { await notificationService.markAllRead(); setNotifications(n => n.map(x => ({ ...x, read: true }))); }
        catch { }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
                        <NeuBox borderRadius={20} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeft size={20} color={mode === 'dark' ? '#E5E7EB' : '#1F2937'} />
                        </NeuBox>
                    </TouchableOpacity>
                    <View>
                        <Text className={clsx('text-xl font-black', colors.textMain)}>Notifikasi</Text>
                        {unreadCount > 0 && <Text style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>{unreadCount} belum dibaca</Text>}
                    </View>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllRead}>
                        <NeuBox borderRadius={14} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#3B82F6' }}>Baca Semua</Text>
                        </NeuBox>
                    </TouchableOpacity>
                )}
            </View>
            {loading ? <Loading mode={mode} /> : (
                <FlatList data={notifications} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={async () => { if (!item.read) { await notificationService.markAsRead(item.id); setNotifications(n => n.map(x => x.id === item.id ? { ...x, read: true } : x)); } }}
                            style={{ marginBottom: 10 }}>
                            <NeuBox borderRadius={20} style={{ padding: 16, borderLeftWidth: item.read ? 0 : 3, borderLeftColor: '#3B82F6' }}>
                                <Text className={clsx('font-black text-sm', colors.textMain)}>{item.title}</Text>
                                <Text className={clsx('text-xs font-bold mt-1', colors.textMuted)}>{item.message}</Text>
                                <Text style={{ fontSize: 9, fontWeight: '700', marginTop: 8, opacity: 0.5, color: mode === 'dark' ? '#D1D5DB' : '#374151' }}>{new Date(item.createdAt).toLocaleString('id-ID')}</Text>
                            </NeuBox>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<EmptyState icon={Bell} text="Tidak ada notifikasi" mode={mode} colors={colors} />}
                />
            )}
        </SafeAreaView>
    );
}

// ── SETTINGS ───────────────────────────────────────────────────────────────────
function SettingsView({ colors, mode, onBack }: any) {
    const { toggleTheme } = useTheme();
    const [pushNotif, setPushNotif] = useState(true);

    const groups = [
        { title: 'Tampilan', items: [{ label: 'Dark Mode', type: 'toggle' as const, value: mode === 'dark', onToggle: toggleTheme }] },
        { title: 'Notifikasi', items: [{ label: 'Push Notification', type: 'toggle' as const, value: pushNotif, onToggle: () => setPushNotif(!pushNotif) }] },
        { title: 'Informasi', items: [{ label: 'Versi Aplikasi', type: 'info' as const, info: '2.0.0 (Premium)' }, { label: 'Platform', type: 'info' as const, info: 'Android' }] },
    ];

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <SubHeader title="Pengaturan" onBack={onBack} mode={mode} colors={colors} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 16 }}>
                {groups.map((group, gi) => (
                    <View key={gi} style={{ marginBottom: 24 }}>
                        <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 12, marginLeft: 4, opacity: 0.6, color: mode === 'dark' ? '#D1D5DB' : '#374151' }}>{group.title.toUpperCase()}</Text>
                        <NeuBox borderRadius={24} style={{ overflow: 'hidden' }}>
                            {group.items.map((item: any, ii) => (
                                <View key={ii} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: ii < group.items.length - 1 ? 1 : 0, borderBottomColor: mode === 'dark' ? '#374151' : '#E2E8F0' }}>
                                    <Text className={clsx('font-black text-sm', colors.textMain)}>{item.label}</Text>
                                    {item.type === 'toggle' && <Switch value={item.value} onValueChange={item.onToggle} trackColor={{ false: '#767577', true: '#3B82F6' }} thumbColor={item.value ? '#BFDBFE' : '#f4f3f4'} />}
                                    {item.type === 'info' && <Text className={clsx('text-sm font-bold', colors.textMuted)}>{item.info}</Text>}
                                </View>
                            ))}
                        </NeuBox>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

// ── SHARED ─────────────────────────────────────────────────────────────────────
const SubHeader = ({ title, onBack, mode, colors, count }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, marginBottom: 4 }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 14 }}>
            <NeuBox borderRadius={20} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} color={mode === 'dark' ? '#E5E7EB' : '#1F2937'} />
            </NeuBox>
        </TouchableOpacity>
        <View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: mode === 'dark' ? '#E5E7EB' : '#1F2937' }}>{title}</Text>
            {count !== undefined && <Text style={{ fontSize: 10, fontWeight: '700', color: mode === 'dark' ? '#6B7280' : '#94A3B8', marginTop: 1 }}>{count} data tersedia</Text>}
        </View>
    </View>
);

const Loading = ({ mode }: any) => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
    </View>
);

const EmptyState = ({ icon: Icon, text, mode, colors }: any) => (
    <View style={{ alignItems: 'center', paddingTop: 80 }}>
        <NeuBox borderRadius={40} style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon size={36} color={mode === 'dark' ? '#4B5563' : '#9CA3AF'} />
        </NeuBox>
        <Text className={clsx('font-bold text-sm', colors.textMuted)}>{text}</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', opacity: 0.5, marginTop: 4, color: mode === 'dark' ? '#6B7280' : '#94A3B8' }}>Tekan + untuk menambahkan</Text>
    </View>
);
