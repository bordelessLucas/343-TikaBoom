import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, Dimensions, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, Modal, StyleSheet, ImageSourcePropType } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { styles } from './BattleItem.styles';

interface Gift {
    id: string;
    name: string;
    price: number;
    imageUri?: ImageSourcePropType; // Para imagens customizadas
}


const GIFTS: Gift[] = [
    { id: '1', name: 'Futuro', price: 1000, imageUri: require('../../../assets/futuro.png') as ImageSourcePropType },
    { id: '2', name: 'Dragão', price: 5000, imageUri: require('../../../assets/dragaoft.png') as ImageSourcePropType },
    { id: '3', name: 'Metamorfose', price: 3000, imageUri: require('../../../assets/metamorfose.png') as ImageSourcePropType },
    { id: '4', name: 'Metamorfose', price: 4000, imageUri: require('../../../assets/metamorfoseEvolucao.png') as ImageSourcePropType },
    { id: '5', name: 'Fada', price: 5000, imageUri: require('../../../assets/fadaMetamorfose.png') as ImageSourcePropType },
    { id: '6', name: 'Borboleta', price: 5000, imageUri: require('../../../assets/borboleta.png') as ImageSourcePropType },
    { id: '7', name: 'Borboleta', price: 6000, imageUri: require('../../../assets/BorboletaQ.png') as ImageSourcePropType },
    { id: '8', name: 'Odisseia', price: 10000, imageUri: require('../../../assets/Espaco.png') as ImageSourcePropType },
    { id: '9', name: 'Rugido de Aço', price: 20000, imageUri: require('../../../assets/aco.png') as ImageSourcePropType },
    { id: '11',name: 'Cão Ski', price: 3000, imageUri: require('../../../assets/CaoSKT.png') as ImageSourcePropType },
    { id: '12',name: 'O Estranho', price: 1000, imageUri: require('../../../assets/estranho.png') as ImageSourcePropType }, 
    { id: '13',name: 'Família Leão', price: 20000, imageUri: require('../../../assets/leao.png') as ImageSourcePropType }, 
    { id: '14',name: 'Guerreiro Fogo', price: 3000, imageUri: require('../../../assets/fogo.png') as ImageSourcePropType }, 
    { id: '15',name: 'Tigre Neon', price: 20000, imageUri: require('../../../assets/tigreN.png') as ImageSourcePropType }, 
    { id: '16',name: 'Sereias 1', price: 5000, imageUri: require('../../../assets/sereia.png') as ImageSourcePropType }, 
    { id: '17',name: 'Sereias 2', price: 5000, imageUri: require('../../../assets/sereia.png') as ImageSourcePropType },  
    { id: '18',name: 'Sereias 3', price: 5000, imageUri: require('../../../assets/sereia.png') as ImageSourcePropType }, 
    { id: '19',name: 'Balão Marionete', price: 1000, imageUri: require('../../../assets/balao.png') as ImageSourcePropType }, 
    { id: '20',name: 'Guerreiro do Mar', price: 2000, imageUri: require('../../../assets/agua.png') as ImageSourcePropType }, 
    { id: '21', name: 'Guerreiro', price: 15000, imageUri: require('../../../assets/martelo.png') as ImageSourcePropType },
    { id: '22', name: 'Tubarões', price: 15000, imageUri: require('../../../assets/tutu.png') as ImageSourcePropType },
    { id: '23', name: 'Dinossauros', price: 10000, imageUri: require('../../../assets/Dino.png') as ImageSourcePropType },
    { id: '24', name: 'Baleia Azul', price: 10000, imageUri: require('../../../assets/golfinho.png') as ImageSourcePropType },
    { id: '25', name: 'Águia Leão', price: 25000, imageUri: require('../../../assets/aguia.png') as ImageSourcePropType },
    { id: '26', name: 'Extraterrestre', price: 1000, imageUri: require('../../../assets/et.png') as ImageSourcePropType },
    { id: '27', name: 'Carros de Asas', price: 2000, imageUri: require('../../../assets/carroA.png') as ImageSourcePropType },
    { id: '28', name: 'Planeta Fantasia', price: 4000, imageUri: require('../../../assets/planeta.png') as ImageSourcePropType },
    { id: '29', name: 'Baleia Arco-íris', price: 3000, imageUri: require('../../../assets/baleia.png') as ImageSourcePropType },
    { id: '30', name: 'Chicabanga', price: 10000, imageUri: require('../../../assets/festa.png') as ImageSourcePropType },
    { id: '31', name: 'Tika Boom!', price: 5000, imageUri: require('../../../assets/tikaB.png') as ImageSourcePropType },
    { id: '32', name: 'Leão Alado', price: 50000, imageUri: require('../../../assets/leaoASA.png') as ImageSourcePropType },
    { id: '33', name: 'Vila', price: 3000, imageUri: require('../../../assets/vila.png') as ImageSourcePropType },
    { id: '34', name: 'Elefantes', price: 1000, imageUri: require('../../../assets/elefantes.png') as ImageSourcePropType },
    { id: '35', name: 'Evolução', price: 15000, imageUri: require('../../../assets/evo.png') as ImageSourcePropType },
    { id: '36', name: 'Sonho de Amor', price: 150, imageUri: require('../../../assets/amor.png') as ImageSourcePropType },
    { id: '37', name: 'Super TB', price: 10000, imageUri: require('../../../assets/super.png') as ImageSourcePropType },
    { id: '38', name: 'Coroa', price: 1000, imageUri: require('../../../assets/coroa.png') as ImageSourcePropType },
    { id: '39', name: 'Boneca Raquel', price: 3000, imageUri: require('../../../assets/raquel.png') as ImageSourcePropType },
    { id: '40', name: 'Confete', price: 1000, imageUri: require('../../../assets/confete.png') as ImageSourcePropType },
    { id: '41', name: 'Luzes', price: 1000, imageUri: require('../../../assets/luzes.png') as ImageSourcePropType },
    { id: '42', name: 'Beijo Quente', price: 200, imageUri: require('../../../assets/beijo.png') as ImageSourcePropType },
    { id: '43', name: 'Troféu', price: 150, imageUri: require('../../../assets/trof.png') as ImageSourcePropType },
    { id: '44', name: 'Emoji Pirado', price: 200, imageUri: require('../../../assets/emoji.png') as ImageSourcePropType },
    { id: '45', name: 'Uau', price: 100, imageUri: require('../../../assets/uau.png') as ImageSourcePropType },
    { id: '46', name: 'Neon', price: 100, imageUri: require('../../../assets/neon.png') as ImageSourcePropType },
    { id: '47', name: 'Presente', price: 100, imageUri: require('../../../assets/presente.png') as ImageSourcePropType },
    { id: '48', name: 'Trovão', price: 50, imageUri: require('../../../assets/trovao.png') as ImageSourcePropType },
    { id: '49', name: 'Foguete', price: 30, imageUri: require('../../../assets/foguete.png') as ImageSourcePropType },
    { id: '50', name: 'Estrela Cadente', price: 30, imageUri: require('../../../assets/estrela.png') as ImageSourcePropType },
    { id: '51', name: 'Chapéu Festa', price: 30, imageUri: require('../../../assets/chapeu.png') as ImageSourcePropType },
    { id: '52', name: 'Biscoito da Sorte', price: 50, imageUri: require('../../../assets/biscoito.png') as ImageSourcePropType },
    { id: '53', name: 'Olho Piscando', price: 30, imageUri: require('../../../assets/Olho.png') as ImageSourcePropType },
    { id: '54', name: 'Relógio Tika', price: 500, imageUri: require('../../../assets/relogio.png') as ImageSourcePropType },
    { id: '55', name: 'Coração de Cristal', price: 500, imageUri: require('../../../assets/coracao.png') as ImageSourcePropType },
    { id: '56', name: 'Martelo do Poder', price: 600, imageUri: require('../../../assets/martelo2.png') as ImageSourcePropType },
    { id: '57', name: 'Coroa Diamante', price: 1000, imageUri: require('../../../assets/CoroaDima.png') as ImageSourcePropType },
    { id: '58', name: 'Orbe Energia', price: 1000, imageUri: require('../../../assets/Orbe.png') as ImageSourcePropType },
    { id: '59', name: 'Asa Neon', price: 500, imageUri: require('../../../assets/asa.png') as ImageSourcePropType },
    { id: '60', name: 'Espada Lendária', price: 500, imageUri: require('../../../assets/Espada.png') as ImageSourcePropType },
    { id: '61', name: 'Olho Cósmico', price: 500, imageUri: require('../../../assets/olhodnv.png') as ImageSourcePropType },
    { id: '62', name: 'Dragão Mini', price: 1000, imageUri: require('../../../assets/dragaomini.png') as ImageSourcePropType },
    { id: '63', name: 'Dado TikaBoom', price: 100, imageUri: require('../../../assets/dado.png') as ImageSourcePropType },
    { id: '64', name: 'Chama Azul', price: 10, imageUri: require('../../../assets/chamaAZUL.png') as ImageSourcePropType },
    { id: '65', name: 'Máscara', price: 500, imageUri: require('../../../assets/mascara.png') as ImageSourcePropType },
    { id: '66', name: 'Livro', price: 200, imageUri: require('../../../assets/Livro.png') as ImageSourcePropType },
    { id: '67', name: 'Escudo Energia', price: 200, imageUri: require('../../../assets/Escudo.png') as ImageSourcePropType },
    { id: '68', name: 'Anel', price: 1000, imageUri: require('../../../assets/Anel.png') as ImageSourcePropType },
    { id: '69', name: 'Livro Misterioso', price: 3000, imageUri: require('../../../assets/LivroMis.png') as ImageSourcePropType },
    { id: '70', name: 'Relógio Tesouro', price: 8000, imageUri: require('../../../assets/relogio2.png') as ImageSourcePropType },
    { id: '71', name: 'Relógio Mágico', price: 5000, imageUri: require('../../../assets/relogio3.png') as ImageSourcePropType },
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
    const [displayScoreA, setDisplayScoreA] = useState(0);
    const [displayScoreB, setDisplayScoreB] = useState(0);
    const [displayProgressA, setDisplayProgressA] = useState(0);
    
    const chatOpacityAnim = useRef(new Animated.Value(0.6)).current;
    const chatHeightAnim = useRef(new Animated.Value(MIN_CHAT_HEIGHT)).current;
    
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

    // Quando o chat é aberto, sempre usa o mesmo tamanho
    useEffect(() => {
        if (isChatOpen) {
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
        } else {
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
        
        // Envia mensagem no chat sobre o presente
        const streamerName = side === 'A' ? streamerA.name : streamerB.name;
        onSendMessage(`Enviou ${gift.name} para ${streamerName}!`);
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
            <View style={styles.videoWrapper}>
                <View style={styles.videoContainer}>
                    <View style={[styles.frameBorder, { borderColor: '#000000' }]}>
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
            <View style={styles.videoWrapper}>
                <View style={styles.videoContainer}>
                    <View style={[styles.frameBorder, { borderColor: '#000000' }]}>
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
                            isChatOpen
                                ? ['rgba(0, 0, 0, 0.95)', 'rgba(10, 10, 26, 0.9)', 'rgba(26, 26, 46, 0.85)']
                                : ['rgba(0, 0, 0, 0.4)', 'rgba(10, 10, 26, 0.3)', 'rgba(26, 26, 46, 0.2)']
                        }
                        style={styles.chatGradientBackground}
                    >
                        {isChatOpen ? (
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
                                                <Ionicons name="gift" size={20} color="#FFFFFF" />
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

            {/* Modal de Presentes */}
            <Modal
                visible={showGiftsModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowGiftsModal(false)}
                statusBarTranslucent={true}
            >
                <View style={styles.giftsModalOverlay}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => {
                            if (!selectedGift) {
                                setShowGiftsModal(false);
                                setSelectedGift(null);
                                setSelectedSide(null);
                            }
                        }}
                    />
                    <TouchableOpacity 
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={styles.giftsModalContent}
                    >
                        <View style={styles.giftsModalInner}>
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
                                        {gift.imageUri && (
                                            <Image 
                                                source={gift.imageUri} 
                                                style={styles.giftItemImage}
                                                resizeMode="cover"
                                            />
                                        )}
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
                                        Enviar {selectedGift.name} para:
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
                                                {selectedGift.imageUri && (
                                                    <Image 
                                                        source={selectedGift.imageUri} 
                                                        style={styles.sideSelectionImage}
                                                        resizeMode="cover"
                                                    />
                                                )}
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
                                                {selectedGift.imageUri && (
                                                    <Image 
                                                        source={selectedGift.imageUri} 
                                                        style={styles.sideSelectionImage}
                                                        resizeMode="cover"
                                                    />
                                                )}
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
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};


