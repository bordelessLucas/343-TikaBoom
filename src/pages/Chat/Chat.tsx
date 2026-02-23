import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Chat.styles';
import { auth } from '../../lib/firebaseconfig';
import { messagesService, Message } from '../../services/messagesService';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Chat = () => {
    const { navigate } = useNavigation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatId, setChatId] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<{ uid: string; username: string; photoURL?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        loadChat();
        
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const loadChat = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                navigate('Login');
                return;
            }

            // Buscar chatId e otherUser do AsyncStorage
            const savedChatId = await AsyncStorage.getItem('currentChatId');
            const savedOtherUser = await AsyncStorage.getItem('currentChatOtherUser');
            
            if (savedChatId && savedOtherUser) {
                setChatId(savedChatId);
                setOtherUser(JSON.parse(savedOtherUser));
                
                // Carregar mensagens
                const chatMessages = await messagesService.getChatMessages(savedChatId);
                setMessages(chatMessages);
                
                // Marcar como lidas (com tratamento de erro)
                try {
                    await messagesService.markMessagesAsRead(savedChatId, user.uid);
                } catch (markReadError: any) {
                    console.warn('⚠️ Erro ao marcar mensagens como lidas:', markReadError.message);
                    // Não bloquear o carregamento do chat se falhar
                }
                
                // Escutar novas mensagens em tempo real
                unsubscribeRef.current = messagesService.subscribeToMessages(savedChatId, (newMessages) => {
                    setMessages(newMessages);
                    // Marcar como lidas quando receber novas mensagens (com tratamento de erro)
                    messagesService.markMessagesAsRead(savedChatId, user.uid).catch((err) => {
                        console.warn('⚠️ Erro ao marcar mensagens como lidas:', err);
                    });
                });
            } else {
                // Se não houver chat, criar um novo (para desenvolvimento)
                console.log('Nenhum chat encontrado');
            }
        } catch (error: any) {
            console.error('❌ Erro ao carregar chat:', error);
            console.error('   Código:', error.code);
            console.error('   Mensagem:', error.message);
            
            // Se for erro de permissão relacionado a participants, mostrar mensagem mais clara
            if (error.message?.includes("right operand of 'in' is not an object") || 
                error.message?.includes('participants')) {
                console.error('💡 Erro relacionado a participants. Verifique se o chat foi criado corretamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !chatId) return;

        const user = auth.currentUser;
        if (!user) return;

        try {
            setSending(true);
            const userProfile = await authService.getUserProfile(user.uid);
            if (!userProfile) {
                throw new Error('Perfil não encontrado');
            }

            await messagesService.sendMessage(
                chatId,
                user.uid,
                newMessage.trim(),
                userProfile.username,
                userProfile.photoURL
            );

            setNewMessage('');
        } catch (error: any) {
            console.error('Erro ao enviar mensagem:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const renderMessage = (message: Message) => {
        const user = auth.currentUser;
        const isMe = message.senderId === user?.uid;
        
        return (
            <View
                key={message.id}
                style={[
                    styles.messageContainer,
                    isMe ? styles.messageContainerMe : styles.messageContainerOther
                ]}
            >
                <View style={[
                    styles.messageBubble,
                    isMe ? styles.messageBubbleMe : styles.messageBubbleOther
                ]}>
                    <Text style={[
                        styles.messageText,
                        isMe ? styles.messageTextMe : styles.messageTextOther
                    ]}>
                        {message.text}
                    </Text>
                    <Text style={[
                        styles.messageTime,
                        isMe ? styles.messageTimeMe : styles.messageTimeOther
                    ]}>
                        {formatTime(message.createdAt)}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <LinearGradient colors={['#28002b', '#1a1a2e', '#0a0a1a']} style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
            </LinearGradient>
        );
    }

    if (!chatId || !otherUser) {
        return (
            <LinearGradient colors={['#28002b', '#1a1a2e', '#0a0a1a']} style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigate('Messages')} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chat</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center' }}>
                        Nenhum chat selecionado
                    </Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigate('Messages')} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        {otherUser.photoURL ? (
                            <Image source={{ uri: otherUser.photoURL }} style={styles.headerAvatar} />
                        ) : (
                            <View style={styles.headerAvatarPlaceholder}>
                                <MaterialIcons name="person" size={20} color="rgba(255,255,255,0.5)" />
                            </View>
                        )}
                        <View>
                            <Text style={styles.headerUsername}>@{otherUser.username}</Text>
                            <Text style={styles.headerStatus}>online</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.headerIcon}>
                        <MaterialIcons name="more-vert" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContent}
                >
                    {messages.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                                Nenhuma mensagem ainda. Comece a conversa!
                            </Text>
                        </View>
                    ) : (
                        messages.map(renderMessage)
                    )}
                </ScrollView>

                {/* Input */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Digite uma mensagem..."
                            placeholderTextColor="#999"
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                            maxLength={500}
                            editable={!sending}
                        />
                        <View style={styles.inputIcons}>
                            <TouchableOpacity style={styles.iconButton}>
                                <MaterialIcons name="image" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <MaterialIcons name="emoji-emotions" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <MaterialIcons name="send" size={24} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};
