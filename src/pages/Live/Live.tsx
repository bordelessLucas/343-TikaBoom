import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { VideoItem } from '../../components/VideoItem/VideoItem';
import { TopBar } from '../../components/TopBar/TopBar';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Live.styles';

const { height } = Dimensions.get('window');

// Dados mockados de transmissões ao vivo
const mockLiveVideos = [
    {
        id: '1',
        videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        username: 'streamer1',
        description: 'Transmissão ao vivo! 🔴',
        likes: 5234,
        comments: [
            { id: '1', username: 'viewer1', text: 'Olá!', likes: 0, timeAgo: 'agora' },
            { id: '2', username: 'viewer2', text: 'Muito bom!', likes: 2, timeAgo: 'agora' },
        ],
        saves: 123,
        shares: 89,
        isLive: true,
    },
    {
        id: '2',
        videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        username: 'streamer2',
        description: 'Live agora! 🎮',
        likes: 3456,
        comments: [
            { id: '3', username: 'fan1', text: 'Amei!', likes: 5, timeAgo: 'agora' },
        ],
        saves: 67,
        shares: 45,
        isLive: true,
    },
    {
        id: '3',
        videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        username: 'streamer3',
        description: 'Ao vivo! 🎉',
        likes: 7890,
        comments: [],
        saves: 234,
        shares: 156,
        isLive: true,
    },
];

export const Live = () => {
    const { navigate, currentScreen } = useNavigation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'forYou' | 'live'>('live');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (currentScreen === 'Live') {
            setActiveTab('live');
        }
    }, [currentScreen]);

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

    const handleTabChange = (tab: 'forYou' | 'live') => {
        setActiveTab(tab);
    };

    const renderItem = ({ item, index }: { item: typeof mockLiveVideos[0]; index: number }) => {
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
                data={mockLiveVideos}
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

