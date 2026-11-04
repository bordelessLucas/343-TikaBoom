import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, FlatList, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '../../services/authService';
import { usersService } from '../../services/usersService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '../../routes/NavigationContext';

interface FollowersModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
}

const { width, height } = Dimensions.get('window');

export const FollowersModal = ({ visible, onClose, userId, type }: FollowersModalProps) => {
    const { navigate } = useNavigation();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && userId) {
            loadUsers();
        } else {
            setUsers([]);
        }
    }, [visible, userId, type]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const userList = type === 'followers' 
                ? await usersService.getFollowers(userId)
                : await usersService.getFollowing(userId);
            setUsers(userList);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUserPress = async (user: UserProfile) => {
        try {
            await AsyncStorage.setItem('viewingUserId', user.uid);
            onClose();
            navigate('Profile');
        } catch (error) {
            console.error('Erro ao navegar para perfil:', error);
        }
    };

    const renderAvatar = (user: UserProfile) => {
        if (user.photoURL) {
            return <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />;
        }
        return (
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
        );
    };

    const renderUserItem = ({ item }: { item: UserProfile }) => {
        return (
            <TouchableOpacity 
                style={styles.userItem}
                onPress={() => handleUserPress(item)}
                activeOpacity={0.7}
            >
                {renderAvatar(item)}
                <View style={styles.userInfo}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.userName}>{item.displayName}</Text>
                        {item.isVerified && (
                            <MaterialIcons name="verified" size={16} color="#1DA1F2" />
                        )}
                    </View>
                    <Text style={styles.userHandle}>@{item.username}</Text>
                    {item.bio && (
                        <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
                    )}
                </View>
                <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                <LinearGradient
                    colors={['rgba(0,0,0,0.95)', 'rgba(40,0,43,0.95)']}
                    style={styles.modalContent}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {type === 'followers' ? 'Seguidores' : 'Seguindo'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                        </View>
                    ) : users.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons 
                                name={type === 'followers' ? 'people-outline' : 'person-outline'} 
                                size={48} 
                                color="rgba(255,255,255,0.3)" 
                            />
                            <Text style={styles.emptyText}>
                                {type === 'followers' 
                                    ? 'Nenhum seguidor ainda' 
                                    : 'Não está seguindo ninguém'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={users}
                            renderItem={renderUserItem}
                            keyExtractor={(item) => item.uid}
                            style={styles.list}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
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
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: height * 0.8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginTop: 16,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(163, 0, 168, 0.49)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    userHandle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginTop: 2,
    },
    userBio: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginTop: 4,
    },
});
