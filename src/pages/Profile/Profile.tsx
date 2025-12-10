import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Profile.styles';

const { width } = Dimensions.get('window');
const videoWidth = (width - 4) / 3; // 3 colunas com espaçamento

// Dados mockados do perfil
const profileData = {
    username: 'usuario',
    displayName: 'usuario',
    isVerified: true,
    following: 14,
    followers: '1,5 mi',
    likes: '15,2 mi',
    description: 'Usuario',
    isLive: true,
};

// Vídeos mockados
const mockVideos = [
    { id: '1', thumbnail: '', views: '40,2 mil', watched: false },
    { id: '2', thumbnail: '', views: '44,5 mil', watched: false },
    { id: '3', thumbnail: '', views: '51,5 mil', watched: false },
    { id: '4', thumbnail: '', views: '168,5 mil', watched: true },
    { id: '5', thumbnail: '', views: '39,3 mil', watched: false },
    { id: '6', thumbnail: '', views: '25,1 mil', watched: false },
    { id: '7', thumbnail: '', views: '32,8 mil', watched: false },
    { id: '8', thumbnail: '', views: '18,9 mil', watched: false },
    { id: '9', thumbnail: '', views: '55,3 mil', watched: false },
];

export const Profile = () => {
    const { navigate } = useNavigation();

    const renderVideoItem = ({ item }: { item: typeof mockVideos[0] }) => {
        return (
            <TouchableOpacity style={styles.videoThumbnail}>
                <View style={[styles.thumbnailContainer, item.watched && styles.watchedContainer]}>
                    {item.watched ? (
                        <View style={styles.watchedOverlay}>
                            <MaterialIcons name="play-arrow" size={40} color="#FFFFFF" />
                            <Text style={styles.watchedText}>Assistido</Text>
                        </View>
                    ) : (
                        <View style={styles.thumbnailPlaceholder}>
                            <View style={styles.playIconContainer}>
                                <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
                            </View>
                        </View>
                    )}
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
                            <View style={styles.profileImagePlaceholder}>
                                <MaterialIcons name="person" size={50} color="rgba(255,255,255,0.5)" />
                            </View>
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

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.followButton}>
                            <Text style={styles.followButtonText}>Seguir</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.messageButton}>
                            <MaterialIcons name="send" size={18} color="#FFFFFF" />
                            <Text style={styles.messageButtonText}>Mensagem</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <MaterialIcons name="arrow-downward" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.description}>{profileData.description}</Text>
                    </View>

                    {/* Live Indicator */}
                    {profileData.isLive && (
                        <View style={styles.liveContainer}>
                            <View style={styles.liveIcon}>
                                <MaterialIcons name="fiber-manual-record" size={12} color="#FF0000" />
                            </View>
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    )}

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

