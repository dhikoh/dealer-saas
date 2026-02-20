import React, { useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    ActivityIndicator,
    StatusBar,
    BackHandler,
    Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

// The OTOHUB web URL with ?source=webview to activate the Neumorphic mobile UI
const OTOHUB_URL = 'https://oto.modula.click?source=webview';

// Injected JS: set custom User-Agent header and hide scrollbars
const INJECTED_JS = `
  (function() {
    // Mark page as WebView for detection
    window.IS_OTOHUB_WEBVIEW = true;
    // Store in localStorage for theme persistence
    try { localStorage.setItem('force_webview', 'true'); } catch(e) {}
    // Suppress scrollbars across the entire app
    var style = document.createElement('style');
    style.textContent = '::-webkit-scrollbar { display: none !important; }';
    document.head && document.head.appendChild(style);
    true;
  })();
`;

export default function App() {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);

    // Android hardware back button support
    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const onBack = () => {
            if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true; // consume event
            }
            return false; // let the system handle (exit app)
        };
        const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
        return () => sub.remove();
    }, [canGoBack]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#E0E5EC" />

            <WebView
                ref={webViewRef}
                source={{ uri: OTOHUB_URL }}
                style={styles.webview}
                // Performance
                cacheEnabled
                domStorageEnabled
                javaScriptEnabled
                allowsBackForwardNavigationGestures
                // Security
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                // Inject JS to activate WebView mode
                injectedJavaScriptBeforeContentLoaded={INJECTED_JS}
                // Custom UA to help server-side detection
                applicationNameForUserAgent="OTOHUB-Mobile/1.0"
                // Navigation state for back button
                onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
                // Loading
                onLoadEnd={() => setLoading(false)}
                onLoadStart={() => setLoading(true)}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                )}
                startInLoadingState
            />

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0E5EC',
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0E5EC',
        zIndex: 10,
    },
});
