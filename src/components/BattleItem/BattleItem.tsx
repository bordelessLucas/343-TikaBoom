import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, Dimensions, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, PanResponder, Modal, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { styles } from './BattleItem.styles';

interface Gift {
    id: string;
    emoji: string;
    name: string;
    price: number;
}

interface ActiveGift {
    id: string;
    emoji: string;
    x: Animated.Value;
    y: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
    rotation: Animated.Value;
}

const GIFTS: Gift[] = [
    { id: '1', emoji: '❤️', name: 'Coração', price: 1 },
    { id: '2', emoji: '🔥', name: 'Fogo', price: 5 },
    { id: '3', emoji: '⭐', name: 'Estrela', price: 10 },
    { id: '4', emoji: '⚡', name: 'Raio', price: 15 },
    { id: '5', emoji: '🌹', name: 'Rosa', price: 20 },
    { id: '6', emoji: '💎', name: 'Diamante', price: 50 },
    { id: '7', emoji: '👑', name: 'Coroa', price: 100 },
    { id: '8', emoji: '🎁', name: 'Presente', price: 200 },
    { id: '9', emoji: '🚀', name: 'Foguete', price: 500 },
    { id: '10', emoji: '💸', name: 'Dinheiro', price: 1000 },
];

const { width, height } = Dimensions.get('window');
const VIDEO_WIDTH = width / 2;
const TOP_BAR_HEIGHT = 60;
const AVAILABLE_HEIGHT = height - TOP_BAR_HEIGHT;
const VIDEO_HEIGHT = AVAILABLE_HEIGHT * 1.2;
const MIN_CHAT_HEIGHT = AVAILABLE_HEIGHT * 0.15;
const MAX_CHAT_HEIGHT = AVAILABLE_HEIGHT * 0.7;
const DEFAULT_OPEN_HEIGHT = AVAILABLE_HEIGHT * 0.3;

interface ChatMessage {
    id: string;
    user: string;
    message: string;
    timestamp: string;
}

interface BattleItemProps {
    videoA: string;
    videoB: string;
    streamerA: { name: string; handle: string; color: string };
    streamerB: { name: string; handle: string; color: string };
    scoreA: number;
    scoreB: number;
    timer: number;
    isActive: boolean;
    chatMessages: ChatMessage[];
    onSendMessage: (message: string) => void;
}

export const BattleItem = ({
    videoA,
    videoB,
    streamerA,
    streamerB,
    scoreA,
    scoreB,
    timer,
    isActive,
    chatMessages,
    onSendMessage,
}: BattleItemProps) => {
    const videoARef = useRef<Video>(null);
    const videoBRef = useRef<Video>(null);
    const chatScrollRef = useRef<ScrollView>(null);
    const [chatInput, setChatInput] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showGiftsModal, setShowGiftsModal] = useState(false);
    const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
    const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);
    const [activeGifts, setActiveGifts] = useState<ActiveGift[]>([]);
    const giftIdCounter = useRef(0);
    const [videoACenter, setVideoACenter] = useState<number>(width * 0.25);
    const [videoBCenter, setVideoBCenter] = useState<number>(width * 0.75);
    const [displayScoreA, setDisplayScoreA] = useState(0);
    const [displayScoreB, setDisplayScoreB] = useState(0);
    const [displayProgressA, setDisplayProgressA] = useState(0);
    
    const chatOpacityAnim = useRef(new Animated.Value(0.6)).current;
    const chatHeightAnim = useRef(new Animated.Value(MIN_CHAT_HEIGHT)).current;
    const dragY = useRef(0);
    const currentHeight = useRef(MIN_CHAT_HEIGHT);
    const [chatHeight, setChatHeight] = useState(MIN_CHAT_HEIGHT);
    
    // Animações para os scores
    const animatedScoreA = useRef(new Animated.Value(0)).current;
    const animatedScoreB = useRef(new Animated.Value(0)).current;
    const animatedProgressA = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isActive) {
            videoARef.current?.playAsync();
            videoBRef.current?.playAsync();
            
            // Anima os scores de 0 até os valores reais
            setDisplayScoreA(0);
            setDisplayScoreB(0);
            setDisplayProgressA(0);
            
            animatedScoreA.setValue(0);
            animatedScoreB.setValue(0);
            animatedProgressA.setValue(0);
            
            const total = scoreA + scoreB || 1;
            const targetProgress = (scoreA / total) * 100;
            
            // Listeners para atualizar os valores exibidos
            const listenerA = animatedScoreA.addListener(({ value }) => {
                setDisplayScoreA(Math.floor(value));
            });
            const listenerB = animatedScoreB.addListener(({ value }) => {
                setDisplayScoreB(Math.floor(value));
            });
            const listenerProgress = animatedProgressA.addListener(({ value }) => {
                setDisplayProgressA(value);
            });
            
            Animated.parallel([
                Animated.timing(animatedScoreA, {
                    toValue: scoreA,
                    duration: 1200,
                    useNativeDriver: false,
                }),
                Animated.timing(animatedScoreB, {
                    toValue: scoreB,
                    duration: 1200,
                    useNativeDriver: false,
                }),
                Animated.timing(animatedProgressA, {
                    toValue: targetProgress,
                    duration: 1200,
                    useNativeDriver: false,
                }),
            ]).start(() => {
                // Remove listeners após animação
                animatedScoreA.removeListener(listenerA);
                animatedScoreB.removeListener(listenerB);
                animatedProgressA.removeListener(listenerProgress);
            });
        } else {
            videoARef.current?.pauseAsync();
            videoBRef.current?.pauseAsync();
        }
    }, [isActive, scoreA, scoreB]);

    const progressA = useMemo(() => {
        const total = scoreA + scoreB || 1;
        return (scoreA / total) * 100;
    }, [scoreA, scoreB]);

    const formatTimer = (value: number) => {
        const minutes = Math.floor(value / 60).toString().padStart(2, '0');
        const seconds = (value % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderGrant: () => {
                chatHeightAnim.setOffset(currentHeight.current);
                chatHeightAnim.setValue(0);
            },
            onPanResponderMove: (_, gestureState) => {
                const newHeight = currentHeight.current - gestureState.dy;
                const clampedHeight = Math.max(MIN_CHAT_HEIGHT, Math.min(MAX_CHAT_HEIGHT, newHeight));
                chatHeightAnim.setValue(clampedHeight - currentHeight.current);
                setChatHeight(clampedHeight);
                const opacity = 0.6 + ((clampedHeight - MIN_CHAT_HEIGHT) / (MAX_CHAT_HEIGHT - MIN_CHAT_HEIGHT)) * 0.4;
                chatOpacityAnim.setValue(Math.min(1, opacity));
            },
            onPanResponderRelease: (_, gestureState) => {
                chatHeightAnim.flattenOffset();
                const newHeight = currentHeight.current - gestureState.dy;
                const clampedHeight = Math.max(MIN_CHAT_HEIGHT, Math.min(MAX_CHAT_HEIGHT, newHeight));
                currentHeight.current = clampedHeight;
                setChatHeight(clampedHeight);
                const shouldBeOpen = clampedHeight > MIN_CHAT_HEIGHT + 20;
                setIsChatOpen(shouldBeOpen);
                Animated.spring(chatHeightAnim, {
                    toValue: clampedHeight,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 8,
                }).start();
                const finalOpacity = shouldBeOpen ? 1 : 0.6;
                Animated.spring(chatOpacityAnim, {
                    toValue: finalOpacity,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 8,
                }).start();
            },
        })
    ).current;

    useEffect(() => {
        if (isChatOpen && currentHeight.current <= MIN_CHAT_HEIGHT + 20) {
            currentHeight.current = DEFAULT_OPEN_HEIGHT;
            setChatHeight(DEFAULT_OPEN_HEIGHT);
            Animated.parallel([
                Animated.spring(chatOpacityAnim, {
                    toValue: 1,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 8,
                }),
                Animated.spring(chatHeightAnim, {
                    toValue: DEFAULT_OPEN_HEIGHT,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 8,
                }),
            ]).start();
        } else if (!isChatOpen && currentHeight.current > MIN_CHAT_HEIGHT + 20) {
            currentHeight.current = MIN_CHAT_HEIGHT;
            setChatHeight(MIN_CHAT_HEIGHT);
            Animated.parallel([
                Animated.spring(chatOpacityAnim, {
                    toValue: 0.6,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 8,
                }),
                Animated.spring(chatHeightAnim, {
                    toValue: MIN_CHAT_HEIGHT,
                    useNativeDriver: false,
                    tension: 50,
                    friction: 8,
                }),
            ]).start();
        }
    }, [isChatOpen]);

    const handleSendMessage = () => {
        if (chatInput.trim()) {
            onSendMessage(chatInput.trim());
            setChatInput('');
            setTimeout(() => {
                chatScrollRef.current?.scrollToEnd({ animated: true });
            }, 150);
        }
    };

    const handleSelectGift = (gift: Gift) => {
        setSelectedGift(gift);
        setSelectedSide(null);
    };

    const handleSelectSide = (side: 'A' | 'B') => {
        if (selectedGift) {
            setSelectedSide(side);
            handleSendGift(selectedGift, side);
        }
    };

    const handleSendGift = (gift: Gift, side: 'A' | 'B') => {
        setShowGiftsModal(false);
        setSelectedGift(null);
        setSelectedSide(null);
        
        // Usa frações fixas para garantir que o spawn respeite o lado escolhido
        const spawnX = side === 'A' ? width * 0.22 : width * 0.78;
        const spawnY = height * 0.40;
        
        // Cria múltiplas instâncias do presente para efeito de explosão
        const giftCount = 8;
        const newGifts: ActiveGift[] = [];
        
        for (let i = 0; i < giftCount; i++) {
            const angle = (i / giftCount) * Math.PI * 2;
            const distance = 150 + Math.random() * 100;
            
            // Inicializa os valores animados com a posição de spawn
            const x = new Animated.Value(spawnX);
            const y = new Animated.Value(spawnY);
            const scale = new Animated.Value(0);
            const opacity = new Animated.Value(1);
            const rotation = new Animated.Value(0);
            
            const giftId = `gift-${Date.now()}-${giftIdCounter.current++}`;
            
            // Calcula a posição final baseada no ângulo e distância
            const finalX = spawnX + Math.cos(angle) * distance;
            const finalY = spawnY + Math.sin(angle) * distance - 100;
            
            // Anima o presente explodindo a partir do lado escolhido
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1.5,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 5,
                }),
                Animated.timing(x, {
                    toValue: finalX,
                    duration: 1500,
                    useNativeDriver: false,
                }),
                Animated.timing(y, {
                    toValue: finalY,
                    duration: 1500,
                    useNativeDriver: false,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(rotation, {
                    toValue: Math.random() * 720 - 360,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setActiveGifts((prev) => prev.filter((g) => g.id !== giftId));
            });
            
            newGifts.push({
                id: giftId,
                emoji: gift.emoji,
                x,
                y,
                scale,
                opacity,
                rotation,
            });
        }
        
        setActiveGifts((prev) => [...prev, ...newGifts]);
        
        // Envia mensagem no chat sobre o presente
        const streamerName = side === 'A' ? streamerA.name : streamerB.name;
        onSendMessage(`🎁 Enviou ${gift.emoji} ${gift.name} para ${streamerName}!`);
    };

    useEffect(() => {
        if (isChatOpen && chatMessages.length > 0) {
            setTimeout(() => {
                chatScrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [chatMessages.length, isChatOpen]);

    return (
        <View style={styles.container}>
            {isChatOpen && (
                <TouchableOpacity
                    style={styles.chatOverlay}
                    activeOpacity={1}
                    onPress={() => setIsChatOpen(false)}
                />
            )}

            {/* Left Video */}
            <View
                style={styles.videoWrapper}
                onLayout={(e) => {
                    const { x, width: w } = e.nativeEvent.layout;
                    setVideoACenter(x + w / 2);
                }}
            >
                <View style={styles.videoContainer}>
                    <View style={[styles.frameBorder, { borderColor: streamerA.color }]}>
                        <View style={styles.frameInner}>
                            <Video
                                ref={videoARef}
                                source={{ uri: videoA }}
                                style={styles.video}
                                resizeMode={ResizeMode.COVER}
                                isLooping
                                shouldPlay={isActive}
                                isMuted={false}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.videoOverlay}
                            />
                        </View>
                    </View>
                    <View style={styles.labelContainer}>
                        <View style={[styles.labelBadge, { borderColor: streamerA.color }]}>
                            <Text style={styles.labelText}>LIVE A</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Right Video */}
            <View
                style={styles.videoWrapper}
                onLayout={(e) => {
                    const { x, width: w } = e.nativeEvent.layout;
                    setVideoBCenter(x + w / 2);
                }}
            >
                <View style={styles.videoContainer}>
                    <View style={[styles.frameBorder, { borderColor: streamerB.color }]}>
                        <View style={styles.frameInner}>
                            <Video
                                ref={videoBRef}
                                source={{ uri: videoB }}
                                style={styles.video}
                                resizeMode={ResizeMode.COVER}
                                isLooping
                                shouldPlay={isActive}
                                isMuted={false}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.videoOverlay}
                            />
                        </View>
                    </View>
                    <View style={styles.labelContainer}>
                        <View style={[styles.labelBadge, { borderColor: streamerB.color }]}>
                            <Text style={styles.labelText}>LIVE B</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* VS Badge */}
            <View style={styles.vsContainer}>
                <Image
                    source={require('../../../assets/Adobe Express - file.png')}
                    style={styles.vsImage}
                    resizeMode="contain"
                />
            </View>

            {/* Score Bar */}
            <View style={styles.scoreContainer}>
                <View style={styles.scoreRow}>
                    <Text style={[styles.scoreText, { color: streamerA.color }]}>
                        {streamerA.name}: {displayScoreA.toLocaleString('pt-BR')}
                    </Text>
                    <Text style={styles.timerText}>{formatTimer(timer)}</Text>
                    <Text style={[styles.scoreText, { color: streamerB.color }]}>
                        {streamerB.name}: {displayScoreB.toLocaleString('pt-BR')}
                    </Text>
                </View>
                <View style={styles.progressBar}>
                    <Animated.View 
                        style={[
                            styles.progressFill, 
                            { 
                                width: animatedProgressA.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%'],
                                }),
                                backgroundColor: streamerA.color 
                            }
                        ]} 
                    />
                    <Animated.View 
                        style={[
                            styles.progressFill, 
                            { 
                                width: animatedProgressA.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['100%', '0%'],
                                }),
                                backgroundColor: streamerB.color 
                            }
                        ]} 
                    />
                </View>
            </View>

            {/* Divisor lines */}
            <View style={styles.dividerLineLeft} />
            <View style={styles.dividerLineRight} />

            {/* Chat Section */}
            <View style={styles.chatContainerWrapper}>
                <Animated.View
                    style={[
                        styles.chatSection,
                        {
                            opacity: chatOpacityAnim,
                            height: chatHeightAnim,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={
                            chatHeight > MIN_CHAT_HEIGHT + 20
                                ? ['rgba(0, 0, 0, 0.95)', 'rgba(10, 10, 26, 0.9)', 'rgba(26, 26, 46, 0.85)']
                                : ['rgba(0, 0, 0, 0.4)', 'rgba(10, 10, 26, 0.3)', 'rgba(26, 26, 46, 0.2)']
                        }
                        style={styles.chatGradientBackground}
                    >
                        <View style={styles.chatDragHandle} {...panResponder.panHandlers}>
                            <View style={styles.chatDragIndicator} />
                        </View>

                        {chatHeight > MIN_CHAT_HEIGHT + 20 ? (
                            <View style={styles.chatContentWrapper}>
                                <View style={styles.chatHeader}>
                                    <View style={styles.chatHeaderLeft}>
                                        <Ionicons name="chatbubbles" size={20} color={streamerA.color} />
                                        <Text style={styles.chatHeaderText}>Chat ao vivo</Text>
                                    </View>
                                    <View style={styles.chatHeaderRight}>
                                        <View style={[styles.chatCountBadge, { borderColor: streamerA.color }]}>
                                            <Text style={styles.chatCount}>{chatMessages.length}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.chatCloseButton}
                                            onPress={() => setIsChatOpen(false)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="chevron-down" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <ScrollView
                                    ref={chatScrollRef}
                                    style={styles.chatMessages}
                                    contentContainerStyle={styles.chatContent}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {chatMessages.map((msg, index) => (
                                        <View
                                            key={msg.id}
                                            style={[
                                                styles.chatMessage,
                                                index === chatMessages.length - 1 && styles.chatMessageLast,
                                            ]}
                                        >
                                            <Text style={[styles.chatUser, { color: streamerA.color }]}>
                                                {msg.user}:
                                            </Text>
                                            <Text style={styles.chatText}>{msg.message}</Text>
                                        </View>
                                    ))}
                                </ScrollView>

                                <KeyboardAvoidingView
                                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                                >
                                    <View style={styles.chatInputContainer}>
                                        <TouchableOpacity
                                            style={styles.giftButton}
                                            onPress={() => setShowGiftsModal(true)}
                                            activeOpacity={0.7}
                                        >
                                            <LinearGradient
                                                colors={[streamerA.color, streamerB.color]}
                                                style={styles.giftButtonGradient}
                                            >
                                                <Text style={styles.giftButtonEmoji}>🎁</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        <TextInput
                                            style={[styles.chatInput, { borderColor: streamerA.color + '50' }]}
                                            placeholder="Digite sua mensagem..."
                                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                            value={chatInput}
                                            onChangeText={setChatInput}
                                            multiline={false}
                                            returnKeyType="send"
                                            onSubmitEditing={handleSendMessage}
                                        />
                                        <TouchableOpacity
                                            style={styles.sendButton}
                                            onPress={handleSendMessage}
                                            activeOpacity={0.7}
                                        >
                                            <LinearGradient
                                                colors={[streamerA.color, streamerB.color]}
                                                style={styles.sendButtonGradient}
                                            >
                                                <Ionicons name="send" size={18} color="#fff" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </KeyboardAvoidingView>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.chatCollapsed}
                                activeOpacity={0.8}
                                onPress={() => setIsChatOpen(true)}
                            >
                                <Ionicons name="chatbubbles" size={24} color="rgba(255, 255, 255, 0.7)" />
                                <Text style={styles.chatCollapsedText}>
                                    {chatMessages.length} mensagens
                                </Text>
                            </TouchableOpacity>
                        )}
                    </LinearGradient>
                </Animated.View>
            </View>

            {/* Presentes animados na tela */}
            {activeGifts.map((gift) => (
                <Animated.View
                    key={gift.id}
                    style={[
                        styles.giftAnimation,
                        {
                            left: Animated.subtract(gift.x, 30),
                            top: Animated.subtract(gift.y, 30),
                            transform: [
                                { scale: gift.scale },
                                {
                                    rotate: gift.rotation.interpolate({
                                        inputRange: [-360, 360],
                                        outputRange: ['-360deg', '360deg'],
                                    }),
                                },
                            ],
                            opacity: gift.opacity,
                        },
                    ]}
                    pointerEvents="none"
                >
                    <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                </Animated.View>
            ))}

            {/* Modal de Presentes */}
            <Modal
                visible={showGiftsModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowGiftsModal(false)}
                statusBarTranslucent={true}
            >
                <View style={styles.giftsModalOverlay}>
                    {!selectedGift && (
                        <TouchableOpacity
                            style={StyleSheet.absoluteFill}
                            activeOpacity={1}
                            onPress={() => {
                                setShowGiftsModal(false);
                                setSelectedGift(null);
                                setSelectedSide(null);
                            }}
                        />
                    )}
                    <View style={styles.giftsModalContent} pointerEvents="box-none">
                        <View
                            style={{ flex: 1 }}
                            pointerEvents="box-none"
                        >
                            <View style={styles.giftsModalHeader}>
                                <Text style={styles.giftsModalTitle}>
                                    {selectedGift ? 'Escolha para quem enviar' : 'Enviar Presente'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowGiftsModal(false);
                                        setSelectedGift(null);
                                        setSelectedSide(null);
                                    }}
                                    style={styles.giftsModalClose}
                                >
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            
                            {!selectedGift ? (
                        <ScrollView
                            style={styles.giftsList}
                            contentContainerStyle={styles.giftsListContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {GIFTS.map((gift) => (
                                <TouchableOpacity
                                    key={gift.id}
                                    style={styles.giftItem}
                                    onPress={() => handleSelectGift(gift)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.giftItemEmojiContainer}>
                                        <Text style={styles.giftItemEmoji}>{gift.emoji}</Text>
                                    </View>
                                    <View style={styles.giftItemInfo}>
                                        <Text style={styles.giftItemName}>{gift.name}</Text>
                                        <Text style={styles.giftItemPrice}>{gift.price} moedas</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                            ) : (
                                <View style={styles.sideSelectionContainer}>
                                    <Text style={styles.sideSelectionTitle}>
                                        Enviar {selectedGift.emoji} {selectedGift.name} para:
                                    </Text>
                                    <View style={styles.sideSelectionButtons}>
                                        <TouchableOpacity
                                            style={[styles.sideSelectionButton, { borderColor: streamerA.color }]}
                                            onPress={() => handleSelectSide('A')}
                                            activeOpacity={0.7}
                                        >
                                            <LinearGradient
                                                colors={[streamerA.color + '40', streamerA.color + '20']}
                                                style={styles.sideSelectionGradient}
                                            >
                                                <Text style={styles.sideSelectionEmoji}>{selectedGift.emoji}</Text>
                                                <Text style={[styles.sideSelectionName, { color: streamerA.color }]}>
                                                    {streamerA.name}
                                                </Text>
                                                <Text style={styles.sideSelectionHandle}>{streamerA.handle}</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity
                                            style={[styles.sideSelectionButton, { borderColor: streamerB.color }]}
                                            onPress={() => handleSelectSide('B')}
                                            activeOpacity={0.7}
                                        >
                                            <LinearGradient
                                                colors={[streamerB.color + '40', streamerB.color + '20']}
                                                style={styles.sideSelectionGradient}
                                            >
                                                <Text style={styles.sideSelectionEmoji}>{selectedGift.emoji}</Text>
                                                <Text style={[styles.sideSelectionName, { color: streamerB.color }]}>
                                                    {streamerB.name}
                                                </Text>
                                                <Text style={styles.sideSelectionHandle}>{streamerB.handle}</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.backButton}
                                        onPress={() => {
                                            setSelectedGift(null);
                                            setSelectedSide(null);
                                        }}
                                    >
                                        <Text style={styles.backButtonText}>← Voltar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};


