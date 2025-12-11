import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TopBar } from '../../components/TopBar/TopBar';
import { BattleItem } from '../../components/BattleItem/BattleItem';
import { useNavigation } from '../../routes/NavigationContext';
import { styles } from './Live.styles';

const { height } = Dimensions.get('window');

interface ChatMessage {
    id: string;
    user: string;
    message: string;
    timestamp: string;
}

interface Battle {
    id: string;
    videoA: string;
    videoB: string;
    streamerA: { name: string; handle: string; color: string };
    streamerB: { name: string; handle: string; color: string };
    scoreA: number;
    scoreB: number;
    timer: number;
    chatMessages: ChatMessage[];
}

const mockBattles: Battle[] = [
    {
        id: '1',
        videoA: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoB: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        streamerA: { name: 'Maiara', handle: '@mai_live', color: '#ff2d6f' },
        streamerB: { name: 'Mateus', handle: '@mateus', color: '#37a0ff' },
        scoreA: 1240,
        scoreB: 980,
        timer: 180,
        chatMessages: [
            { id: '1', user: 'Lia', message: 'Vamos time A! 🔥', timestamp: 'agora' },
            { id: '2', user: 'Caio', message: 'Mateus reagindo muito! 😎', timestamp: 'agora' },
            { id: '3', user: 'Pri', message: 'Manda presente pra virar!', timestamp: 'agora' },
        ],
    },
    {
        id: '2',
        videoA: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        videoB: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        streamerA: { name: 'Ana', handle: '@ana_live', color: '#ff6b6b' },
        streamerB: { name: 'Carlos', handle: '@carlos', color: '#4ecdc4' },
        scoreA: 2100,
        scoreB: 1950,
        timer: 120,
        chatMessages: [
            { id: '1', user: 'João', message: 'Batalha épica! 🔥', timestamp: 'agora' },
            { id: '2', user: 'Maria', message: 'Ana está arrasando!', timestamp: 'agora' },
        ],
    },
    {
        id: '3',
        videoA: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        videoB: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        streamerA: { name: 'Julia', handle: '@julia', color: '#ffd93d' },
        streamerB: { name: 'Pedro', handle: '@pedro', color: '#6bcf7f' },
        scoreA: 890,
        scoreB: 1120,
        timer: 240,
        chatMessages: [
            { id: '1', user: 'Lucas', message: 'Pedro na frente! 💪', timestamp: 'agora' },
            { id: '2', user: 'Sofia', message: 'Julia pode virar ainda!', timestamp: 'agora' },
            { id: '3', user: 'Rafael', message: 'Batalha acirrada!', timestamp: 'agora' },
        ],
    },
];

export const Live = () => {
    const { currentScreen } = useNavigation();
    const [activeTab, setActiveTab] = useState<'forYou' | 'lives' | 'battle'>('battle');
    const [battles, setBattles] = useState<Battle[]>(mockBattles);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (currentScreen === 'Live') {
            setActiveTab('battle');
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

    const handleSendMessage = (battleId: string, message: string) => {
        setBattles((prev) =>
            prev.map((battle) => {
                if (battle.id === battleId) {
                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        user: 'Você',
                        message,
                        timestamp: 'agora',
                    };
                    return {
                        ...battle,
                        chatMessages: [...battle.chatMessages, newMessage],
                    };
                }
                return battle;
            })
        );
    };

    const renderItem = ({ item, index }: { item: Battle; index: number }) => {
        return (
            <BattleItem
                videoA={item.videoA}
                videoB={item.videoB}
                streamerA={item.streamerA}
                streamerB={item.streamerB}
                scoreA={item.scoreA}
                scoreB={item.scoreB}
                timer={item.timer}
                isActive={index === currentIndex}
                chatMessages={item.chatMessages}
                onSendMessage={(message) => handleSendMessage(item.id, message)}
            />
        );
    };

    return (
        <LinearGradient
            colors={['#0a0a1a', '#1a1a2e', '#16213e', '#0f1419']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <TopBar activeTab={activeTab} onTabChange={setActiveTab} />
            <FlatList
                ref={flatListRef}
                data={battles}
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
        </LinearGradient>
    );
};

