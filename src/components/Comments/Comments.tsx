import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    Dimensions,
    Alert,
    Platform,
    KeyboardAvoidingView,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../lib/supabase';
import { postsService } from '../../services/postsService';
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
    postId?: string;
}

const { height } = Dimensions.get('window');

export const Comments = ({ visible, onClose, comments: initialComments, postId }: CommentsProps) => {
    const insets = useSafeAreaInsets();
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
            const remoteComments = await postsService.getPostComments(postId);
            setComments(
                remoteComments.map((comment) => ({
                    id: comment.id,
                    username: comment.authorUsername,
                    text: comment.text,
                    likes: comment.likes,
                    timeAgo: formatTimeAgo(comment.createdAt),
                }))
            );
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
            await loadComments();
        } catch (error: any) {
            console.error('Erro ao adicionar comentário:', error);
            Alert.alert('Erro', error.message || 'Não foi possível adicionar comentário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                >
                    <View
                        style={[
                            styles.sheet,
                            {
                                height: height * 0.62,
                                paddingBottom: Math.max(insets.bottom, 10),
                            },
                        ]}
                    >
                        <View style={styles.handle} />

                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                {comments.length} comentário{comments.length === 1 ? '' : 's'}
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
                                <MaterialIcons name="close" size={22} color="#161823" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.commentsList}
                            contentContainerStyle={styles.commentsContent}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            showsVerticalScrollIndicator={false}
                        >
                            {loading && comments.length === 0 && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#161823" />
                                </View>
                            )}
                            {!loading && comments.length === 0 && (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>Nenhum comentário ainda</Text>
                                    <Text style={styles.emptySubtext}>Seja o primeiro a comentar</Text>
                                </View>
                            )}
                            {comments.map((comment) => (
                                <View key={comment.id} style={styles.commentItem}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {(comment.username || '?').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.commentBody}>
                                        <Text style={styles.commentUsername}>{comment.username}</Text>
                                        <Text style={styles.commentText}>{comment.text}</Text>
                                        <View style={styles.commentMeta}>
                                            <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                                            <TouchableOpacity>
                                                <Text style={styles.replyText}>Responder</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.likeColumn}>
                                        <Ionicons name="heart-outline" size={16} color="#8A8B91" />
                                        <Text style={styles.likeCount}>{comment.likes || ''}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.inputContainer}>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Adicionar comentário..."
                                    placeholderTextColor="#8A8B91"
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    multiline
                                    maxLength={500}
                                />
                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={handleAddComment}
                                    disabled={!newComment.trim() || loading}
                                >
                                    <Text
                                        style={[
                                            styles.sendText,
                                            (!newComment.trim() || loading) && styles.sendTextDisabled,
                                        ]}
                                    >
                                        Publicar
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    handle: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D0D1D3',
        marginTop: 8,
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E8E8E8',
    },
    headerTitle: {
        color: '#161823',
        fontSize: 15,
        fontWeight: '700',
    },
    closeButton: {
        position: 'absolute',
        right: 12,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentsList: {
        flex: 1,
    },
    commentsContent: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    commentItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        gap: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F1F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#161823',
        fontWeight: '700',
        fontSize: 14,
    },
    commentBody: {
        flex: 1,
        paddingRight: 8,
    },
    commentUsername: {
        color: '#8A8B91',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    commentText: {
        color: '#161823',
        fontSize: 14,
        lineHeight: 20,
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 6,
    },
    commentTime: {
        color: '#8A8B91',
        fontSize: 12,
    },
    replyText: {
        color: '#8A8B91',
        fontSize: 12,
        fontWeight: '600',
    },
    likeColumn: {
        alignItems: 'center',
        paddingTop: 2,
        minWidth: 24,
    },
    likeCount: {
        color: '#8A8B91',
        fontSize: 11,
        marginTop: 2,
    },
    inputContainer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E8E8E8',
        paddingHorizontal: 12,
        paddingTop: 10,
        backgroundColor: '#FFFFFF',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F1F1F2',
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 8,
        minHeight: 44,
    },
    input: {
        flex: 1,
        color: '#161823',
        fontSize: 14,
        maxHeight: 100,
        paddingTop: Platform.OS === 'ios' ? 6 : 4,
        paddingBottom: Platform.OS === 'ios' ? 6 : 4,
    },
    sendButton: {
        paddingLeft: 10,
        paddingBottom: 4,
    },
    sendText: {
        color: '#FE2C55',
        fontSize: 14,
        fontWeight: '700',
    },
    sendTextDisabled: {
        color: '#C6C7C9',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
    },
    emptyText: {
        color: '#161823',
        fontSize: 16,
        fontWeight: '600',
    },
    emptySubtext: {
        color: '#8A8B91',
        fontSize: 13,
        marginTop: 6,
    },
});

