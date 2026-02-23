import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Messages.styles';
import { Notifications } from './Notifications';
import { auth } from '../../lib/firebaseconfig';
import { messagesService, Chat } from '../../services/messagesService';
import { usersService, UserProfile } from '../../services/usersService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatWithUser extends Chat {
    otherUser?: {
        uid: string;
        username: string;
        photoURL?: string;
    };
}

export const Messages = () => {
    const { navigate } = useNavigation();
    const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
    const [chats, setChats] = useState<ChatWithUser[]>([]);
    const [followingUsers, setFollowingUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTab === 'messages') {
            loadChats();
            loadFollowingUsers();
        }
    }, [activeTab]);

    const loadChats = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                setChats([]);
                return;
            }

            const userChats = await messagesService.getUserChats(user.uid);
            setChats(userChats);
        } catch (error: any) {
            console.error('❌ Erro ao carregar chats:', error);
            // Se for erro de permissão, mostrar mensagem mais clara
            if (error.message?.includes('permission') || error.code === 'permission-denied') {
                console.error('💡 Configure as regras de segurança do Firestore para permitir leitura de chats');
            }
            setChats([]);
        } finally {
            setLoading(false);
        }
    };

    const loadFollowingUsers = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setFollowingUsers([]);
                return;
            }

            const following = await usersService.getFollowing(user.uid);
            
            // Filtrar usuários que já têm chat criado
            const chatUserIds = new Set(chats.map(chat => {
                const otherUserId = chat.participants?.find(id => id !== user.uid);
                return otherUserId;
            }).filter(Boolean));

            const availableUsers = following.filter(followedUser => 
                !chatUserIds.has(followedUser.uid)
            );

            setFollowingUsers(availableUsers);
        } catch (error) {
            console.error('Erro ao carregar usuários seguidos:', error);
            setFollowingUsers([]);
        }
    };

    useEffect(() => {
        if (chats.length > 0) {
            loadFollowingUsers();
        }
    }, [chats]);

    const formatTime = (timestamp?: number): string => {
        if (!timestamp) return '';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'agora';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    const handleChatPress = async (chat: ChatWithUser) => {
        try {
            // Salvar chatId no AsyncStorage para o Chat acessar
            await AsyncStorage.setItem('currentChatId', chat.id);
            await AsyncStorage.setItem('currentChatOtherUser', JSON.stringify(chat.otherUser));
            navigate('Chat' as any);
        } catch (error) {
            console.error('Erro ao abrir chat:', error);
        }
    };

    const handleStartChat = async (user: UserProfile) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Erro', 'Você precisa estar logado');
                return;
            }

            // Criar ou obter chat
            const chatId = await messagesService.getOrCreateChat(currentUser.uid, user.uid);
            
            // Salvar informações do chat
            await AsyncStorage.setItem('currentChatId', chatId);
            await AsyncStorage.setItem('currentChatOtherUser', JSON.stringify({
                uid: user.uid,
                username: user.username,
                photoURL: user.photoURL,
            }));

            // Recarregar chats e usuários seguidos
            await loadChats();
            await loadFollowingUsers();
            
            navigate('Chat' as any);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível iniciar o chat');
        }
    };

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigate('Home')} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {activeTab === 'messages' ? 'Mensagens' : 'Notificações'}
                </Text>
                <TouchableOpacity style={styles.headerIcon}>
                    <MaterialIcons name="search" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
                    onPress={() => setActiveTab('messages')}
                >
                    <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
                        Mensagens
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
                    onPress={() => setActiveTab('notifications')}
                >
                    <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
                        Notificações
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'messages' ? (
                loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                    </View>
                ) : chats.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <MaterialIcons name="chat-bubble-outline" size={60} color="rgba(255,255,255,0.3)" />
                        <Text style={{ color: '#FFFFFF', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                            Nenhuma mensagem ainda
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                            Comece uma conversa com seus amigos!
                        </Text>
                    </View>
                ) : (
                    <ScrollView style={styles.messagesList}>
                        {/* Chats existentes */}
                        {chats.length > 0 && (
                            <>
                                {chats.map((chat) => {
                                    const user = auth.currentUser;
                                    const unreadCount = user ? (chat.unreadCount[user.uid] || 0) : 0;
                                    
                                    return (
                                        <TouchableOpacity
                                            key={chat.id}
                                            style={styles.messageItem}
                                            onPress={() => handleChatPress(chat)}
                                        >
                                            <View style={styles.profileImageContainer}>
                                                {chat.otherUser?.photoURL ? (
                                                    <Image 
                                                        source={{ uri: chat.otherUser.photoURL }} 
                                                        style={styles.profileImage}
                                                    />
                                                ) : (
                                                    <View style={styles.profileImagePlaceholder}>
                                                        <MaterialIcons name="person" size={30} color="rgba(255,255,255,0.5)" />
                                                    </View>
                                                )}
                                                {unreadCount > 0 && (
                                                    <View style={styles.unreadBadge}>
                                                        <Text style={styles.unreadText}>{unreadCount}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.messageContent}>
                                                <View style={styles.messageHeader}>
                                                    <Text style={styles.messageUsername}>
                                                        @{chat.otherUser?.username || 'usuário'}
                                                    </Text>
                                                    <Text style={styles.messageTime}>
                                                        {formatTime(chat.lastMessageTime)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.messageText} numberOfLines={1}>
                                                    {chat.lastMessage || 'Nenhuma mensagem'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </>
                        )}

                        {/* Usuários seguidos disponíveis para chat */}
                        {followingUsers.length > 0 && (
                            <>
                                {chats.length > 0 && (
                                    <View style={styles.sectionDivider}>
                                        <View style={styles.dividerLine} />
                                        <Text style={styles.sectionTitle}>Iniciar conversa</Text>
                                        <View style={styles.dividerLine} />
                                    </View>
                                )}
                                {followingUsers.map((user) => (
                                    <TouchableOpacity
                                        key={user.uid}
                                        style={styles.messageItem}
                                        onPress={() => handleStartChat(user)}
                                    >
                                        <View style={styles.profileImageContainer}>
                                            {user.photoURL ? (
                                                <Image 
                                                    source={{ uri: user.photoURL }} 
                                                    style={styles.profileImage}
                                                />
                                            ) : (
                                                <View style={styles.profileImagePlaceholder}>
                                                    <MaterialIcons name="person" size={30} color="rgba(255,255,255,0.5)" />
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.messageContent}>
                                            <View style={styles.messageHeader}>
                                                <Text style={styles.messageUsername}>
                                                    @{user.username}
                                                </Text>
                                                <MaterialIcons name="add-circle" size={20} color="rgba(163, 0, 168, 0.8)" />
                                            </View>
                                            <Text style={styles.messageText} numberOfLines={1}>
                                                {user.bio || 'Iniciar conversa'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {chats.length === 0 && followingUsers.length === 0 && (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                <MaterialIcons name="chat-bubble-outline" size={60} color="rgba(255,255,255,0.3)" />
                                <Text style={{ color: '#FFFFFF', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                                    Nenhuma mensagem ainda
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                                    Comece uma conversa com seus amigos!
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                )
            ) : (
                <Notifications />
            )}
        </LinearGradient>
    );
};
