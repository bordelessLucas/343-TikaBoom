import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '../../routes/NavigationContext';
import { livesService, LiveSession } from '../../services/livesService';
import { LiveRoomWebView } from '../../components/LiveRoom/LiveRoomWebView';
import { buildDailyEmbedUrl } from '../../services/dailyService';
import { auth } from '../../lib/firebaseconfig';

const LIVE_ID_KEY = '@tikaboom_watching_live_id';
const LIVE_ROOM_URL_KEY = '@tikaboom_watching_live_url';

export const LiveWatch = () => {
  const { navigate } = useNavigation();
  const [live, setLive] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const top = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 54;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await AsyncStorage.getItem(LIVE_ID_KEY);
        const roomUrlHint = await AsyncStorage.getItem(LIVE_ROOM_URL_KEY);
        if (!id && !roomUrlHint) {
          setError('LIVE não encontrada');
          setLoading(false);
          return;
        }

        let session: LiveSession | null = null;
        if (id && !id.startsWith('daily_')) {
          try {
            session = await livesService.getLive(id);
          } catch {
            session = null;
          }
        }

        if ((!session || session.status !== 'live') && roomUrlHint) {
          session = {
            id: id || `daily_${Date.now()}`,
            hostId: 'daily',
            hostUsername: 'live',
            hostDisplayName: 'LIVE',
            title: 'AO VIVO',
            status: 'live',
            roomName: id?.replace(/^daily_/, '') || '',
            roomUrl: roomUrlHint,
            viewerCount: 0,
            startedAt: Date.now(),
            provider: 'daily',
          };
        }

        if (cancelled) return;
        if (!session || session.status !== 'live') {
          setError('Esta LIVE já encerrou');
          setLoading(false);
          return;
        }
        setLive(session);
        if (id && !id.startsWith('daily_')) {
          livesService.incrementViewers(id, 1).catch(() => {});
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Erro ao abrir LIVE');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      AsyncStorage.getItem(LIVE_ID_KEY).then((id) => {
        if (id && !id.startsWith('daily_')) {
          livesService.incrementViewers(id, -1).catch(() => {});
        }
      });
    };
  }, []);

  const userName =
    auth.currentUser?.displayName ||
    auth.currentUser?.email?.split('@')[0] ||
    'Viewer';

  const embedUrl =
    live?.roomUrl
      ? buildDailyEmbedUrl(live.roomUrl, userName, false)
      : '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#C0F93C" size="large" />
        </View>
      ) : error || !live ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'LIVE indisponível'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigate('Live')}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {embedUrl ? (
            <LiveRoomWebView roomUrl={embedUrl} style={styles.fill} />
          ) : (
            <View style={styles.center}>
              <Text style={styles.liveBadge}>AO VIVO</Text>
              <Text style={styles.title}>{live.title}</Text>
              <Text style={styles.sub}>
                @{live.hostUsername} · stream de vídeo ainda sem provedor (Daily)
              </Text>
              <Text style={styles.hint}>
                Configure EXPO_PUBLIC_DAILY_API_KEY para ver a câmera do host.
              </Text>
            </View>
          )}

          <View style={[styles.topBar, { paddingTop: top }]} pointerEvents="box-none">
            <TouchableOpacity style={styles.close} onPress={() => navigate('Live')}>
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.meta}>
              <View style={styles.dot}>
                <Text style={styles.dotText}>AO VIVO</Text>
              </View>
              <Text style={styles.metaTitle} numberOfLines={1}>
                {live.title}
              </Text>
            </View>
            <Text style={styles.viewers}>{live.viewerCount} 👁</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fill: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 10 },
  errorText: { color: '#fff', textAlign: 'center', marginBottom: 12 },
  backBtn: {
    backgroundColor: '#C0F93C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: { color: '#111', fontWeight: '800' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: { flex: 1, gap: 4 },
  dot: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF2D55',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dotText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  metaTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  viewers: { color: '#fff', fontWeight: '600', fontSize: 12 },
  liveBadge: {
    color: '#FF2D55',
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 4,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  hint: { color: '#C0F93C', textAlign: 'center', marginTop: 12, fontSize: 12 },
});
