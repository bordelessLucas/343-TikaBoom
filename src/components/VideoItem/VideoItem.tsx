import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Comments } from '../Comments/Comments';
import { ShareModal } from '../ShareModal/ShareModal';
import { useNavigation } from '../../routes/NavigationContext';

interface Comment {
    id: string;
    username: string;
    text: string;
    likes: number;
    timeAgo: string;
}

interface VideoItemProps {
    videoUri: string;
    username: string;
    description: string;
    isActive: boolean;
    likes: number;
    comments: Comment[];
    saves: number;
    shares: number;
    userProfileImage?: string;
    creatorProfileImage?: string;
}

const { width, height } = Dimensions.get('window');

export const VideoItem = ({ 
    videoUri, 
    username, 
    description, 
    isActive,
    likes: initialLikes,
    comments,
    saves: initialSaves,
    shares: initialShares,
    userProfileImage,
    creatorProfileImage
}: VideoItemProps) => {
    const videoRef = useRef<Video>(null);
    const { navigate } = useNavigation();
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(initialLikes);
    const [isSaved, setIsSaved] = useState(false);
    const [saves, setSaves] = useState(initialSaves);
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [shareVisible, setShareVisible] = useState(false);

    useEffect(() => {
        if (isActive) {
            videoRef.current?.playAsync();
        } else {
            videoRef.current?.pauseAsync();
        }
    }, [isActive]);

    const handleLike = () => {
        if (isLiked) {
            setLikes(likes - 1);
        } else {
            setLikes(likes + 1);
        }
        setIsLiked(!isLiked);
    };

    const handleSave = () => {
        if (isSaved) {
            setSaves(saves - 1);
        } else {
            setSaves(saves + 1);
        }
        setIsSaved(!isSaved);
    };

    return (
        <View style={styles.container}>
            <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={isActive}
                isMuted={false}
            />
            
            {/* Botões de interação na lateral direita */}
            <View style={styles.actionsContainer}>
                {/* Botão de perfil do usuário (topo) */}
                <TouchableOpacity style={styles.actionButton} onPress={() => navigate('Profile')}>
                    <View style={styles.profileImageContainer}>
                        {userProfileImage ? (
                            <Image source={{ uri: userProfileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <MaterialIcons name="person" size={24} color="#FFFFFF" />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Botão de Like */}
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <View style={[styles.actionIconContainer, isLiked && styles.likedContainer]}>
                        <MaterialIcons 
                            name={isLiked ? "favorite" : "favorite-border"} 
                            size={28} 
                            color={isLiked ? "#FF6B6B" : "#FFFFFF"} 
                        />
                    </View>
                    <Text style={[styles.actionCount, isLiked && styles.likedCount]}>{likes}</Text>
                </TouchableOpacity>

                {/* Botão de Comentários */}
                <TouchableOpacity style={styles.actionButton} onPress={() => setCommentsVisible(true)}>
                    <View style={styles.actionIconContainer}>
                        <MaterialIcons name="comment" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionCount}>{comments.length}</Text>
                </TouchableOpacity>

                {/* Botão de Favoritar */}
                <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                    <View style={[styles.actionIconContainer, isSaved && styles.savedContainer]}>
                        <MaterialIcons 
                            name={isSaved ? "bookmark" : "bookmark-border"} 
                            size={28} 
                            color={isSaved ? "#FFD700" : "#FFFFFF"} 
                        />
                    </View>
                    <Text style={[styles.actionCount, isSaved && styles.savedCount]}>{saves}</Text>
                </TouchableOpacity>

                {/* Botão de Compartilhar */}
                <TouchableOpacity style={styles.actionButton} onPress={() => setShareVisible(true)}>
                    <View style={styles.actionIconContainer}>
                        <MaterialIcons name="share" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.actionCount}>{initialShares}</Text>
                </TouchableOpacity>

                {/* Foto do criador (embaixo) */}
                <TouchableOpacity style={styles.actionButton} onPress={() => navigate('Profile')}>
                    <View style={styles.profileImageContainer}>
                        {creatorProfileImage ? (
                            <Image source={{ uri: creatorProfileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <MaterialIcons name="person" size={24} color="#FFFFFF" />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Informações do vídeo na parte inferior */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.gradient}
            >
                <View style={styles.infoContainer}>
                    <Text style={styles.username}>@{username}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>
            </LinearGradient>

            {/* Modal de Comentários */}
            <Comments
                visible={commentsVisible}
                onClose={() => setCommentsVisible(false)}
                comments={comments}
                videoId=""
            />

            {/* Modal de Compartilhamento */}
            <ShareModal
                visible={shareVisible}
                onClose={() => setShareVisible(false)}
                videoId=""
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height,
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    actionsContainer: {
        position: 'absolute',
        right: 15,
        bottom: 100,
        alignItems: 'center',
        gap: 20,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    actionCount: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    likedContainer: {
        backgroundColor: 'rgba(255,0,0,0.2)',
    },
    likedCount: {
        color: '#FF6B6B',
    },
    savedContainer: {
        backgroundColor: 'rgba(255,255,0,0.3)',
    },
    savedCount: {
        color: '#FFD700',
    },
    profileImageContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
        marginBottom: 5,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profileImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        justifyContent: 'flex-end',
        padding: 20,
        paddingRight: 90, // Espaço para os botões
        paddingBottom: 100, // Espaço para a bottom navigation
    },
    infoContainer: {
        marginBottom: 10,
    },
    username: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        color: '#FFFFFF',
        fontSize: 14,
    },
});
