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
import { auth } from '../../lib/firebaseconfig';
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
} from '../../lib/cameraFilters';
import {
    isDeepArConfigured,
    mapFaceEffectToDeepAr,
    DeepArEffectId,
} from '../../services/deepArEffects';
import { livesService } from '../../services/livesService';
import {
    isDailyConfigured,
    createDailyRoom,
    deleteDailyRoom,
    buildDailyEmbedUrl,
} from '../../services/dailyService';
import { LiveRoomWebView } from '../../components/LiveRoom/LiveRoomWebView';
import { styles } from './CreateVideo.styles';

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
    const { navigate } = useNavigation();
    const cameraRef = useRef<any>(null);
    const recordingPromiseRef = useRef<Promise<any> | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recordingTimeRef = useRef<number>(0);
    
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
    const [sideExpanded, setSideExpanded] = useState(true);
    const [beautyOn, setBeautyOn] = useState(false);
    const [mirrorOn, setMirrorOn] = useState(false);
    const [filterId, setFilterId] = useState('normal');
    const [beautyConfig, setBeautyConfig] = useState<BeautyConfig>(DEFAULT_BEAUTY);
    const [faceEffect, setFaceEffect] = useState<FaceEffectId>('none');
    const [deepArEffectId, setDeepArEffectId] = useState<DeepArEffectId>('none');
    const [livePanel, setLivePanel] = useState<'filters' | 'beauty' | 'effects' | 'settings' | null>(null);
    const [deepArFailed, setDeepArFailed] = useState(false);
    const deepArEnabled = isDeepArConfigured() && !deepArFailed;
    const [isLiveOn, setIsLiveOn] = useState(false);
    const [liveSeconds, setLiveSeconds] = useState(0);
    const [liveSource, setLiveSource] = useState<'camera' | 'game'>('camera');
    const [favoriteLive, setFavoriteLive] = useState(false);
    const [showCreateFilters, setShowCreateFilters] = useState(false);
    const [activeLiveId, setActiveLiveId] = useState<string | null>(null);
    const [liveRoomUrl, setLiveRoomUrl] = useState<string | null>(null);
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

    const toggleLivePanel = (panel: 'filters' | 'beauty' | 'effects' | 'settings') => {
        setLivePanel((prev) => (prev === panel ? null : panel));
    };

    const toggleLiveStream = async () => {
        if (isLiveOn) {
            try {
                if (activeLiveId && !activeLiveId.startsWith('daily_')) {
                    await livesService.endLive(activeLiveId).catch(() => {});
                }
                if (liveRoomUrl) {
                    const roomName = liveRoomUrl.split('/').pop()?.split('?')[0];
                    if (roomName) deleteDailyRoom(roomName).catch(() => {});
                }
                await AsyncStorage.removeItem('@tikaboom_active_daily_room');
            } catch (e: any) {
                console.warn('Erro ao encerrar LIVE:', e?.message || e);
            }
            setIsLiveOn(false);
            setActiveLiveId(null);
            setLiveRoomUrl(null);
            // Volta os efeitos AR (DeepAR) após sair da sala Daily
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
            await user.getIdToken(true).catch(() => {});

            // Encerra lives antigas do mesmo host (ignora erro de regras)
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

            let roomUrl: string | undefined;
            let provider: 'daily' | 'local' = 'local';

            if (!isDailyConfigured()) {
                throw new Error(
                    'Configure EXPO_PUBLIC_DAILY_API_KEY no .env para transmitir LIVE real.'
                );
            }

            const room = await createDailyRoom(roomName);
            roomUrl = room.url;
            provider = 'daily';

            let sessionId = `daily_${roomName}`;
            try {
                const session = await livesService.createLive({
                    title,
                    hostUsername,
                    hostDisplayName,
                    hostPhotoURL: profile?.photoURL,
                    roomName,
                    roomUrl,
                    provider,
                });
                sessionId = session.id;
            } catch (fsErr: any) {
                // Firestore bloqueado → segue só com Daily (lista via API Daily)
                console.warn(
                    'Firestore indisponível p/ LIVE, usando só Daily:',
                    fsErr?.code || fsErr?.message
                );
                await AsyncStorage.setItem(
                    '@tikaboom_active_daily_room',
                    JSON.stringify({
                        id: sessionId,
                        roomName,
                        roomUrl,
                        title,
                        hostUsername,
                        hostDisplayName,
                        startedAt: Date.now(),
                    })
                );
            }

            setActiveLiveId(sessionId);
            setLiveRoomUrl(buildDailyEmbedUrl(roomUrl, hostDisplayName, true));
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
        if (!isRecording || !cameraRef.current) {
            console.log('⚠️ Não há gravação ativa para parar');
            return;
        }
        
        try {
            console.log('🛑 Parando gravação...');
            
            // Chamar stopRecording no ref da câmera
            // Isso faz com que a Promise do recordAsync resolva
            if (cameraRef.current.stopRecording) {
                cameraRef.current.stopRecording();
            } else {
                console.error('❌ stopRecording não está disponível no cameraRef');
                setIsRecording(false);
                recordingPromiseRef.current = null;
            }
            
        } catch (error: any) {
            console.error('❌ Erro ao parar gravação:', error);
            setIsRecording(false);
            recordingPromiseRef.current = null;
            Alert.alert('Erro', 'Erro ao parar a gravação');
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
            
            // Garantir perfil no Firestore antes de publicar
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

            // Upload da mídia para Firebase Storage
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

            // Criar post no Firestore
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
            
            console.log('✅ Post publicado no Firebase:', postId);
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
        setCameraReady(false);
        setTorchOn(false);
        setFacing(current => (current === 'back' ? 'front' : 'back'));
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
        if (!cameraRef.current || isRecording) {
            console.log('⚠️ Não é possível iniciar gravação:', { 
                hasCamera: !!cameraRef.current, 
                isRecording 
            });
            return;
        }
        
        try {
            console.log('🎥 Iniciando gravação de vídeo...');
            
            // Iniciar gravação - recordAsync retorna uma Promise que resolve quando stopRecording é chamado
            const recordingPromise = cameraRef.current.recordAsync({
                maxDuration: duration,
                quality: '720p',
            });
            
            // Armazenar a Promise em um ref para poder parar depois
            recordingPromiseRef.current = recordingPromise;
            setIsRecording(true);
            setRecordingTime(0);
            
            // Aguardar a Promise resolver (isso acontece quando stopRecording é chamado)
            const video = await recordingPromise;
            
            // Capturar o tempo de gravação do ref (sempre atualizado)
            const finalDuration = recordingTimeRef.current || 1;
            
            console.log('✅ Vídeo gravado com sucesso:', video?.uri, `Duração: ${finalDuration}s`);
            
            if (video && video.uri) {
                const mediaData: CapturedMedia = {
                    id: `video_${Date.now()}`,
                    uri: video.uri,
                    type: 'video',
                    timestamp: Date.now(),
                    duration: finalDuration,
                };
                
                const saved = await saveCapturedMedia(mediaData);
                if (saved) {
                    // Abrir preview para revisar o vídeo antes de publicar
                    setSelectedMedia(mediaData);
                } else {
                    Alert.alert('Aviso', 'Vídeo gravado mas não foi possível salvar');
                }
            } else {
                console.warn('⚠️ Vídeo gravado mas sem URI válida');
                Alert.alert('Aviso', 'Vídeo gravado mas não foi possível obter o arquivo');
            }
            
        } catch (error: any) {
            console.error('❌ Erro ao gravar vídeo:', error);
            const errorMessage = error?.message || 'Erro desconhecido';
            
            // Ignorar erros de cancelamento de gravação
            if (!errorMessage.includes('recording') && !errorMessage.includes('cancel')) {
                Alert.alert('Erro', `Erro ao gravar vídeo: ${errorMessage}`);
            }
        } finally {
            setIsRecording(false);
            recordingPromiseRef.current = null;
            setRecordingTime(0);
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

    // LIVE — rosto limpo no centro; TODOS os controles só embaixo
    const renderLiveScreen = () => {
        const liveTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 54;
        const useDeepAr = deepArEnabled;

        if (!cameraGranted) {
            return (
                <View style={[styles.liveContainer, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                    <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 16 }}>
                        Precisamos da câmera para a LIVE com filtros.
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

                {/* Com Daily ativo + LIVE ligada → stream real via WebView */}
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
                    <>
                        <CameraView
                            key={`live-cam-${facing}`}
                            style={StyleSheet.absoluteFill}
                            facing={facing}
                            mode="video"
                            mute={false}
                            enableTorch={torchOn && facing === 'back'}
                            mirror={mirrorOn || facing === 'front'}
                            ref={cameraRef}
                            onCameraReady={() => setCameraReady(true)}
                        />
                        {(filterId !== 'normal' || beautyOn || faceEffect !== 'none') && (
                            <FilterOverlay
                                filterId={filterId}
                                beautyOn={beautyOn}
                                beauty={beautyConfig}
                                faceEffect={faceEffect}
                                facing={facing}
                            />
                        )}
                    </>
                )}

                <View style={styles.liveOverlay} pointerEvents="box-none">
                    {/* TOPO: só fechar + status — zero ícones no meio do rosto */}
                    <View style={[styles.liveTopBar, { paddingTop: liveTop }]} pointerEvents="box-none">
                        <TouchableOpacity
                            onPress={() => {
                                // Se um painel está aberto, o X só fecha o painel (não sai da LIVE)
                                if (livePanel) {
                                    setLivePanel(null);
                                    return;
                                }
                                setIsLiveOn(false);
                                navigate('Home');
                            }}
                            style={styles.liveCloseButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>

                        {isLiveOn ? (
                            <View style={styles.liveRecDot}>
                                <Text style={styles.liveRecDotText}>AO VIVO · {formatTime(liveSeconds)}</Text>
                            </View>
                        ) : (
                            <View style={{ flex: 1 }} />
                        )}

                        <View style={{ width: 40 }} />
                    </View>

                    {/* Espaço livre do rosto */}
                    <View style={{ flex: 1 }} pointerEvents="none" />

                    {/* ========== DOCK INFERIOR (clean) ========== */}
                    <View style={styles.liveBottomDock} pointerEvents="box-none">
                        {/* Carrossel de efeitos / filtros / beleza */}
                        {livePanel === 'effects' && (
                            useDeepAr ? (
                                <DeepArEffectsPanel
                                    selectedId={deepArEffectId}
                                    onSelect={setDeepArEffectId}
                                    onClose={() => setLivePanel(null)}
                                />
                            ) : (
                                <EffectsPanel
                                    selectedId={faceEffect}
                                    onSelect={(id) => {
                                        setFaceEffect(id);
                                        setDeepArEffectId(mapFaceEffectToDeepAr(id));
                                        if (id === 'beauty' || id === 'doll' || id === 'anime' || id === 'flower') {
                                            setBeautyOn(true);
                                        }
                                    }}
                                    onClose={() => setLivePanel(null)}
                                />
                            )
                        )}
                        {livePanel === 'filters' && (
                            <FilterPicker
                                selectedId={filterId}
                                onSelect={(id) => {
                                    setFilterId(id);
                                    if (id === 'softglow' || id === 'peach') setBeautyOn(true);
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
                        {livePanel === 'settings' && (
                            <View style={styles.liveSettingsPanel}>
                                <View style={styles.liveSettingsHeader}>
                                    <Text style={styles.liveSettingsTitle}>Configurações</Text>
                                    <TouchableOpacity onPress={() => setLivePanel(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Text style={styles.livePanelClose}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.liveSettingsInput}
                                    value={liveTitle}
                                    onChangeText={setLiveTitle}
                                    placeholder="Título da LIVE"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                />
                                <TouchableOpacity style={styles.liveSettingsRow} onPress={() => setMirrorOn((v) => !v)}>
                                    <Text style={styles.liveSettingsLabel}>Espelho</Text>
                                    <Text style={styles.liveSettingsValue}>{mirrorOn ? 'On' : 'Off'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.liveSettingsRow}
                                    onPress={() => {
                                        setFilterId('normal');
                                        setFaceEffect('none');
                                        setDeepArEffectId('none');
                                        setBeautyOn(false);
                                    }}
                                >
                                    <Text style={styles.liveSettingsLabel}>Limpar efeitos</Text>
                                    <Text style={styles.liveSettingsValue}>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Fila de ícones EMBAIXO — não cobre o rosto */}
                        <View style={styles.liveBottomTools}>
                            <TouchableOpacity style={styles.liveBottomTool} onPress={() => setFacing((c) => (c === 'back' ? 'front' : 'back'))}>
                                <Ionicons name="camera-reverse" size={22} color="#FFF" />
                                <Text style={styles.liveBottomToolText}>Girar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.liveBottomTool}
                                onPress={() => {
                                    setBeautyOn(true);
                                    toggleLivePanel('beauty');
                                }}
                            >
                                <MaterialIcons name="auto-fix-high" size={22} color={livePanel === 'beauty' ? '#C0F93C' : '#FFF'} />
                                <Text style={styles.liveBottomToolText}>Beleza</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.liveBottomTool}
                                onPress={() => {
                                    if (isLiveOn && liveRoomUrl) {
                                        Alert.alert(
                                            'Efeitos AR',
                                            'Durante a LIVE (Daily) a câmera é da sala de transmissão.\n\nEncerrar a LIVE para voltar aos efeitos DeepAR.'
                                        );
                                        return;
                                    }
                                    // Garante DeepAR de novo se tinha caído
                                    setDeepArFailed(false);
                                    setDeepArRemountKey((k) => k + 1);
                                    toggleLivePanel('effects');
                                }}
                            >
                                <MaterialIcons name="auto-awesome" size={22} color={livePanel === 'effects' ? '#C0F93C' : '#FFF'} />
                                <Text style={styles.liveBottomToolText}>Efeitos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.liveBottomTool} onPress={() => toggleLivePanel('filters')}>
                                <MaterialIcons name="filter-vintage" size={22} color={livePanel === 'filters' ? '#C0F93C' : '#FFF'} />
                                <Text style={styles.liveBottomToolText}>Filtros</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.liveBottomTool} onPress={() => toggleLivePanel('settings')}>
                                <Ionicons name="settings-outline" size={22} color={livePanel === 'settings' ? '#C0F93C' : '#FFF'} />
                                <Text style={styles.liveBottomToolText}>Mais</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.liveStartButton, isLiveOn && styles.liveStopButton]}
                            onPress={toggleLiveStream}
                            disabled={liveStarting}
                        >
                            <Text style={[styles.liveStartButtonText, isLiveOn && styles.liveStopButtonText]}>
                                {liveStarting
                                    ? 'Conectando…'
                                    : isLiveOn
                                      ? 'Encerrar LIVE'
                                      : 'Iniciar LIVE'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.bottomMenu}>
                            <TouchableOpacity
                                style={styles.bottomMenuItem}
                                onPress={() => Alert.alert('Publicação', 'Use o modo CRIAR para postar no feed.')}
                            >
                                <Text style={styles.bottomMenuText}>PUBLICAÇÃO</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.bottomMenuItem} onPress={() => setCreateMode('create')}>
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

    const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 54;
    const timerLabel = timerDelay === 0 ? '' : `${timerDelay}s`;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Preview em flex:1 — mais estável que absoluteFill no device */}
            <CameraView
                key={`cam-${facing}`}
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
            />

            <View style={styles.cameraOverlay} pointerEvents="box-none">
                <View style={[styles.header, { paddingTop: topInset }]} pointerEvents="box-none">
                    <TouchableOpacity
                        onPress={() => navigate('Home')}
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.addSoundButton} activeOpacity={0.85}>
                        <MaterialIcons name="music-note" size={18} color="#FFFFFF" />
                        <Text style={styles.addSoundText}>Adicionar som</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={toggleCameraFacing}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.sideOptions, { top: topInset + 72 }]}>
                    <TouchableOpacity style={[styles.sideOption, torchOn && styles.sideOptionActive]} onPress={toggleTorch}>
                        <Ionicons name={torchOn ? 'flash' : 'flash-off'} size={22} color={torchOn ? '#111111' : '#FFFFFF'} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.sideOption, timerDelay > 0 && styles.sideOptionActive]} onPress={cycleTimer}>
                        <MaterialIcons name="timer" size={22} color={timerDelay > 0 ? '#111111' : '#FFFFFF'} />
                        {timerDelay > 0 && <Text style={styles.sideOptionBadge}>{timerLabel}</Text>}
                    </TouchableOpacity>

                    {sideExpanded && (
                        <>
                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={[styles.sideOption, (beautyOn || showCreateFilters) && styles.sideOptionActive]}
                                onPress={() => {
                                    setShowCreateFilters((v) => !v);
                                    setBeautyOn(true);
                                }}
                            >
                                <MaterialIcons name="auto-fix-high" size={22} color={beautyOn || showCreateFilters ? '#111111' : '#FFFFFF'} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.sideOption, faceEffect !== 'none' && styles.sideOptionActive]}
                                onPress={() => setShowCreateFilters(true)}
                            >
                                <MaterialIcons name="auto-awesome" size={22} color={faceEffect !== 'none' ? '#111111' : '#FFFFFF'} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.sideOption, mirrorOn && styles.sideOptionActive]}
                                onPress={() => setMirrorOn(v => !v)}
                            >
                                <MaterialCommunityIcons name="mirror" size={22} color={mirrorOn ? '#111111' : '#FFFFFF'} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.sideOption}
                                onPress={() => Alert.alert('Convidar', 'Em breve você poderá convidar amigos para a gravação.')}
                            >
                                <MaterialIcons name="person-add" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity style={styles.sideOption} onPress={() => setSideExpanded(v => !v)}>
                        <Ionicons name={sideExpanded ? 'chevron-up' : 'chevron-down'} size={22} color="#FFFFFF" />
                    </TouchableOpacity>
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

                {!cameraReady && (
                    <View style={styles.cameraStatusPill} pointerEvents="none">
                        <Text style={styles.cameraStatusText}>Preparando câmera…</Text>
                    </View>
                )}

                <View style={styles.bottomControls} pointerEvents="box-none">
                    <View style={styles.durationContainer}>
                        {([15, 60, 600] as VideoDuration[]).map((value) => (
                            <TouchableOpacity
                                key={value}
                                style={[styles.durationButton, duration === value && styles.durationButtonActive]}
                                onPress={() => setDuration(value)}
                            >
                                <Text style={[styles.durationText, duration === value && styles.durationTextActive]}>
                                    {value === 600 ? '10m' : `${value}s`}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.captureModeButton, captureMode === 'photo' && styles.captureModeButtonActive]}
                            onPress={() => setCaptureMode('photo')}
                        >
                            <Text style={[styles.captureModeText, captureMode === 'photo' && styles.captureModeTextActive]}>
                                FOTO
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.captureModeButton, captureMode === 'video' && styles.captureModeButtonActive]}
                            onPress={() => setCaptureMode('video')}
                        >
                            <Text style={[styles.captureModeText, captureMode === 'video' && styles.captureModeTextActive]}>
                                VÍDEO
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.captureContainer}>
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

                        <TouchableOpacity
                            style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
                            onPress={handleCapture}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.captureButtonInner, isRecording && styles.captureButtonInnerRecording]} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                            <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {showCreateFilters && (
                        <ScrollView style={styles.createFiltersSheet} keyboardShouldPersistTaps="handled">
                            <FilterPicker
                                selectedId={filterId}
                                onSelect={(id) => {
                                    setFilterId(id);
                                    setBeautyOn(true);
                                }}
                            />
                            <BeautyPanel
                                beauty={beautyConfig}
                                onChange={(next) => {
                                    setBeautyConfig(next);
                                    setBeautyOn(true);
                                }}
                            />
                            <EffectsPanel selectedId={faceEffect} onSelect={setFaceEffect} />
                            <TouchableOpacity
                                style={styles.createFiltersClose}
                                onPress={() => setShowCreateFilters(false)}
                            >
                                <Text style={styles.createFiltersCloseText}>Fechar</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}

                    <View style={styles.bottomMenu}>
                        <TouchableOpacity style={styles.bottomMenuItem} onPress={() => setShowGalleryModal(true)}>
                            <Text style={styles.bottomMenuText}>PUBLICAÇÃO</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.bottomMenuItem} onPress={() => setCreateMode('create')}>
                            <Text style={[styles.bottomMenuText, createMode === 'create' && styles.bottomMenuTextActive]}>
                                CRIAR
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.bottomMenuItem}
                            onPress={() => {
                                setDeepArFailed(false);
                                setDeepArRemountKey((k) => k + 1);
                                setCreateMode('live');
                            }}
                        >
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

