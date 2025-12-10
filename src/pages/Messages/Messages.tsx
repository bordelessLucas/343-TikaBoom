import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Messages.styles';
import { Notifications } from './Notifications';

// Dados mockados de mensagens
const mockMessages = [
    { id: '1', username: 'usuario1', lastMessage: 'Oi! Como você está?', time: '2h', unread: 2 },
    { id: '2', username: 'usuario2', lastMessage: 'Viu meu novo vídeo?', time: '5h', unread: 0 },
    { id: '3', username: 'usuario3', lastMessage: 'Obrigado pelo like!', time: '1d', unread: 1 },
    { id: '4', username: 'usuario4', lastMessage: 'Vamos colaborar?', time: '2d', unread: 0 },
];

export const Messages = () => {
    const { navigate } = useNavigation();
    const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');

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
                <ScrollView style={styles.messagesList}>
                    {mockMessages.map((message) => (
                        <TouchableOpacity
                            key={message.id}
                            style={styles.messageItem}
                            onPress={() => navigate('Chat' as any)}
                        >
                            <View style={styles.profileImageContainer}>
                                <View style={styles.profileImagePlaceholder}>
                                    <MaterialIcons name="person" size={30} color="rgba(255,255,255,0.5)" />
                                </View>
                                {message.unread > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadText}>{message.unread}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.messageContent}>
                                <View style={styles.messageHeader}>
                                    <Text style={styles.messageUsername}>@{message.username}</Text>
                                    <Text style={styles.messageTime}>{message.time}</Text>
                                </View>
                                <Text style={styles.messageText} numberOfLines={1}>
                                    {message.lastMessage}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <Notifications />
            )}
        </LinearGradient>
    );
};
