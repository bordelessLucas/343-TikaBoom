import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Modal,
  FlatList,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '../../routes/NavigationContext';
import { livesService, LiveSession } from '../../services/livesService';
import { LiveRoomWebView } from '../../components/LiveRoom/LiveRoomWebView';
import { prepareViewerLiveRoom } from '../../services/liveProvider';
import { auth } from '../../lib/supabase';
import { useSafePad } from '../../hooks/useSafePad';
import {
  GiftEffectOverlay,
  type GiftEffectPayload,
} from '../../components/GiftEffectOverlay/GiftEffectOverlay';

type QuickGift = {
  id: string;
  name: string;
  price: number;
  imageUri: ImageSourcePropType;
  isRealGift?: boolean;
};

const QUICK_GIFTS: QuickGift[] = [
  { id: 'tika', name: 'Tika Boom!', price: 5000, imageUri: require('../../../assets/tikaB.png') },
  { id: 'dragao', name: 'Dragão', price: 5000, imageUri: require('../../../assets/dragaoft.png') },
  { id: 'fada', name: 'Fada', price: 5000, imageUri: require('../../../assets/fadaMetamorfose.png') },
  {
    id: 'presente_real',
    name: 'Presente Real',
    price: 100,
    imageUri: require('../../../assets/presente.png'),
    isRealGift: true,
  },
];

const LIVE_ID_KEY = '@tikaboom_watching_live_id';
const LIVE_ROOM_URL_KEY = '@tikaboom_watching_live_url';
const LIVE_ROOM_NAME_KEY = '@tikaboom_watching_live_room';
const LIVE_PROVIDER_KEY = '@tikaboom_watching_live_provider';

export const LiveWatch = () => {
  const { navigate } = useNavigation();
  const safe = useSafePad(8, 8);
  const [live, setLive] = useState<LiveSession | null>(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [giftsOpen, setGiftsOpen] = useState(false);
  const [giftEffect, setGiftEffect] = useState<GiftEffectPayload | null>(null);
  const top = safe.paddingTop;

  const sendGift = (gift: QuickGift) => {
    setGiftsOpen(false);
    setGiftEffect({
      id: `${gift.id}_${Date.now()}`,
      name: gift.name,
      imageUri: gift.imageUri,
      senderName: auth.currentUser?.displayName || 'Você',
      targetName: live?.hostDisplayName || live?.hostUsername,
      isRealGift: !!gift.isRealGift,
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await AsyncStorage.getItem(LIVE_ID_KEY);
        const roomUrlHint = await AsyncStorage.getItem(LIVE_ROOM_URL_KEY);
        const roomNameHint = await AsyncStorage.getItem(LIVE_ROOM_NAME_KEY);
        const providerHint = (await AsyncStorage.getItem(LIVE_PROVIDER_KEY)) as
          | 'livekit'
          | 'daily'
          | 'local'
          | null;

        if (!id && !roomUrlHint && !roomNameHint) {
          setError('LIVE não encontrada');
          setLoading(false);
          return;
        }

        let session: LiveSession | null = null;
        if (id && !id.startsWith('daily_') && !id.startsWith('lk_')) {
          try {
            session = await livesService.getLive(id);
          } catch {
            session = null;
          }
        }

        if ((!session || session.status !== 'live') && (roomUrlHint || roomNameHint)) {
          session = {
            id: id || `live_${Date.now()}`,
            hostId: 'unknown',
            hostUsername: 'live',
            hostDisplayName: 'LIVE',
            title: 'AO VIVO',
            status: 'live',
            roomName: roomNameHint || id?.replace(/^(daily_|lk_)/, '') || '',
            roomUrl: roomUrlHint || undefined,
            viewerCount: 0,
            startedAt: Date.now(),
            provider: providerHint || (roomUrlHint?.includes('daily') ? 'daily' : 'livekit'),
          };
        }

        if (cancelled) return;
        if (!session || session.status !== 'live') {
          setError('Esta LIVE já encerrou');
          setLoading(false);
          return;
        }

        setLive(session);

        const userName =
          auth.currentUser?.displayName ||
          auth.currentUser?.email?.split('@')[0] ||
          'Viewer';

        try {
          const prepared = await prepareViewerLiveRoom({
            roomName: session.roomName,
            roomUrl: session.roomUrl,
            provider: session.provider,
            displayName: userName,
          });
          if (!cancelled) setEmbedUrl(prepared.embedUrl);
        } catch (e: any) {
          // Daily: roomUrl pode já ser a URL da sala
          if (session.roomUrl?.includes('daily.co')) {
            if (!cancelled) setEmbedUrl(session.roomUrl);
          } else if (!cancelled) {
            setError(e?.message || 'Não foi possível entrar na sala');
          }
        }

        if (id && !id.startsWith('daily_') && !id.startsWith('lk_')) {
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
        if (id && !id.startsWith('daily_') && !id.startsWith('lk_')) {
          livesService.incrementViewers(id, -1).catch(() => {});
        }
      });
    };
  }, []);

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
              <Text style={styles.sub}>@{live.hostUsername}</Text>
              <Text style={styles.hint}>
                Configure EXPO_PUBLIC_LIVEKIT_URL + function live-token (ou Daily) para ver o vídeo.
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
            <Text style={styles.viewers}>{live.viewerCount}</Text>
          </View>

          <TouchableOpacity
            style={[styles.giftFab, { bottom: safe.bottom + 24 }]}
            onPress={() => setGiftsOpen(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="gift" size={26} color="#111" />
          </TouchableOpacity>

          <Modal
            visible={giftsOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setGiftsOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setGiftsOpen(false)}
              />
              <View style={styles.modalSheet}>
                <Text style={styles.modalTitle}>Enviar presente</Text>
                <FlatList
                  data={QUICK_GIFTS}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.giftCard}
                      onPress={() => sendGift(item)}
                      activeOpacity={0.85}
                    >
                      <Image source={item.imageUri} style={styles.giftImg} resizeMode="contain" />
                      <Text style={styles.giftName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.isRealGift && (
                        <Text style={styles.realTag}>Presente Real</Text>
                      )}
                      <Text style={styles.giftPrice}>{item.price} moedas</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <GiftEffectOverlay gift={giftEffect} onFinished={() => setGiftEffect(null)} />
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
  giftFab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C0F93C',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  modalTitle: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 8 },
  giftCard: {
    width: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  giftImg: { width: 72, height: 72, marginBottom: 6 },
  giftName: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  realTag: { color: '#C0F93C', fontSize: 10, fontWeight: '800', marginTop: 2 },
  giftPrice: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 4 },
});
