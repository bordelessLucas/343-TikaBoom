import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './MyProfile.styles';

const { width } = Dimensions.get('window');
const videoWidth = (width - 4) / 3;

// Estado inicial do perfil (editável)
const initialProfileData = {
    username: 'meuusuario',
    displayName: 'Meu Nome',
    isVerified: false,
    following: 0,
    followers: '0',
    likes: '0',
    description: 'Adicione uma descrição aqui...',
    isLive: false,
};

// Vídeos mockados
const mockVideos = [
    { id: '1', thumbnail: '', views: '0', watched: false },
    { id: '2', thumbnail: '', views: '0', watched: false },
    { id: '3', thumbnail: '', views: '0', watched: false },
];

export const MyProfile = () => {
    const { navigate } = useNavigation();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState(initialProfileData);
    const [editDisplayName, setEditDisplayName] = useState(profileData.displayName);
    const [editDescription, setEditDescription] = useState(profileData.description);

    const handleSave = () => {
        setProfileData({
            ...profileData,
            displayName: editDisplayName,
            description: editDescription,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditDisplayName(profileData.displayName);
        setEditDescription(profileData.description);
        setIsEditing(false);
    };

    const renderVideoItem = ({ item }: { item: typeof mockVideos[0] }) => {
        return (
            <TouchableOpacity style={styles.videoThumbnail}>
                <View style={styles.thumbnailContainer}>
                    <View style={styles.thumbnailPlaceholder}>
                        <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
                    </View>
                </View>
                <View style={styles.videoInfo}>
                    <MaterialIcons name="play-arrow" size={12} color="#FFFFFF" />
                    <Text style={styles.viewCount}>{item.views}</Text>
                </View>
            </TouchableOpacity>
        );
    };

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
                        <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                            <MaterialIcons name="edit" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Profile Picture */}
                <View style={styles.profileSection}>
                    <TouchableOpacity style={styles.profileImageContainer} disabled={!isEditing}>
                        <View style={styles.profileImagePlaceholder}>
                            <MaterialIcons name="person" size={50} color="rgba(255,255,255,0.5)" />
                        </View>
                        {isEditing && (
                            <View style={styles.editImageOverlay}>
                                <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Profile Info */}
                    <View style={styles.profileInfo}>
                        {isEditing ? (
                            <TextInput
                                style={styles.editInput}
                                value={editDisplayName}
                                onChangeText={setEditDisplayName}
                                placeholder="Nome"
                                placeholderTextColor="#999"
                            />
                        ) : (
                            <View style={styles.nameContainer}>
                                <Text style={styles.displayName}>{profileData.displayName}</Text>
                                {profileData.isVerified && (
                                    <MaterialIcons name="verified" size={18} color="#1DA1F2" />
                                )}
                            </View>
                        )}
                        <Text style={styles.username}>@{profileData.username}</Text>
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
                            <Text style={styles.statNumber}>{profileData.likes}</Text>
                            <Text style={styles.statLabel}>Curtidas</Text>
                        </View>
                    </View>
                    
                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        {isEditing ? (
                            <TextInput
                                style={styles.editDescriptionInput}
                                value={editDescription}
                                onChangeText={setEditDescription}
                                placeholder="Adicione uma descrição..."
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />
                        ) : (
                            <Text style={styles.description}>{profileData.description}</Text>
                        )}
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
                    <FlatList
                        data={mockVideos}
                        renderItem={renderVideoItem}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        scrollEnabled={false}
                        columnWrapperStyle={styles.row}
                    />
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

