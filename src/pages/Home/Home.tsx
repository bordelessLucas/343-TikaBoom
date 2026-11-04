import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { VideoItem } from '../../components/VideoItem/VideoItem';
import { TopBar } from '../../components/TopBar/TopBar';
import { useNavigation } from '../../routes/NavigationContext';
import { postsService, Post } from '../../services/postsService';
import { styles } from './Home.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

interface FeedItem {
    id: string;
    videoUri: string;
    username: string;
    description: string;
    likes: number;
    comments: any[];
    saves: number;
    shares: number;
    postId: string; // Sempre presente para posts do Firebase
    userProfileImage?: string;
    creatorProfileImage?: string;
}

export const Home = () => {
    const { navigate, currentScreen } = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'forYou' | 'lives'>('forYou');
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (currentScreen === 'Home') {
            setActiveTab('forYou');
            loadFeed();
        }
    }, [currentScreen]);

    useEffect(() => {
        // Verificar post específico após o feed carregar
        if (feedItems.length > 0 && !loading) {
            checkForSpecificPost();
        }
    }, [feedItems, loading]);

    const checkForSpecificPost = async () => {
        try {
            const viewingPostId = await AsyncStorage.getItem('viewingPostId');
            const openComments = await AsyncStorage.getItem('openComments');
            
            if (viewingPostId) {
                // Limpar o AsyncStorage
                await AsyncStorage.removeItem('viewingPostId');
                await AsyncStorage.removeItem('openComments');
                
                // Encontrar o índice do post
                const postIndex = feedItems.findIndex(item => item.postId === viewingPostId);
                if (postIndex !== -1 && flatListRef.current) {
                    // Aguardar um pouco para garantir que o FlatList está renderizado
                    setTimeout(() => {
                        try {
                            // Scroll para o post
                            flatListRef.current?.scrollToIndex({ 
                                index: postIndex, 
                                animated: true 
                            });
                            setCurrentIndex(postIndex);
                            
                            // Se deve abrir comentários, salvar flag para o VideoItem
                            if (openComments === 'true') {
                                AsyncStorage.setItem('shouldOpenComments', 'true');
                            }
                        } catch (error) {
                            console.error('Erro ao fazer scroll para o post:', error);
                        }
                    }, 500);
                } else {
                    console.warn('Post não encontrado no feed:', viewingPostId);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar post específico:', error);
        }
    };

    const loadFeed = async () => {
        try {
            setLoading(true);
            // Buscar APENAS posts do Firebase (sem mockados)
            const firebasePosts = await postsService.getFeedPosts(50);
            
            // Converter posts do Firebase para formato do feed
            const feedItems: FeedItem[] = firebasePosts
                .filter(post => post.mediaType === 'video') // Apenas vídeos no feed
                .map(post => ({
                    id: post.id,
                    postId: post.id, // Sempre presente
                    videoUri: post.mediaURL,
                    username: post.authorUsername,
                    description: post.description || post.title,
                    likes: post.likes || 0,
                    comments: [], // Será carregado quando necessário
                    saves: post.saves || 0,
                    shares: post.shares || 0,
                    userProfileImage: post.authorPhotoURL,
                    creatorProfileImage: post.authorPhotoURL,
                }));

            setFeedItems(feedItems);
            
            if (feedItems.length === 0) {
                console.log('📭 Nenhum post encontrado no feed');
            } else {
                console.log(`✅ ${feedItems.length} posts carregados do Firebase`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar feed:', error);
            setFeedItems([]); // Array vazio em caso de erro
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab: 'forYou' | 'lives') => {
        setActiveTab(tab);
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            if (index !== null) {
                setCurrentIndex(index);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const renderItem = ({ item, index }: { item: FeedItem; index: number }) => {
        return (
            <VideoItem
                videoUri={item.videoUri}
                username={item.username}
                description={item.description}
                isActive={index === currentIndex}
                likes={item.likes}
                comments={item.comments}
                saves={item.saves}
                shares={item.shares}
                postId={item.postId} // Sempre presente
                userProfileImage={item.userProfileImage}
                creatorProfileImage={item.creatorProfileImage}
            />
        );
    };

    return (
        <View style={styles.container}>
            <TopBar activeTab={activeTab} onTabChange={handleTabChange} />
            <FlatList
                ref={flatListRef}
                data={feedItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                refreshing={loading}
                onRefresh={loadFeed}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(data, index) => ({
                    length: height,
                    offset: height * index,
                    index,
                })}
            />
        </View>
    );
};
