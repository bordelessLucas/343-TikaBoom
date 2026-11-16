import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CAMERA_FILTERS } from '../../lib/cameraFilters';

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose?: () => void;
};

export function FilterPicker({ selectedId, onSelect, onClose }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Filtros</Text>
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
        {CAMERA_FILTERS.map((f) => {
          const active = f.id === selectedId;
          return (
            <TouchableOpacity
              key={f.id}
              style={styles.item}
              onPress={() => onSelect(f.id)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: f.swatch },
                  active && styles.swatchActive,
                ]}
              >
                {f.id === 'normal' && <Text style={styles.normalMark}>∅</Text>}
              </View>
              <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
                {f.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingTop: 10,
    paddingBottom: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  row: {
    paddingHorizontal: 12,
    gap: 12,
  },
  item: {
    alignItems: 'center',
    width: 64,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchActive: {
    borderColor: '#C0F93C',
    transform: [{ scale: 1.06 }],
  },
  normalMark: {
    color: '#111',
    fontSize: 18,
    fontWeight: '700',
  },
  name: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
  },
  nameActive: {
    color: '#C0F93C',
  },
});
