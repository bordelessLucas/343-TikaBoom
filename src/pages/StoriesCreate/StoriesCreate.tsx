import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './StoriesCreate.styles';
import { useNavigation } from '../../routes/NavigationContext';

export const StoriesCreate = () => {
    const { navigate } = useNavigation();
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [isRecording, setIsRecording] = useState(false);
    const cameraRef = useRef<CameraView | null>(null);

    const toggleCameraFacing = () => {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    };

    const handleClose = () => {
        if (isRecording) return;
        navigate('Messages');
    };

    const handleToggleRecord = async () => {
        if (!cameraRef.current) return;

        try {
            if (!isRecording) {
                setIsRecording(true);
                // Gravação mockada – em produção, usar recordAsync com tempo limitado
                setTimeout(() => {
                    setIsRecording(false);
                    Alert.alert('Story gravado', 'Mock: story gravado com sucesso!');
                }, 3000);
            } else {
                setIsRecording(false);
            }
        } catch (error: any) {
            console.error('Erro ao gravar story:', error);
            setIsRecording(false);
            Alert.alert('Erro', error.message || 'Não foi possível gravar o story');
        }
    };

    const handlePublish = () => {
        Alert.alert(
            'Story publicado',
            'Mock: seu story foi publicado e ficará visível por 24h.',
            [
                {
                    text: 'OK',
                    onPress: () => navigate('Messages'),
                },
            ]
        );
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
        <LinearGradient
            colors={['#000000', '#1a1a2e']}
            style={styles.container}
        >
            <CameraView
                ref={(ref) => (cameraRef.current = ref)}
                style={styles.camera}
                facing={facing}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
                        <MaterialIcons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Story</Text>
                    <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
                        <MaterialIcons name="flip-camera-ios" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Bottom controls */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.publishButton}
                        onPress={handlePublish}
                        disabled={isRecording}
                    >
                        <Text style={styles.publishButtonText}>Publicar (mock)</Text>
                    </TouchableOpacity>

                    <View style={styles.recordRow}>
                        <Text style={styles.helpText}>Toque para gravar um story rápido</Text>
                        <TouchableOpacity
                            style={[
                                styles.recordButtonOuter,
                                isRecording && styles.recordButtonOuterActive,
                            ]}
                            onPress={handleToggleRecord}
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

