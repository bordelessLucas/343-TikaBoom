import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Dimensions, Image, FlatList, Modal, TextInput } from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './CreateVideo.styles';

type VideoDuration = 15 | 60 | 600; // 15s, 60s, 10min (600s)
type CaptureMode = 'video' | 'photo';

interface CapturedMedia {
    id: string;
    uri: string;
    type: 'photo' | 'video';
    timestamp: number;
    duration?: number; // Para vídeos
}

const STORAGE_KEY = '@tikaboom_captured_media';

export const CreateVideo = () => {
    const { navigate } = useNavigation();
    const cameraRef = useRef<any>(null);
    const recordingPromiseRef = useRef<Promise<any> | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recordingTimeRef = useRef<number>(0);
    
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [flash, setFlash] = useState<FlashMode>('off');
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState<VideoDuration>(60);
    const [captureMode, setCaptureMode] = useState<CaptureMode>('video');
    const [recordingTime, setRecordingTime] = useState(0);
    const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<CapturedMedia | null>(null);
    const [createMode, setCreateMode] = useState<'create' | 'live'>('create'); // Modo: Criar ou Live
    const [liveTitle, setLiveTitle] = useState('le LIVE em escala');

    // Carregar mídias salvas ao montar componente
    useEffect(() => {
        loadCapturedMedia();
    }, []);

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

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <MaterialIcons name="camera" size={80} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.permissionText}>Precisamos de permissão para acessar a câmera</Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const toggleFlash = () => {
        setFlash(current => {
            if (current === 'off') return 'on';
            if (current === 'on') return 'auto';
            return 'off';
        });
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
                    Alert.alert('✅ Sucesso!', 'Vídeo gravado e salvo!');
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
                quality: 1,
            });
            
            console.log('✅ Foto tirada:', photo.uri);
            
            const mediaData: CapturedMedia = {
                id: `photo_${Date.now()}`,
                uri: photo.uri,
                type: 'photo',
                timestamp: Date.now(),
            };
            
            await saveCapturedMedia(mediaData);
            Alert.alert('✅ Sucesso!', 'Foto tirada e salva!');
            
        } catch (error: any) {
            console.error('❌ Erro:', error);
            Alert.alert('Erro', 'Erro ao tirar foto');
        }
    };

    const handleCapture = () => {
        if (captureMode === 'photo') {
            takePicture();
        } else if (captureMode === 'video') {
            if (isRecording) {
                stopRecordingHandler();
            } else {
                startRecording();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Renderizar tela de Live
    const renderLiveScreen = () => {
        return (
            <View style={styles.liveContainer}>
                {/* Header */}
                <View style={styles.liveHeader}>
                    <TouchableOpacity onPress={() => navigate('Home')} style={styles.liveCloseButton}>
                        <Ionicons name="close" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.liveSearchContainer}>
                        <Text style={styles.liveSearchDollar}>$</Text>
                        <TextInput
                            style={styles.liveSearchInput}
                            value={liveTitle}
                            onChangeText={setLiveTitle}
                            placeholder="le LIVE em escala"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                        />
                        <Text style={styles.liveSearchRec}>Rec</Text>
                    </View>
                    
                    <View style={styles.liveHeaderButtons}>
                        <TouchableOpacity style={styles.liveHeaderButton}>
                            <Ionicons name="star" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.liveHeaderButton}>
                            <Ionicons name="play" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Live Controls */}
                <View style={styles.liveControlsContainer}>
                    <TouchableOpacity style={styles.liveControlButton}>
                        <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
                        <Text style={styles.liveControlText}>Inverter</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.liveControlButton}>
                        <MaterialIcons name="auto-fix-high" size={28} color="#FFFFFF" />
                        <Text style={styles.liveControlText}>Embelezamento</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.liveControlButton}>
                        <MaterialIcons name="auto-awesome" size={28} color="#FFFFFF" />
                        <Text style={styles.liveControlText}>Efeitos</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.liveControlButton}>
                        <Ionicons name="settings" size={28} color="#FFFFFF" />
                        <Text style={styles.liveControlText}>Configurações</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.liveControlButton}>
                        <Ionicons name="heart" size={28} color="#FFFFFF" />
                        <Text style={styles.liveControlText}>Fã-Clube</Text>
                    </TouchableOpacity>
                </View>

                {/* Start Live Button */}
                <View style={styles.liveStartButtonContainer}>
                    <TouchableOpacity style={styles.liveStartButton}>
                        <Text style={styles.liveStartButtonText}>Iniciar LIVE</Text>
                    </TouchableOpacity>
                </View>

                {/* Camera/Game Selection */}
                <View style={styles.liveSourceContainer}>
                    <TouchableOpacity style={styles.liveSourceButton}>
                        <Ionicons name="videocam" size={20} color="#FFFFFF" />
                        <Text style={styles.liveSourceText}>Câmera do dispositivo</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.liveSourceButton}>
                        <Ionicons name="phone-portrait" size={20} color="#FFFFFF" />
                        <Text style={styles.liveSourceText}>Jogo</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Menu */}
                <View style={styles.bottomMenu}>
                    <TouchableOpacity style={styles.bottomMenuItem}>
                        <Text style={styles.bottomMenuText}>PUBLICAÇÃO</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.bottomMenuItem}
                        onPress={() => setCreateMode('create')}
                    >
                        <Text style={styles.bottomMenuText}>CRIAR</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.bottomMenuItem}
                        onPress={() => setCreateMode('live')}
                    >
                        <Text style={[styles.bottomMenuText, styles.bottomMenuTextActive]}>LIVE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Se estiver no modo Live, renderizar tela de Live
    if (createMode === 'live') {
        return renderLiveScreen();
    }

    return (
        <View style={styles.container}>
            <CameraView 
                style={styles.camera} 
                facing={facing}
                flash={flash}
                ref={cameraRef}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigate('Home')} style={styles.closeButton}>
                        <Ionicons name="close" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.addSoundButton}>
                        <MaterialIcons name="music-note" size={20} color="#FFFFFF" />
                        <Text style={styles.addSoundText}>Adicionar som</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.refreshButton}>
                        <MaterialIcons name="refresh" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Side Options */}
                <View style={styles.sideOptions}>
                    <TouchableOpacity style={styles.sideOption} onPress={toggleFlash}>
                        <Ionicons 
                            name={flash === 'off' ? 'flash-off' : flash === 'on' ? 'flash' : 'flash-outline'} 
                            size={28} 
                            color="#FFFFFF" 
                        />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.sideOption}>
                        <MaterialIcons name="timer" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.divider} />
                    
                    <TouchableOpacity style={styles.sideOption}>
                        <MaterialCommunityIcons name="view-split-horizontal" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.sideOption}>
                        <MaterialIcons name="person-add" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.sideOption}>
                        <MaterialCommunityIcons name="share-variant" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.sideOption}>
                        <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Recording Timer */}
                {isRecording && (
                    <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                    </View>
                )}

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    {/* Duration Selection */}
                    <View style={styles.durationContainer}>
                        <TouchableOpacity 
                            style={styles.durationButton}
                            onPress={() => setDuration(600)}
                        >
                            <Text style={[styles.durationText, duration === 600 && styles.durationTextActive]}>
                                10 min
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.durationButton}
                            onPress={() => setDuration(60)}
                        >
                            <Text style={[styles.durationText, duration === 60 && styles.durationTextActive]}>
                                60 s
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.durationButton}
                            onPress={() => setDuration(15)}
                        >
                            <Text style={[styles.durationText, duration === 15 && styles.durationTextActive]}>
                                15 s
                            </Text>
                        </TouchableOpacity>
                        
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

                    {/* Capture Button and Options */}
                    <View style={styles.captureContainer}>
                        <TouchableOpacity 
                            style={styles.galleryButton}
                            onPress={() => setShowGalleryModal(true)}
                        >
                            <MaterialIcons name="photo-library" size={24} color="#FFFFFF" />
                            {capturedMedia.length > 0 && (
                                <View style={styles.galleryBadge}>
                                    <Text style={styles.galleryBadgeText}>
                                        {capturedMedia.length}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.captureButton,
                                isRecording && styles.captureButtonRecording
                            ]}
                            onPress={handleCapture}
                        >
                            <View style={[
                                styles.captureButtonInner,
                                isRecording && styles.captureButtonInnerRecording
                            ]} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                            <Ionicons name="camera-reverse" size={32} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Menu */}
                    <View style={styles.bottomMenu}>
                        <TouchableOpacity style={styles.bottomMenuItem}>
                            <Text style={styles.bottomMenuText}>PUBLICAÇÃO</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.bottomMenuItem}
                            onPress={() => setCreateMode('create')}
                        >
                            <Text style={[styles.bottomMenuText, createMode === 'create' && styles.bottomMenuTextActive]}>CRIAR</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.bottomMenuItem}
                            onPress={() => setCreateMode('live')}
                        >
                            <Text style={styles.bottomMenuText}>LIVE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>

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
                            <Image 
                                source={{ uri: selectedMedia.uri }} 
                                style={styles.detailImage}
                                resizeMode="contain"
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
                                        Alert.alert('URI', selectedMedia.uri, [
                                            { text: 'OK' }
                                        ]);
                                    }}
                                >
                                    <Ionicons name="information-circle" size={24} color="#FFFFFF" />
                                    <Text style={styles.detailActionText}>Info</Text>
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
        </View>
    );
};

