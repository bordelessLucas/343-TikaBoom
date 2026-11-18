import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    FlatList,
    Dimensions,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TopBar } from '../../components/TopBar/TopBar';
import { BattleItem } from '../../components/BattleItem/BattleItem';
import { useNavigation } from '../../routes/NavigationContext';
import { livesService, LiveSession } from '../../services/livesService';
import { listDailyRooms, isDailyConfigured } from '../../services/dailyService';
import { styles } from './Live.styles';

const { height } = Dimensions.get('window');
const LIVE_ID_KEY = '@tikaboom_watching_live_id';
const LIVE_ROOM_URL_KEY = '@tikaboom_watching_live_url';
const LIVE_ROOM_NAME_KEY = '@tikaboom_watching_live_room';
const LIVE_PROVIDER_KEY = '@tikaboom_watching_live_provider';

interface ChatMessage {
    id: string;
    user: string;
    message: string;
    timestamp: string;
}

interface Battle {
    id: string;
    videoA: string;
    videoB: string;
    streamerA: { name: string; handle: string; color: string };
    streamerB: { name: string; handle: string; color: string };
    scoreA: number;
    scoreB: number;
    timer: number;
    chatMessages: ChatMessage[];
}

const mockBattles: Battle[] = [
    {
        id: '1',
        videoA: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoB: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        streamerA: { name: 'Maiara', handle: '@mai_live', color: '#ff2d6f' },
        streamerB: { name: 'Mateus', handle: '@mateus', color: '#37a0ff' },
        scoreA: 1240,
        scoreB: 980,
        timer: 180,
        chatMessages: [
            { id: '1', user: 'Lia', message: 'Vamos time A! 🔥', timestamp: 'agora' },
            { id: '2', user: 'Caio', message: 'Mateus reagindo muito! 😎', timestamp: 'agora' },
        ],
    },
];

export const Live = () => {
    const { currentScreen, navigate } = useNavigation();
    const insets = useSafeAreaInsets();
    // TopBar é absolute (tabs + submenu Lives/Batalhas) — lista precisa começar abaixo
    const topBarOffset = Math.max(insets.top, 8) + 108;
    const [activeTab, setActiveTab] = useState<'forYou' | 'lives'>('lives');
    const [liveMode, setLiveMode] = useState<'lives' | 'battle'>('lives');
    const [battles, setBattles] = useState<Battle[]>(mockBattles);
    const [activeLives, setActiveLives] = useState<LiveSession[]>([]);
    const [loadingLives, setLoadingLives] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isChatDragging, setIsChatDragging] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (currentScreen === 'Live') {
            setActiveTab('lives');
        }
    }, [currentScreen]);

    const loadLives = async () => {
        setLoadingLives(true);
        let fromFs: LiveSession[] = [];
        try {
            fromFs = await livesService.listActiveLives();
        } catch (e) {
            console.warn('Lives no banco indisponíveis, tentando Daily…', e);
        }

        let fromDaily: LiveSession[] = [];
        if (isDailyConfigured()) {
            try {
                const rooms = await listDailyRooms();
                fromDaily = rooms.map((r) => ({
                    id: `daily_${r.name}`,
                    hostId: 'daily',
                    hostUsername: 'live',
                    hostDisplayName: r.name.replace(/^tb_/, 'LIVE '),
                    title: `LIVE · ${r.name.slice(-6)}`,
                    status: 'live' as const,
                    roomName: r.name,
                    roomUrl: r.url,
                    viewerCount: 0,
                    startedAt: Date.now(),
                    provider: 'daily' as const,
                }));
            } catch (e) {
                console.warn('Daily list rooms error:', e);
            }
        }

        // Merge por roomName (Firestore tem prioridade de título)
        const map = new Map<string, LiveSession>();
        for (const l of fromDaily) map.set(l.roomName, l);
        for (const l of fromFs) map.set(l.roomName || l.id, l);
        setActiveLives(Array.from(map.values()));
        setLoadingLives(false);
    };

    useEffect(() => {
        loadLives();
        const unsub = livesService.subscribeActiveLives((lives) => {
            if (lives.length > 0) {
                setActiveLives(lives);
                setLoadingLives(false);
            } else {
                loadLives();
            }
        });
        const poll = setInterval(loadLives, 15000);
        return () => {
            unsub();
            clearInterval(poll);
        };
    }, []);

    const openLive = async (live: LiveSession) => {
        await AsyncStorage.setItem(LIVE_ID_KEY, live.id);
        if (live.roomUrl) {
            await AsyncStorage.setItem(LIVE_ROOM_URL_KEY, live.roomUrl);
        } else {
            await AsyncStorage.removeItem(LIVE_ROOM_URL_KEY);
        }
        if (live.roomName) {
            await AsyncStorage.setItem(LIVE_ROOM_NAME_KEY, live.roomName);
        } else {
            await AsyncStorage.removeItem(LIVE_ROOM_NAME_KEY);
        }
        await AsyncStorage.setItem(LIVE_PROVIDER_KEY, live.provider || 'livekit');
        navigate('LiveWatch');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            if (index !== null) setCurrentIndex(index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const handleSendMessage = (battleId: string, message: string) => {
        setBattles((prev) =>
            prev.map((battle) => {
                if (battle.id !== battleId) return battle;
                return {
                    ...battle,
                    chatMessages: [
                        ...battle.chatMessages,
                        {
                            id: Date.now().toString(),
                            user: 'Você',
                            message,
                            timestamp: 'agora',
                        },
                    ],
                };
            })
        );
    };

    const battlePageHeight = Math.max(height - topBarOffset - 90, 500);

    const renderBattle = ({ item, index }: { item: Battle; index: number }) => (
        <View style={{ width: '100%', height: battlePageHeight }}>
            <BattleItem
                videoA={item.videoA}
                videoB={item.videoB}
                streamerA={item.streamerA}
                streamerB={item.streamerB}
                scoreA={item.scoreA}
                scoreB={item.scoreB}
                timer={item.timer}
                isActive={index === currentIndex}
                chatMessages={item.chatMessages}
                onSendMessage={(message) => handleSendMessage(item.id, message)}
                onChatDragStart={() => setIsChatDragging(true)}
                onChatDragEnd={() => setIsChatDragging(false)}
            />
        </View>
    );

    const renderLiveCard = ({ item }: { item: LiveSession }) => (
        <TouchableOpacity style={liveListStyles.card} onPress={() => openLive(item)} activeOpacity={0.9}>
            <View style={liveListStyles.avatarWrap}>
                {item.hostPhotoURL ? (
                    <Image source={{ uri: item.hostPhotoURL }} style={liveListStyles.avatar} />
                ) : (
                    <View style={[liveListStyles.avatar, liveListStyles.avatarFallback]}>
                        <Text style={liveListStyles.avatarLetter}>
                            {(item.hostDisplayName || 'L')[0].toUpperCase()}
                        </Text>
                    </View>
                )}
                <View style={liveListStyles.livePill}>
                    <Text style={liveListStyles.livePillText}>AO VIVO</Text>
                </View>
            </View>
            <View style={liveListStyles.info}>
                <Text style={liveListStyles.title} numberOfLines={1}>
                    {item.title}
                </Text>
                <Text style={liveListStyles.host} numberOfLines={1}>
                    {item.hostDisplayName} · @{item.hostUsername}
                </Text>
                <Text style={liveListStyles.meta}>
                    {item.viewerCount} assistindo · {item.provider === 'livekit' ? 'LiveKit' : item.provider === 'daily' ? 'Daily' : 'Local'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={['#0a0a1a', '#1a1a2e', '#16213e', '#0f1419']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <TopBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                liveMode={liveMode}
                onLiveModeChange={setLiveMode}
            />

            {liveMode === 'lives' ? (
                loadingLives ? (
                    <View style={[liveListStyles.empty, { paddingTop: topBarOffset }]}>
                        <ActivityIndicator color="#C0F93C" size="large" />
                    </View>
                ) : activeLives.length === 0 ? (
                    <View style={[liveListStyles.empty, { paddingTop: topBarOffset }]}>
                        <Ionicons name="radio-outline" size={56} color="rgba(255,255,255,0.35)" />
                        <Text style={liveListStyles.emptyTitle}>Nenhuma LIVE no momento</Text>
                        <Text style={liveListStyles.emptySub}>
                            Vá em Criar → LIVE → Iniciar LIVE para transmitir
                        </Text>
                        <TouchableOpacity
                            style={liveListStyles.cta}
                            onPress={() => navigate('CreateVideo')}
                        >
                            <Text style={liveListStyles.ctaText}>Começar uma LIVE</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={activeLives}
                        keyExtractor={(item) => item.id}
                        renderItem={renderLiveCard}
                        contentContainerStyle={[
                            liveListStyles.list,
                            { paddingTop: topBarOffset, paddingBottom: 100 + insets.bottom },
                        ]}
                        refreshControl={
                            <RefreshControl
                                refreshing={loadingLives}
                                onRefresh={loadLives}
                                tintColor="#C0F93C"
                                progressViewOffset={topBarOffset}
                            />
                        }
                    />
                )
            ) : (
                <View style={{ flex: 1, paddingTop: topBarOffset }}>
                    <FlatList
                        ref={flatListRef}
                        data={battles}
                        renderItem={renderBattle}
                        keyExtractor={(item) => item.id}
                        pagingEnabled
                        showsVerticalScrollIndicator={false}
                        snapToInterval={battlePageHeight}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        scrollEnabled={!isChatDragging}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        getItemLayout={(_, index) => ({
                            length: battlePageHeight,
                            offset: battlePageHeight * index,
                            index,
                        })}
                    />
                </View>
            )}
        </LinearGradient>
    );
};

const liveListStyles = {
    list: { padding: 16, paddingBottom: 100 },
    card: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        gap: 12,
    },
    avatarWrap: { position: 'relative' as const },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    avatarFallback: {
        backgroundColor: '#C0F93C',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    avatarLetter: { color: '#111', fontWeight: '800' as const, fontSize: 20 },
    livePill: {
        position: 'absolute' as const,
        bottom: -4,
        alignSelf: 'center' as const,
        backgroundColor: '#FF2D55',
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    livePillText: { color: '#fff', fontSize: 8, fontWeight: '800' as const },
    info: { flex: 1, gap: 2 },
    title: { color: '#fff', fontWeight: '700' as const, fontSize: 15 },
    host: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
    meta: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
    empty: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: 32,
        gap: 10,
    },
    emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '700' as const },
    emptySub: { color: 'rgba(255,255,255,0.55)', textAlign: 'center' as const, lineHeight: 20 },
    cta: {
        marginTop: 12,
        backgroundColor: '#C0F93C',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
    },
    ctaText: { color: '#111', fontWeight: '800' as const },
};
