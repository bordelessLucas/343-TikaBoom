import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './Messages.styles';

// Dados mockados de notificações
const mockNotifications = [
    {
        id: '1',
        type: 'follow',
        username: 'usuario_novo',
        message: 'começou a seguir você',
        time: '5m',
        read: false,
    },
    {
        id: '2',
        type: 'like',
        username: 'usuario_amigo',
        message: 'curtiu seu vídeo',
        videoTitle: 'Meu vídeo incrível',
        time: '1h',
        read: false,
    },
    {
        id: '3',
        type: 'comment',
        username: 'fan123',
        message: 'comentou no seu vídeo',
        comment: 'Muito bom! 👏',
        time: '2h',
        read: false,
    },
    {
        id: '4',
        type: 'follow',
        username: 'seguidor_legal',
        message: 'começou a seguir você',
        time: '3h',
        read: true,
    },
    {
        id: '5',
        type: 'like',
        username: 'curtidor_pro',
        message: 'curtiu seu vídeo',
        videoTitle: 'Novo conteúdo',
        time: '5h',
        read: true,
    },
];

export const Notifications = () => {
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

    return (
        <ScrollView style={styles.notificationsList}>
            {mockNotifications.map((notification) => (
                <TouchableOpacity
                    key={notification.id}
                    style={[
                        styles.notificationItem,
                        !notification.read && styles.notificationItemUnread
                    ]}
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
                                @{notification.username}
                            </Text>
                            <Text style={styles.notificationTime}>{notification.time}</Text>
                        </View>
                        <Text style={styles.notificationMessage}>
                            {notification.message}
                        </Text>
                        {notification.videoTitle && (
                            <Text style={styles.notificationVideoTitle}>
                                "{notification.videoTitle}"
                            </Text>
                        )}
                        {notification.comment && (
                            <Text style={styles.notificationComment}>
                                "{notification.comment}"
                            </Text>
                        )}
                    </View>
                    {!notification.read && (
                        <View style={styles.unreadDot} />
                    )}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

