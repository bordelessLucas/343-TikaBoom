import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './GroupChat.styles';
import { auth } from '../../lib/firebaseconfig';
import { groupsService, Group, GroupMessage } from '../../services/groupsService';
import { authService } from '../../services/authService';

export const GroupChat = () => {
    const { navigate } = useNavigation();
    const [group, setGroup] = useState<Group | null>(null);
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<ScrollView | null>(null);

    // Por enquanto, buscar groupId salvo no AsyncStorage se necessário (mock simples)
    // Em produção, usar params de navegação

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const user = auth.currentUser;
                if (!user) {
                    navigate('Login');
                    return;
                }

                // Mock: usar um ID fixo se não houver groupId (poderia vir de AsyncStorage)
                const groupId = 'mock-group';

                const g = await groupsService.getGroup(groupId);
                setGroup(
                    g || {
                        id: groupId,
                        name: 'Grupo Mock',
                        description: 'Chat em grupo de exemplo',
                        ownerId: user.uid,
                        members: [user.uid],
                        interests: ['geral'],
                        createdAt: Date.now(),
                    },
                );

                const msgs = await groupsService.getGroupMessages(groupId, 50);
                setMessages(msgs);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !group) return;
        const user = auth.currentUser;
        if (!user) return;

        try {
            const profile = await authService.getUserProfile(user.uid);
            const username = profile?.username || 'user';
            const photoURL = profile?.photoURL;

            await groupsService.sendGroupMessage(
                group.id,
                user.uid,
                newMessage,
                username,
                photoURL,
            );

            const msgs = await groupsService.getGroupMessages(group.id, 50);
            setMessages(msgs);
            setNewMessage('');
        } catch (error) {
            console.error('Erro ao enviar mensagem no grupo:', error);
        }
    };

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigate('Groups')} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{group?.name || 'Grupo'}</Text>
                    {group?.description ? (
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {group.description}
                        </Text>
                    ) : null}
                </View>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={80}
            >
                <ScrollView
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesContent}
                    ref={(ref) => (scrollRef.current = ref)}
                >
                    {messages.map((msg) => {
                        const isMine = msg.senderId === auth.currentUser?.uid;
                        return (
                            <View
                                key={msg.id}
                                style={[
                                    styles.messageBubble,
                                    isMine ? styles.messageMine : styles.messageOther,
                                ]}
                            >
                                {!isMine && (
                                    <Text style={styles.messageSender}>@{msg.senderUsername}</Text>
                                )}
                                <Text style={styles.messageText}>{msg.text}</Text>
                            </View>
                        );
                    })}
                    {messages.length === 0 && !loading && (
                        <Text style={styles.emptyText}>
                            Nenhuma mensagem ainda. Comece a conversa!
                        </Text>
                    )}
                </ScrollView>

                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Mensagem"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <MaterialIcons name="send" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

