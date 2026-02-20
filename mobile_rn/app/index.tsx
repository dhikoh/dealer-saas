import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Car, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../components/ThemeContext';
import clsx from 'clsx';

export default function LoginScreen() {
    const { colors, mode } = useTheme();
    const { login } = useAuth();
    const [email, setEmail] = useState('superadmin@otohub.com'); // Default valid email for test
    const [password, setPassword] = useState('password');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            await login(email, password);
            // Router redirect handled in AuthContext
        } catch (error) {
            alert('Login Gagal: Periksa email dan password Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
            <View className={clsx("flex-1 p-8 justify-center", colors.bgFrame)}>

                {/* Logo Section */}
                <View className="items-center mb-12">
                    <View className={clsx("w-28 h-28 rounded-full items-center justify-center mb-6", colors.iconContainer)}>
                        <Car size={48} color={mode === 'dark' ? '#60A5FA' : '#2563EB'} />
                    </View>
                    <Text className={clsx("text-4xl font-black tracking-tight", colors.textMain)}>DealerSaaS</Text>
                    <Text className={clsx("text-sm font-semibold mt-3 text-center leading-relaxed", colors.textMuted)}>
                        Kelola penjualan dan stok kendaraan{'\n'}dalam satu genggaman.
                    </Text>
                </View>

                {/* Form Section */}
                <View className="space-y-6">
                    <View>
                        <View className="flex-row items-center relative">
                            <View className="absolute left-6 z-10">
                                <Mail size={20} color={mode === 'dark' ? '#9CA3AF' : '#64748B'} />
                            </View>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Alamat Email"
                                placeholderTextColor={mode === 'dark' ? '#6B7280' : '#94A3B8'}
                                className={clsx(
                                    "w-full pl-14 pr-6 py-4 rounded-2xl text-sm font-bold",
                                    colors.shadowIncome,
                                    mode === 'dark' ? 'bg-[#2A2D32] text-gray-200' : 'bg-[#E0E5EC] text-slate-700'
                                )}
                            />
                        </View>
                    </View>

                    <View>
                        <View className="flex-row items-center relative">
                            <View className="absolute left-6 z-10">
                                <Lock size={20} color={mode === 'dark' ? '#9CA3AF' : '#64748B'} />
                            </View>
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholder="Password"
                                placeholderTextColor={mode === 'dark' ? '#6B7280' : '#94A3B8'}
                                className={clsx(
                                    "w-full pl-14 pr-14 py-4 rounded-2xl text-sm font-bold",
                                    colors.shadowIncome,
                                    mode === 'dark' ? 'bg-[#2A2D32] text-gray-200' : 'bg-[#E0E5EC] text-slate-700'
                                )}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                className="absolute right-6 z-10"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color={mode === 'dark' ? '#9CA3AF' : '#64748B'} />
                                ) : (
                                    <Eye size={20} color={mode === 'dark' ? '#9CA3AF' : '#64748B'} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <TouchableOpacity className="mt-6 mb-12 self-end">
                    <Text className={clsx("text-sm font-black", colors.textHighlight)}>Lupa Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleLogin}
                    className={clsx(
                        "w-full py-5 rounded-2xl items-center",
                        colors.btnPrimary
                    )}
                >
                    <Text className={clsx("text-lg uppercase tracking-wider font-bold", colors.textHighlight)}>
                        Masuk
                    </Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}
