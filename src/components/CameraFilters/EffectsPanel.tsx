import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FACE_EFFECTS, FaceEffectId } from '../../lib/cameraFilters';

type Props = {
  selectedId: FaceEffectId;
  onSelect: (id: FaceEffectId) => void;
  onClose?: () => void;
};

export function EffectsPanel({ selectedId, onSelect, onClose }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Efeitos</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        snapToInterval={76}
        decelerationRate="fast"
      >
        {FACE_EFFECTS.map((e) => {
          const active = e.id === selectedId;
          return (
            <TouchableOpacity key={e.id} style={styles.item} onPress={() => onSelect(e.id)} activeOpacity={0.85}>
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
      <View style={styles.favRow}>
        <Text style={styles.favText}>★ Efeitos favoritos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(0,0,0,0.78)',
    paddingTop: 10,
    paddingBottom: 8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  close: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  row: { paddingHorizontal: 12, gap: 10, alignItems: 'center' },
  item: { alignItems: 'center', width: 66 },
  circle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  circleActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
  },
  emoji: { fontSize: 28 },
  name: {
    marginTop: 5,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
  },
  nameActive: { color: '#C0F93C' },
  favRow: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  favText: { color: '#FFE066', fontWeight: '700', fontSize: 13 },
});
