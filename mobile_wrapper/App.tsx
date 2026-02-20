import React, { useRef, useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ActivityIndicator,
    StatusBar,
    BackHandler,
    Platform,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

// URL target untuk Webview Mobile OTOHUB
const OTOHUB_URL = 'https://oto.modula.click/auth?source=webview';

// Injected JS: set custom User-Agent dan format layout
const INJECTED_JS = `
  (function() {
    window.IS_OTOHUB_WEBVIEW = true;
    try { localStorage.setItem('force_webview', 'true'); } catch(e) {}
    var style = document.createElement('style');
    style.textContent = '::-webkit-scrollbar { display: none !important; } * { -webkit-tap-highlight-color: transparent; }';
    document.head && document.head.appendChild(style);
    true;
  })();
`;

export default function App() {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);

    // Menangani tombol back fisik Android
    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const onBack = () => {
            if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true;
            }
            return false;
        };
        const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
        return () => sub.remove();
    }, [canGoBack]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#E0E5EC" />

            <WebView
                ref={webViewRef}
                source={{ uri: OTOHUB_URL }}
                style={styles.webview}
                cacheEnabled
                domStorageEnabled
                javaScriptEnabled
                allowsBackForwardNavigationGestures
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                injectedJavaScriptBeforeContentLoaded={INJECTED_JS}
                applicationNameForUserAgent="OTOHUB-Mobile/1.0"
                onNavigationStateChange={(state: WebViewNavigation) => setCanGoBack(state.canGoBack)}
                onLoadEnd={() => setLoading(false)}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#00bfa5" />
                    </View>
                )}
                startInLoadingState
                bounces={false}
                overScrollMode="never"
            />

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00bfa5" />
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
