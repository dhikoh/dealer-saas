import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calculator, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../components/ThemeContext';
import clsx from 'clsx';

export default function CreditScreen() {
    const { colors, mode } = useTheme();
    const [price, setPrice] = useState('25000000');
    const [dp, setDp] = useState('5000000');
    const [tenor, setTenor] = useState('24');
    const [rate, setRate] = useState('15');
    const [result, setResult] = useState<any>(null);

    const calculate = () => {
        const p = parseFloat(price) || 0;
        const d = parseFloat(dp) || 0;
        const t = parseInt(tenor) || 12;
        const r = parseFloat(rate) || 0;

        const principal = p - d;
        const totalInterest = (principal * (r / 100) * t) / 12;
        const totalCredit = principal + totalInterest;
        const monthly = Math.round(totalCredit / t);

        setResult({ monthly, principal, totalInterest });
    };

    return (
        <SafeAreaView className={clsx("flex-1", colors.bgApp)}>
            <View className="px-6 pt-4 pb-6">
                <Text className={clsx("text-2xl font-black tracking-tight", colors.textMain)}>Kalkulator Kredit</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
                {/* Display Large Price */}
                <View className="items-center py-6">
                    <Text className={clsx("text-[11px] font-black uppercase tracking-widest mb-2", colors.textMuted)}>Harga OTR</Text>
                    <Text className={clsx("text-4xl font-black tracking-tighter", colors.textMain)}>
                        <Text className="text-lg">Rp </Text>
                        {parseFloat(price).toLocaleString('id-ID')}
                    </Text>
                </View>

                {/* Inputs */}
                <View className="space-y-6">
                    <InputGroup label="Harga Kendaraan (Rp)" value={price} onChange={setPrice} colors={colors} mode={mode} />
                    <InputGroup label="Uang Muka (Rp)" value={dp} onChange={setDp} colors={colors} mode={mode} />

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <InputGroup label="Tenor (Bulan)" value={tenor} onChange={setTenor} colors={colors} mode={mode} />
                        </View>
                        <View className="flex-1">
                            <InputGroup label="Bunga (%)" value={rate} onChange={setRate} colors={colors} mode={mode} />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={calculate}
                    className={clsx("mt-8 w-full py-5 rounded-2xl items-center", colors.btnPrimary)}
                >
                    <Text className={clsx("text-sm uppercase tracking-widest font-black", colors.textHighlight)}>Hitung Cicilan</Text>
                </TouchableOpacity>

                {/* Result Card */}
                {result && (
                    <View className={clsx("mt-8 p-6 rounded-3xl items-center", colors.iconContainer)}>
                        <Text className={clsx("text-[11px] font-black uppercase tracking-widest mb-2", colors.textMuted)}>Angsuran Per Bulan</Text>
                        <Text className={clsx("text-3xl font-black tracking-tighter", colors.textHighlight)}>
                            Rp {result.monthly.toLocaleString('id-ID')}
                        </Text>

                        <View className={clsx("w-full pt-6 mt-6 border-t", mode === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
                            <View className="flex-row justify-between mb-2">
                                <Text className={clsx("text-xs font-black uppercase tracking-wider", colors.textMuted)}>Pokok Hutang</Text>
                                <Text className={clsx("font-black text-sm", colors.textMain)}>Rp {result.principal.toLocaleString('id-ID')}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className={clsx("text-xs font-black uppercase tracking-wider", colors.textMuted)}>Total Bunga</Text>
                                <Text className={clsx("font-black text-sm", colors.textMain)}>Rp {result.totalInterest.toLocaleString('id-ID')}</Text>
                            </View>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const InputGroup = ({ label, value, onChange, colors, mode }: { label: string, value: string, onChange: (text: string) => void, colors: any, mode: any }) => (
    <View>
        <Text className={clsx("text-[10px] font-black uppercase tracking-widest mb-2 pl-2", colors.textMuted)}>{label}</Text>
        <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            className={clsx(
                "w-full px-5 py-4 rounded-2xl text-sm font-black",
                colors.shadowIncome,
                mode === 'dark' ? 'bg-[#2A2D32] text-gray-200' : 'bg-[#E0E5EC] text-slate-700'
            )}
        />
    </View>
);
