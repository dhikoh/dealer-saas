import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../components/ThemeContext';
import { AuthProvider } from '../components/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PremiumBackground from '../components/PremiumBackground';
import '../global.css';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <PremiumBackground>
                    <AuthProvider>
                        <Stack screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: 'transparent' },
                            animation: 'fade' // smoother transitions between root screens
                        }} />
                        <StatusBar style="dark" />
                    </AuthProvider>
                </PremiumBackground>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
