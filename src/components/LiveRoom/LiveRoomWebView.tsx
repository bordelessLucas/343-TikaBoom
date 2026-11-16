import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  roomUrl: string;
  style?: object;
};

/** Player/Host Daily Prebuilt dentro do app */
export function LiveRoomWebView({ roomUrl, style }: Props) {
  if (!roomUrl) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>Sala de LIVE indisponível</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        source={{ uri: roomUrl }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#C0F93C" size="large" />
            <Text style={styles.loadingText}>Conectando à LIVE…</Text>
          </View>
        )}
        allowsFullscreenVideo
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: 12,
  },
  loadingText: { color: '#fff', fontSize: 13 },
  fallback: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: { color: 'rgba(255,255,255,0.7)' },
});
