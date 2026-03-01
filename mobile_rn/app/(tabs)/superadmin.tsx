import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Users, Building2, FileText, CheckCircle, ChevronRight, ArrowLeft, Trash2, XCircle, ChevronDown, DollarSign, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../components/AuthContext';
import { superadminService } from '../../services/superadmin.service';
import clsx from 'clsx';

const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

type SubScreen = 'menu' | 'dashboard' | 'tenants' | 'users' | 'invoices' | 'approvals';

export default function SuperadminScreen() {
    const { colors, mode } = useTheme();
    const { user } = useAuth();
    const [subScreen, setSubScreen] = useState<SubScreen>('menu');

    // Redirect non-superadmin
    if (user?.role !== 'SUPERADMIN') {
        return (
            <SafeAreaView className={clsx("flex-1 items-center justify-center", colors.bgApp)}>
                <Shield size={48} color="#EF4444" />
                <Text className={clsx("mt-4 text-lg font-black", colors.textMain)}>Akses Ditolak</Text>
                <Text className={clsx("mt-2 text-sm font-bold", colors.textMuted)}>Halaman ini hanya untuk Superadmin</Text>
            </SafeAreaView>
        );
    }

    if (subScreen === 'dashboard') return <SADashboard colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'tenants') return <SATenants colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'users') return <SAUsers colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'invoices') return <SAInvoices colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;
    if (subScreen === 'approvals') return <SAApprovals colors={colors} mode={mode} onBack={() => setSubScreen('menu')} />;

    const menuItems = [
        { icon: BarChart3, label: 'Dashboard', desc: 'Statistik platform', screen: 'dashboard' as SubScreen },
        { icon: Building2, label: 'Dealer / Tenant', desc: 'Kelola semua dealer', screen: 'tenants' as SubScreen },
        { icon: Users, label: 'Semua User', desc: 'Kelola seluruh pengguna', screen: 'users' as SubScreen },
        { icon: FileText, label: 'Invoice', desc: 'Tagihan & pembayaran', screen: 'invoices' as SubScreen },
        { icon: CheckCircle, label: 'Approval', desc: 'Permintaan persetujuan', screen: 'approvals' as SubScreen },
    ];

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <View className="px-6 pt-4 pb-2 flex-row items-center gap-3">
                <View className={clsx("w-10 h-10 rounded-full items-center justify-center", colors.shadowIncome)}>
                    <Shield size={20} color={mode === 'dark' ? '#F59E0B' : '#D97706'} />
                </View>
                <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>Superadmin</Text>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}>
                {menuItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <TouchableOpacity key={i} onPress={() => setSubScreen(item.screen)}
                            className={clsx("flex-row items-center p-5 rounded-3xl mb-4", colors.iconContainer)}>
                            <View className={clsx("w-12 h-12 rounded-2xl items-center justify-center mr-4", colors.shadowIncome)}>
                                <Icon size={22} color={mode === 'dark' ? '#F59E0B' : '#D97706'} />
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

// ============== SUPERADMIN DASHBOARD ==============
function SADashboard({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await superadminService.getStats();
                setStats(data);
            } catch { /* */ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Dashboard" onBack={onBack} mode={mode} colors={colors} />
            {loading ? <Loading mode={mode} /> : (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}>
                    <View className="flex-row flex-wrap gap-3">
                        {[
                            { label: 'Total Tenant', value: stats?.totalTenants ?? 0, color: 'text-blue-500' },
                            { label: 'Aktif', value: stats?.activeTenants ?? 0, color: 'text-green-500' },
                            { label: 'Total User', value: stats?.totalUsers ?? 0, color: 'text-purple-500' },
                            { label: 'Revenue', value: `Rp ${fmt(Number(stats?.totalRevenue ?? 0))}`, color: 'text-amber-500' },
                            { label: 'Invoice Pending', value: stats?.pendingInvoices ?? 0, color: 'text-red-500' },
                            { label: 'Trial Expired', value: stats?.expiredTrials ?? 0, color: 'text-orange-500' },
                        ].map((s, i) => (
                            <View key={i} className={clsx("p-4 rounded-3xl items-center", colors.iconContainer)} style={{ width: '47%' }}>
                                <Text className={clsx("text-[9px] font-black uppercase tracking-widest", colors.textMuted)}>{s.label}</Text>
                                <Text className={clsx("text-xl font-black mt-2", s.color)}>{s.value}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ============== TENANTS ==============
function SATenants({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { loadTenants(); }, []);

    const loadTenants = async () => {
        setLoading(true);
        try { const data = await superadminService.getTenants(search ? { search } : undefined); setTenants(data); }
        catch { /* */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const timer = setTimeout(() => { loadTenants(); }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleSuspend = (id: string, name: string) => {
        Alert.alert('Suspend', `Suspend ${name}?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Suspend', style: 'destructive', onPress: async () => {
                    try { await superadminService.suspendTenant(id, 'Suspended by admin'); loadTenants(); }
                    catch { Alert.alert('Error', 'Gagal suspend'); }
                }
            },
        ]);
    };

    const handleActivate = async (id: string) => {
        try { await superadminService.activateTenant(id); loadTenants(); }
        catch { Alert.alert('Error', 'Gagal aktivasi'); }
    };

    const statusColor = (s: string) => {
        if (s === 'ACTIVE') return 'text-green-500';
        if (s === 'SUSPENDED') return 'text-red-500';
        if (s === 'TRIAL') return 'text-amber-500';
        return colors.textMuted;
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Dealer / Tenant" onBack={onBack} mode={mode} colors={colors} />
            <View className="px-6 mt-2 mb-2">
                <TextInput placeholder="Cari dealer..." value={search} onChangeText={setSearch}
                    placeholderTextColor={mode === 'dark' ? '#6B7280' : '#94A3B8'}
                    className={clsx("w-full px-5 py-3 rounded-2xl text-sm font-bold",
                        colors.shadowIncome, mode === 'dark' ? 'bg-[#2A2D32] text-gray-200' : 'bg-[#E0E5EC] text-slate-700')} />
            </View>
            {loading ? <Loading mode={mode} /> : (
                <FlatList data={tenants} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 8 }}
                    renderItem={({ item }) => (
                        <View className={clsx("p-4 mb-3 rounded-3xl", colors.iconContainer)}>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className={clsx("font-black text-sm", colors.textMain)}>{item.name}</Text>
                                    <Text className={clsx("text-xs font-bold mt-0.5", colors.textMuted)}>
                                        {item.subscription?.plan?.name || 'No Plan'} • {item._count?.users || 0} user
                                    </Text>
                                </View>
                                <View className={clsx("px-3 py-1 rounded-lg", colors.shadowIncome)}>
                                    <Text className={clsx("text-[9px] font-black uppercase tracking-widest", statusColor(item.subscriptionStatus))}>
                                        {item.subscriptionStatus}
                                    </Text>
                                </View>
                            </View>
                            <View className={clsx("flex-row gap-2 mt-3 pt-3 border-t", mode === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
                                {item.subscriptionStatus === 'SUSPENDED' ? (
                                    <TouchableOpacity onPress={() => handleActivate(item.id)} className="flex-row items-center gap-1">
                                        <CheckCircle size={14} color="#22C55E" />
                                        <Text className="text-xs font-black text-green-500">Aktivasi</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity onPress={() => handleSuspend(item.id, item.name)} className="flex-row items-center gap-1">
                                        <XCircle size={14} color="#EF4444" />
                                        <Text className="text-xs font-black text-red-500">Suspend</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<EmptyState icon={Building2} text="Tidak ada tenant" mode={mode} colors={colors} />}
                />
            )}
        </SafeAreaView>
    );
}

// ============== ALL USERS ==============
function SAUsers({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await superadminService.getAllUsers(search ? { search } : undefined);
            setUsers(Array.isArray(data) ? data : data?.data || []);
        }
        catch { /* */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const timer = setTimeout(() => { loadUsers(); }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = (id: string, name: string) => {
        Alert.alert('Hapus User', `Hapus ${name}?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus', style: 'destructive', onPress: async () => {
                    try { await superadminService.deleteUser(id); setUsers(u => u.filter(x => x.id !== id)); }
                    catch { Alert.alert('Error', 'Gagal menghapus'); }
                }
            },
        ]);
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Semua User" onBack={onBack} mode={mode} colors={colors} />
            <View className="px-6 mt-2 mb-2">
                <TextInput placeholder="Cari user..." value={search} onChangeText={setSearch}
                    placeholderTextColor={mode === 'dark' ? '#6B7280' : '#94A3B8'}
                    className={clsx("w-full px-5 py-3 rounded-2xl text-sm font-bold",
                        colors.shadowIncome, mode === 'dark' ? 'bg-[#2A2D32] text-gray-200' : 'bg-[#E0E5EC] text-slate-700')} />
            </View>
            {loading ? <Loading mode={mode} /> : (
                <FlatList data={users} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 8 }}
                    renderItem={({ item }) => (
                        <View className={clsx("p-4 mb-3 rounded-3xl flex-row items-center", colors.iconContainer)}>
                            <View className={clsx("w-10 h-10 rounded-full items-center justify-center mr-3", colors.shadowIncome)}>
                                <Text className={clsx("font-black text-sm", colors.textHighlight)}>{(item.name || 'U').charAt(0)}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className={clsx("font-black text-sm", colors.textMain)}>{item.name}</Text>
                                <Text className={clsx("text-xs font-bold", colors.textMuted)}>{item.email}</Text>
                                {item.tenant && <Text className={clsx("text-[9px] font-bold mt-0.5", colors.textMuted)}>{item.tenant.name}</Text>}
                            </View>
                            <View className={clsx("px-2 py-1 rounded-lg mr-2", colors.shadowIncome)}>
                                <Text className={clsx("text-[8px] font-black uppercase", colors.textMuted)}>{item.role}</Text>
                            </View>
                            {item.role !== 'SUPERADMIN' && (
                                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} className="p-1">
                                    <Trash2 size={14} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={<EmptyState icon={Users} text="Tidak ada user" mode={mode} colors={colors} />}
                />
            )}
        </SafeAreaView>
    );
}

// ============== INVOICES ==============
function SAInvoices({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { loadInvoices(); }, [filter]);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : undefined;
            const data = await superadminService.getInvoices(params);
            setInvoices(data);
        }
        catch { /* */ }
        finally { setLoading(false); }
    };

    const handleVerify = (id: string, approved: boolean) => {
        const action = approved ? 'Approve' : 'Reject';
        Alert.alert(action, `${action} invoice ini?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: action, onPress: async () => {
                    try { await superadminService.verifyInvoice(id, approved); loadInvoices(); }
                    catch { Alert.alert('Error', 'Gagal memproses'); }
                }
            },
        ]);
    };

    const statusColor = (s: string) => {
        if (s === 'PAID' || s === 'VERIFIED') return 'text-green-500';
        if (s === 'PENDING') return 'text-amber-500';
        if (s === 'OVERDUE') return 'text-red-500';
        return colors.textMuted;
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Invoice" onBack={onBack} mode={mode} colors={colors} />
            <View className="px-6 mt-2 mb-2 flex-row gap-2">
                {['all', 'PENDING', 'PAID', 'OVERDUE'].map(f => (
                    <TouchableOpacity key={f} onPress={() => setFilter(f)}
                        className={clsx("px-4 py-2 rounded-xl", filter === f ? colors.btnPrimary : colors.shadowOutcome)}>
                        <Text className={clsx("text-[9px] font-black uppercase", filter === f ? colors.textHighlight : colors.textMuted)}>
                            {f === 'all' ? 'Semua' : f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {loading ? <Loading mode={mode} /> : (
                <FlatList data={invoices} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 8 }}
                    renderItem={({ item }) => (
                        <View className={clsx("p-4 mb-3 rounded-3xl", colors.iconContainer)}>
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1">
                                    <Text className={clsx("font-black text-sm", colors.textMain)}>{item.tenant?.name || 'Unknown'}</Text>
                                    <Text className={clsx("text-xs font-bold mt-0.5", colors.textMuted)}>#{item.invoiceNumber || item.id?.slice(0, 8)}</Text>
                                </View>
                                <View>
                                    <Text className={clsx("font-black text-sm text-right", colors.textHighlight)}>Rp {fmt(Number(item.amount || 0))}</Text>
                                    <Text className={clsx("text-[9px] font-black uppercase text-right mt-1", statusColor(item.status))}>{item.status}</Text>
                                </View>
                            </View>
                            {item.status === 'PENDING' && (
                                <View className={clsx("flex-row gap-3 mt-3 pt-3 border-t", mode === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
                                    <TouchableOpacity onPress={() => handleVerify(item.id, true)} className="flex-row items-center gap-1">
                                        <CheckCircle size={14} color="#22C55E" />
                                        <Text className="text-xs font-black text-green-500">Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleVerify(item.id, false)} className="flex-row items-center gap-1">
                                        <XCircle size={14} color="#EF4444" />
                                        <Text className="text-xs font-black text-red-500">Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={<EmptyState icon={FileText} text="Tidak ada invoice" mode={mode} colors={colors} />}
                />
            )}
        </SafeAreaView>
    );
}

// ============== APPROVALS ==============
function SAApprovals({ colors, mode, onBack }: { colors: any; mode: any; onBack: () => void }) {
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadApprovals(); }, []);

    const loadApprovals = async () => {
        setLoading(true);
        try { const data = await superadminService.getApprovals(); setApprovals(data); }
        catch { /* */ }
        finally { setLoading(false); }
    };

    const handle = (id: string, approved: boolean) => {
        Alert.alert(approved ? 'Setujui' : 'Tolak', 'Proses permintaan ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Ya', onPress: async () => {
                    try { await superadminService.processApproval(id, approved); loadApprovals(); }
                    catch { Alert.alert('Error', 'Gagal memproses'); }
                }
            },
        ]);
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <SubHeader title="Approval" onBack={onBack} mode={mode} colors={colors} />
            {loading ? <Loading mode={mode} /> : (
                <FlatList data={approvals} keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 }}
                    renderItem={({ item }) => (
                        <View className={clsx("p-4 mb-3 rounded-3xl", colors.iconContainer)}>
                            <Text className={clsx("font-black text-sm", colors.textMain)}>{item.type || 'Request'}</Text>
                            <Text className={clsx("text-xs font-bold mt-1", colors.textMuted)}>{item.description || item.reason || 'No description'}</Text>
                            <Text className={clsx("text-[9px] font-bold mt-1", colors.textMuted)}>{new Date(item.createdAt).toLocaleString('id-ID')}</Text>
                            {item.status === 'PENDING' && (
                                <View className={clsx("flex-row gap-3 mt-3 pt-3 border-t", mode === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
                                    <TouchableOpacity onPress={() => handle(item.id, true)} className="flex-row items-center gap-1">
                                        <CheckCircle size={14} color="#22C55E" />
                                        <Text className="text-xs font-black text-green-500">Setuju</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handle(item.id, false)} className="flex-row items-center gap-1">
                                        <XCircle size={14} color="#EF4444" />
                                        <Text className="text-xs font-black text-red-500">Tolak</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={<EmptyState icon={CheckCircle} text="Tidak ada permintaan" mode={mode} colors={colors} />}
                />
            )}
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

const Loading = ({ mode }: { mode: any }) => (
    <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={mode === 'dark' ? '#F59E0B' : '#D97706'} />
    </View>
);

const EmptyState = ({ icon: Icon, text, mode, colors }: { icon: any; text: string; mode: any; colors: any }) => (
    <View className="items-center pt-20">
        <Icon size={48} color={mode === 'dark' ? '#4B5563' : '#9CA3AF'} />
        <Text className={clsx("mt-4 font-bold", colors.textMuted)}>{text}</Text>
    </View>
);
