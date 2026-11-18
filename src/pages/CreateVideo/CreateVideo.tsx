import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    Dimensions,
    Image,
    FlatList,
    Modal,
    TextInput,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../lib/supabase';
import { postsService } from '../../services/postsService';
import { authService } from '../../services/authService';
import { useNavigation } from '../../routes/NavigationContext';
import { FilterOverlay } from '../../components/CameraFilters/FilterOverlay';
import { FilterPicker } from '../../components/CameraFilters/FilterPicker';
import { BeautyPanel } from '../../components/CameraFilters/BeautyPanel';
import { EffectsPanel } from '../../components/CameraFilters/EffectsPanel';
import { DeepArEffectsPanel } from '../../components/CameraFilters/DeepArEffectsPanel';
import { DeepARCamera } from '../../components/DeepARCamera/DeepARCamera';
import {
    DEFAULT_BEAUTY,
    BeautyConfig,
    FaceEffectId,
    FACE_EFFECTS,
} from '../../lib/cameraFilters';
import {
    isDeepArConfigured,
    mapFaceEffectToDeepAr,
    DeepArEffectId,
} from '../../services/deepArEffects';
import { livesService } from '../../services/livesService';
import {
    prepareHostLiveRoom,
    cleanupHostLiveRoom,
    isAnyLiveProviderConfigured,
    LiveProviderName,
} from '../../services/liveProvider';
import { LiveRoomWebView } from '../../components/LiveRoom/LiveRoomWebView';
import { styles } from './CreateVideo.styles';
import { useSafePad } from '../../hooks/useSafePad';

/** Preview de foto ou vídeo (local) */
function MediaPreview({
    uri,
    type,
    style,
}: {
    uri: string;
    type: 'photo' | 'video';
    style?: object;
}) {
    const player = useVideoPlayer(type === 'video' ? uri : null, (p) => {
        p.loop = true;
        p.muted = false;
    });

    useEffect(() => {
        if (type !== 'video') return;
        try {
            player.play();
        } catch {
            // ignore
        }
        return () => {
            try {
                player.pause();
            } catch {
                // ignore
            }
        };
    }, [type, uri, player]);

    if (type === 'photo') {
        return <Image source={{ uri }} style={style as any} resizeMode="cover" />;
    }

    return (
        <VideoView
            player={player}
            style={style as any}
            contentFit="cover"
            nativeControls
            allowsFullscreen
        />
    );
}

// Mantém a câmera montada após a 1ª permissão (evita abrir/fechar)
let cachedCameraGranted = false;

type TimerDelay = 0 | 3 | 5 | 10;

type VideoDuration = 15 | 60 | 600; // 15s, 60s, 10min (600s)
type CaptureMode = 'video' | 'photo';

type CameraPanel = 'filters' | 'beauty' | 'effects' | 'settings' | null;

interface CapturedMedia {
    id: string;
    uri: string;
    type: 'photo' | 'video';
    timestamp: number;
    duration?: number; // Para vídeos
}

interface Post {
    id: string;
    mediaUri: string;
    mediaType: 'photo' | 'video';
    title: string;
    description: string;
    hashtags: string[];
    isPrivate: boolean;
    timestamp: number;
    duration?: number;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    author: {
        name: string;
        username: string;
        avatar?: string;
    };
}

const STORAGE_KEY = '@tikaboom_captured_media';
const POSTS_STORAGE_KEY = '@tikaboom_posts';

export const CreateVideo = () => {
    const { navigate, currentScreen } = useNavigation();
    const safe = useSafePad(8, 8);
    const cameraRef = useRef<any>(null);
    const recordingPromiseRef = useRef<Promise<any> | null>(null);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recordingTimeRef = useRef<number>(0);
    const isRecordingRef = useRef(false);
    
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [torchOn, setTorchOn] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState<VideoDuration>(60);
    const [captureMode, setCaptureMode] = useState<CaptureMode>('video');
    const [recordingTime, setRecordingTime] = useState(0);
    const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<CapturedMedia | null>(null);
    const [createMode, setCreateMode] = useState<'create' | 'live'>('create');
    const [liveTitle, setLiveTitle] = useState('le LIVE em escala');
    const [cameraReady, setCameraReady] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [timerDelay, setTimerDelay] = useState<TimerDelay>(0);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [beautyOn, setBeautyOn] = useState(false);
    const [mirrorOn, setMirrorOn] = useState(false);
    const [filterId, setFilterId] = useState('normal');
    const [beautyConfig, setBeautyConfig] = useState<BeautyConfig>(DEFAULT_BEAUTY);
    const [faceEffect, setFaceEffect] = useState<FaceEffectId>('none');
    const [deepArEffectId, setDeepArEffectId] = useState<DeepArEffectId>('none');
    const [livePanel, setLivePanel] = useState<CameraPanel>(null);
    const [createPanel, setCreatePanel] = useState<CameraPanel>(null);
    const [deepArFailed, setDeepArFailed] = useState(false);
    const deepArEnabled = isDeepArConfigured() && !deepArFailed;
    const [isLiveOn, setIsLiveOn] = useState(false);
    const [liveSeconds, setLiveSeconds] = useState(0);
    const [liveSource, setLiveSource] = useState<'camera' | 'game'>('camera');
    const [favoriteLive, setFavoriteLive] = useState(false);
    const [activeLiveId, setActiveLiveId] = useState<string | null>(null);
    const [liveRoomUrl, setLiveRoomUrl] = useState<string | null>(null);
    const [liveProvider, setLiveProvider] = useState<LiveProviderName>('local');
    const [liveRoomName, setLiveRoomName] = useState<string | null>(null);
    const [liveStarting, setLiveStarting] = useState(false);
    const [deepArRemountKey, setDeepArRemountKey] = useState(0);
    const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    // Estados para publicação
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [mediaToPublish, setMediaToPublish] = useState<CapturedMedia | null>(null);
    const [postTitle, setPostTitle] = useState('');
    const [postDescription, setPostDescription] = useState('');
    const [postHashtags, setPostHashtags] = useState('');
    const [isPrivatePost, setIsPrivatePost] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);

    const cameraGranted = Boolean(permission?.granted || cachedCameraGranted);
    if (permission?.granted) {
        cachedCameraGranted = true;
    }

    // Carregar mídias salvas e posts ao montar componente
    useEffect(() => {
        loadCapturedMedia();
        loadPosts();
    }, []);

    // Ao entrar na tela, começa sempre na câmera limpa (evita aba/painel preso)
    useEffect(() => {
        if (currentScreen === 'CreateVideo') {
            setCreateMode('create');
            setCreatePanel(null);
            setLivePanel(null);
        }
    }, [currentScreen]);

    useEffect(() => {
        if (permission && !permission.granted && permission.canAskAgain) {
            requestPermission().catch(() => {});
        }
    }, [permission, requestPermission]);

    // Fallback: nunca deixar a UI travada se onCameraReady não disparar
    useEffect(() => {
        if (!cameraGranted) return;
        const t = setTimeout(() => setCameraReady(true), 1500);
        return () => clearTimeout(t);
    }, [cameraGranted, facing]);

    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (liveTimerRef.current) clearInterval(liveTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isLiveOn) {
            if (liveTimerRef.current) clearInterval(liveTimerRef.current);
            liveTimerRef.current = null;
            return;
        }
        setLiveSeconds(0);
        liveTimerRef.current = setInterval(() => {
            setLiveSeconds((s) => s + 1);
        }, 1000);
        return () => {
            if (liveTimerRef.current) clearInterval(liveTimerRef.current);
        };
    }, [isLiveOn]);

    const openLiveMode = () => {
        if (isRecordingRef.current) {
            Alert.alert('Gravação', 'Pare a gravação antes de ir para a LIVE.');
            return;
        }
        setCreatePanel(null);
        setLivePanel(null);
        setDeepArFailed(false);
        setDeepArRemountKey((k) => k + 1);
        setCreateMode('live');
    };

    const toggleCreatePanel = (panel: Exclude<CameraPanel, null>) => {
        setCreatePanel((cur) => (cur === panel ? null : panel));
    };

    const toggleLivePanel = (panel: Exclude<CameraPanel, null>) => {
        setLivePanel((prev) => (prev === panel ? null : panel));
    };

    const toggleLiveStream = async () => {
        if (isLiveOn) {
            try {
                if (activeLiveId && !activeLiveId.startsWith('daily_') && !activeLiveId.startsWith('lk_')) {
                    await livesService.endLive(activeLiveId).catch(() => {});
                } else if (activeLiveId) {
                    // fallback local id — tenta encerrar por room se existir no banco
                    await livesService.endActiveLivesForHost(auth.currentUser?.uid || '').catch(() => {});
                }
                if (liveRoomName) {
                    await cleanupHostLiveRoom(liveProvider, liveRoomName);
                }
                await AsyncStorage.removeItem('@tikaboom_active_live_room');
            } catch (e: any) {
                console.warn('Erro ao encerrar LIVE:', e?.message || e);
            }
            setIsLiveOn(false);
            setActiveLiveId(null);
            setLiveRoomUrl(null);
            setLiveRoomName(null);
            setLiveProvider('local');
            setDeepArFailed(false);
            setDeepArRemountKey((k) => k + 1);
            Alert.alert('LIVE', 'Transmissão encerrada. Efeitos AR de volta.');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Login', 'Faça login para iniciar uma LIVE.');
            navigate('Login');
            return;
        }

        if (liveSource === 'game') {
            Alert.alert('Jogo', 'Espelhamento de jogo em breve. Use a câmera do dispositivo por enquanto.');
            setLiveSource('camera');
        }

        try {
            setLiveStarting(true);

            if (!isAnyLiveProviderConfigured()) {
                throw new Error(
                    'Configure EXPO_PUBLIC_LIVEKIT_URL (recomendado) ou EXPO_PUBLIC_DAILY_API_KEY no .env.'
                );
            }

            await livesService.endActiveLivesForHost(user.uid).catch(() => {});

            let profile = null;
            try {
                profile = await authService.getUserProfile(user.uid);
            } catch {
                profile = null;
            }

            const hostUsername =
                profile?.username ||
                user.email?.split('@')[0] ||
                'user';
            const hostDisplayName = profile?.displayName || user.displayName || hostUsername;
            const title = (liveTitle || '').trim() || `LIVE de ${hostDisplayName}`;
            const roomName = `tb_${user.uid.slice(0, 8)}_${Date.now().toString(36)}`;

            const prepared = await prepareHostLiveRoom({
                roomName,
                displayName: hostDisplayName,
            });

            let sessionId = `${prepared.provider === 'livekit' ? 'lk' : 'daily'}_${roomName}`;
            try {
                const session = await livesService.createLive({
                    title,
                    hostUsername,
                    hostDisplayName,
                    hostPhotoURL: profile?.photoURL,
                    roomName: prepared.roomName,
                    roomUrl: prepared.roomUrl,
                    provider: prepared.provider,
                });
                sessionId = session.id;
            } catch (fsErr: any) {
                console.warn(
                    'Lives no banco indisponíveis, seguindo só com o provedor:',
                    fsErr?.message
                );
                await AsyncStorage.setItem(
                    '@tikaboom_active_live_room',
                    JSON.stringify({
                        id: sessionId,
                        roomName: prepared.roomName,
                        roomUrl: prepared.roomUrl,
                        embedUrl: prepared.embedUrl,
                        provider: prepared.provider,
                        title,
                        hostUsername,
                        hostDisplayName,
                        startedAt: Date.now(),
                    })
                );
            }

            setActiveLiveId(sessionId);
            setLiveProvider(prepared.provider);
            setLiveRoomName(prepared.roomName);
            setLiveRoomUrl(prepared.embedUrl);
            setFacing('front');
            setIsLiveOn(true);
            setLivePanel(null);
        } catch (e: any) {
            console.error('Erro ao iniciar LIVE:', e);
            Alert.alert('Erro', e?.message || 'Não foi possível iniciar a LIVE');
        } finally {
            setLiveStarting(false);
        }
    };

    // Função para parar gravação
    const stopRecordingHandler = async () => {
        if (!isRecordingRef.current || !cameraRef.current) {
            return;
        }

        try {
            if (cameraRef.current.stopRecording) {
                cameraRef.current.stopRecording();
            } else {
                isRecordingRef.current = false;
                setIsRecording(false);
                recordingPromiseRef.current = null;
            }
        } catch (error: any) {
            console.error('Erro ao parar gravação:', error);
            isRecordingRef.current = false;
            setIsRecording(false);
            recordingPromiseRef.current = null;
        }
    };

    // Timer de gravação
    useEffect(() => {
        if (isRecording) {
            recordingTimeRef.current = 0;
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    recordingTimeRef.current = newTime;
                    // Parar automaticamente quando atingir a duração máxima
                    if (newTime >= duration) {
                        // Usar setTimeout para evitar problemas com setState
                        setTimeout(() => {
                            stopRecordingHandler();
                        }, 0);
                        return duration;
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            setRecordingTime(0);
            recordingTimeRef.current = 0;
        }
        
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        };
    }, [isRecording, duration]);

    // Funções de AsyncStorage
    const loadCapturedMedia = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const media: CapturedMedia[] = JSON.parse(stored);
                setCapturedMedia(media);
                console.log(`✅ ${media.length} mídias carregadas do storage`);
            }
        } catch (error) {
            console.error('Erro ao carregar mídias:', error);
        }
    };

    const saveCapturedMedia = async (newMedia: CapturedMedia) => {
        try {
            const updatedMedia = [newMedia, ...capturedMedia];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMedia));
            setCapturedMedia(updatedMedia);
            console.log('✅ Mídia salva no storage:', newMedia.id);
            return true;
        } catch (error) {
            console.error('Erro ao salvar mídia:', error);
            return false;
        }
    };

    const deleteCapturedMedia = async (mediaId: string) => {
        try {
            const updatedMedia = capturedMedia.filter(m => m.id !== mediaId);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMedia));
            setCapturedMedia(updatedMedia);
            console.log('✅ Mídia deletada:', mediaId);
            Alert.alert('Sucesso', 'Mídia deletada com sucesso!');
        } catch (error) {
            console.error('Erro ao deletar mídia:', error);
            Alert.alert('Erro', 'Não foi possível deletar a mídia');
        }
    };

    const clearAllMedia = async () => {
        Alert.alert(
            'Confirmar',
            'Deseja realmente deletar todas as mídias?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Deletar Tudo',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem(STORAGE_KEY);
                            setCapturedMedia([]);
                            console.log('✅ Todas as mídias deletadas');
                            Alert.alert('Sucesso', 'Todas as mídias foram deletadas!');
                        } catch (error) {
                            console.error('Erro ao limpar mídias:', error);
                        }
                    }
                }
            ]
        );
    };

    // Funções de Posts
    const loadPosts = async () => {
        try {
            const stored = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
            if (stored) {
                const loadedPosts: Post[] = JSON.parse(stored);
                setPosts(loadedPosts);
                console.log(`✅ ${loadedPosts.length} posts carregados do storage`);
            }
        } catch (error) {
            console.error('Erro ao carregar posts:', error);
        }
    };

    const openPublishModal = (media: CapturedMedia) => {
        setMediaToPublish(media);
        setPostTitle('');
        setPostDescription('');
        setPostHashtags('');
        setIsPrivatePost(false);
        setShowPublishModal(true);
    };

    const publishPost = async () => {
        if (!mediaToPublish || isPublishing) return;
        
        if (!postTitle.trim()) {
            Alert.alert('Atenção', 'Por favor, adicione um título ao seu post');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Erro', 'Você precisa estar logado para publicar');
            navigate('Login');
            return;
        }

        try {
            setIsPublishing(true);

            const { refreshAuthUser } = await import('../../lib/supabase');
            await refreshAuthUser();
            if (!auth.currentUser) {
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            
            // Garantir perfil no Supabase antes de publicar
            await authService.ensureUserProfile(user.uid, user.email || '', user.displayName);
            let userProfile = await authService.getUserProfile(user.uid);
            if (!userProfile) {
                const fallbackName = user.displayName || (user.email || 'user').split('@')[0];
                userProfile = {
                    isVerified: false,
                    uid: user.uid,
                    email: user.email || '',
                    displayName: fallbackName,
                    username: fallbackName.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'user',
                    followers: 0,
                    following: 0,
                    posts: 0,
                    likes: 0,
                    isPrivate: false,
                    createdAt: Date.now(),
                };
            }

            // Upload da mídia para Supabase Storage
            const { mediaURL, thumbnailURL } = await postsService.uploadMedia(
                user.uid,
                mediaToPublish.uri,
                mediaToPublish.type
            );

            // Processar hashtags
            const hashtags = postHashtags
                .split(' ')
                .filter(tag => tag.startsWith('#'))
                .map(tag => tag.trim().toLowerCase());

            // Criar post no Supabase
            const postId = await postsService.createPost({
                authorId: user.uid,
                authorUsername: userProfile.username,
                authorDisplayName: userProfile.displayName,
                authorPhotoURL: userProfile.photoURL,
                mediaType: mediaToPublish.type,
                mediaURL,
                thumbnailURL,
                title: postTitle.trim(),
                description: postDescription.trim(),
                hashtags,
                isPrivate: isPrivatePost,
            });

            // Salvar também no AsyncStorage para compatibilidade
            const newPost = {
                id: postId,
                mediaUri: mediaURL,
                mediaType: mediaToPublish.type,
                title: postTitle.trim(),
                description: postDescription.trim(),
                hashtags,
                isPrivate: isPrivatePost,
                timestamp: Date.now(),
                duration: mediaToPublish.duration,
                likes: 0,
                comments: 0,
                shares: 0,
                views: 0,
                author: {
                    name: userProfile.displayName,
                    username: userProfile.username,
                }
            };

            const updatedPosts = [newPost, ...posts];
            await AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));
            setPosts(updatedPosts);
            
            setShowPublishModal(false);
            setMediaToPublish(null);
            setPostTitle('');
            setPostDescription('');
            setPostHashtags('');
            
            console.log('✅ Post publicado no Supabase:', postId);
            // Vai direto ao feed para o usuário ver o post
            navigate('Home');
        } catch (error: any) {
            console.error('Erro ao publicar post:', error);
            Alert.alert('Erro', error.message || 'Não foi possível publicar o post');
        } finally {
            setIsPublishing(false);
        }
    };

    if (!permission && !cameraGranted) {
        return <View style={styles.container} />;
    }

    if (!cameraGranted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <MaterialIcons name="camera" size={80} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.permissionText}>Precisamos de permissão para acessar a câmera</Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.permissionButton, { marginTop: 12, backgroundColor: '#333' }]} onPress={() => navigate('Home')}>
                        <Text style={styles.permissionButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const toggleCameraFacing = () => {
        if (isRecordingRef.current) return;
        setTorchOn(false);
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    };

    const toggleTorch = () => {
        if (facing === 'front') {
            Alert.alert('Flash', 'O flash só funciona na câmera traseira.');
            return;
        }
        setTorchOn(prev => !prev);
    };

    const cycleTimer = () => {
        setTimerDelay(current => {
            if (current === 0) return 3;
            if (current === 3) return 5;
            if (current === 5) return 10;
            return 0;
        });
    };

    const runCapture = () => {
        if (captureMode === 'photo') {
            takePicture();
        } else if (isRecording) {
            stopRecordingHandler();
        } else {
            startRecording();
        }
    };

    const handleCaptureWithTimer = () => {
        if (isRecording || countdown !== null) {
            if (isRecording) stopRecordingHandler();
            return;
        }

        if (timerDelay === 0) {
            runCapture();
            return;
        }

        let remaining = timerDelay;
        setCountdown(remaining);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                countdownRef.current = null;
                setCountdown(null);
                runCapture();
            } else {
                setCountdown(remaining);
            }
        }, 1000);
    };

    const startRecording = async () => {
        if (!cameraRef.current || isRecordingRef.current) {
            return;
        }
        if (!cameraReady) {
            Alert.alert('Câmera', 'Aguarde a câmera ficar pronta e tente de novo.');
            return;
        }

        try {
            isRecordingRef.current = true;
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimeRef.current = 0;

            // Pequena pausa para o estado estabilizar antes do recordAsync
            await new Promise((r) => setTimeout(r, 50));
            if (!cameraRef.current || !isRecordingRef.current) return;

            const recordingPromise = cameraRef.current.recordAsync({
                maxDuration: duration,
            });
            recordingPromiseRef.current = recordingPromise;

            const video = await recordingPromise;
            const finalDuration = recordingTimeRef.current || 1;

            if (video?.uri) {
                const mediaData: CapturedMedia = {
                    id: `video_${Date.now()}`,
                    uri: video.uri,
                    type: 'video',
                    timestamp: Date.now(),
                    duration: finalDuration,
                };

                const saved = await saveCapturedMedia(mediaData);
                if (saved) {
                    setSelectedMedia(mediaData);
                } else {
                    Alert.alert('Aviso', 'Vídeo gravado mas não foi possível salvar');
                }
            } else {
                Alert.alert('Aviso', 'Vídeo gravado mas não foi possível obter o arquivo');
            }
        } catch (error: any) {
            const errorMessage = String(error?.message || error || '');
            const ignored =
                /unmounted|cancel|stopped|recording/i.test(errorMessage);
            if (!ignored) {
                console.error('Erro ao gravar vídeo:', error);
                Alert.alert('Erro', `Erro ao gravar vídeo: ${errorMessage}`);
            } else {
                console.warn('Gravação interrompida:', errorMessage);
            }
        } finally {
            isRecordingRef.current = false;
            setIsRecording(false);
            recordingPromiseRef.current = null;
            setRecordingTime(0);
            recordingTimeRef.current = 0;
        }
    };

    const takePicture = async () => {
        if (!cameraRef.current) {
            return;
        }
        
        try {
            console.log('📸 Tirando foto...');
            
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.85,
                shutterSound: false,
            });
            
            console.log('✅ Foto tirada:', photo.uri);
            
            const mediaData: CapturedMedia = {
                id: `photo_${Date.now()}`,
                uri: photo.uri,
                type: 'photo',
                timestamp: Date.now(),
            };
            
            await saveCapturedMedia(mediaData);
            // Revisar foto antes de publicar
            setSelectedMedia(mediaData);
            
        } catch (error: any) {
            console.error('❌ Erro:', error);
            Alert.alert('Erro', 'Erro ao tirar foto');
        }
    };

    const handleCapture = () => handleCaptureWithTimer();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const applyFaceEffect = (id: FaceEffectId) => {
        setFaceEffect(id);
        setDeepArEffectId(mapFaceEffectToDeepAr(id));
        if (id === 'beauty' || id === 'doll' || id === 'anime' || id === 'flower') {
            setBeautyOn(true);
        }
        if (id === 'none') {
            setBeautyOn(false);
        }
    };

    const clearAllFilters = () => {
        setFilterId('normal');
        setFaceEffect('none');
        setDeepArEffectId('none');
        setBeautyOn(false);
        setCreatePanel(null);
        setLivePanel(null);
    };

    const exitCamera = async () => {
        setCreatePanel(null);
        setLivePanel(null);
        if (isLiveOn) {
            try {
                if (activeLiveId && !activeLiveId.startsWith('daily_') && !activeLiveId.startsWith('lk_')) {
                    await livesService.endLive(activeLiveId).catch(() => {});
                } else {
                    await livesService.endActiveLivesForHost(auth.currentUser?.uid || '').catch(() => {});
                }
                if (liveRoomName) {
                    await cleanupHostLiveRoom(liveProvider, liveRoomName);
                }
                await AsyncStorage.removeItem('@tikaboom_active_live_room');
            } catch {
                // ignore
            }
            setIsLiveOn(false);
            setActiveLiveId(null);
            setLiveRoomUrl(null);
            setLiveRoomName(null);
        }
        setCreateMode('create');
        navigate('Home');
    };

    // LIVE — mesmo layout limpo da câmera (sem overlays no meio)
    const renderLiveScreen = () => {
        const liveTop = safe.paddingTop;
        const liveBottom = Math.max(safe.insets.bottom, 10);
        const useDeepAr = deepArEnabled;

        if (!cameraGranted) {
            return (
                <View style={[styles.liveContainer, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                    <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 16 }}>
                        Precisamos da câmera para a LIVE.
                    </Text>
                    <TouchableOpacity style={styles.liveStartButton} onPress={() => requestPermission()}>
                        <Text style={styles.liveStartButtonText}>Permitir câmera</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.liveContainer}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                {isLiveOn && liveRoomUrl ? (
                    <LiveRoomWebView roomUrl={liveRoomUrl} style={StyleSheet.absoluteFillObject} />
                ) : useDeepAr ? (
                    <DeepARCamera
                        key={`deepar-${facing}-${deepArRemountKey}`}
                        style={StyleSheet.absoluteFillObject}
                        effectId={deepArEffectId}
                        facing={facing === 'back' ? 'back' : 'front'}
                        onReady={() => {
                            setCameraReady(true);
                            setDeepArFailed(false);
                        }}
                        onError={(msg) => {
                            console.warn('DeepAR falhou, usando câmera local:', msg);
                            setDeepArFailed(true);
                        }}
                    />
                ) : (
                    <CameraView
                        style={StyleSheet.absoluteFill}
                        facing={facing}
                        mode="video"
                        mute={false}
                        enableTorch={torchOn && facing === 'back'}
                        mirror={mirrorOn || facing === 'front'}
                        ref={cameraRef}
                        onCameraReady={() => setCameraReady(true)}
                    />
                )}

                {!isLiveOn || !liveRoomUrl ? (
                    <FilterOverlay
                        filterId={filterId}
                        beautyOn={beautyOn}
                        beauty={beautyConfig}
                        faceEffect={useDeepAr ? 'none' : faceEffect}
                        facing={facing}
                        interactive={false}
                    />
                ) : null}

                {/* Chrome por cima da câmera nativa — sempre visível */}
                <View style={styles.floatingChrome} pointerEvents="box-none">
                    <View style={[styles.topChrome, { paddingTop: liveTop }]}>
                        <TouchableOpacity onPress={exitCamera} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
                        </TouchableOpacity>
                        {isLiveOn ? (
                            <View style={styles.liveRecDot}>
                                <Text style={styles.liveRecDotText}>AO VIVO · {formatTime(liveSeconds)}</Text>
                            </View>
                        ) : (
                            <Text style={styles.liveHeaderTitle}>LIVE</Text>
                        )}
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={() => setFacing((c) => (c === 'back' ? 'front' : 'back'))}
                        >
                            <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {livePanel && (
                        <View style={[styles.createSheet, { bottom: 200 + liveBottom }]}>
                            {livePanel === 'effects' &&
                                (useDeepAr ? (
                                    <DeepArEffectsPanel
                                        selectedId={deepArEffectId}
                                        onSelect={setDeepArEffectId}
                                        onClose={() => setLivePanel(null)}
                                    />
                                ) : (
                                    <EffectsPanel
                                        selectedId={faceEffect}
                                        onSelect={applyFaceEffect}
                                        onClose={() => setLivePanel(null)}
                                    />
                                ))}
                            {livePanel === 'filters' && (
                                <FilterPicker
                                    selectedId={filterId}
                                    onSelect={(id) => {
                                        setFilterId(id);
                                        if (id === 'normal') setBeautyOn(false);
                                        else if (id === 'softglow' || id === 'peach') setBeautyOn(true);
                                    }}
                                    onClose={() => setLivePanel(null)}
                                />
                            )}
                            {livePanel === 'beauty' && (
                                <BeautyPanel
                                    beauty={beautyConfig}
                                    onChange={(next) => {
                                        setBeautyConfig(next);
                                        setBeautyOn(true);
                                    }}
                                    onClose={() => setLivePanel(null)}
                                />
                            )}
                        </View>
                    )}

                    <View style={[styles.bottomControls, { paddingBottom: liveBottom }]}>
                        <View style={styles.liveActionRow}>
                            <TouchableOpacity style={styles.liveActionBtn} onPress={exitCamera}>
                                <Ionicons name="arrow-back" size={20} color="#FFF" />
                                <Text style={styles.liveActionText}>Sair</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.liveActionBtn}
                                onPress={() => setFacing((c) => (c === 'back' ? 'front' : 'back'))}
                            >
                                <Ionicons name="camera-reverse" size={20} color="#FFF" />
                                <Text style={styles.liveActionText}>Inverter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.liveActionBtn, livePanel === 'filters' && styles.liveActionBtnActive]}
                                onPress={() => toggleLivePanel('filters')}
                            >
                                <MaterialIcons name="filter-vintage" size={20} color="#FFF" />
                                <Text style={styles.liveActionText}>Filtros</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.liveActionBtn, livePanel === 'effects' && styles.liveActionBtnActive]}
                                onPress={() => {
                                    setDeepArFailed(false);
                                    setDeepArRemountKey((k) => k + 1);
                                    toggleLivePanel('effects');
                                }}
                            >
                                <MaterialIcons name="auto-awesome" size={20} color="#FFF" />
                                <Text style={styles.liveActionText}>Efeitos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.liveActionBtn} onPress={clearAllFilters}>
                                <MaterialIcons name="block" size={20} color="#FF6B6B" />
                                <Text style={[styles.liveActionText, { color: '#FF6B6B' }]}>Limpar</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.liveStartButton, isLiveOn && styles.liveStopButton]}
                            onPress={toggleLiveStream}
                            disabled={liveStarting}
                        >
                            <Text style={[styles.liveStartButtonText, isLiveOn && styles.liveStopButtonText]}>
                                {liveStarting ? 'Conectando…' : isLiveOn ? 'Encerrar LIVE' : 'Iniciar LIVE'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.bottomMenu}>
                            <TouchableOpacity
                                style={styles.bottomMenuItem}
                                onPress={() => {
                                    setLivePanel(null);
                                    setCreateMode('create');
                                }}
                            >
                                <Text style={styles.bottomMenuText}>CÂMERA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.bottomMenuItem}
                                onPress={() => {
                                    setLivePanel(null);
                                    setCreateMode('create');
                                    setShowGalleryModal(true);
                                }}
                            >
                                <Text style={styles.bottomMenuText}>CRIAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.bottomMenuItem}>
                                <Text style={[styles.bottomMenuText, styles.bottomMenuTextActive]}>LIVE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    // Se estiver no modo Live, renderizar tela de Live
    if (createMode === 'live') {
        return renderLiveScreen();
    }

    const topInset = safe.paddingTop;
    const bottomInset = Math.max(safe.insets.bottom, 10);
    const timerLabel = timerDelay === 0 ? '' : `${timerDelay}s`;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Sem key dinâmica: remount no meio do recordAsync causa "Camera unmounted" */}
            <CameraView
                style={styles.camera}
                facing={facing}
                mode="video"
                mute={false}
                enableTorch={torchOn && facing === 'back'}
                mirror={mirrorOn}
                ref={cameraRef}
                onCameraReady={() => setCameraReady(true)}
                onMountError={(e) => {
                    console.error('Erro ao montar câmera:', e);
                    setCameraReady(true);
                    Alert.alert(
                        'Câmera',
                        'Não foi possível abrir a câmera. Feche outros apps que usam a câmera e tente de novo.'
                    );
                }}
            />

            <FilterOverlay
                filterId={filterId}
                beautyOn={beautyOn}
                beauty={beautyConfig}
                faceEffect={faceEffect}
                facing={facing}
                interactive={false}
            />

            <View style={styles.floatingChrome} pointerEvents="box-none">
                <View style={[styles.topChrome, { paddingTop: topInset }]}>
                    <TouchableOpacity onPress={exitCamera} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.addSoundButton} activeOpacity={0.85}>
                        <MaterialIcons name="music-note" size={18} color="#FFFFFF" />
                        <Text style={styles.addSoundText}>Adicionar som</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.refreshButton} onPress={toggleCameraFacing}>
                        <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.sideOptions, { top: topInset + 70 }]}>
                    <TouchableOpacity style={[styles.sideOption, styles.sideOptionBg, torchOn && styles.sideOptionActive]} onPress={toggleTorch}>
                        <Ionicons name={torchOn ? 'flash' : 'flash-off'} size={22} color={torchOn ? '#111' : '#FFF'} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.sideOption, styles.sideOptionBg, timerDelay > 0 && styles.sideOptionActive]} onPress={cycleTimer}>
                        <MaterialIcons name="timer" size={22} color={timerDelay > 0 ? '#111' : '#FFF'} />
                        {timerDelay > 0 && <Text style={styles.sideOptionBadge}>{timerLabel}</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sideOption, styles.sideOptionBg, (beautyOn || createPanel === 'beauty') && styles.sideOptionActive]}
                        onPress={() => {
                            setBeautyOn(true);
                            toggleCreatePanel('beauty');
                        }}
                    >
                        <MaterialIcons name="auto-fix-high" size={22} color={beautyOn || createPanel === 'beauty' ? '#111' : '#FFF'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sideOption, styles.sideOptionBg, (filterId !== 'normal' || createPanel === 'filters') && styles.sideOptionActive]}
                        onPress={() => toggleCreatePanel('filters')}
                    >
                        <MaterialIcons name="filter-vintage" size={22} color={filterId !== 'normal' || createPanel === 'filters' ? '#111' : '#FFF'} />
                    </TouchableOpacity>
                    <Text style={styles.sideOptionLabel}>Filtros</Text>

                    <TouchableOpacity
                        style={[styles.sideOption, styles.sideOptionBg, (faceEffect !== 'none' || createPanel === 'effects') && styles.sideOptionActive]}
                        onPress={() => toggleCreatePanel('effects')}
                    >
                        <MaterialIcons name="auto-awesome" size={22} color={faceEffect !== 'none' || createPanel === 'effects' ? '#111' : '#FFF'} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.sideOption, styles.sideOptionBg]} onPress={clearAllFilters}>
                        <MaterialIcons name="block" size={22} color="#FF6B6B" />
                    </TouchableOpacity>
                    <Text style={styles.sideOptionLabel}>Limpar</Text>
                </View>

                {countdown !== null && (
                    <View style={styles.countdownOverlay} pointerEvents="none">
                        <Text style={styles.countdownText}>{countdown}</Text>
                    </View>
                )}

                {isRecording && (
                    <View style={[styles.recordingIndicator, { top: topInset + 8 }]} pointerEvents="none">
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                    </View>
                )}

                {createPanel && (
                    <View style={[styles.createSheet, { bottom: 160 + bottomInset }]}>
                        {createPanel === 'filters' && (
                            <FilterPicker
                                selectedId={filterId}
                                onSelect={(id) => {
                                    setFilterId(id);
                                    if (id === 'normal') setBeautyOn(false);
                                    else if (id === 'softglow' || id === 'peach') setBeautyOn(true);
                                }}
                                onClose={() => setCreatePanel(null)}
                            />
                        )}
                        {createPanel === 'beauty' && (
                            <BeautyPanel
                                beauty={beautyConfig}
                                onChange={(next) => {
                                    setBeautyConfig(next);
                                    setBeautyOn(true);
                                }}
                                onClose={() => setCreatePanel(null)}
                            />
                        )}
                        {createPanel === 'effects' && (
                            <EffectsPanel
                                selectedId={faceEffect}
                                onSelect={applyFaceEffect}
                                onClose={() => setCreatePanel(null)}
                            />
                        )}
                    </View>
                )}

                <View style={[styles.bottomControls, { paddingBottom: bottomInset }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.modeStrip}
                        style={styles.modeStripScroll}
                    >
                        {([600, 60, 15] as VideoDuration[]).map((value) => {
                            const active = captureMode === 'video' && duration === value;
                            return (
                                <TouchableOpacity
                                    key={value}
                                    style={[styles.modeChip, active && styles.modeChipActive]}
                                    onPress={() => {
                                        setCaptureMode('video');
                                        setDuration(value);
                                    }}
                                >
                                    <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                                        {value === 600 ? '10 min' : `${value} s`}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity
                            style={[styles.modeChip, captureMode === 'photo' && styles.modeChipActive]}
                            onPress={() => setCaptureMode('photo')}
                        >
                            <Text style={[styles.modeChipText, captureMode === 'photo' && styles.modeChipTextActive]}>
                                FOTO
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.captureRow}>
                        <View style={styles.captureSide}>
                            <TouchableOpacity style={styles.galleryButton} onPress={() => setShowGalleryModal(true)}>
                                {capturedMedia[0] ? (
                                    <Image source={{ uri: capturedMedia[0].uri }} style={styles.galleryThumb} />
                                ) : (
                                    <MaterialIcons name="photo-library" size={22} color="#FFFFFF" />
                                )}
                                {capturedMedia.length > 0 && (
                                    <View style={styles.galleryBadge}>
                                        <Text style={styles.galleryBadgeText}>{capturedMedia.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
                            onPress={handleCapture}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.captureButtonInner, isRecording && styles.captureButtonInnerRecording]} />
                        </TouchableOpacity>

                        <View style={styles.captureSide}>
                            <TouchableOpacity
                                style={styles.flipButton}
                                onPress={toggleCameraFacing}
                                disabled={isRecording}
                            >
                                <Ionicons name="camera-reverse" size={26} color={isRecording ? '#666' : '#FFFFFF'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.bottomMenu}>
                        <TouchableOpacity
                            style={styles.bottomMenuItem}
                            onPress={() => {
                                setCreatePanel(null);
                                setCreateMode('create');
                            }}
                        >
                            <Text style={[styles.bottomMenuText, styles.bottomMenuTextActive]}>CÂMERA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.bottomMenuItem}
                            onPress={() => {
                                if (isRecordingRef.current) return;
                                setCreatePanel(null);
                                setShowGalleryModal(true);
                            }}
                        >
                            <Text style={styles.bottomMenuText}>CRIAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.bottomMenuItem} onPress={openLiveMode}>
                            <Text style={styles.bottomMenuText}>LIVE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Gallery Modal */}
            <Modal
                visible={showGalleryModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowGalleryModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowGalleryModal(false)}>
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            Mídias Capturadas ({capturedMedia.length})
                        </Text>
                        <TouchableOpacity onPress={clearAllMedia}>
                            <MaterialIcons name="delete-sweep" size={28} color="#FF4444" />
                        </TouchableOpacity>
                    </View>

                    {capturedMedia.length === 0 ? (
                        <View style={styles.emptyGallery}>
                            <MaterialIcons name="photo-library" size={80} color="rgba(255,255,255,0.3)" />
                            <Text style={styles.emptyGalleryText}>
                                Nenhuma mídia capturada ainda
                            </Text>
                            <Text style={styles.emptyGallerySubtext}>
                                Tire fotos ou grave vídeos para vê-los aqui
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={capturedMedia}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            contentContainerStyle={styles.galleryGrid}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.galleryItem}
                                    onPress={() => setSelectedMedia(item)}
                                >
                                    <Image source={{ uri: item.uri }} style={styles.galleryImage} />
                                    <View style={styles.mediaTypeIndicator}>
                                        <Ionicons 
                                            name={item.type === 'video' ? 'videocam' : 'camera'} 
                                            size={16} 
                                            color="#FFFFFF" 
                                        />
                                    </View>
                                    {item.type === 'video' && item.duration && (
                                        <View style={styles.durationIndicator}>
                                            <Text style={styles.videoDurationText}>
                                                {Math.floor(item.duration)}s
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>

            {/* Media Detail Modal */}
            <Modal
                visible={selectedMedia !== null}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedMedia(null)}
            >
                <View style={styles.detailModalContainer}>
                    <TouchableOpacity 
                        style={styles.detailModalBackdrop}
                        activeOpacity={1}
                        onPress={() => setSelectedMedia(null)}
                    />
                    
                    {selectedMedia && (
                        <View style={styles.detailModalContent}>
                            <MediaPreview
                                uri={selectedMedia.uri}
                                type={selectedMedia.type}
                                style={styles.detailImage}
                            />
                            
                            <View style={styles.detailInfo}>
                                <View style={styles.detailInfoRow}>
                                    <Ionicons 
                                        name={selectedMedia.type === 'video' ? 'videocam' : 'camera'} 
                                        size={20} 
                                        color="#FFFFFF" 
                                    />
                                    <Text style={styles.detailInfoText}>
                                        {selectedMedia.type === 'video' ? 'Vídeo' : 'Foto'}
                                    </Text>
                                </View>
                                
                                <View style={styles.detailInfoRow}>
                                    <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.detailInfoText}>
                                        {new Date(selectedMedia.timestamp).toLocaleString('pt-BR')}
                                    </Text>
                                </View>
                                
                                {selectedMedia.type === 'video' && selectedMedia.duration && (
                                    <View style={styles.detailInfoRow}>
                                        <Ionicons name="timer-outline" size={20} color="#FFFFFF" />
                                        <Text style={styles.detailInfoText}>
                                            Duração: {Math.floor(selectedMedia.duration)}s
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.detailActions}>
                                <TouchableOpacity 
                                    style={styles.detailActionButton}
                                    onPress={() => {
                                        const media = selectedMedia;
                                        setSelectedMedia(null);
                                        setShowGalleryModal(false);
                                        openPublishModal(media);
                                    }}
                                >
                                    <Ionicons name="cloud-upload" size={24} color="#C0F93C" />
                                    <Text style={[styles.detailActionText, { color: '#C0F93C' }]}>Publicar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.detailActionButton, styles.deleteButton]}
                                    onPress={() => {
                                        deleteCapturedMedia(selectedMedia.id);
                                        setSelectedMedia(null);
                                    }}
                                >
                                    <Ionicons name="trash" size={24} color="#FF4444" />
                                    <Text style={[styles.detailActionText, styles.deleteButtonText]}>Deletar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Publish Modal */}
            <Modal
                visible={showPublishModal}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowPublishModal(false)}
            >
                <KeyboardAvoidingView
                    style={styles.publishModalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
                >
                    {/* Header */}
                    <View style={styles.publishModalHeader}>
                        <TouchableOpacity onPress={() => setShowPublishModal(false)}>
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.publishModalTitle}>Publicar</Text>
                        <TouchableOpacity onPress={publishPost} disabled={isPublishing}>
                            <Text style={styles.publishButton}>{isPublishing ? 'Publicando...' : 'Publicar'}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                    {/* Preview — vídeo com player real */}
                    {mediaToPublish && (
                        <View style={styles.publishPreview}>
                            <MediaPreview
                                uri={mediaToPublish.uri}
                                type={mediaToPublish.type}
                                style={styles.publishPreviewImage}
                            />
                            <View style={styles.publishPreviewBadge}>
                                <Ionicons 
                                    name={mediaToPublish.type === 'video' ? 'videocam' : 'camera'} 
                                    size={16} 
                                    color="#FFFFFF" 
                                />
                            </View>
                        </View>
                    )}

                    {/* Form */}
                    <View style={styles.publishForm}>
                        {/* Título */}
                        <View style={styles.publishFormGroup}>
                            <Text style={styles.publishLabel}>Título *</Text>
                            <TextInput
                                style={styles.publishInput}
                                placeholder="Adicione um título chamativo..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={postTitle}
                                onChangeText={setPostTitle}
                                maxLength={100}
                            />
                            <Text style={styles.publishCharCount}>{postTitle.length}/100</Text>
                        </View>

                        {/* Descrição */}
                        <View style={styles.publishFormGroup}>
                            <Text style={styles.publishLabel}>Descrição</Text>
                            <TextInput
                                style={[styles.publishInput, styles.publishTextArea]}
                                placeholder="Conte mais sobre seu conteúdo..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={postDescription}
                                onChangeText={setPostDescription}
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                            />
                            <Text style={styles.publishCharCount}>{postDescription.length}/500</Text>
                        </View>

                        {/* Hashtags */}
                        <View style={styles.publishFormGroup}>
                            <Text style={styles.publishLabel}>Hashtags</Text>
                            <TextInput
                                style={styles.publishInput}
                                placeholder="#tikaboom #viral #trending"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={postHashtags}
                                onChangeText={setPostHashtags}
                            />
                            <Text style={styles.publishHint}>Separe hashtags com espaços</Text>
                        </View>

                        {/* Privacidade */}
                        <View style={styles.publishFormGroup}>
                            <Text style={styles.publishLabel}>Privacidade</Text>
                            <View style={styles.publishPrivacyOptions}>
                                <TouchableOpacity 
                                    style={[
                                        styles.publishPrivacyOption,
                                        !isPrivatePost && styles.publishPrivacyOptionActive
                                    ]}
                                    onPress={() => setIsPrivatePost(false)}
                                >
                                    <Ionicons 
                                        name="earth" 
                                        size={20} 
                                        color={!isPrivatePost ? "#C0F93C" : "#FFFFFF"} 
                                    />
                                    <Text style={[
                                        styles.publishPrivacyText,
                                        !isPrivatePost && styles.publishPrivacyTextActive
                                    ]}>
                                        Público
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[
                                        styles.publishPrivacyOption,
                                        isPrivatePost && styles.publishPrivacyOptionActive
                                    ]}
                                    onPress={() => setIsPrivatePost(true)}
                                >
                                    <Ionicons 
                                        name="lock-closed" 
                                        size={20} 
                                        color={isPrivatePost ? "#C0F93C" : "#FFFFFF"} 
                                    />
                                    <Text style={[
                                        styles.publishPrivacyText,
                                        isPrivatePost && styles.publishPrivacyTextActive
                                    ]}>
                                        Privado
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

