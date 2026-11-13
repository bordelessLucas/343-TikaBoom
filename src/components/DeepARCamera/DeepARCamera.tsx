import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  DEEPAR_SDK_JS,
  getDeepArAppDomain,
  getDeepArEffectUrl,
  getDeepArLicenseKey,
} from '../../services/deepArEffects';

type Props = {
  effectId: string;
  facing?: 'front' | 'back';
  style?: object;
  onReady?: () => void;
  onError?: (message: string) => void;
};

function buildHtml(licenseKey: string, effectUrl: string | null, facing: 'front' | 'back') {
  const facingMode = facing === 'back' ? 'environment' : 'user';
  const effectJson = JSON.stringify(effectUrl || '');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body { margin:0; padding:0; width:100%; height:100%; background:#000; overflow:hidden; }
    #preview { width:100%; height:100%; }
    #status {
      position:absolute; left:12px; right:12px; top:12px; z-index:5;
      color:#fff; font:600 12px -apple-system,sans-serif; text-align:center;
      text-shadow:0 1px 2px #000; pointer-events:none;
    }
  </style>
  <script src="${DEEPAR_SDK_JS}"></script>
</head>
<body>
  <div id="status">Carregando DeepAR…</div>
  <div id="preview"></div>
  <script>
    (async function () {
      const status = document.getElementById('status');
      const post = (type, payload) => {
        try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload })); } catch (e) {}
      };
      try {
        status.textContent = 'Iniciando câmera AR…';
        // Espera o script do CDN (rede do celular precisa estar online)
        let tries = 0;
        while (!window.deepar && tries < 40) {
          await new Promise(r => setTimeout(r, 100));
          tries++;
        }
        if (!window.deepar) throw new Error('SDK não carregou (verifique a internet do celular)');
        const initialEffect = ${effectJson};
        const deepAR = await window.deepar.initialize({
          licenseKey: ${JSON.stringify(licenseKey)},
          previewElement: document.getElementById('preview'),
          effect: initialEffect || undefined,
          additionalOptions: {
            cameraConfig: { facingMode: '${facingMode}' }
          }
        });
        window.__deepAR = deepAR;
        status.style.display = 'none';
        post('ready', true);
        window.__switchEffect = async function (url) {
          try {
            if (!url) {
              if (deepAR.clearEffect) await deepAR.clearEffect();
              else await deepAR.switchEffect(null);
              return;
            }
            status.style.display = 'block';
            status.textContent = 'Trocando efeito…';
            await deepAR.switchEffect(url);
            status.style.display = 'none';
            post('effect', url);
          } catch (err) {
            status.textContent = 'Erro no efeito';
            post('error', String(err && err.message ? err.message : err));
          }
        };
      } catch (err) {
        const msg = String(err && err.message ? err.message : err);
        status.textContent = 'DeepAR: ' + msg;
        post('error', msg);
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Câmera AR via DeepAR Web SDK (plano free) dentro de WebView.
 * Requer EXPO_PUBLIC_DEEPAR_LICENSE_KEY no .env
 */
export function DeepARCamera({ effectId, facing = 'front', style, onReady, onError }: Props) {
  const webRef = useRef<WebView>(null);
  const licenseKey = getDeepArLicenseKey();
  const domain = getDeepArAppDomain();
  const effectUrl = getDeepArEffectUrl(effectId);

  const html = useMemo(
    () => buildHtml(licenseKey, effectUrl, facing),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [licenseKey, facing]
  );

  useEffect(() => {
    const url = getDeepArEffectUrl(effectId) || '';
    const js = `window.__switchEffect && window.__switchEffect(${JSON.stringify(url)}); true;`;
    webRef.current?.injectJavaScript(js);
  }, [effectId]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'ready') onReady?.();
      if (data.type === 'error') onError?.(data.payload);
    } catch {
      // ignore
    }
  };

  if (!licenseKey) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackTitle}>DeepAR (grátis)</Text>
        <Text style={styles.fallbackText}>
          Adicione EXPO_PUBLIC_DEEPAR_LICENSE_KEY no .env{'\n'}
          Crie em developer.deepar.ai (plano Free)
        </Text>
      </View>
    );
  }

  const baseUrl =
    domain.startsWith('http') ? domain : `https://${domain.replace(/^https?:\/\//, '')}`;

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html, baseUrl }}
        style={styles.webview}
        onMessage={onMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="grant"
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#C0F93C" size="large" />
          </View>
        )}
        // Android camera in WebView
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        {...(Platform.OS === 'android'
          ? { androidLayerType: 'hardware' as const }
          : {})}
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
  },
  fallback: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackTitle: { color: '#C0F93C', fontWeight: '800', fontSize: 16, marginBottom: 8 },
  fallbackText: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 },
});
