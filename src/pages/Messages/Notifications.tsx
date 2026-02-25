import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './Messages.styles';
import { auth } from '../../lib/firebaseconfig';
import { notificationsService, Notification } from '../../services/notificationsService';
import { useNavigation } from '../../routes/NavigationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Notifications = () => {
    const { navigate } = useNavigation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                setNotifications([]);
                return;
            }

            const userNotifications = await notificationsService.getUserNotifications(user.uid);
            setNotifications(userNotifications);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: number): string => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'agora';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    const handleNotificationPress = async (notification: Notification) => {
        try {
            // Marcar como lida
            if (!notification.read) {
                await notificationsService.markAsRead(notification.id);
                // Atualizar localmente
                setNotifications(prev => 
                    prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                );
            }

            // Navegar baseado no tipo
            if (notification.type === 'follow') {
                // Navegar para o perfil do usuário que seguiu
                await AsyncStorage.setItem('viewingUserId', notification.actorId);
                navigate('Profile');
            } else if (notification.type === 'like' || notification.type === 'comment') {
                // Navegar para o post
                if (notification.postId) {
                    await AsyncStorage.setItem('viewingPostId', notification.postId);
                    await AsyncStorage.setItem('openComments', notification.type === 'comment' ? 'true' : 'false');
                    navigate('Home');
                }
            }
        } catch (error) {
            console.error('Erro ao processar notificação:', error);
        }
    };
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'follow':
                return 'person-add';
            case 'like':
                return 'favorite';
            case 'comment':
                return 'comment';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'follow':
                return '#1DA1F2';
            case 'like':
                return '#FF6B6B';
            case 'comment':
                return '#FFD700';
            default:
                return '#FFFFFF';
        }
    };

    if (loading) {
        return (
            <View style={styles.notificationsList}>
                <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 50 }} />
            </View>
        );
    }

    if (notifications.length === 0) {
        return (
            <ScrollView style={styles.notificationsList}>
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
                    <MaterialIcons name="notifications-none" size={64} color="#666" />
                    <Text style={{ color: '#999', marginTop: 20, fontSize: 16 }}>
                        Nenhuma notificação ainda
                    </Text>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.notificationsList}>
            {notifications.map((notification) => {
                const getMessage = () => {
                    switch (notification.type) {
                        case 'follow':
                            return 'começou a seguir você';
                        case 'like':
                            return 'curtiu seu vídeo';
                        case 'comment':
                            return 'comentou no seu vídeo';
                        default:
                            return '';
                    }
                };

                return (
                    <TouchableOpacity
                        key={notification.id}
                        style={[
                            styles.notificationItem,
                            !notification.read && styles.notificationItemUnread
                        ]}
                        onPress={() => handleNotificationPress(notification)}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.notificationIconContainer,
                            { backgroundColor: `${getNotificationColor(notification.type)}20` }
                        ]}>
                            <MaterialIcons
                                name={getNotificationIcon(notification.type) as any}
                                size={24}
                                color={getNotificationColor(notification.type)}
                            />
                        </View>
                        <View style={styles.notificationContent}>
                            <View style={styles.notificationHeader}>
                                <Text style={styles.notificationUsername}>
                                    @{notification.actorUsername}
                                </Text>
                                <Text style={styles.notificationTime}>
                                    {formatTime(notification.createdAt)}
                                </Text>
                            </View>
                            <Text style={styles.notificationMessage}>
                                {getMessage()}
                            </Text>
                            {notification.postTitle && (
                                <Text style={styles.notificationVideoTitle}>
                                    "{notification.postTitle}"
                                </Text>
                            )}
                            {notification.commentText && (
                                <Text style={styles.notificationComment}>
                                    "{notification.commentText}"
                                </Text>
                            )}
                        </View>
                        {!notification.read && (
                            <View style={styles.unreadDot} />
                        )}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

