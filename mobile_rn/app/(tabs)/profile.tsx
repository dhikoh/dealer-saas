import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Modal, TextInput,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Sun, Moon, LogOut, ChevronRight, TrendingUp, CreditCard, Edit3, Phone, Mail, X } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../components/AuthContext';
import { useRouter } from 'expo-router';
import NeuBox from '../../components/NeuBox';
import GlassView from '../../components/GlassView';
import api from '../../services/api';
import clsx from 'clsx';

export default function ProfileScreen() {
    const { colors, mode, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const router = useRouter();
    const isDark = mode === 'dark';

    const [showEdit, setShowEdit] = useState(false);
    const [form, setForm] = useState({ name: user?.name || '', phone: (user as any)?.phone || '' });
    const [saving, setSaving] = useState(false);

    const handleLogout = async () => {
        Alert.alert('Keluar', 'Yakin ingin keluar?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Keluar', style: 'destructive', onPress: async () => {
                    await logout();
                    // AuthContext navigation guard auto-redirects to '/' when user becomes null
                }
            }
        ]);
    };

    const handleSaveProfile = async () => {
        if (!form.name) return Alert.alert('Error', 'Nama tidak boleh kosong');
        setSaving(true);
        try {
            await api.put('/auth/profile', { name: form.name, phone: form.phone });
            setShowEdit(false);
            Alert.alert('Berhasil', 'Profil berhasil diperbarui');
        } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const roleColor: Record<string, string> = {
        SUPERADMIN: '#F59E0B', OWNER: '#8B5CF6', MANAGER: '#3B82F6',
        SALES: '#22C55E', ADMIN: '#0EA5E9', STAFF: '#94A3B8'
    };

    const userRole = user?.role || 'STAFF';
    const rColor = roleColor[userRole] || '#94A3B8';

    return (
        <SafeAreaView className={clsx('flex-1', colors.bgApp)}>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '900', color: isDark ? '#E5E7EB' : '#1F2937' }}>Profil</Text>
                    <TouchableOpacity onPress={() => setShowEdit(true)}>
                        <NeuBox borderRadius={20} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                            <Edit3 size={18} color={isDark ? '#60A5FA' : '#2563EB'} />
                        </NeuBox>
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                    <NeuBox borderRadius={28} style={{ padding: 24, alignItems: 'center' }}>
                        {/* Avatar */}
                        <GlassView intensity={60} borderRadius={40} style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: rColor + '60' }}>
                            <Text style={{ fontSize: 32, fontWeight: '900', color: rColor }}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
                        </GlassView>
                        <Text style={{ fontSize: 22, fontWeight: '900', color: isDark ? '#E5E7EB' : '#1F2937' }}>{user?.name || 'User'}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#9CA3AF' : '#64748B', marginTop: 4 }}>{user?.email}</Text>
                        <View style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10, backgroundColor: rColor + '22' }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, color: rColor }}>{userRole}</Text>
                        </View>
                    </NeuBox>
                </View>

                {/* Theme Toggle */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, color: isDark ? '#6B7280' : '#94A3B8', marginBottom: 12, marginLeft: 4 }}>TAMPILAN</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {[
                            { icon: Sun, label: 'Light', value: 'light' },
                            { icon: Moon, label: 'Dark', value: 'dark' },
                        ].map(t => {
                            const Icon = t.icon;
                            const isActive = mode === t.value;
                            return (
                                <TouchableOpacity key={t.value} onPress={!isActive ? toggleTheme : undefined} style={{ flex: 1 }}>
                                    <NeuBox pressed={isActive} borderRadius={20} style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
                                        <Icon size={22} color={isActive ? (isDark ? '#60A5FA' : '#2563EB') : (isDark ? '#4B5563' : '#CBD5E1')} />
                                        <Text style={{ fontSize: 11, fontWeight: '900', color: isActive ? (isDark ? '#60A5FA' : '#2563EB') : (isDark ? '#6B7280' : '#94A3B8') }}>{t.label}</Text>
                                    </NeuBox>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Info Items */}
                <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, color: isDark ? '#6B7280' : '#94A3B8', marginBottom: 12, marginLeft: 4 }}>INFORMASI AKUN</Text>
                    <NeuBox borderRadius={24} style={{ overflow: 'hidden' }}>
                        {[
                            { icon: Mail, label: 'Email', value: user?.email || '-' },
                            { icon: Phone, label: 'Telepon', value: (user as any)?.phone || 'Belum diisi' },
                            { icon: User, label: 'Role', value: userRole },
                        ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: isDark ? '#374151' : '#E2E8F0' }}>
                                    <GlassView intensity={30} borderRadius={12} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                        <Icon size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                                    </GlassView>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 9, fontWeight: '900', color: isDark ? '#6B7280' : '#94A3B8', letterSpacing: 1.5 }}>{item.label.toUpperCase()}</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#E5E7EB' : '#1F2937', marginTop: 2 }}>{item.value}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </NeuBox>
                </View>

                {/* Stats */}
                <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 2, color: isDark ? '#6B7280' : '#94A3B8', marginBottom: 12, marginLeft: 4 }}>PERFORMA</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {[
                            { icon: TrendingUp, label: 'Target Sales', value: '-', color: '#22C55E' },
                            { icon: CreditCard, label: 'Komisi', value: '-', color: '#3B82F6' },
                        ].map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <NeuBox key={i} borderRadius={20} style={{ flex: 1, padding: 18, alignItems: 'center' }}>
                                    <Icon size={22} color={s.color} />
                                    <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 1.5, color: isDark ? '#6B7280' : '#94A3B8', marginTop: 10 }}>{s.label.toUpperCase()}</Text>
                                    <Text style={{ fontSize: 20, fontWeight: '900', color: s.color, marginTop: 4 }}>{s.value}</Text>
                                </NeuBox>
                            );
                        })}
                    </View>
                </View>

                {/* Logout */}
                <View style={{ paddingHorizontal: 20 }}>
                    <TouchableOpacity onPress={handleLogout} activeOpacity={0.85}>
                        <NeuBox borderRadius={20} style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                            <LogOut size={20} color="#EF4444" />
                            <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 1.5, color: '#EF4444' }}>KELUAR</Text>
                        </NeuBox>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={showEdit} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <GlassView intensity={80} borderRadius={32} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 28 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: isDark ? '#E5E7EB' : '#1F2937' }}>Edit Profil</Text>
                                <TouchableOpacity onPress={() => setShowEdit(false)}>
                                    <NeuBox borderRadius={20} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={18} color={isDark ? '#9CA3AF' : '#64748B'} />
                                    </NeuBox>
                                </TouchableOpacity>
                            </View>

                            <Text style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8, opacity: 0.6, color: isDark ? '#D1D5DB' : '#374151' }}>NAMA LENGKAP</Text>
                            <NeuBox pressed borderRadius={16} style={{ height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
                                <User size={16} color={isDark ? '#6B7280' : '#94A3B8'} style={{ marginRight: 10 }} />
                                <TextInput value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Nama lengkap"
                                    placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                                    style={{ flex: 1, fontSize: 14, fontWeight: '700', color: isDark ? '#E5E7EB' : '#1E293B' }} />
                            </NeuBox>

                            <Text style={{ fontSize: 10, letterSpacing: 2, marginBottom: 8, opacity: 0.6, color: isDark ? '#D1D5DB' : '#374151' }}>NOMOR HP</Text>
                            <NeuBox pressed borderRadius={16} style={{ height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 28 }}>
                                <Phone size={16} color={isDark ? '#6B7280' : '#94A3B8'} style={{ marginRight: 10 }} />
                                <TextInput value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder="08xxxxxxxxxx"
                                    keyboardType="phone-pad" placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                                    style={{ flex: 1, fontSize: 14, fontWeight: '700', color: isDark ? '#E5E7EB' : '#1E293B' }} />
                            </NeuBox>

                            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
                                <NeuBox borderRadius={20} style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}>
                                    {saving ? <ActivityIndicator color={isDark ? '#60A5FA' : '#2563EB'} />
                                        : <Text style={{ fontSize: 12, fontWeight: '900', letterSpacing: 2, color: isDark ? '#60A5FA' : '#2563EB' }}>SIMPAN PERUBAHAN</Text>}
                                </NeuBox>
                            </TouchableOpacity>
                        </GlassView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
