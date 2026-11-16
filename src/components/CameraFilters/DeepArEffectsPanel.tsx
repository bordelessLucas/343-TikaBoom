import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { DEEPAR_FREE_EFFECTS, DeepArEffectId } from '../../services/deepArEffects';

type Props = {
  selectedId: string;
  onSelect: (id: DeepArEffectId) => void;
  onClose?: () => void;
};

export function DeepArEffectsPanel({ selectedId, onSelect, onClose }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Efeitos DeepAR (grátis)</Text>
        {onClose && (
          <TouchableOpacity
            onPress={(e) => {
              e?.stopPropagation?.();
              onClose();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {DEEPAR_FREE_EFFECTS.map((e) => {
          const active = e.id === selectedId;
          return (
            <TouchableOpacity key={e.id} style={styles.item} onPress={() => onSelect(e.id)}>
              <View style={[styles.circle, { backgroundColor: e.swatch }, active && styles.circleActive]}>
                <Text style={styles.emoji}>{e.emoji}</Text>
              </View>
              <Text style={[styles.name, active && styles.nameActive]}>{e.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    paddingTop: 10,
    paddingBottom: 8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { color: '#C0F93C', fontWeight: '800', fontSize: 13 },
  close: { color: '#FFF', fontSize: 18 },
  row: { paddingHorizontal: 12, gap: 10 },
  item: { alignItems: 'center', width: 68 },
  circle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  circleActive: { borderColor: '#FFF', transform: [{ scale: 1.06 }] },
  emoji: { fontSize: 28 },
  name: { marginTop: 5, color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600' },
  nameActive: { color: '#C0F93C' },
});
