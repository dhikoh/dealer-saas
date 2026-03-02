import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, StatusBar, Animated
} from 'react-native';
import { useAuth } from '../components/AuthContext';
import { useRouter } from 'expo-router';
import { API_URL } from '../services/api';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

// ── Design tokens (identical to webapp) ────────────────────────────────────────
const BG = '#ecf0f3';
const SHADOW_LIGHT = '#ffffff';
const SHADOW_DARK = '#cbced1';
const TEAL = '#00bfa5';
const TEXT_MAIN = '#555555';
const TEXT_SUB = '#999999';

// ── Neumorphism helpers ─────────────────────────────────────────────────────────
const neuCard = {
    backgroundColor: BG,
    borderRadius: 24,
    shadowColor: SHADOW_DARK,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
};

const neuInput = {
    backgroundColor: BG,
    borderRadius: 12,
    shadowColor: SHADOW_DARK,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
};

const neuButton = {
    backgroundColor: TEAL,
    borderRadius: 60,
    shadowColor: '#009a85',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
};

const neuButtonSecondary = {
    backgroundColor: BG,
    borderRadius: 60,
    shadowColor: SHADOW_DARK,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
};

type FormType = 'login' | 'signup' | 'forgot';

export default function AuthScreen() {
    const { login } = useAuth();
    const router = useRouter();

    const [activeForm, setActiveForm] = useState<FormType>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Login form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup form
    const [signupUsername, setSignupUsername] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPass, setSignupPass] = useState('');
    const [signupConfirm, setSignupConfirm] = useState('');

    // Forgot form
    const [forgotEmail, setForgotEmail] = useState('');

    const switchForm = (f: FormType) => { setActiveForm(f); };

    // ── EYE ICON SVG (inline) ─────────────────────────────────────────────────
    const EyeIcon = ({ visible }: { visible: boolean }) => (
        <Text style={{ fontSize: 16, color: TEXT_SUB }}>{visible ? '🙈' : '👁️'}</Text>
    );

    // ── ROBOT SVG (matches webapp exactly) ────────────────────────────────────
    const RobotSVG = () => {
        const isSignup = activeForm === 'signup';
        const isForgot = activeForm === 'forgot';
        return (
            <View style={{ width: 90, height: 90, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', ...neuInput }}>
                    {/* Simplified robot SVG rendered as View components */}
                    {/* Antenna */}
                    <View style={{ position: 'absolute', top: 5, left: 39, width: 3, height: 10, backgroundColor: TEAL, borderRadius: 2 }} />
                    <View style={{ position: 'absolute', top: 3, left: 38, width: 5, height: 5, borderRadius: 2.5, backgroundColor: TEAL }} />
                    {/* Head/Body */}
                    <View style={{ width: 50, height: 36, borderRadius: 16, borderWidth: 3, borderColor: TEAL, backgroundColor: 'transparent', position: 'absolute', top: 13 }}>
                        {/* Arms */}
                        <View style={{ position: 'absolute', left: -8, top: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL }} />
                        <View style={{ position: 'absolute', right: -8, top: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL }} />
                    </View>
                    {/* Eyes */}
                    {!isForgot ? (
                        <>
                            <View style={{ position: 'absolute', top: 24, left: 23, width: isSignup ? 10 : 8, height: isSignup ? 3 : 8, borderRadius: isSignup ? 2 : 4, backgroundColor: TEAL }} />
                            <View style={{ position: 'absolute', top: 24, right: 23, width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL }} />
                        </>
                    ) : (
                        <>
                            <View style={{ position: 'absolute', top: 25, left: 20, width: 10, height: 10, borderRadius: 3, borderWidth: 2.5, borderColor: TEAL, backgroundColor: 'transparent', transform: [{ rotate: '45deg' }] }} />
                            <View style={{ position: 'absolute', top: 25, right: 20, width: 10, height: 10, borderRadius: 3, borderWidth: 2.5, borderColor: TEAL, backgroundColor: 'transparent', transform: [{ rotate: '45deg' }] }} />
                        </>
                    )}
                    {/* Mouth */}
                    <View style={{ position: 'absolute', bottom: 16, width: 20, height: isForgot ? 6 : 4, borderRadius: 3, borderBottomWidth: isForgot ? 0 : 3, borderTopWidth: isForgot ? 3 : 0, borderColor: TEAL, backgroundColor: 'transparent' }} />
                </View>
            </View>
        );
    };

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    const handleLogin = async () => {
        if (!loginEmail.trim() || !loginPassword) {
            Alert.alert('Perhatian', 'Email dan password wajib diisi');
            return;
        }
        setIsLoading(true);
        try {
            // Call the auth service directly
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login gagal');

            // Store token and navigate
            if (data.access_token) {
                await SecureStore.setItemAsync('auth_token', data.access_token);
            }
            // Trigger auth context refresh
            await login(loginEmail.trim().toLowerCase(), loginPassword);
            router.replace('/(tabs)/dashboard');
        } catch (err: any) {
            Alert.alert('Login Gagal', err?.message || 'Email atau password salah. Periksa koneksi internet Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── SIGNUP ────────────────────────────────────────────────────────────────
    const handleSignup = async () => {
        if (!signupUsername || !signupEmail || !signupPass || !signupConfirm) {
            Alert.alert('Perhatian', 'Semua field wajib diisi');
            return;
        }
        if (signupPass !== signupConfirm) {
            Alert.alert('Error', 'Password tidak cocok');
            return;
        }
        if (signupPass.length < 8) {
            Alert.alert('Error', 'Password minimal 8 karakter');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: signupUsername, email: signupEmail.toLowerCase(), password: signupPass }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Pendaftaran gagal');
            Alert.alert('Berhasil!', 'Akun berhasil dibuat. Silakan login.', [
                { text: 'OK', onPress: () => switchForm('login') }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Pendaftaran gagal');
        } finally {
            setIsLoading(false);
        }
    };

    // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
    const handleForgot = async () => {
        if (!forgotEmail.trim()) {
            Alert.alert('Perhatian', 'Masukkan email Anda');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Gagal mengirim email reset');
            }
            Alert.alert('Berhasil!', 'Link reset password telah dikirim ke email Anda.', [
                { text: 'OK', onPress: () => switchForm('login') }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Gagal mengirim link reset');
        } finally {
            setIsLoading(false);
        }
    };

    // ── FORM INPUT COMPONENT ──────────────────────────────────────────────────
    const FormInput = ({ value, onChange, placeholder, secure, showToggle, onToggle, keyboardType, icon }: any) => (
        <View style={{ ...neuInput, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, marginBottom: 14 }}>
            <Text style={{ fontSize: 15, color: TEXT_SUB, marginRight: 10 }}>{icon}</Text>
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#aab0b7"
                secureTextEntry={secure}
                keyboardType={keyboardType || 'default'}
                autoCapitalize="none"
                style={{ flex: 1, fontSize: 14, color: TEXT_MAIN, fontWeight: '500' }}
            />
            {showToggle && (
                <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
                    <EyeIcon visible={!secure} />
                </TouchableOpacity>
            )}
        </View>
    );

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* Background decoration text (behind card) */}
            <View style={{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center', zIndex: 0 }}>
                <Text style={{ fontSize: 72, fontWeight: '900', color: '#e8eaec', letterSpacing: 6 }}>OTOHUB</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* Login Card */}
                    <View style={{ ...neuCard, width: Math.min(width - 32, 380), paddingHorizontal: 32, paddingTop: 36, paddingBottom: 28 }}>

                        {/* Header — Robot + Brand */}
                        <View style={{ alignItems: 'center', marginBottom: 28 }}>
                            <RobotSVG />
                            <Text style={{ fontSize: 22, fontWeight: '900', color: TEXT_MAIN, letterSpacing: 2, marginTop: 14 }}>OTOHUB</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_SUB, letterSpacing: 1.5, marginTop: 2 }}>Smart System</Text>
                        </View>

                        {/* ── LOGIN FORM ── */}
                        {activeForm === 'login' && (
                            <>
                                <FormInput value={loginEmail} onChange={setLoginEmail} placeholder="Email / Username" icon="✉️" keyboardType="email-address" />
                                <FormInput value={loginPassword} onChange={setLoginPassword} placeholder="Password" secure={!showPassword} showToggle onToggle={() => setShowPassword(!showPassword)} icon="🔒" />

                                {/* Remember + Forgot row */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: rememberMe ? TEAL : '#ccc', backgroundColor: rememberMe ? TEAL : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                                            {rememberMe && <Text style={{ fontSize: 10, color: '#fff', fontWeight: '900' }}>✓</Text>}
                                        </View>
                                        <Text style={{ fontSize: 13, color: TEXT_SUB, fontWeight: '500' }}>Ingat Saya</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => switchForm('forgot')}>
                                        <Text style={{ fontSize: 13, color: TEXT_SUB }}>Lupa Password?</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* MASUK Button */}
                                <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={{ ...neuButton, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 2 }}>MASUK</Text>}
                                </TouchableOpacity>

                                {/* OR divider */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
                                    <View style={{ flex: 1, height: 1, backgroundColor: '#e0e3e7' }} />
                                    <Text style={{ fontSize: 11, color: TEXT_SUB, fontWeight: '600' }}>ATAU</Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: '#e0e3e7' }} />
                                </View>

                                {/* Google Button */}
                                <TouchableOpacity style={{ ...neuButtonSecondary, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}
                                    onPress={() => Alert.alert('Info', 'Login dengan Google hanya tersedia melalui browser web')}>
                                    <Text style={{ fontSize: 18 }}>G</Text>
                                    <Text style={{ fontSize: 14, color: TEXT_MAIN, fontWeight: '700' }}>Login dengan Google</Text>
                                </TouchableOpacity>

                                {/* Signup link */}
                                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 13, color: TEXT_SUB }}>Belum punya akun? </Text>
                                    <TouchableOpacity onPress={() => switchForm('signup')}>
                                        <Text style={{ fontSize: 13, color: TEAL, fontWeight: '700' }}>Daftar Sekarang</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ── SIGNUP FORM ── */}
                        {activeForm === 'signup' && (
                            <>
                                <FormInput value={signupUsername} onChange={setSignupUsername} placeholder="Username" icon="👤" />
                                <FormInput value={signupEmail} onChange={setSignupEmail} placeholder="Email" keyboardType="email-address" icon="✉️" />
                                <FormInput value={signupPass} onChange={setSignupPass} placeholder="Buat Password" secure={!showConfirmPass} showToggle onToggle={() => setShowConfirmPass(!showConfirmPass)} icon="🔒" />
                                <FormInput value={signupConfirm} onChange={setSignupConfirm} placeholder="Konfirmasi Password" secure={!showConfirmPass} icon="🔒" />

                                <TouchableOpacity onPress={handleSignup} disabled={isLoading} style={{ ...neuButton, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: 4 }}>
                                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 2 }}>DAFTAR</Text>}
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4 }}>
                                    <Text style={{ fontSize: 13, color: TEXT_SUB }}>Sudah punya akun? </Text>
                                    <TouchableOpacity onPress={() => switchForm('login')}>
                                        <Text style={{ fontSize: 13, color: TEAL, fontWeight: '700' }}>Login</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ── FORGOT PASSWORD FORM ── */}
                        {activeForm === 'forgot' && (
                            <>
                                <Text style={{ fontSize: 14, color: TEXT_SUB, marginBottom: 18, textAlign: 'center' }}>
                                    Masukkan email terdaftar Anda. Kami akan mengirim link untuk reset password.
                                </Text>

                                <FormInput value={forgotEmail} onChange={setForgotEmail} placeholder="Email terdaftar" keyboardType="email-address" icon="✉️" />

                                <TouchableOpacity onPress={handleForgot} disabled={isLoading} style={{ ...neuButton, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 4 }}>
                                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1.5 }}>KIRIM LINK RESET</Text>}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => switchForm('login')} style={{ ...neuButtonSecondary, height: 46, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: TEXT_MAIN }}>Batal</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Bottom brand */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff' }}>M</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: TEXT_SUB }}>Modula</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
