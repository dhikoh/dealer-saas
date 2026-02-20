import { Stack } from 'expo-router';
import { ThemeProvider } from '../components/ThemeContext';
import "../global.css";

import { AuthProvider } from '../components/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(tabs)" />
                </Stack>
            </ThemeProvider>
        </AuthProvider>
    );
}
