import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, StatusBar
} from 'react-native';
import { useAuth } from '../components/AuthContext';
import { API_URL } from '../services/api';

const { width } = Dimensions.get('window');

// ── Constants (same as webapp) ─────────────────────────────────────────────────
const BG = '#ecf0f3';
const SHADOW_DARK = '#cbced1';
const TEAL = '#00bfa5';
const TEXT_MAIN = '#555555';
const TEXT_SUB = '#999999';

// ── Styles outside component to prevent recreation ────────────────────────────
const S = {
    card: {
        backgroundColor: BG,
        borderRadius: 24,
        shadowColor: SHADOW_DARK,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 8,
    },
    inputRow: {
        backgroundColor: BG,
        borderRadius: 12,
        shadowColor: SHADOW_DARK,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 4,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 16,
        height: 48,
        marginBottom: 14,
    },
    btnTeal: {
        backgroundColor: TEAL,
        borderRadius: 60,
        shadowColor: '#009a85',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
        height: 50,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: 16,
    },
    btnGhost: {
        backgroundColor: BG,
        borderRadius: 60,
        shadowColor: SHADOW_DARK,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
        height: 48,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    inputText: {
        flex: 1,
        fontSize: 14,
        color: TEXT_MAIN,
        fontWeight: '500' as const,
    },
};

// ── FormInput — OUTSIDE component so it never gets recreated on state update ──
// ── This is the fix for the keyboard-dismissing bug ───────────────────────────
interface FormInputProps {
    value: string;
    onChange: (text: string) => void;
    placeholder: string;
    secure?: boolean;
    showToggle?: boolean;
    onToggle?: () => void;
    keyboardType?: any;
    iconChar: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const FormInput = React.memo(({
    value, onChange, placeholder, secure, showToggle, onToggle,
    keyboardType, iconChar, autoCapitalize = 'none'
}: FormInputProps) => (
    <View style={S.inputRow}>
        <Text style={{ fontSize: 15, color: TEXT_SUB, marginRight: 10 }}>{iconChar}</Text>
        <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#aab0b7"
            secureTextEntry={secure}
            keyboardType={keyboardType || 'default'}
            autoCapitalize={autoCapitalize}
            style={S.inputText}
        />
        {showToggle && onToggle && (
            <TouchableOpacity onPress={onToggle} style={{ padding: 6 }}>
                <Text style={{ fontSize: 15, color: TEXT_SUB }}>{secure ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
        )}
    </View>
));

// ── Robot Avatar — OUTSIDE component ─────────────────────────────────────────
const RobotAvatar = React.memo(({ form }: { form: 'login' | 'signup' | 'forgot' }) => {
    const isForgot = form === 'forgot';
    const isSignup = form === 'signup';
    return (
        <View style={{ width: 90, height: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <View style={[S.card, { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }]}>
                {/* Antenna */}
                <View style={{ position: 'absolute', top: 4, left: 38, width: 3, height: 10, backgroundColor: TEAL, borderRadius: 2 }} />
                <View style={{ position: 'absolute', top: 2, left: 37, width: 5, height: 5, borderRadius: 2.5, backgroundColor: TEAL }} />
                {/* Head */}
                <View style={{ width: 50, height: 36, borderRadius: 16, borderWidth: 3, borderColor: TEAL, backgroundColor: 'transparent', position: 'absolute', top: 13 }}>
                    <View style={{ position: 'absolute', left: -8, top: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL }} />
                    <View style={{ position: 'absolute', right: -8, top: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL }} />
                </View>
                {/* Eyes */}
                {!isForgot ? (
                    <>
                        <View style={{ position: 'absolute', top: 25, left: 22, width: isSignup ? 11 : 8, height: isSignup ? 3 : 8, borderRadius: isSignup ? 2 : 4, backgroundColor: TEAL }} />
                        <View style={{ position: 'absolute', top: 25, right: 22, width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL }} />
                    </>
                ) : (
                    <>
                        <View style={{ position: 'absolute', top: 24, left: 19, width: 10, height: 10, borderRadius: 3, borderWidth: 2.5, borderColor: TEAL, backgroundColor: 'transparent', transform: [{ rotate: '45deg' }] }} />
                        <View style={{ position: 'absolute', top: 24, right: 19, width: 10, height: 10, borderRadius: 3, borderWidth: 2.5, borderColor: TEAL, backgroundColor: 'transparent', transform: [{ rotate: '45deg' }] }} />
                    </>
                )}
                {/* Mouth */}
                <View style={{ position: 'absolute', bottom: 17, width: 20, height: 4, borderRadius: 3, borderBottomWidth: isForgot ? 0 : 3, borderTopWidth: isForgot ? 3 : 0, borderColor: TEAL, backgroundColor: 'transparent' }} />
            </View>
        </View>
    );
});

// ── Authentication Screen ─────────────────────────────────────────────────────
type FormType = 'login' | 'signup' | 'forgot';

export default function AuthScreen() {
    const { login } = useAuth();

    const [activeForm, setActiveForm] = useState<FormType>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Login
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Signup
    const [signupUsername, setSignupUsername] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPass, setSignupPass] = useState('');
    const [signupConfirm, setSignupConfirm] = useState('');

    // Forgot
    const [forgotEmail, setForgotEmail] = useState('');

    // Stable callbacks to prevent FormInput remount
    const setLoginEmailCb = useCallback((t: string) => setLoginEmail(t), []);
    const setLoginPasswordCb = useCallback((t: string) => setLoginPassword(t), []);
    const setSignupUsernameCb = useCallback((t: string) => setSignupUsername(t), []);
    const setSignupEmailCb = useCallback((t: string) => setSignupEmail(t), []);
    const setSignupPassCb = useCallback((t: string) => setSignupPass(t), []);
    const setSignupConfirmCb = useCallback((t: string) => setSignupConfirm(t), []);
    const setForgotEmailCb = useCallback((t: string) => setForgotEmail(t), []);
    const togglePassword = useCallback(() => setShowPassword(v => !v), []);
    const toggleConfirm = useCallback(() => setShowConfirmPass(v => !v), []);

    const switchForm = useCallback((f: FormType) => { setActiveForm(f); }, []);

    // ── Login ─────────────────────────────────────────────────────────────────
    const handleLogin = async () => {
        const email = loginEmail.trim().toLowerCase();
        if (!email || !loginPassword) {
            Alert.alert('Perhatian', 'Email dan password wajib diisi');
            return;
        }
        setIsLoading(true);
        try {
            await login(email, loginPassword);
            // Navigation handled automatically by AuthContext navigation guard
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Login gagal';
            Alert.alert('Login Gagal', msg);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Signup ────────────────────────────────────────────────────────────────
    const handleSignup = async () => {
        if (!signupUsername || !signupEmail || !signupPass || !signupConfirm) {
            Alert.alert('Perhatian', 'Semua field wajib diisi'); return;
        }
        if (signupPass !== signupConfirm) {
            Alert.alert('Error', 'Password tidak cocok'); return;
        }
        if (signupPass.length < 8) {
            Alert.alert('Error', 'Password minimal 8 karakter'); return;
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
            Alert.alert('Berhasil!', 'Akun dibuat. Silakan login.', [
                { text: 'OK', onPress: () => switchForm('login') }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Pendaftaran gagal');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Forgot ────────────────────────────────────────────────────────────────
    const handleForgot = async () => {
        if (!forgotEmail.trim()) {
            Alert.alert('Perhatian', 'Masukkan email Anda'); return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.message || 'Gagal mengirim email reset');
            }
            Alert.alert('Berhasil!', 'Link reset dikirim ke email Anda.', [
                { text: 'OK', onPress: () => switchForm('login') }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Gagal mengirim link reset');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* Deco background text */}
            <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center', zIndex: 0 }}>
                <Text style={{ fontSize: 68, fontWeight: '900', color: '#e8eaec', letterSpacing: 6 }}>OTOHUB</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Login Card */}
                    <View style={[S.card, { width: Math.min(width - 32, 380), paddingHorizontal: 32, paddingTop: 36, paddingBottom: 28 }]}>

                        {/* Brand header */}
                        <View style={{ alignItems: 'center', marginBottom: 28 }}>
                            <RobotAvatar form={activeForm} />
                            <Text style={{ fontSize: 22, fontWeight: '900', color: TEXT_MAIN, letterSpacing: 2, marginTop: 12 }}>OTOHUB</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: TEXT_SUB, letterSpacing: 1.5, marginTop: 2 }}>Smart System</Text>
                        </View>

                        {/* ── LOGIN ── */}
                        {activeForm === 'login' && (
                            <>
                                <FormInput
                                    value={loginEmail}
                                    onChange={setLoginEmailCb}
                                    placeholder="Email / Username"
                                    iconChar="✉️"
                                    keyboardType="email-address"
                                />
                                <FormInput
                                    value={loginPassword}
                                    onChange={setLoginPasswordCb}
                                    placeholder="Password"
                                    secure={!showPassword}
                                    showToggle
                                    onToggle={togglePassword}
                                    iconChar="🔒"
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <TouchableOpacity onPress={() => setRememberMe(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: rememberMe ? TEAL : '#ccc', backgroundColor: rememberMe ? TEAL : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                                            {rememberMe && <Text style={{ fontSize: 10, color: '#fff', fontWeight: '900' }}>✓</Text>}
                                        </View>
                                        <Text style={{ fontSize: 13, color: TEXT_SUB }}>Ingat Saya</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => switchForm('forgot')}>
                                        <Text style={{ fontSize: 13, color: TEXT_SUB }}>Lupa Password?</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={S.btnTeal}>
                                    {isLoading
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 2 }}>MASUK</Text>}
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
                                    <View style={{ flex: 1, height: 1, backgroundColor: '#e0e3e7' }} />
                                    <Text style={{ fontSize: 11, color: TEXT_SUB, fontWeight: '600' }}>ATAU</Text>
                                    <View style={{ flex: 1, height: 1, backgroundColor: '#e0e3e7' }} />
                                </View>

                                <TouchableOpacity
                                    style={[S.btnGhost, { flexDirection: 'row', gap: 10, marginBottom: 16 }]}
                                    onPress={() => Alert.alert('Info', 'Login dengan Google hanya tersedia via browser web.\n\nGunakan email & password untuk login di aplikasi.')}>
                                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#4285F4' }}>G</Text>
                                    <Text style={{ fontSize: 14, color: TEXT_MAIN, fontWeight: '600' }}>Login dengan Google</Text>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 13, color: TEXT_SUB }}>Belum punya akun? </Text>
                                    <TouchableOpacity onPress={() => switchForm('signup')}>
                                        <Text style={{ fontSize: 13, color: TEAL, fontWeight: '700' }}>Daftar Sekarang</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ── SIGNUP ── */}
                        {activeForm === 'signup' && (
                            <>
                                <FormInput value={signupUsername} onChange={setSignupUsernameCb} placeholder="Username" iconChar="👤" />
                                <FormInput value={signupEmail} onChange={setSignupEmailCb} placeholder="Email" keyboardType="email-address" iconChar="✉️" />
                                <FormInput value={signupPass} onChange={setSignupPassCb} placeholder="Buat Password" secure={!showConfirmPass} showToggle onToggle={toggleConfirm} iconChar="🔒" />
                                <FormInput value={signupConfirm} onChange={setSignupConfirmCb} placeholder="Konfirmasi Password" secure={!showConfirmPass} iconChar="🔒" />

                                <TouchableOpacity onPress={handleSignup} disabled={isLoading} style={[S.btnTeal, { marginTop: 4 }]}>
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

                        {/* ── FORGOT ── */}
                        {activeForm === 'forgot' && (
                            <>
                                <Text style={{ fontSize: 14, color: TEXT_SUB, marginBottom: 18, textAlign: 'center' }}>
                                    Masukkan email terdaftar. Kami kirimkan link untuk reset password.
                                </Text>
                                <FormInput value={forgotEmail} onChange={setForgotEmailCb} placeholder="Email terdaftar" keyboardType="email-address" iconChar="✉️" />

                                <TouchableOpacity onPress={handleForgot} disabled={isLoading} style={[S.btnTeal, { marginTop: 4 }]}>
                                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1.5 }}>KIRIM LINK RESET</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => switchForm('login')} style={S.btnGhost}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: TEXT_MAIN }}>Batal</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Bottom brand */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24 }}>
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
