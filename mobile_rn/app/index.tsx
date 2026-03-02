import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, StatusBar
} from 'react-native';
import { useAuth } from '../components/AuthContext';
import { useRouter } from 'expo-router';
import { useTheme } from '../components/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const router = useRouter();
    const { mode } = useTheme();
    const isDark = mode === 'dark';

    const handleLogin = async () => {
        if (!email || !password) { Alert.alert('Error', 'Email dan password wajib diisi'); return; }
        setIsSubmitting(true);
        try {
            await login(email, password);
            router.replace('/(tabs)/dashboard');
        } catch (error: any) {
            Alert.alert('Login Gagal', error?.response?.data?.message || error.message || 'Email atau password salah');
        } finally { setIsSubmitting(false); }
    };

    // Brand colors matching the webapp
    const brandBlue = '#2563EB';
    const brandCyan = '#0EA5E9';
    const accentGreen = '#10B981';

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#0F172A' }}>
            <StatusBar barStyle="light-content" />

            {/* Background gradient blobs — same aesthetic as webapp */}
            <View style={{ position: 'absolute', top: -100, left: -80, width: 350, height: 350, borderRadius: 175, backgroundColor: brandBlue, opacity: 0.25 }} />
            <View style={{ position: 'absolute', top: height * 0.3, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: brandCyan, opacity: 0.15 }} />
            <View style={{ position: 'absolute', bottom: -80, left: width * 0.3, width: 250, height: 250, borderRadius: 125, backgroundColor: accentGreen, opacity: 0.1 }} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }} showsVerticalScrollIndicator={false}>

                    {/* Brand Header */}
                    <View style={{ alignItems: 'center', marginBottom: 48 }}>
                        {/* Logo Card */}
                        <BlurView intensity={20} tint="dark" style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                            <View style={{ paddingHorizontal: 28, paddingVertical: 18, alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 }}>OTO</Text>
                                    <Text style={{ fontSize: 32, fontWeight: '900', color: brandCyan, letterSpacing: -1 }}>HUB</Text>
                                </View>
                                <Text style={{ fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 3, marginTop: 2 }}>DEALER MANAGEMENT</Text>
                            </View>
                        </BlurView>

                        <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 }}>Selamat Datang</Text>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Login untuk melanjutkan</Text>
                    </View>

                    {/* Login Card — Glass style matching webapp */}
                    <BlurView intensity={25} tint="dark" style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                        <View style={{ padding: 28 }}>

                            {/* Email */}
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 10 }}>EMAIL ADDRESS</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, borderWidth: 1, borderColor: email ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.1)', paddingHorizontal: 16, height: 54 }}>
                                    <Mail size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 12 }} />
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="nama@dealership.com"
                                        placeholderTextColor="rgba(255,255,255,0.25)"
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={{ marginBottom: 28 }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 10 }}>PASSWORD</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, borderWidth: 1, borderColor: password ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.1)', paddingHorizontal: 16, height: 54 }}>
                                    <Lock size={18} color="rgba(255,255,255,0.4)" style={{ marginRight: 12 }} />
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Masukkan password"
                                        placeholderTextColor="rgba(255,255,255,0.25)"
                                        secureTextEntry={!showPass}
                                        style={{ flex: 1, fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}
                                    />
                                    <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                                        {showPass ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Login Button — matches webapp primary button */}
                            <TouchableOpacity onPress={handleLogin} disabled={isSubmitting} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={[brandBlue, brandCyan]}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={{ borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
                                >
                                    {isSubmitting
                                        ? <ActivityIndicator color="#FFFFFF" />
                                        : <Text style={{ fontSize: 15, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 }}>Masuk ke Dashboard</Text>
                                    }
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} activeOpacity={0.7}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>Lupa password? Hubungi Superadmin</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>

                    {/* Footer */}
                    <Text style={{ textAlign: 'center', marginTop: 32, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.25)' }}>
                        © 2026 OTOHUB Dealer Management System
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
