import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  ImageSourcePropType,
  Dimensions,
  Modal,
} from 'react-native';

export type GiftEffectPayload = {
  id: string;
  name: string;
  imageUri?: ImageSourcePropType | string;
  senderName?: string;
  targetName?: string;
  isRealGift?: boolean;
};

type Props = {
  gift: GiftEffectPayload | null;
  onFinished?: () => void;
};

const { width, height } = Dimensions.get('window');
const SIZE = Math.min(width * 0.5, 200);

/** Presente no CENTRO da tela (Modal) — sem cortar nem empilhar no layout. */
export function GiftEffectOverlay({ gift, onFinished }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!gift) return;

    opacity.setValue(0);
    scale.setValue(0.35);

    const anim = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 110,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(gift.isRealGift ? 2000 : 1400),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]);

    anim.start(({ finished }) => {
      if (finished) onFinished?.();
    });

    return () => anim.stop();
  }, [gift?.id]);

  const source =
    gift && (typeof gift.imageUri === 'string' ? { uri: gift.imageUri } : gift.imageUri);

  return (
    <Modal visible={!!gift} transparent animationType="none" statusBarTranslucent>
      <View style={styles.root} pointerEvents="none">
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          {source ? (
            <Image source={source} style={styles.image} resizeMode="contain" />
          ) : (
            <Text style={styles.fallbackEmoji}>{gift?.isRealGift ? '🎁' : '✨'}</Text>
          )}
          <Text style={styles.sender} numberOfLines={1}>
            {gift?.senderName || 'Alguém'}
          </Text>
          <Text style={styles.action} numberOfLines={2}>
            enviou <Text style={styles.giftName}>{gift?.name}</Text>
            {gift?.targetName ? ` para ${gift.targetName}` : ''}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width,
    height,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(width * 0.78, 300),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,12,20,0.82)',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  image: {
    width: SIZE,
    height: SIZE,
    marginBottom: 12,
  },
  fallbackEmoji: {
    fontSize: 72,
    marginBottom: 12,
  },
  sender: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
  action: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  giftName: {
    color: '#C0F93C',
    fontWeight: '800',
  },
});
