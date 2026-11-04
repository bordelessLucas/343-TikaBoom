import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './BottomNavigation.styles';
import { auth } from '../../lib/firebaseconfig';
import { messagesService, Chat } from '../../services/messagesService';

export const BottomNavigation = () => {
    const { currentScreen, navigate } = useNavigation();
    const [unreadCount, setUnreadCount] = useState(0);

    const navItems = [
        { id: 'home', label: 'Início', icon: 'home', screen: 'Home' as const },
        { id: 'friends', label: 'Amigos', icon: 'people', screen: 'Friends' as const },
        { id: 'create', label: '', icon: 'add', screen: 'CreateVideo' as const },
        { id: 'messages', label: 'Mensagens', icon: 'message', screen: 'Messages' as const },
        { id: 'profile', label: 'Perfil', icon: 'person', screen: 'MyProfile' as const },
    ];

    // Escutar mudanças nos chats para atualizar contador de não lidas
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setUnreadCount(0);
            return;
        }

        // Função para calcular total de não lidas
        const calculateUnreadCount = (chats: Chat[]) => {
            let total = 0;
            chats.forEach(chat => {
                if (chat.unreadCount && chat.unreadCount[user.uid]) {
                    total += chat.unreadCount[user.uid];
                }
            });
            setUnreadCount(total);
        };

        // Escutar mudanças em tempo real
        const unsubscribe = messagesService.subscribeToUserChats(user.uid, (chats) => {
            calculateUnreadCount(chats);
        });

        // Carregar contador inicial
        messagesService.getUserChats(user.uid).then(calculateUnreadCount).catch(() => {
            setUnreadCount(0);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.98)']}
                style={styles.gradient}
            >
                {navItems.map((item) => {
                    const isActive = currentScreen === item.screen;
                    const isCreate = item.id === 'create';

                    if (isCreate) {
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.createButton}
                                onPress={() => item.screen && navigate(item.screen)}
                            >
                                <View style={styles.createButtonWrapper}>
                                    <View style={styles.createButtonContainer}>
                                        <LinearGradient
                                            colors={['#FFFFFF', '#FFFFFF']}
                                            style={styles.createButtonGradient}
                                        >
                                            <MaterialIcons name="add" size={28} color="#000000" />
                                        </LinearGradient>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.navItem}
                            onPress={() => item.screen && navigate(item.screen)}
                            disabled={!item.screen}
                        >
                            <View style={styles.iconContainer}>
                                <MaterialIcons
                                    name={item.icon as any}
                                    size={24}
                                    color={isActive ? '#FFFFFF' : '#999'}
                                />
                                {/* Indicador de mensagens não lidas */}
                                {item.id === 'messages' && unreadCount > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadBadgeText}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </LinearGradient>
        </View>
    );
};

