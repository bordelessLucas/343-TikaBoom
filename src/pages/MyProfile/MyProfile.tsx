import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, FlatList, Image, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '../../routes/NavigationContext';
import { auth } from '../../lib/firebaseconfig';
import { authService, UserProfile } from '../../services/authService';
import { postsService, Post } from '../../services/postsService';
import { styles } from './MyProfile.styles';

const { width } = Dimensions.get('window');
const videoWidth = (width - 4) / 3;

type TabType = 'posts' | 'liked' | 'saved';

export const MyProfile = () => {
    const { navigate } = useNavigation();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [likedPosts, setLikedPosts] = useState<Post[]>([]);
    const [savedPosts, setSavedPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [loading, setLoading] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editBio, setEditBio] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [usernameError, setUsernameError] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'liked' && likedPosts.length === 0) {
            loadLikedPosts();
        } else if (activeTab === 'saved' && savedPosts.length === 0) {
            loadSavedPosts();
        }
    }, [activeTab]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                navigate('Login');
                return;
            }

            const profile = await authService.getUserProfile(user.uid);
            if (profile) {
                setProfileData(profile);
                setEditDisplayName(profile.displayName);
                setEditUsername(profile.username);
                setEditBio(profile.bio || '');
                setIsPrivate(profile.isPrivate || false);

                // Carregar posts do usuário
                await loadUserPosts();
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserPosts = async () => {
        try {
            setLoadingPosts(true);
            const user = auth.currentUser;
            if (!user) return;
            const posts = await postsService.getUserPosts(user.uid, true);
            setUserPosts(posts);
        } catch (error) {
            console.error('Erro ao carregar posts:', error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const loadLikedPosts = async () => {
        try {
            setLoadingPosts(true);
            const user = auth.currentUser;
            if (!user) {
                setLikedPosts([]);
                return;
            }
            const posts = await postsService.getLikedPosts(user.uid);
            setLikedPosts(posts);
        } catch (error: any) {
            console.error('Erro ao carregar posts curtidos:', error);
            // Em caso de erro, definir array vazio para não quebrar a UI
            setLikedPosts([]);
        } finally {
            setLoadingPosts(false);
        }
    };

    const loadSavedPosts = async () => {
        try {
            setLoadingPosts(true);
            const user = auth.currentUser;
            if (!user) {
                setSavedPosts([]);
                return;
            }
            const posts = await postsService.getSavedPosts(user.uid);
            setSavedPosts(posts);
        } catch (error: any) {
            console.error('Erro ao carregar posts salvos:', error);
            // Em caso de erro, definir array vazio para não quebrar a UI
            setSavedPosts([]);
        } finally {
            setLoadingPosts(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0] && profileData) {
                const user = auth.currentUser;
                if (!user) return;

                Alert.alert('Enviando...', 'Upload da foto em andamento...');
                const photoURL = await authService.uploadProfilePhoto(user.uid, result.assets[0].uri);
                await loadProfile(); // Recarregar perfil
                Alert.alert('Sucesso!', 'Foto de perfil atualizada!');
            }
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível atualizar a foto');
        }
    };

    const checkUsername = async (username: string) => {
        if (!username.trim()) {
            setUsernameError('Username não pode estar vazio');
            return false;
        }
        if (username.length < 3) {
            setUsernameError('Username deve ter pelo menos 3 caracteres');
            return false;
        }
        if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
            setUsernameError('Username só pode conter letras, números e _');
            return false;
        }
        if (username.toLowerCase() === profileData?.username.toLowerCase()) {
            setUsernameError('');
            return true;
        }
        try {
            const available = await authService.isUsernameAvailable(username);
            if (!available) {
                setUsernameError('Username já está em uso');
                return false;
            }
            setUsernameError('');
            return true;
        } catch (error) {
            setUsernameError('Erro ao verificar username');
            return false;
        }
    };

    const handleSave = async () => {
        if (!profileData) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            // Validar username
            const usernameValid = await checkUsername(editUsername);
            if (!usernameValid) {
                return;
            }

            if (!editDisplayName.trim()) {
                Alert.alert('Erro', 'Nome não pode estar vazio');
                return;
            }

            const updates: Partial<UserProfile> = {
                displayName: editDisplayName.trim(),
                username: editUsername.toLowerCase().trim(),
                bio: editBio.trim(),
                isPrivate: isPrivate,
            };

            await authService.updateUserProfile(user.uid, updates);

            await loadProfile();
            setIsEditing(false);
            Alert.alert('Sucesso!', 'Perfil atualizado com sucesso!');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível atualizar o perfil');
        }
    };

    const handleCancel = () => {
        if (profileData) {
            setEditDisplayName(profileData.displayName);
            setEditUsername(profileData.username);
            setEditBio(profileData.bio || '');
            setIsPrivate(profileData.isPrivate || false);
            setUsernameError('');
        }
        setIsEditing(false);
    };

    const handleLogout = () => {
        Alert.alert(
            'Sair da Conta',
            'Tem certeza que deseja sair?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.logout();
                            // Limpar AsyncStorage
                            await AsyncStorage.removeItem('currentChatId');
                            await AsyncStorage.removeItem('currentChatOtherUser');
                            await AsyncStorage.removeItem('savedEmail');
                            await AsyncStorage.removeItem('savedPassword');
                            await AsyncStorage.removeItem('rememberMe');
                            navigate('Login');
                        } catch (error: any) {
                            console.error('Erro ao fazer logout:', error);
                            Alert.alert('Erro', error.message || 'Não foi possível fazer logout');
                        }
                    },
                },
            ]
        );
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

    const getCurrentPosts = () => {
        switch (activeTab) {
            case 'liked':
                return likedPosts;
            case 'saved':
                return savedPosts;
            default:
                return userPosts;
        }
    };

    if (loading || !profileData) {
        return (
            <LinearGradient colors={['#28002b', '#1a1a2e', '#0a0a1a']} style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#FFFFFF' }}>Carregando...</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigate('Home')} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Meu Perfil</Text>
                    {isEditing ? (
                        <View style={styles.editActions}>
                            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                                <Text style={styles.saveText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.headerActions}>
                            <TouchableOpacity 
                                onPress={() => navigate('Wallet')} 
                                style={styles.walletButton}
                            >
                                <MaterialIcons name="account-balance-wallet" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => navigate('Settings')} 
                                style={styles.settingsButton}
                            >
                                <MaterialIcons name="settings" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                                <MaterialIcons name="edit" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Profile Picture */}
                <View style={styles.profileSection}>
                    <TouchableOpacity 
                        style={styles.profileImageContainer} 
                        onPress={isEditing ? handlePickImage : undefined}
                        disabled={!isEditing}
                    >
                        {profileData.photoURL ? (
                            <Image source={{ uri: profileData.photoURL }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <MaterialIcons name="person" size={50} color="rgba(255,255,255,0.5)" />
                            </View>
                        )}
                        {isEditing && (
                            <View style={styles.editImageOverlay}>
                                <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Profile Info */}
                    <View style={styles.profileInfo}>
                        {isEditing ? (
                            <>
                                <TextInput
                                    style={[styles.editInput, !editDisplayName.trim() && styles.editInputError]}
                                    value={editDisplayName}
                                    onChangeText={setEditDisplayName}
                                    placeholder="Nome completo"
                                    placeholderTextColor="#999"
                                />
                                <View style={styles.usernameInputContainer}>
                                    <Text style={styles.usernameLabel}>@</Text>
                                    <TextInput
                                        style={[styles.editUsernameInput, usernameError && styles.editInputError]}
                                        value={editUsername}
                                        onChangeText={(text) => {
                                            setEditUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                                            setUsernameError('');
                                        }}
                                        onBlur={() => checkUsername(editUsername)}
                                        placeholder="username"
                                        placeholderTextColor="#999"
                                        autoCapitalize="none"
                                    />
                                </View>
                                {usernameError ? (
                                    <Text style={styles.errorText}>{usernameError}</Text>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <View style={styles.nameContainer}>
                                    <Text style={styles.displayName}>{profileData.displayName}</Text>
                                    {profileData.isVerified && (
                                        <MaterialIcons name="verified" size={18} color="#1DA1F2" />
                                    )}
                                </View>
                                <Text style={styles.username}>@{profileData.username}</Text>
                            </>
                        )}
                    </View>

                    {/* Statistics */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profileData.following}</Text>
                            <Text style={styles.statLabel}>Seguindo</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profileData.followers}</Text>
                            <Text style={styles.statLabel}>Seguidores</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{profileData.posts}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                    </View>
                    
                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        {isEditing ? (
                            <TextInput
                                style={styles.editDescriptionInput}
                                value={editBio}
                                onChangeText={setEditBio}
                                placeholder="Adicione uma descrição..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />
                        ) : (
                            <Text style={styles.description}>{profileData.bio || 'Sem descrição'}</Text>
                        )}
                    </View>

                    {/* Privacy Toggle */}
                    {isEditing && (
                        <View style={styles.privacyContainer}>
                            <TouchableOpacity 
                                style={styles.privacyToggle}
                                onPress={() => setIsPrivate(!isPrivate)}
                            >
                                <MaterialIcons 
                                    name={isPrivate ? 'lock' : 'lock-open'} 
                                    size={20} 
                                    color="#FFFFFF" 
                                />
                                <Text style={styles.privacyText}>
                                    {isPrivate ? 'Conta Privada' : 'Conta Pública'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Logout Button */}
                    {!isEditing && (
                        <View style={styles.logoutContainer}>
                            <TouchableOpacity 
                                style={styles.logoutButton}
                                onPress={handleLogout}
                            >
                                <MaterialIcons name="logout" size={20} color="#FF6B6B" />
                                <Text style={styles.logoutText}>Sair da Conta</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
                            onPress={() => setActiveTab('posts')}
                        >
                            <MaterialIcons 
                                name="grid-view" 
                                size={20} 
                                color={activeTab === 'posts' ? '#FFFFFF' : '#999'} 
                            />
                            <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
                                Posts
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
                            onPress={() => setActiveTab('liked')}
                        >
                            <MaterialIcons 
                                name="favorite" 
                                size={20} 
                                color={activeTab === 'liked' ? '#FF6B6B' : '#999'} 
                            />
                            <Text style={[styles.tabText, activeTab === 'liked' && styles.tabTextActive]}>
                                Curtidos
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
                            onPress={() => setActiveTab('saved')}
                        >
                            <MaterialIcons 
                                name="bookmark" 
                                size={20} 
                                color={activeTab === 'saved' ? '#FFD700' : '#999'} 
                            />
                            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
                                Salvos
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Videos Grid */}
                <View style={styles.videosGrid}>
                    {loadingPosts ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                        </View>
                    ) : getCurrentPosts().length > 0 ? (
                        <FlatList
                            data={getCurrentPosts()}
                            renderItem={renderVideoItem}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            scrollEnabled={false}
                            columnWrapperStyle={styles.row}
                        />
                    ) : (
                        <View style={styles.emptyPosts}>
                            <MaterialIcons 
                                name={activeTab === 'posts' ? 'videocam-off' : activeTab === 'liked' ? 'favorite-border' : 'bookmark-border'} 
                                size={40} 
                                color="rgba(255,255,255,0.3)" 
                            />
                            <Text style={styles.emptyPostsText}>
                                {activeTab === 'posts' 
                                    ? 'Nenhum post ainda' 
                                    : activeTab === 'liked' 
                                    ? 'Nenhum vídeo curtido' 
                                    : 'Nenhum vídeo salvo'}
                            </Text>
                            <Text style={styles.emptyPostsSubtext}>
                                {activeTab === 'posts' 
                                    ? 'Crie seu primeiro vídeo!' 
                                    : activeTab === 'liked' 
                                    ? 'Comece a curtir vídeos!' 
                                    : 'Salve seus vídeos favoritos!'}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

