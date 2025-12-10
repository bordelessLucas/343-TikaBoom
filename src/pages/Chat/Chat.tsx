import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Chat.styles';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'other';
    time: string;
}

// Mensagens mockadas
const initialMessages: Message[] = [
    { id: '1', text: 'Oi! Como você está?', sender: 'other', time: '10:30' },
    { id: '2', text: 'Oi! Estou bem, obrigado!', sender: 'me', time: '10:32' },
    { id: '3', text: 'Que bom! Viu meu novo vídeo?', sender: 'other', time: '10:33' },
];

export const Chat = () => {
    const { navigate } = useNavigation();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [username] = useState('usuario1');
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const now = new Date();
            const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            const message: Message = {
                id: Date.now().toString(),
                text: newMessage.trim(),
                sender: 'me',
                time,
            };
            
            setMessages([...messages, message]);
            setNewMessage('');
        }
    };

    const renderMessage = (message: Message) => {
        const isMe = message.sender === 'me';
        
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
                        {message.time}
                    </Text>
                </View>
            </View>
        );
    };

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
                        <Text style={styles.headerUsername}>@{username}</Text>
                        <Text style={styles.headerStatus}>online</Text>
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
                    {messages.map(renderMessage)}
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
                        style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!newMessage.trim()}
                    >
                        <MaterialIcons name="send" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

