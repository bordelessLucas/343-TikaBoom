import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../routes/NavigationContext';
import { postsService, Post } from '../../services/postsService';
import { usersService, UserProfile } from '../../services/usersService';
import { auth } from '../../lib/firebaseconfig';
import { styles } from './Search.styles';

type SearchTab = 'all' | 'users' | 'hashtags' | 'posts';

export const Search = () => {
    const { navigate } = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<SearchTab>('all');
    const [searchResults, setSearchResults] = useState<{
        users: UserProfile[];
        posts: Post[];
        hashtags: { hashtag: string; count: number }[];
    }>({ users: [], posts: [], hashtags: [] });
    const [trendingHashtags, setTrendingHashtags] = useState<{ hashtag: string; count: number }[]>([]);
    const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTrendingAndSuggestions();
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            performSearch();
        } else {
            setSearchResults({ users: [], posts: [], hashtags: [] });
        }
    }, [searchQuery]);

    const loadTrendingAndSuggestions = async () => {
        try {
            const hashtags = await postsService.getTrendingHashtags(10);
            setTrendingHashtags(hashtags);

            const user = auth.currentUser;
            if (user) {
                const suggestions = await usersService.getSuggestedUsers(user.uid, 5);
                setSuggestedUsers(suggestions);
            }
        } catch (error) {
            console.error('Erro ao carregar trending:', error);
        }
    };

    const performSearch = async () => {
        if (searchQuery.trim().length < 2) return;

        setLoading(true);
        try {
            const query = searchQuery.trim().toLowerCase();

            // Buscar usuários
            const users = await usersService.searchUsersByName(query, 10);

            // Buscar posts por hashtag se começar com #
            let posts: Post[] = [];
            if (query.startsWith('#')) {
                posts = await postsService.searchPostsByHashtag(query);
            }

            // Buscar hashtags trending que correspondem
            const matchingHashtags = trendingHashtags.filter(h => 
                h.hashtag.toLowerCase().includes(query.replace('#', ''))
            );

            setSearchResults({
                users,
                posts,
                hashtags: matchingHashtags,
            });
        } catch (error) {
            console.error('Erro na busca:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHashtagClick = async (hashtag: string) => {
        setSearchQuery(`#${hashtag}`);
        setActiveTab('posts');
        try {
            const posts = await postsService.searchPostsByHashtag(hashtag);
            setSearchResults(prev => ({ ...prev, posts }));
        } catch (error) {
            console.error('Erro ao buscar hashtag:', error);
        }
    };

    const renderUserItem = ({ item }: { item: UserProfile }) => (
        <TouchableOpacity 
            style={styles.userItem}
            onPress={() => navigate('Profile', { userId: item.uid })}
        >
            {item.photoURL ? (
                <Image source={{ uri: item.photoURL }} style={styles.userAvatar} />
            ) : (
                <View style={styles.userAvatarPlaceholder}>
                    <MaterialIcons name="person" size={24} color="#FFFFFF" />
                </View>
            )}
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userUsername}>@{item.username}</Text>
                {item.bio && <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>}
            </View>
            <View style={styles.userStats}>
                <Text style={styles.userStatNumber}>{item.followers}</Text>
                <Text style={styles.userStatLabel}>seguidores</Text>
            </View>
        </TouchableOpacity>
    );

    const renderPostItem = ({ item }: { item: Post }) => (
        <TouchableOpacity style={styles.postItem}>
            {item.thumbnailURL ? (
                <Image source={{ uri: item.thumbnailURL }} style={styles.postThumbnail} />
            ) : (
                <View style={styles.postThumbnailPlaceholder}>
                    <MaterialIcons 
                        name={item.mediaType === 'video' ? 'videocam' : 'image'} 
                        size={30} 
                        color="rgba(255,255,255,0.5)" 
                    />
                </View>
            )}
            <View style={styles.postInfo}>
                <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.postAuthor}>@{item.authorUsername}</Text>
                <View style={styles.postStats}>
                    <Ionicons name="heart" size={14} color="#FF0050" />
                    <Text style={styles.postStatText}>{item.likes}</Text>
                    <Ionicons name="eye" size={14} color="#FFFFFF" style={styles.postStatIcon} />
                    <Text style={styles.postStatText}>{item.views}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderHashtagItem = ({ item }: { item: { hashtag: string; count: number } }) => (
        <TouchableOpacity 
            style={styles.hashtagItem}
            onPress={() => handleHashtagClick(item.hashtag)}
        >
            <Ionicons name="pricetag" size={20} color="#FF0050" />
            <View style={styles.hashtagInfo}>
                <Text style={styles.hashtagText}>{item.hashtag}</Text>
                <Text style={styles.hashtagCount}>{item.count} posts</Text>
            </View>
        </TouchableOpacity>
    );

    const hasResults = searchQuery.trim().length > 0;
    const showTrending = !hasResults;

    return (
        <LinearGradient
            colors={['#28002b', '#1a1a2e', '#0a0a1a']}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigate('Home')} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                {/* Search Input */}
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar usuários, hashtags..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tabs */}
            {hasResults && (
                <View style={styles.tabsContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                        onPress={() => setActiveTab('all')}
                    >
                        <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Tudo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'users' && styles.tabActive]}
                        onPress={() => setActiveTab('users')}
                    >
                        <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Usuários</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>Posts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'hashtags' && styles.tabActive]}
                        onPress={() => setActiveTab('hashtags')}
                    >
                        <Text style={[styles.tabText, activeTab === 'hashtags' && styles.tabTextActive]}>Hashtags</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading && (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Buscando...</Text>
                    </View>
                )}

                {!loading && hasResults && (
                    <>
                        {activeTab === 'all' && (
                            <>
                                {searchResults.users.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Usuários</Text>
                                        <FlatList
                                            data={searchResults.users}
                                            renderItem={renderUserItem}
                                            keyExtractor={(item) => item.uid}
                                            scrollEnabled={false}
                                        />
                                    </View>
                                )}
                                {searchResults.posts.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Posts</Text>
                                        <FlatList
                                            data={searchResults.posts}
                                            renderItem={renderPostItem}
                                            keyExtractor={(item) => item.id}
                                            scrollEnabled={false}
                                        />
                                    </View>
                                )}
                                {searchResults.hashtags.length > 0 && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Hashtags</Text>
                                        <FlatList
                                            data={searchResults.hashtags}
                                            renderItem={renderHashtagItem}
                                            keyExtractor={(item) => item.hashtag}
                                            scrollEnabled={false}
                                        />
                                    </View>
                                )}
                                {searchResults.users.length === 0 && 
                                 searchResults.posts.length === 0 && 
                                 searchResults.hashtags.length === 0 && (
                                    <View style={styles.emptyContainer}>
                                        <MaterialIcons name="search-off" size={60} color="rgba(255,255,255,0.3)" />
                                        <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
                                    </View>
                                )}
                            </>
                        )}

                        {activeTab === 'users' && (
                            <View style={styles.section}>
                                {searchResults.users.length > 0 ? (
                                    <FlatList
                                        data={searchResults.users}
                                        renderItem={renderUserItem}
                                        keyExtractor={(item) => item.uid}
                                        scrollEnabled={false}
                                    />
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'posts' && (
                            <View style={styles.section}>
                                {searchResults.posts.length > 0 ? (
                                    <FlatList
                                        data={searchResults.posts}
                                        renderItem={renderPostItem}
                                        keyExtractor={(item) => item.id}
                                        scrollEnabled={false}
                                    />
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Nenhum post encontrado</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'hashtags' && (
                            <View style={styles.section}>
                                {searchResults.hashtags.length > 0 ? (
                                    <FlatList
                                        data={searchResults.hashtags}
                                        renderItem={renderHashtagItem}
                                        keyExtractor={(item) => item.hashtag}
                                        scrollEnabled={false}
                                    />
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Nenhuma hashtag encontrada</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}

                {!loading && showTrending && (
                    <>
                        {/* Trending Hashtags */}
                        {trendingHashtags.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>🔥 Trending Hashtags</Text>
                                <FlatList
                                    data={trendingHashtags}
                                    renderItem={renderHashtagItem}
                                    keyExtractor={(item) => item.hashtag}
                                    scrollEnabled={false}
                                />
                            </View>
                        )}

                        {/* Suggested Users */}
                        {suggestedUsers.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>👥 Sugestões para você</Text>
                                <FlatList
                                    data={suggestedUsers}
                                    renderItem={renderUserItem}
                                    keyExtractor={(item) => item.uid}
                                    scrollEnabled={false}
                                />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

