import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

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
}

const { width, height } = Dimensions.get('window');

export const Comments = ({ visible, onClose, comments, videoId }: CommentsProps) => {
    const [newComment, setNewComment] = useState('');

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
                        {comments.map((comment) => (
                            <View key={comment.id} style={styles.commentItem}>
                                <View style={styles.commentHeader}>
                                    <Text style={styles.commentUsername}>@{comment.username}</Text>
                                </View>
                                <Text style={styles.commentText}>{comment.text}</Text>
                                <View style={styles.commentFooter}>
                                    <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                                    <TouchableOpacity style={styles.commentActions}>
                                        <MaterialIcons name="favorite" size={16} color="#FF6B6B" />
                                        <Text style={styles.likeCount}>{comment.likes}</Text>
                                        <MaterialIcons name="thumb-down" size={16} color="#FFFFFF" style={styles.dislikeIcon} />
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
                            />
                            <View style={styles.inputIcons}>
                                <TouchableOpacity style={styles.iconButton}>
                                    <MaterialIcons name="image" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconButton}>
                                    <MaterialIcons name="emoji-emotions" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconButton}>
                                    <MaterialIcons name="alternate-email" size={20} color="#FFFFFF" />
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
});

