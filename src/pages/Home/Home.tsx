import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { VideoItem } from '../../components/VideoItem/VideoItem';
import { TopBar } from '../../components/TopBar/TopBar';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Home.styles';

const { height } = Dimensions.get('window');

// Dados mockados de vídeos (por enquanto)
const mockVideos = [
    {
        id: '1',
        videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        username: 'usuario1',
        description: 'Meu primeiro vídeo no TikaBoom! 🎉',
        likes: 1331,
        comments: [
            { id: '1', username: 'queimandocoisas no microondas', text: 'manda salve', likes: 0, timeAgo: '2d' },
            { id: '2', username: 'MrRebelatto', text: '"tira tira"', likes: 1, timeAgo: '2d' },
        ],
        saves: 47,
        shares: 19,
    },
    {
        id: '2',
        videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        username: 'usuario2',
        description: 'Conteúdo incrível aqui! 👏',
        likes: 856,
        comments: [
            { id: '3', username: 'user123', text: 'Muito bom!', likes: 5, timeAgo: '1d' },
        ],
        saves: 23,
        shares: 12,
    },
    {
        id: '3',
        videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        username: 'usuario3',
        description: 'Seguindo a tendência! 🔥',
        likes: 2341,
        comments: [],
        saves: 89,
        shares: 45,
    },
    {
        id: '4',
        videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        username: 'usuario4',
        description: 'Novo vídeo disponível! ✨',
        likes: 567,
        comments: [
            { id: '4', username: 'fan1', text: 'Amei!', likes: 2, timeAgo: '3h' },
            { id: '5', username: 'fan2', text: 'Incrível!', likes: 0, timeAgo: '5h' },
        ],
        saves: 34,
        shares: 8,
    },
    {
        id: '5',
        videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        username: 'usuario5',
        description: 'Divertido e criativo! 😄',
        likes: 1234,
        comments: [
            { id: '6', username: 'user456', text: 'Hahaha', likes: 3, timeAgo: '1h' },
        ],
        saves: 56,
        shares: 23,
    },
];

export const Home = () => {
    const { navigate, currentScreen } = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'forYou' | 'lives'>('forYou');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (currentScreen === 'Home') {
            setActiveTab('forYou');
        }
    }, [currentScreen]);

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

    const renderItem = ({ item, index }: { item: typeof mockVideos[0]; index: number }) => {
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
            />
        );
    };

    return (
        <View style={styles.container}>
            <TopBar activeTab={activeTab} onTabChange={handleTabChange} />
            <FlatList
                ref={flatListRef}
                data={mockVideos}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
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
