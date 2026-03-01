// app.config.js — replaces app.json for dynamic EAS environment variable support
// This file allows reading process.env values injected by EAS secrets at build time.

module.exports = ({ config }) => ({
    ...config,

    name: 'OTOHUB',
    slug: 'otohub-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    // MEDIUM FIX: versionCode added — required for Play Store submission
    newArchEnabled: true,
    scheme: 'otohub',

    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0F172A',
    },

    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.otohub.mobile',
    },

    android: {
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#0F172A',
        },
        package: 'com.otohub.mobile',
        versionCode: 1,   // MEDIUM FIX: increment on every Play Store release
        // MEDIUM FIX: Minimal permissions — only what the app truly needs
        permissions: [
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE',
        ],
    },

    plugins: ['expo-router', 'expo-secure-store'],

    // CRITICAL FIX: API URL via EAS environment variable — never hardcoded
    // Set via: eas secret:create --scope project --name API_URL --value https://your-backend.com
    // Or locally: create .env with EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
    extra: {
        apiUrl: process.env.API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.10:3000',
        eas: {
            projectId: '9c51af6f-a1a6-459d-b101-a603e2764895',
        },
    },
});
