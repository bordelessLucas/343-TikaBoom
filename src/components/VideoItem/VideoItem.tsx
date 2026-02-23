import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Comments } from '../Comments/Comments';
import { ShareModal } from '../ShareModal/ShareModal';
import { useNavigation } from '../../routes/NavigationContext';
import { auth } from '../../lib/firebaseconfig';
import { postsService } from '../../services/postsService';

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
    postId?: string; // ID do post no Firebase
    onView?: () => void; // Callback quando o vídeo é visualizado
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
    creatorProfileImage,
    postId,
    onView
}: VideoItemProps) => {
    const videoRef = useRef<Video>(null);
    const { navigate } = useNavigation();
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(initialLikes);
    const [isSaved, setIsSaved] = useState(false);
    const [saves, setSaves] = useState(initialSaves);
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [shareVisible, setShareVisible] = useState(false);
    const [hasViewed, setHasViewed] = useState(false);
    const [isLoadingState, setIsLoadingState] = useState(false);

    useEffect(() => {
        if (isActive) {
            videoRef.current?.playAsync();
            
            // Incrementar visualizações quando o vídeo começa a tocar
            if (postId && !hasViewed) {
                postsService.incrementViews(postId);
                setHasViewed(true);
                onView?.();
            }
            
            // Recarregar estado quando o vídeo se torna ativo (ao voltar para a página)
            if (postId && auth.currentUser && !isLoadingState) {
                const reloadState = async () => {
                    try {
                        const post = await postsService.getPost(postId);
                        if (post) {
                            const likedBy = post.likedBy || [];
                            const savedBy = post.savedBy || [];
                            const user = auth.currentUser;
                            if (user) {
                                setIsLiked(likedBy.includes(user.uid));
                                setIsSaved(savedBy.includes(user.uid));
                                setLikes(post.likes || 0);
                                setSaves(post.saves || 0);
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao recarregar estado ao ativar:', error);
                    }
                };
                reloadState();
            }
        } else {
            videoRef.current?.pauseAsync();
        }
    }, [isActive, postId, hasViewed, isLoadingState]);

    // Verificar se o usuário já curtiu/salvou e sincronizar estado
    useEffect(() => {
        const user = auth.currentUser;
        if (postId && user) {
            const loadPostState = async () => {
                try {
                    setIsLoadingState(true);
                    console.log('🔄 Carregando estado do post do Firebase:', postId);
                    const post = await postsService.getPost(postId);
                    if (post) {
                        const likedBy = post.likedBy || [];
                        const savedBy = post.savedBy || [];
                        const userLiked = likedBy.includes(user.uid);
                        const userSaved = savedBy.includes(user.uid);
                        console.log('📊 Estado carregado do Firebase:', {
                            userLiked,
                            userSaved,
                            likes: post.likes,
                            saves: post.saves,
                            likedByCount: likedBy.length,
                        });
                        // SEMPRE usar valores do Firebase, não dos props iniciais
                        setIsLiked(userLiked);
                        setIsSaved(userSaved);
                        setLikes(post.likes || 0);
                        setSaves(post.saves || 0);
                    } else {
                        console.warn('⚠️ Post não encontrado no Firebase:', postId);
                        // Se não encontrar, usar valores iniciais
                        setIsLiked(false);
                        setIsSaved(false);
                        setLikes(initialLikes);
                        setSaves(initialSaves);
                    }
                } catch (error) {
                    console.error('❌ Erro ao carregar estado do post:', error);
                    // Em caso de erro, usar valores iniciais
                    setIsLiked(false);
                    setIsSaved(false);
                    setLikes(initialLikes);
                    setSaves(initialSaves);
                } finally {
                    setIsLoadingState(false);
                }
            };
            loadPostState();
        } else {
            // Reset para posts mockados
            setIsLiked(false);
            setIsSaved(false);
            setLikes(initialLikes);
            setSaves(initialSaves);
        }
    }, [postId]); // Removido initialLikes e initialSaves das dependências para sempre recarregar do Firebase

    const handleLike = async () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Login necessário', 'Você precisa estar logado para curtir posts');
            return;
        }

        if (!postId) {
            Alert.alert('Erro', 'Post não encontrado. Não é possível curtir.');
            return;
        }

        try {
            console.log('❤️ Iniciando like no post:', { postId, userId: user.uid });
            
            // Atualizar estado local imediatamente para feedback visual
            const newLikedState = !isLiked;
            setIsLiked(newLikedState);
            setLikes(newLikedState ? likes + 1 : Math.max(0, likes - 1));
            
            // Salvar no Firebase
            const result = await postsService.toggleLike(postId, user.uid);
            console.log('✅ Like salvo no Firebase:', result);
            
            // Atualizar com valores reais do Firebase
            setIsLiked(result.liked);
            setLikes(result.likes);
            
            // Recarregar o post completo para garantir sincronização total
            setTimeout(async () => {
                try {
                    const post = await postsService.getPost(postId);
                    if (post) {
                        const likedBy = post.likedBy || [];
                        const userLiked = likedBy.includes(user.uid);
                        console.log('🔄 Estado sincronizado:', {
                            likes: post.likes,
                            userLiked,
                            likedByCount: likedBy.length,
                        });
                        setLikes(post.likes || 0);
                        setIsLiked(userLiked);
                    }
                } catch (error) {
                    console.error('❌ Erro ao recarregar post após like:', error);
                }
            }, 500);
        } catch (error: any) {
            console.error('❌ Erro ao curtir:', error);
            // Reverter estado local em caso de erro
            setIsLiked(!isLiked);
            setLikes(isLiked ? likes - 1 : likes + 1);
            Alert.alert('Erro', error.message || 'Não foi possível curtir o post');
        }
    };

    const handleSave = async () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Login necessário', 'Você precisa estar logado para salvar posts');
            return;
        }

        if (!postId) {
            Alert.alert('Erro', 'Post não encontrado. Não é possível salvar.');
            return;
        }

        try {
            const result = await postsService.toggleSave(postId, user.uid);
            setIsSaved(result.saved);
            setSaves(result.saves);
            // Recarregar post para garantir sincronização
            const post = await postsService.getPost(postId);
            if (post) {
                setSaves(post.saves || 0);
                setIsSaved((post.savedBy || []).includes(user.uid));
            }
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            Alert.alert('Erro', error.message || 'Não foi possível salvar o post');
        }
    };

    const handleShare = async () => {
        if (postId) {
            try {
                await postsService.sharePost(postId);
                setShareVisible(true);
            } catch (error: any) {
                Alert.alert('Erro', 'Não foi possível compartilhar');
            }
        } else {
            setShareVisible(true);
        }
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
                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
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
                postId={postId}
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
