import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../components/ThemeContext';
import { AuthProvider } from '../components/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <Stack screenOptions={{ headerShown: false }} />
                    <StatusBar style="dark" />
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
