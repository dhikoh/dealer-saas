import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../components/ThemeContext';
import { AuthProvider } from '../components/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import '../global.css'; // CRITICAL: required for NativeWind className to work across all screens

// Inner wrapper that reads theme safely after provider is mounted
function ThemedRoot() {
    const { mode } = useTheme();
    const bgColor = mode === 'dark' ? '#1E2228' : '#E0E5EC';

    return (
        <View style={{ flex: 1, backgroundColor: bgColor }}>
            <AuthProvider>
                <Stack screenOptions={{
                    headerShown: false,
                    // CRITICAL FIX: Remove transparent — transparent causes blank screen in release APK
                    contentStyle: { backgroundColor: bgColor },
                    animation: 'fade',
                }} />
                <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            </AuthProvider>
        </View>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <ThemedRoot />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
