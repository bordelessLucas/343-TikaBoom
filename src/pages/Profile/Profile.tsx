import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, FlatList, Image, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Profile.styles';
import { auth } from '../../lib/firebaseconfig';
import { authService, UserProfile } from '../../services/authService';
import { postsService, Post } from '../../services/postsService';
import { usersService } from '../../services/usersService';
import { messagesService } from '../../services/messagesService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FollowersModal } from '../../components/FollowersModal/FollowersModal';

const { width } = Dimensions.get('window');
const videoWidth = (width - 4) / 3;

export const Profile = () => {
    const { navigate } = useNavigation();
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'followers' | 'following'>('followers');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                navigate('Login');
                return;
            }

            // Buscar userId do AsyncStorage
            const viewingUserId = await AsyncStorage.getItem('viewingUserId');
            if (!viewingUserId) {
                // Se não houver userId, redirecionar para Home
                navigate('Home');
                return;
            }

            // Verificar se é o próprio perfil
            if (viewingUserId === currentUser.uid) {
                setIsCurrentUser(true);
                navigate('MyProfile');
                return;
            }

            // Carregar perfil do usuário
            const profile = await authService.getUserProfile(viewingUserId);
            if (!profile) {
                Alert.alert('Erro', 'Usuário não encontrado');
                navigate('Home');
                return;
            }

            setProfileData(profile);

            // Verificar se está seguindo
            const following = await usersService.isFollowing(currentUser.uid, viewingUserId);
            setIsFollowing(following);

            // Carregar posts do usuário
            const posts = await postsService.getUserPosts(viewingUserId, false);
            setUserPosts(posts);
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            Alert.alert('Erro', 'Não foi possível carregar o perfil');
            navigate('Home');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!profileData) return;

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            if (isFollowing) {
                await usersService.unfollowUser(currentUser.uid, profileData.uid);
                setIsFollowing(false);
                Alert.alert('Sucesso', 'Você deixou de seguir este usuário');
            } else {
                await usersService.followUser(currentUser.uid, profileData.uid);
                setIsFollowing(true);
                
                // Criar chat automaticamente ao seguir
                try {
                    await messagesService.getOrCreateChat(currentUser.uid, profileData.uid);
                    console.log('✅ Chat criado automaticamente ao seguir');
                } catch (error) {
                    console.warn('⚠️ Não foi possível criar chat automaticamente:', error);
                }
                
                Alert.alert('Sucesso', 'Agora você está seguindo este usuário!');
            }

            // Recarregar perfil para atualizar contadores
            await loadProfile();
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível seguir/deixar de seguir');
        }
    };

    const handleMessage = async () => {
        if (!profileData) return;

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Erro', 'Você precisa estar logado para enviar mensagens');
                return;
            }

            console.log('💬 Iniciando criação/obtenção de chat...');
            
            // Criar ou obter chat
            const chatId = await messagesService.getOrCreateChat(currentUser.uid, profileData.uid);
            
            console.log('✅ Chat ID obtido:', chatId);
            
            // Salvar informações do chat
            await AsyncStorage.setItem('currentChatId', chatId);
            await AsyncStorage.setItem('currentChatOtherUser', JSON.stringify({
                uid: profileData.uid,
                username: profileData.username,
                photoURL: profileData.photoURL,
            }));

            console.log('✅ Navegando para Chat...');
            navigate('Chat');
        } catch (error: any) {
            console.error('❌ Erro ao abrir chat:', error);
            const errorMessage = error.message || 'Não foi possível abrir o chat';
            
            // Mensagem mais descritiva para erros de permissão
            if (errorMessage.includes('permission') || errorMessage.includes('Permissão')) {
                Alert.alert(
                    'Erro de Permissão',
                    'Não foi possível criar o chat. Verifique se as regras de segurança do Firestore estão configuradas corretamente para a coleção "chats".\n\n' +
                    'Certifique-se de que a regra de criação permite:\n' +
                    'allow create: if request.auth != null && request.auth.uid in request.resource.data.participants;'
                );
            } else {
                Alert.alert('Erro', errorMessage);
            }
        }
    };

    const renderVideoItem = ({ item }: { item: Post }) => {
        const views = item.views > 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views.toString();
        return (
            <TouchableOpacity 
                style={styles.videoThumbnail}
                onPress={() => navigate('Home')}
            >
                <View style={styles.thumbnailContainer}>
                    {item.thumbnailURL ? (
                        <Image source={{ uri: item.thumbnailURL }} style={styles.thumbnailImage} />
                    ) : item.mediaType === 'video' ? (
                        <View style={styles.thumbnailPlaceholder}>
                            <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
                        </View>
                    ) : (
                        <Image source={{ uri: item.mediaURL }} style={styles.thumbnailImage} />
                    )}
                </View>
                <View style={styles.videoInfo}>
                    <MaterialIcons name="play-arrow" size={12} color="#FFFFFF" />
                    <Text style={styles.viewCount}>{views}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading || !profileData) {
        return (
            <LinearGradient colors={['#28002b', '#1a1a2e', '#0a0a1a']} style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigate('Home')} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.headerIcon}>
                            <MaterialIcons name="notifications-none" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIcon}>
                            <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Picture */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        {profileData.photoURL ? (
                            <Image source={{ uri: profileData.photoURL }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <MaterialIcons name="person" size={50} color="rgba(255,255,255,0.5)" />
                            </View>
                        )}
                    </View>

                    {/* Profile Info */}
                    <View style={styles.profileInfo}>
                        <View style={styles.nameContainer}>
                            <Text style={styles.displayName}>{profileData.displayName}</Text>
                            {profileData.isVerified && (
                                <MaterialIcons name="verified" size={18} color="#1DA1F2" />
                            )}
                        </View>
                        <Text style={styles.username}>@{profileData.username}</Text>
                    </View>

                    {/* Statistics */}
                    <View style={styles.statsContainer}>
                        <TouchableOpacity 
                            style={styles.statItem}
                            onPress={() => {
                                setModalType('following');
                                setModalVisible(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.statNumber}>{profileData.following}</Text>
                            <Text style={styles.statLabel}>Seguindo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.statItem}
                            onPress={() => {
                                setModalType('followers');
                                setModalVisible(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.statNumber}>{profileData.followers}</Text>
                            <Text style={styles.statLabel}>Seguidores</Text>
                        </TouchableOpacity>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profileData.posts}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity 
                            style={[styles.followButton, isFollowing && styles.followingButton]}
                            onPress={handleFollow}
                        >
                            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                {isFollowing ? 'Seguindo' : 'Seguir'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                            <MaterialIcons name="send" size={18} color="#FFFFFF" />
                            <Text style={styles.messageButtonText}>Mensagem</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <MaterialIcons name="arrow-downward" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.description}>{profileData.bio || 'Sem descrição'}</Text>
                    </View>

                    {/* Grid Selector */}
                    <View style={styles.gridSelector}>
                        <TouchableOpacity style={styles.gridButton}>
                            <MaterialIcons name="grid-view" size={24} color="#FFFFFF" />
                            <MaterialIcons name="arrow-drop-down" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.gridUnderline} />
                    </View>
                </View>

                {/* Videos Grid */}
                <View style={styles.videosGrid}>
                    {userPosts.length > 0 ? (
                        <FlatList
                            data={userPosts}
                            renderItem={renderVideoItem}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            scrollEnabled={false}
                            columnWrapperStyle={styles.row}
                        />
                    ) : (
                        <View style={styles.emptyPosts}>
                            <MaterialIcons name="videocam-off" size={40} color="rgba(255,255,255,0.3)" />
                            <Text style={styles.emptyPostsText}>Nenhum post ainda</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Followers/Following Modal */}
            {profileData && (
                <FollowersModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    userId={profileData.uid}
                    type={modalType}
                />
            )}
        </LinearGradient>
    );
};
