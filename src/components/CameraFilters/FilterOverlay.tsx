import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import {
  BeautyConfig,
  CameraFilter,
  FaceEffectId,
  getFilterById,
} from '../../lib/cameraFilters';

type Props = {
  filterId: string;
  beautyOn?: boolean;
  beauty?: BeautyConfig;
  faceEffect?: FaceEffectId;
  facing?: 'front' | 'back';
};

const { width: W, height: H } = Dimensions.get('window');
const FACE_W = Math.min(W * 0.78, 340);
const FACE_H = FACE_W * 1.15;
const FACE_TOP = H * 0.18;
const FACE_LEFT = (W - FACE_W) / 2;

export function FilterOverlay({
  filterId,
  beautyOn = false,
  beauty,
  faceEffect = 'none',
  facing = 'front',
}: Props) {
  const filter: CameraFilter = getFilterById(filterId);
  const pulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (faceEffect === 'none' && !beautyOn) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.65, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [faceEffect, beautyOn, pulse]);

  const intensity = beauty?.intensity ?? 2;
  const iOp = 0.05 * intensity;
  const top = facing === 'back' ? H * 0.26 : FACE_TOP;

  const showBigEyes = faceEffect === 'anime' || faceEffect === 'doll';
  const showBigLips = faceEffect === 'anime' || faceEffect === 'biglips' || faceEffect === 'doll';
  const showBeautyMakeup = beautyOn || faceEffect === 'beauty' || faceEffect === 'doll';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {filter.layers.map((layer, idx) => (
        <View
          key={`${filter.id}-${idx}`}
          style={[StyleSheet.absoluteFill, { backgroundColor: layer.color, opacity: layer.opacity }]}
        />
      ))}
      {(filter.glow ?? 0) > 0 && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF', opacity: filter.glow }]} />
      )}

      {/* Soft beauty skin */}
      {showBeautyMakeup && (
        <>
          <View
            style={[
              styles.skinGlow,
              { top, left: FACE_LEFT, width: FACE_W, height: FACE_H, opacity: 0.14 + iOp },
            ]}
          />
          <View style={[styles.blush, { top: top + FACE_H * 0.42, left: FACE_LEFT + FACE_W * 0.08 }]} />
          <View style={[styles.blush, { top: top + FACE_H * 0.42, right: FACE_LEFT + FACE_W * 0.08 }]} />
          <View style={[styles.lipTint, { top: top + FACE_H * 0.62, left: FACE_LEFT + FACE_W * 0.32 }]} />
        </>
      )}

      {/* Olhos grandes (modelo anime/boneca do vídeo) */}
      {showBigEyes && (
        <View style={[styles.faceBox, { top, left: FACE_LEFT, width: FACE_W, height: FACE_H }]}>
          <View style={[styles.eye, styles.eyeLeft]}>
            <View style={styles.eyeWhite}>
              <View style={styles.iris}>
                <View style={styles.pupil} />
                <View style={styles.eyeShine} />
              </View>
            </View>
            <View style={styles.lash} />
          </View>
          <View style={[styles.eye, styles.eyeRight]}>
            <View style={styles.eyeWhite}>
              <View style={styles.iris}>
                <View style={styles.pupil} />
                <View style={styles.eyeShine} />
              </View>
            </View>
            <View style={styles.lash} />
          </View>
        </View>
      )}

      {/* Boca ampliada */}
      {showBigLips && (
        <View
          style={[
            styles.bigMouth,
            {
              top: top + FACE_H * (faceEffect === 'anime' ? 0.58 : 0.6),
              left: FACE_LEFT + FACE_W * 0.22,
            },
          ]}
        >
          <View style={styles.upperLip} />
          <View style={styles.lowerLip} />
        </View>
      )}

      {/* Flor na orelha (referência do vídeo) */}
      {faceEffect === 'flower' && (
        <>
          <Text style={[styles.flower, { top: top + FACE_H * 0.08, left: FACE_LEFT - 8 }]}>🌸</Text>
          <Text style={[styles.flowerSmall, { top: top + FACE_H * 0.18, left: FACE_LEFT + 18 }]}>🌺</Text>
          {showBeautyMakeup ? null : (
            <View style={[styles.blush, { top: top + FACE_H * 0.42, left: FACE_LEFT + FACE_W * 0.1 }]} />
          )}
        </>
      )}

      {faceEffect === 'sunglasses' && (
        <View style={[styles.glassesWrap, { top: top + FACE_H * 0.28, left: FACE_LEFT + FACE_W * 0.08 }]}>
          <View style={styles.glassLens} />
          <View style={styles.glassBridge} />
          <View style={styles.glassLens} />
        </View>
      )}

      {faceEffect === 'bear' && (
        <View style={[styles.faceBox, { top, left: FACE_LEFT, width: FACE_W, height: FACE_H }]}>
          <Text style={styles.bearEarL}>🐻</Text>
          <Text style={styles.bearEarR}>🐻</Text>
          <Text style={styles.bearNose}>🟤</Text>
        </View>
      )}

      {faceEffect === 'cat' && (
        <View style={[styles.faceBox, { top, left: FACE_LEFT, width: FACE_W, height: FACE_H }]}>
          <Text style={styles.catEarL}>▲</Text>
          <Text style={styles.catEarR}>▲</Text>
          <Text style={styles.whiskerL}>〰〰</Text>
          <Text style={styles.whiskerR}>〰〰</Text>
          <Text style={styles.catNose}>💗</Text>
        </View>
      )}

      {(faceEffect === 'sparkle' || faceEffect === 'beauty') && (
        <Animated.View style={[styles.faceBox, { top, left: FACE_LEFT, width: FACE_W, height: FACE_H, opacity: pulse }]}>
          <Text style={styles.sparkTL}>✨</Text>
          <Text style={styles.sparkTR}>💫</Text>
          <Text style={styles.sparkBL}>🌟</Text>
          <Text style={styles.sparkBR}>✨</Text>
        </Animated.View>
      )}

      {(filter.id === 'cinema' || filter.id === 'neon') && (
        <>
          <View style={styles.vignetteTop} />
          <View style={styles.vignetteBottom} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  skinGlow: {
    position: 'absolute',
    borderRadius: FACE_W / 2,
    backgroundColor: '#FFD6E8',
  },
  blush: {
    position: 'absolute',
    width: 58,
    height: 34,
    borderRadius: 20,
    backgroundColor: '#FF6B9D',
    opacity: 0.35,
  },
  lipTint: {
    position: 'absolute',
    width: FACE_W * 0.36,
    height: 22,
    borderRadius: 14,
    backgroundColor: '#E63946',
    opacity: 0.28,
  },
  faceBox: {
    position: 'absolute',
  },
  eye: {
    position: 'absolute',
    top: '28%',
  },
  eyeLeft: { left: '14%' },
  eyeRight: { right: '14%' },
  eyeWhite: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iris: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5B3A29',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0A0A0A',
  },
  eyeShine: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  lash: {
    position: 'absolute',
    top: -4,
    left: 6,
    right: 6,
    height: 10,
    borderTopWidth: 4,
    borderTopColor: '#111',
    borderRadius: 8,
  },
  bigMouth: {
    position: 'absolute',
    width: FACE_W * 0.56,
    height: 56,
    alignItems: 'center',
  },
  upperLip: {
    width: '100%',
    height: 26,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#C9184A',
    opacity: 0.85,
  },
  lowerLip: {
    width: '92%',
    height: 28,
    marginTop: -6,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: '#FF4D6D',
    opacity: 0.9,
  },
  flower: {
    position: 'absolute',
    fontSize: 54,
    transform: [{ rotate: '-18deg' }],
  },
  flowerSmall: {
    position: 'absolute',
    fontSize: 28,
    transform: [{ rotate: '-8deg' }],
  },
  glassesWrap: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    width: FACE_W * 0.84,
  },
  glassLens: {
    width: FACE_W * 0.36,
    height: FACE_W * 0.28,
    borderRadius: 12,
    backgroundColor: 'rgba(10,10,10,0.72)',
    borderWidth: 3,
    borderColor: '#111',
  },
  glassBridge: {
    width: 16,
    height: 6,
    backgroundColor: '#111',
  },
  bearEarL: { position: 'absolute', top: -10, left: 8, fontSize: 44 },
  bearEarR: { position: 'absolute', top: -10, right: 8, fontSize: 44 },
  bearNose: { position: 'absolute', top: '48%', left: '42%', fontSize: 36 },
  catEarL: {
    position: 'absolute',
    top: -6,
    left: 24,
    fontSize: 36,
    color: '#FF9F1C',
    transform: [{ rotate: '-20deg' }],
  },
  catEarR: {
    position: 'absolute',
    top: -6,
    right: 24,
    fontSize: 36,
    color: '#FF9F1C',
    transform: [{ rotate: '20deg' }],
  },
  whiskerL: { position: 'absolute', top: '50%', left: 10, color: '#fff', fontSize: 14, opacity: 0.8 },
  whiskerR: { position: 'absolute', top: '50%', right: 10, color: '#fff', fontSize: 14, opacity: 0.8 },
  catNose: { position: 'absolute', top: '46%', left: '44%', fontSize: 22 },
  sparkTL: { position: 'absolute', top: 20, left: 16, fontSize: 28 },
  sparkTR: { position: 'absolute', top: 30, right: 16, fontSize: 26 },
  sparkBL: { position: 'absolute', bottom: 50, left: 24, fontSize: 24 },
  sparkBR: { position: 'absolute', bottom: 40, right: 20, fontSize: 28 },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: H * 0.1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});
