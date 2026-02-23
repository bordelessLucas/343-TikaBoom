import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { auth } from '../../lib/firebaseconfig';
import { postsService, Comment as FirebaseComment } from '../../services/postsService';
import { authService } from '../../services/authService';

interface Comment {
    id: string;
    username: string;
    text: string;
    likes: number;
    timeAgo: string;
}

interface CommentsProps {
    visible: boolean;
    onClose: () => void;
    comments: Comment[];
    videoId: string;
    postId?: string; // ID do post no Firebase
}

const { width, height } = Dimensions.get('window');

export const Comments = ({ visible, onClose, comments: initialComments, videoId, postId }: CommentsProps) => {
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && postId) {
            loadComments();
        } else {
            setComments(initialComments);
        }
    }, [visible, postId]);

    const loadComments = async () => {
        if (!postId) return;
        
        try {
            setLoading(true);
            const firebaseComments = await postsService.getPostComments(postId);
            
            // Converter comentários do Firebase para formato do componente
            const formattedComments: Comment[] = firebaseComments.map(comment => ({
                id: comment.id,
                username: comment.authorUsername,
                text: comment.text,
                likes: comment.likes,
                timeAgo: formatTimeAgo(comment.createdAt),
            }));
            
            setComments(formattedComments);
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (timestamp: number): string => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Erro', 'Você precisa estar logado para comentar');
            return;
        }

        if (!postId) {
            Alert.alert('Erro', 'Post não encontrado. Não é possível comentar.');
            return;
        }

        try {
            setLoading(true);
            const userProfile = await authService.getUserProfile(user.uid);
            if (!userProfile) {
                throw new Error('Perfil não encontrado');
            }

            await postsService.addComment(postId, {
                postId,
                authorId: user.uid,
                authorUsername: userProfile.username,
                authorPhotoURL: userProfile.photoURL,
                text: newComment.trim(),
            });

            setNewComment('');
            // Aguardar um pouco antes de recarregar para garantir que o Firestore atualizou
            setTimeout(async () => {
                await loadComments();
            }, 500);
        } catch (error: any) {
            console.error('Erro ao adicionar comentário:', error);
            Alert.alert('Erro', error.message || 'Não foi possível adicionar comentário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)']}
                    style={styles.modalContent}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{comments.length} comentários</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.commentsList}>
                        {loading && (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Carregando comentários...</Text>
                            </View>
                        )}
                        {!loading && comments.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Nenhum comentário ainda</Text>
                                <Text style={styles.emptySubtext}>Seja o primeiro a comentar!</Text>
                            </View>
                        )}
                        {comments.map((comment) => (
                            <View key={comment.id} style={styles.commentItem}>
                                <View style={styles.commentHeader}>
                                    <Text style={styles.commentUsername}>@{comment.username}</Text>
                                    <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                                </View>
                                <Text style={styles.commentText}>{comment.text}</Text>
                                <View style={styles.commentFooter}>
                                    <TouchableOpacity style={styles.commentActions}>
                                        <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
                                        <Text style={styles.likeCount}>{comment.likes}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Adicionar comentário..."
                                placeholderTextColor="#999"
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                                onSubmitEditing={handleAddComment}
                            />
                            <View style={styles.inputIcons}>
                                <TouchableOpacity 
                                    style={styles.sendButton}
                                    onPress={handleAddComment}
                                    disabled={!newComment.trim()}
                                >
                                    <Ionicons 
                                        name="send" 
                                        size={20} 
                                        color={newComment.trim() ? "#FF0050" : "rgba(255,255,255,0.3)"} 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: height * 0.7,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    commentItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    commentUsername: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    commentText: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 8,
    },
    commentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    commentTime: {
        color: '#999',
        fontSize: 12,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    likeCount: {
        color: '#FFFFFF',
        fontSize: 12,
        marginLeft: 5,
    },
    dislikeIcon: {
        marginLeft: 10,
    },
    inputContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        maxHeight: 100,
    },
    inputIcons: {
        flexDirection: 'row',
        gap: 10,
    },
    iconButton: {
        padding: 5,
    },
    sendButton: {
        padding: 5,
        marginLeft: 10,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginTop: 4,
    },
});

