import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { FACE_EFFECTS, FaceEffectId } from '../../lib/cameraFilters';

type Props = {
  selectedId: FaceEffectId;
  onSelect: (id: FaceEffectId) => void;
  onClose: () => void;
};

const { width: W } = Dimensions.get('window');

/** Seletor de efeitos no MEIO da tela — estilo TikTok, com preview grande. */
export function CenterEffectsPicker({ selectedId, onSelect, onClose }: Props) {
  const selected = FACE_EFFECTS.find((e) => e.id === selectedId) || FACE_EFFECTS[0];
  const bounce = useRef(new Animated.Value(1)).current;

  const pick = (id: FaceEffectId) => {
    onSelect(id);
    bounce.setValue(0.82);
    Animated.spring(bounce, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.preview,
            { backgroundColor: selected.swatch + '55', transform: [{ scale: bounce }] },
          ]}
        >
          <Text style={styles.previewEmoji}>{selected.emoji}</Text>
          <Text style={styles.previewName}>{selected.name}</Text>
          <Text style={styles.previewHint}>Toque nos ícones abaixo · efeito no centro</Text>
        </Animated.View>

        <View style={styles.sheet}>
          <View style={styles.topRow}>
            <Text style={styles.title}>Efeitos</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
            snapToInterval={84}
            decelerationRate="fast"
          >
            {FACE_EFFECTS.map((e) => {
              const active = e.id === selectedId;
              return (
                <TouchableOpacity
                  key={e.id}
                  style={styles.item}
                  onPress={() => pick(e.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.circle, { backgroundColor: e.swatch }, active && styles.circleActive]}>
                    <Text style={styles.emoji}>{e.emoji}</Text>
                  </View>
                  <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
                    {e.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  stage: {
    paddingBottom: 12,
    alignItems: 'center',
  },
  preview: {
    width: Math.min(W * 0.7, 280),
    height: Math.min(W * 0.7, 280),
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 18,
  },
  previewEmoji: { fontSize: 88 },
  previewName: {
    marginTop: 8,
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  previewHint: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  sheet: {
    width: '100%',
    backgroundColor: 'rgba(10,10,20,0.92)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  close: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  row: { paddingHorizontal: 12, gap: 10, alignItems: 'center' },
  item: { alignItems: 'center', width: 74 },
  circle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  circleActive: {
    borderColor: '#C0F93C',
    transform: [{ scale: 1.08 }],
  },
  emoji: { fontSize: 30 },
  name: {
    marginTop: 5,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
  },
  nameActive: { color: '#C0F93C' },
});
