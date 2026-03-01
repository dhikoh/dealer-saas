import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, TextInput, ActivityIndicator, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, DollarSign, Bell, Settings, ChevronRight, Trash2, ArrowLeft, MapPin, BarChart3, UserPlus, Building2, X, Edit3 } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { customerService } from '../../services/customer.service';
import { financeService } from '../../services/finance.service';
import { notificationService } from '../../services/notification.service';
import { staffService } from '../../services/staff.service';
import { branchService } from '../../services/branch.service';
import { transactionService } from '../../services/transaction.service';
import clsx from 'clsx';
import { Customer, OperatingCost, Notification as NotifType } from '../../constants/types';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

type SubScreen = 'menu' | 'customers' | 'staff' | 'finance' | 'reports' | 'branches' | 'notifications' | 'settings';

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
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <View className="px-6 pt-4 pb-6">
                <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>Lainnya</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
                {menuItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <TouchableOpacity key={i} onPress={() => setSubScreen(item.screen)}
                            className={clsx("flex-row items-center p-5 rounded-3xl mb-4", colors.iconContainer)}>
                            <View className={clsx("w-12 h-12 rounded-2xl items-center justify-center mr-4", colors.shadowIncome)}>
                                <Icon size={22} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                            </View>
                            <View className="flex-1">
                                <Text className={clsx("font-black text-base", colors.textMain)}>{item.label}</Text>
                                <Text className={clsx("text-xs font-bold mt-0.5", colors.textMuted)}>{item.desc}</Text>
                            </View>
                            <ChevronRight size={18} color={mode === 'dark' ? '#6B7280' : '#94A3B8'} />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

// ============== CUSTOMERS SUB-SCREEN ==============
function CustomersView({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { loadCustomers(); }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try { const data = await customerService.getCustomers(); setCustomers(data); }
        catch { /* fail silently */ }
        finally { setLoading(false); }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert('Hapus Customer', `Hapus ${name}?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus', style: 'destructive', onPress: async () => {
                    try { await customerService.deleteCustomer(id); setCustomers(c => c.filter(x => x.id !== id)); }
                    catch { Alert.alert('Error', 'Gagal menghapus'); }
                }
            },
        ]);
    };

    const filtered = customers.filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
    });

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Customer" onBack={onBack} mode={mode} colors={colors} />
            {loading ? <Loading mode={mode} colors={colors} /> : (
                <FlatList data={filtered} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                    renderItem={({ item }) => (
                        <View className={clsx("p-4 mb-3 rounded-3xl flex-row items-center", colors.iconContainer)}>
                            <View className={clsx("w-10 h-10 rounded-full items-center justify-center mr-3", colors.shadowIncome)}>
                                <Text className={clsx("font-black text-sm", colors.textHighlight)}>{item.name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className={clsx("font-black text-sm", colors.textMain)}>{item.name}</Text>
                                <Text className={clsx("text-xs font-bold", colors.textMuted)}>{item.phone}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} className="p-2">
                                <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<EmptyState icon={Users} text="Belum ada customer" mode={mode} colors={colors} />}
                />
            )}
        </SafeAreaView>
    );
}

// ============== STAFF SUB-SCREEN ==============
function StaffView({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStaff(); }, []);

    const loadStaff = async () => {
        setLoading(true);
        try { const data = await staffService.getStaff(); setStaff(data); }
        catch { /* fail silently */ }
        finally { setLoading(false); }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert('Hapus Staff', `Hapus ${name}?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus', style: 'destructive', onPress: async () => {
                    try { await staffService.deleteStaff(id); setStaff(s => s.filter(x => x.id !== id)); }
                    catch { Alert.alert('Error', 'Gagal menghapus'); }
                }
            },
        ]);
    };

    const roleLabel = (role: string) => {
        const map: Record<string, string> = { OWNER: 'Pemilik', MANAGER: 'Manager', SALES: 'Sales', ADMIN: 'Admin', STAFF: 'Staff' };
        return map[role] || role;
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Staff" onBack={onBack} mode={mode} colors={colors} />
            {loading ? <Loading mode={mode} colors={colors} /> : (
                <FlatList data={staff} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                    renderItem={({ item }) => (
                        <View className={clsx("p-4 mb-3 rounded-3xl flex-row items-center", colors.iconContainer)}>
                            <View className={clsx("w-10 h-10 rounded-full items-center justify-center mr-3", colors.shadowIncome)}>
                                <Text className={clsx("font-black text-sm", colors.textHighlight)}>{(item.name || 'U').charAt(0).toUpperCase()}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className={clsx("font-black text-sm", colors.textMain)}>{item.name}</Text>
                                <Text className={clsx("text-xs font-bold", colors.textMuted)}>{item.email}</Text>
                            </View>
                            <View className={clsx("px-3 py-1.5 rounded-lg mr-2", colors.shadowIncome)}>
                                <Text className={clsx("text-[9px] font-black uppercase tracking-widest", colors.textMuted)}>{roleLabel(item.role)}</Text>
                            </View>
                            {item.role !== 'OWNER' && (
                                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} className="p-2">
                                    <Trash2 size={14} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={<EmptyState icon={UserPlus} text="Belum ada staff" mode={mode} colors={colors} />}
                />
            )}
        </SafeAreaView>
    );
}

// ============== FINANCE SUB-SCREEN ==============
function FinanceView({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [costs, setCosts] = useState<OperatingCost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadCosts(); }, []);

    const loadCosts = async () => {
        setLoading(true);
        try { const data = await financeService.getCosts(); setCosts(data); }
        catch { /* fail silently */ }
        finally { setLoading(false); }
    };

    const total = costs.reduce((s, c) => s + Number(c.amount), 0);

    const handleDelete = (id: string) => {
        Alert.alert('Hapus', 'Hapus pengeluaran ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus', style: 'destructive', onPress: async () => {
                    try { await financeService.deleteCost(id); setCosts(c => c.filter(x => x.id !== id)); }
                    catch { Alert.alert('Error', 'Gagal menghapus'); }
                }
            },
        ]);
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Keuangan" onBack={onBack} mode={mode} colors={colors} />
            <View className="px-6 mt-4">
                <View className={clsx("p-5 rounded-3xl items-center", colors.iconContainer)}>
                    <Text className={clsx("text-[10px] font-black uppercase tracking-widest", colors.textMuted)}>Total Pengeluaran</Text>
                    <Text className="text-2xl font-black mt-2 text-red-500">Rp {fmt(total)}</Text>
                </View>
            </View>
            {loading ? <Loading mode={mode} colors={colors} /> : (
                <FlatList data={costs} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                    renderItem={({ item }) => (
                        <View className={clsx("p-4 mb-3 rounded-3xl flex-row items-center", colors.iconContainer)}>
                            <View className={clsx("w-10 h-10 rounded-full items-center justify-center mr-3", colors.shadowIncome)}>
                                <DollarSign size={18} color="#EF4444" />
                            </View>
                            <View className="flex-1">
                                <Text className={clsx("font-black text-sm", colors.textMain)}>{item.name}</Text>
                                <Text className={clsx("text-[10px] font-bold", colors.textMuted)}>{item.category}</Text>
                            </View>
                            <View className="items-end mr-2">
                                <Text className="text-sm font-black text-red-500">Rp {fmt(Number(item.amount))}</Text>
                                <Text className={clsx("text-[9px] font-bold", colors.textMuted)}>{new Date(item.date).toLocaleDateString('id-ID')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2"><Trash2 size={14} color="#EF4444" /></TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<EmptyState icon={DollarSign} text="Belum ada pengeluaran" mode={mode} colors={colors} />}
                />
            )}
        </SafeAreaView>
    );
}

// ============== REPORTS SUB-SCREEN ==============
function ReportsView({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
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
            } catch { /* fail silently */ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const maxRevenue = Math.max(...monthlySales.map(m => m.revenue || 0), 1);

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Laporan" onBack={onBack} mode={mode} colors={colors} />
            {loading ? <Loading mode={mode} colors={colors} /> : (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}>
                    {/* Summary Cards */}
                    {stats && (
                        <View className="flex-row gap-3 mb-6">
                            <View className={clsx("flex-1 p-4 rounded-3xl items-center", colors.iconContainer)}>
                                <Text className={clsx("text-[9px] font-black uppercase tracking-widest", colors.textMuted)}>Total Penjualan</Text>
                                <Text className={clsx("text-xl font-black mt-1", colors.textHighlight)}>{stats.totalSalesCount}</Text>
                            </View>
                            <View className={clsx("flex-1 p-4 rounded-3xl items-center", colors.iconContainer)}>
                                <Text className={clsx("text-[9px] font-black uppercase tracking-widest", colors.textMuted)}>Pending</Text>
                                <Text className={clsx("text-xl font-black mt-1 text-amber-500")}>{stats.pendingCount}</Text>
                            </View>
                            <View className={clsx("flex-1 p-4 rounded-3xl items-center", colors.iconContainer)}>
                                <Text className={clsx("text-[9px] font-black uppercase tracking-widest", colors.textMuted)}>Bulan Ini</Text>
                                <Text className={clsx("text-xl font-black mt-1 text-green-500")}>{stats.completedThisMonth}</Text>
                            </View>
                        </View>
                    )}

                    {/* Revenue Summary */}
                    {stats && (
                        <View className={clsx("p-5 rounded-3xl mb-6", colors.iconContainer)}>
                            <Text className={clsx("text-[10px] font-black uppercase tracking-widest mb-3", colors.textMuted)}>Revenue Total</Text>
                            <View className="flex-row justify-between">
                                <View>
                                    <Text className={clsx("text-xs font-bold", colors.textMuted)}>Penjualan</Text>
                                    <Text className={clsx("text-lg font-black text-green-500")}>Rp {fmt(Number(stats.totalSalesAmount || 0))}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className={clsx("text-xs font-bold", colors.textMuted)}>Pembelian</Text>
                                    <Text className={clsx("text-lg font-black text-red-500")}>Rp {fmt(Number(stats.totalPurchaseAmount || 0))}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Monthly Bar Chart */}
                    <View className={clsx("p-5 rounded-3xl", colors.iconContainer)}>
                        <Text className={clsx("text-[10px] font-black uppercase tracking-widest mb-4", colors.textMuted)}>Penjualan 6 Bulan Terakhir</Text>
                        {monthlySales.length > 0 ? (
                            <View className="gap-3">
                                {monthlySales.map((m, i) => (
                                    <View key={i}>
                                        <View className="flex-row justify-between mb-1">
                                            <Text className={clsx("text-xs font-black", colors.textMain)}>{m.month}</Text>
                                            <Text className={clsx("text-xs font-bold", colors.textMuted)}>{m.count} unit • Rp {fmt(m.revenue)}</Text>
                                        </View>
                                        <View className={clsx("h-3 rounded-full overflow-hidden", mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200')}>
                                            <View className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max((m.revenue / maxRevenue) * 100, 2)}%` }} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text className={clsx("text-xs font-bold text-center py-4", colors.textMuted)}>Belum ada data penjualan</Text>
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ============== BRANCHES SUB-SCREEN ==============
function BranchesView({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadBranches(); }, []);

    const loadBranches = async () => {
        setLoading(true);
        try { const data = await branchService.getBranches(); setBranches(data); }
        catch { /* fail silently */ }
        finally { setLoading(false); }
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert('Hapus Cabang', `Hapus ${name}?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus', style: 'destructive', onPress: async () => {
                    try { await branchService.deleteBranch(id); setBranches(b => b.filter(x => x.id !== id)); }
                    catch { Alert.alert('Error', 'Gagal menghapus'); }
                }
            },
        ]);
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Cabang" onBack={onBack} mode={mode} colors={colors} />
            {loading ? <Loading mode={mode} colors={colors} /> : (
                <FlatList data={branches} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                    renderItem={({ item }) => (
                        <View className={clsx("p-4 mb-3 rounded-3xl flex-row items-center", colors.iconContainer)}>
                            <View className={clsx("w-10 h-10 rounded-full items-center justify-center mr-3", colors.shadowIncome)}>
                                <Building2 size={18} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center gap-2">
                                    <Text className={clsx("font-black text-sm", colors.textMain)}>{item.name}</Text>
                                    {item.isMain && (
                                        <View className="bg-blue-500 px-2 py-0.5 rounded">
                                            <Text className="text-[8px] font-black text-white">PUSAT</Text>
                                        </View>
                                    )}
                                </View>
                                <Text className={clsx("text-xs font-bold mt-0.5", colors.textMuted)}>{item.address || 'No address'}</Text>
                            </View>
                            {!item.isMain && (
                                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} className="p-2">
                                    <Trash2 size={14} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={<EmptyState icon={Building2} text="Belum ada cabang" mode={mode} colors={colors} />}
                />
            )}
        </SafeAreaView>
    );
}

// ============== NOTIFICATIONS SUB-SCREEN ==============
function NotificationsView({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [notifications, setNotifications] = useState<NotifType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadNotifs(); }, []);

    const loadNotifs = async () => {
        setLoading(true);
        try { const data = await notificationService.getNotifications(); setNotifications(data); }
        catch { /* fail silently */ }
        finally { setLoading(false); }
    };

    const handleMarkAllRead = async () => {
        try { await notificationService.markAllRead(); setNotifications(n => n.map(x => ({ ...x, read: true }))); }
        catch { /* fail silently */ }
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={onBack} className="mr-3">
                        <ArrowLeft size={24} color={mode === 'dark' ? '#E5E7EB' : '#1F2937'} />
                    </TouchableOpacity>
                    <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>Notifikasi</Text>
                </View>
                <TouchableOpacity onPress={handleMarkAllRead}>
                    <Text className="text-xs font-black text-blue-500">Tandai semua dibaca</Text>
                </TouchableOpacity>
            </View>
            {loading ? <Loading mode={mode} colors={colors} /> : (
                <FlatList data={notifications} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={async () => {
                                if (!item.read) {
                                    await notificationService.markAsRead(item.id);
                                    setNotifications(n => n.map(x => x.id === item.id ? { ...x, read: true } : x));
                                }
                            }}
                            className={clsx("p-4 mb-3 rounded-3xl", colors.iconContainer, !item.read && 'border-l-4 border-blue-500')}>
                            <Text className={clsx("font-black text-sm", colors.textMain)}>{item.title}</Text>
                            <Text className={clsx("text-xs font-bold mt-1", colors.textMuted)}>{item.message}</Text>
                            <Text className={clsx("text-[9px] font-bold mt-2", colors.textMuted)}>{new Date(item.createdAt).toLocaleString('id-ID')}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<EmptyState icon={Bell} text="Tidak ada notifikasi" mode={mode} colors={colors} />}
                />
            )}
        </SafeAreaView>
    );
}

// ============== SETTINGS SUB-SCREEN ==============
function SettingsView({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const { toggleTheme } = useTheme();
    const [pushNotif, setPushNotif] = useState(true);

    const settingsGroups = [
        {
            title: 'Tampilan',
            items: [
                { label: 'Dark Mode', type: 'toggle' as const, value: mode === 'dark', onToggle: toggleTheme },
            ],
        },
        {
            title: 'Notifikasi',
            items: [
                { label: 'Push Notification', type: 'toggle' as const, value: pushNotif, onToggle: () => setPushNotif(!pushNotif) },
            ],
        },
        {
            title: 'Informasi',
            items: [
                { label: 'Versi Aplikasi', type: 'info' as const, info: '1.0.0' },
                { label: 'Build', type: 'info' as const, info: 'RN-Expo' },
            ],
        },
    ];

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Pengaturan" onBack={onBack} mode={mode} colors={colors} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}>
                {settingsGroups.map((group, gi) => (
                    <View key={gi} className="mb-6">
                        <Text className={clsx("text-[10px] font-black uppercase tracking-widest mb-3 pl-2", colors.textMuted)}>{group.title}</Text>
                        <View className={clsx("rounded-3xl overflow-hidden", colors.iconContainer)}>
                            {group.items.map((item, ii) => (
                                <View key={ii} className={clsx("flex-row justify-between items-center px-5 py-4",
                                    ii < group.items.length - 1 && (mode === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'))}>
                                    <Text className={clsx("font-black text-sm", colors.textMain)}>{item.label}</Text>
                                    {item.type === 'toggle' && (
                                        <Switch value={item.value} onValueChange={item.onToggle}
                                            trackColor={{ false: '#767577', true: '#3B82F6' }}
                                            thumbColor={item.value ? '#BFDBFE' : '#f4f3f4'} />
                                    )}
                                    {item.type === 'info' && (
                                        <Text className={clsx("text-sm font-bold", colors.textMuted)}>{item.info}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

// ============== SHARED COMPONENTS ==============
const SubHeader = ({ title, onBack, mode, colors }: { title: string; onBack: () => void; mode: any; colors: any }) => (
    <View className="flex-row items-center px-6 pt-4 pb-2">
        <TouchableOpacity onPress={onBack} className="mr-3">
            <ArrowLeft size={24} color={mode === 'dark' ? '#E5E7EB' : '#1F2937'} />
        </TouchableOpacity>
        <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>{title}</Text>
    </View>
);

const Loading = ({ mode, colors }: { mode: any; colors: any }) => (
    <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
    </View>
);

const EmptyState = ({ icon: Icon, text, mode, colors }: { icon: any; text: string; mode: any; colors: any }) => (
    <View className="items-center pt-20">
        <Icon size={48} color={mode === 'dark' ? '#4B5563' : '#9CA3AF'} />
        <Text className={clsx("mt-4 font-bold", colors.textMuted)}>{text}</Text>
    </View>
);
