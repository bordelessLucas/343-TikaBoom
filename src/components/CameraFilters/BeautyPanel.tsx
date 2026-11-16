import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BeautyConfig } from '../../lib/cameraFilters';

type Props = {
  beauty: BeautyConfig;
  onChange: (next: BeautyConfig) => void;
  onClose?: () => void;
};

const TOGGLES: { key: keyof Omit<BeautyConfig, 'intensity'>; label: string }[] = [
  { key: 'smooth', label: 'Suave' },
  { key: 'brighten', label: 'Clarear' },
  { key: 'blush', label: 'Blush' },
  { key: 'softFace', label: 'Glow' },
];

export function BeautyPanel({ beauty, onChange, onClose }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Embelezamento</Text>
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
      <View style={styles.row}>
        {TOGGLES.map((t) => {
          const on = beauty[t.key];
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onChange({ ...beauty, [t.key]: !on })}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.sub}>Intensidade</Text>
      <View style={styles.row}>
        {([1, 2, 3] as const).map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.chip, beauty.intensity === n && styles.chipOn]}
            onPress={() => onChange({ ...beauty, intensity: n })}
          >
            <Text style={[styles.chipText, beauty.intensity === n && styles.chipTextOn]}>
              {n === 1 ? 'Leve' : n === 2 ? 'Médio' : 'Forte'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  close: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  sub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipOn: {
    backgroundColor: '#C0F93C',
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextOn: {
    color: '#111111',
  },
});
