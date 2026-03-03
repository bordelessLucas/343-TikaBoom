import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';

const { width, height } = Dimensions.get('window');

interface Story {
    id: string;
    username: string;
    photoURL?: string;
    mediaURL: string;
}

const MOCK_STORIES: Story[] = [
    {
        id: '1',
        username: 'usuario1',
        mediaURL: 'https://images.pexels.com/photos/8960863/pexels-photo-8960863.jpeg',
    },
    {
        id: '2',
        username: 'criador2',
        mediaURL: 'https://images.pexels.com/photos/6898859/pexels-photo-6898859.jpeg',
    },
    {
        id: '3',
        username: 'streamer3',
        mediaURL: 'https://images.pexels.com/photos/6898858/pexels-photo-6898858.jpeg',
    },
];

export const StoriesViewer = () => {
    const { navigate } = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const STORY_DURATION = 5000; // 5 segundos por story (mock)

    const currentStory = MOCK_STORIES[currentIndex];

    const handleClose = () => {
        navigate('Messages');
    };

    const handleNext = () => {
        if (currentIndex < MOCK_STORIES.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            navigate('Messages');
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    // Animação da linha de duração do story
    useEffect(() => {
        setProgress(0);
        const start = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const p = Math.min(1, elapsed / STORY_DURATION);
            setProgress(p);

            if (p >= 1) {
                clearInterval(interval);
                handleNext();
            }
        }, 50);

        return () => {
            clearInterval(interval);
        };
    }, [currentIndex]);

    return (
        <LinearGradient
            colors={['#000000', '#1a1a2e']}
            style={styles.container}
        >
            {/* Story media mock (imagem de fundo) */}
            <Image
                source={{ uri: currentStory.mediaURL }}
                style={styles.media}
                resizeMode="cover"
            />

            {/* Overlay */}
            <View style={styles.overlay} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <MaterialIcons name="person" size={22} color="#FFFFFF" />
                    </View>
                    <Text style={styles.username}>@{currentStory.username}</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <MaterialIcons name="close" size={26} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Navegação por toque */}
            <View style={styles.touchRow}>
                <TouchableOpacity style={styles.touchZone} onPress={handlePrev} />
                <TouchableOpacity style={styles.touchZone} onPress={handleNext} />
            </View>

            {/* Indicadores de progresso mockados */}
            <View style={styles.progressContainer}>
                {MOCK_STORIES.map((story, index) => (
                    <View key={story.id} style={styles.progressBar}>
                        {index < currentIndex && (
                            <View style={[styles.progressFill, { width: '100%' }]} />
                        )}
                        {index === currentIndex && (
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${Math.max(5, progress * 100)}%` },
                                ]}
                            />
                        )}
                    </View>
                ))}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    media: {
        position: 'absolute',
        width,
        height,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    header: {
        position: 'absolute',
        top: 80,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    username: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    touchRow: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
    },
    touchZone: {
        flex: 1,
    },
    progressContainer: {
        position: 'absolute',
        top: 60,
        left: 10,
        right: 10,
        flexDirection: 'row',
        gap: 6,
    },
    progressBar: {
        flex: 1,
        height: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
    },
});

