import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './StoriesCreate.styles';
import { useNavigation } from '../../routes/NavigationContext';
import { auth, refreshAuthUser } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { postsService } from '../../services/postsService';
import { useSafePad } from '../../hooks/useSafePad';

export const StoriesCreate = () => {
    const { navigate } = useNavigation();
    const safe = useSafePad(8, 8);
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [isRecording, setIsRecording] = useState(false);
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [publishing, setPublishing] = useState(false);
    const cameraRef = useRef<CameraView | null>(null);
    const recordingRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

    const toggleCameraFacing = () => {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    };

    const handleClose = () => {
        if (isRecording || publishing) return;
        navigate('Messages');
    };

    const handleToggleRecord = async () => {
        if (!cameraRef.current) return;

        try {
            if (!isRecording) {
                setIsRecording(true);
                setCapturedUri(null);
                const promise = cameraRef.current.recordAsync({
                    maxDuration: 15,
                    quality: '720p',
                });
                recordingRef.current = promise;
                const video = await promise;
                if (video?.uri) {
                    setCapturedUri(video.uri);
                } else {
                    Alert.alert('Aviso', 'Não foi possível obter o vídeo do story.');
                }
            } else {
                cameraRef.current.stopRecording();
            }
        } catch (error: any) {
            console.error('Erro ao gravar story:', error);
            Alert.alert('Erro', error.message || 'Não foi possível gravar o story');
        } finally {
            setIsRecording(false);
            recordingRef.current = null;
        }
    };

    const handlePublish = async () => {
        if (!capturedUri) {
            Alert.alert('Story', 'Grave um story antes de publicar.');
            return;
        }

        await refreshAuthUser();
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Login', 'Faça login para publicar stories.');
            navigate('Login');
            return;
        }

        try {
            setPublishing(true);
            await authService.ensureUserProfile(user.uid, user.email || '', user.displayName);
            const profile = await authService.getUserProfile(user.uid);
            const username = profile?.username || user.email?.split('@')[0] || 'user';
            const displayName = profile?.displayName || user.displayName || username;

            const { mediaURL, thumbnailURL } = await postsService.uploadMedia(
                user.uid,
                capturedUri,
                'video'
            );

            await postsService.createPost({
                authorId: user.uid,
                authorUsername: username,
                authorDisplayName: displayName,
                authorPhotoURL: profile?.photoURL,
                mediaType: 'video',
                mediaURL,
                thumbnailURL,
                title: 'Story',
                description: 'Story',
                hashtags: ['#story'],
                isPrivate: false,
            });

            Alert.alert('Story publicado', 'Seu story foi publicado no feed.', [
                { text: 'OK', onPress: () => navigate('Home') },
            ]);
        } catch (error: any) {
            console.error('Erro ao publicar story:', error);
            Alert.alert('Erro', error.message || 'Não foi possível publicar o story');
        } finally {
            setPublishing(false);
        }
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>
                    Precisamos da sua permissão para acessar a câmera e criar stories.
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Permitir câmera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <LinearGradient colors={['#000000', '#1a1a2e']} style={styles.container}>
            <CameraView
                ref={(ref) => (cameraRef.current = ref)}
                style={styles.camera}
                facing={facing}
                mode="video"
            >
                <View style={[styles.header, { paddingTop: safe.paddingTop }]}>
                    <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
                        <MaterialIcons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Story</Text>
                    <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
                        <MaterialIcons name="flip-camera-ios" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.publishButton}
                        onPress={handlePublish}
                        disabled={isRecording || publishing || !capturedUri}
                    >
                        {publishing ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.publishButtonText}>
                                {capturedUri ? 'Publicar story' : 'Grave para publicar'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.recordRow}>
                        <Text style={styles.helpText}>
                            {isRecording
                                ? 'Gravando… toque de novo para parar'
                                : capturedUri
                                  ? 'Story pronto — publique acima'
                                  : 'Toque para gravar (até 15s)'}
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.recordButtonOuter,
                                isRecording && styles.recordButtonOuterActive,
                            ]}
                            onPress={handleToggleRecord}
                            disabled={publishing}
                        >
                            <View
                                style={[
                                    styles.recordButtonInner,
                                    isRecording && styles.recordButtonInnerActive,
                                ]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </LinearGradient>
    );
};
