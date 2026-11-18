import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
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
  interactive?: boolean;
};

const { width: W, height: H } = Dimensions.get('window');
const BASE = Math.min(W * 0.72, 320);

export function FilterOverlay({
  filterId,
  beautyOn = false,
  beauty,
  faceEffect = 'none',
  interactive = true,
}: Props) {
  const filter: CameraFilter = getFilterById(filterId);
  const pulse = useRef(new Animated.Value(0.75)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dragStart = useRef({ x: 0, y: 0 });
  const [scaleStep, setScaleStep] = useState(1);

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    setScaleStep(1);
    scaleAnim.setValue(1);
  }, [faceEffect, pan, scaleAnim]);

  useEffect(() => {
    if (faceEffect === 'none' && !beautyOn) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [faceEffect, beautyOn, pulse]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive && faceEffect !== 'none',
        onMoveShouldSetPanResponder: (_, g) =>
          interactive && faceEffect !== 'none' && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
        onPanResponderGrant: () => {
          pan.stopAnimation((v) => {
            dragStart.current = { x: v.x, y: v.y };
          });
        },
        onPanResponderMove: (_, g) => {
          pan.setValue({
            x: dragStart.current.x + g.dx,
            y: dragStart.current.y + g.dy,
          });
        },
        onPanResponderRelease: (_, g) => {
          dragStart.current = {
            x: dragStart.current.x + g.dx,
            y: dragStart.current.y + g.dy,
          };
        },
      }),
    [interactive, faceEffect, pan]
  );

  const cycleScale = () => {
    const next = scaleStep >= 1.45 ? 0.75 : Number((scaleStep + 0.25).toFixed(2));
    setScaleStep(next);
    Animated.spring(scaleAnim, {
      toValue: next,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const intensity = beauty?.intensity ?? 2;
  const iOp = 0.05 * intensity;
  const showBigEyes = faceEffect === 'anime' || faceEffect === 'doll';
  const showBigLips = faceEffect === 'anime' || faceEffect === 'biglips' || faceEffect === 'doll';
  const showBeautyMakeup = beautyOn || faceEffect === 'beauty' || faceEffect === 'doll';
  const hasProp = faceEffect !== 'none';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
        {(filter.id === 'cinema' || filter.id === 'neon') && (
          <>
            <View style={styles.vignetteTop} />
            <View style={styles.vignetteBottom} />
          </>
        )}
      </View>

      {showBeautyMakeup && (
        <View style={styles.centerStage} pointerEvents="none">
          <View style={[styles.skinGlow, { opacity: 0.16 + iOp }]} />
        </View>
      )}

      {hasProp && (
        <View style={styles.centerStage} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.effectHit,
              {
                transform: [...pan.getTranslateTransform(), { scale: scaleAnim }],
              },
            ]}
            {...(interactive ? panResponder.panHandlers : {})}
          >
            <TouchableOpacity activeOpacity={0.95} onPress={cycleScale} disabled={!interactive}>
              <Animated.View style={[styles.effectCard, { opacity: pulse }]}>
                {showBeautyMakeup && (
                  <>
                    <View style={[styles.blush, { left: '12%', top: '42%' }]} />
                    <View style={[styles.blush, { right: '12%', top: '42%' }]} />
                    <View style={styles.lipTint} />
                  </>
                )}

                {showBigEyes && (
                  <>
                    <View style={[styles.eye, styles.eyeLeft]}>
                      <View style={styles.eyeWhite}>
                        <View style={styles.iris}>
                          <View style={styles.pupil} />
                          <View style={styles.eyeShine} />
                        </View>
                      </View>
                    </View>
                    <View style={[styles.eye, styles.eyeRight]}>
                      <View style={styles.eyeWhite}>
                        <View style={styles.iris}>
                          <View style={styles.pupil} />
                          <View style={styles.eyeShine} />
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {showBigLips && (
                  <View style={styles.bigMouth}>
                    <View style={styles.upperLip} />
                    <View style={styles.lowerLip} />
                  </View>
                )}

                {faceEffect === 'flower' && (
                  <>
                    <Text style={[styles.flower, { top: 8, left: -6 }]}>🌸</Text>
                    <Text style={[styles.flowerSmall, { top: 48, left: 28 }]}>🌺</Text>
                    <Text style={[styles.flower, { top: 18, right: -4, transform: [{ rotate: '16deg' }] }]}>
                      🌼
                    </Text>
                  </>
                )}

                {faceEffect === 'sunglasses' && (
                  <View style={styles.glassesWrap}>
                    <View style={styles.glassLens} />
                    <View style={styles.glassBridge} />
                    <View style={styles.glassLens} />
                  </View>
                )}

                {faceEffect === 'bear' && (
                  <>
                    <Text style={styles.bearEarL}>🐻</Text>
                    <Text style={styles.bearEarR}>🐻</Text>
                    <Text style={styles.bearNose}>🟤</Text>
                  </>
                )}

                {faceEffect === 'cat' && (
                  <>
                    <Text style={styles.catEarL}>▲</Text>
                    <Text style={styles.catEarR}>▲</Text>
                    <Text style={styles.whiskerL}>〰〰</Text>
                    <Text style={styles.whiskerR}>〰〰</Text>
                    <Text style={styles.catNose}>💗</Text>
                  </>
                )}

                {(faceEffect === 'sparkle' || faceEffect === 'beauty') && (
                  <>
                    <Text style={styles.sparkTL}>✨</Text>
                    <Text style={styles.sparkTR}>💫</Text>
                    <Text style={styles.sparkBL}>🌟</Text>
                    <Text style={styles.sparkBR}>✨</Text>
                  </>
                )}
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerStage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: H * 0.08,
  },
  effectHit: {
    width: BASE,
    height: BASE * 1.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectCard: {
    width: BASE,
    height: BASE * 1.15,
    borderRadius: BASE * 0.28,
    overflow: 'visible',
  },
  skinGlow: {
    width: BASE * 1.05,
    height: BASE * 1.2,
    borderRadius: BASE * 0.5,
    backgroundColor: '#FFD6E8',
  },
  blush: {
    position: 'absolute',
    width: 58,
    height: 34,
    borderRadius: 20,
    backgroundColor: '#FF6B9D',
    opacity: 0.4,
  },
  lipTint: {
    position: 'absolute',
    top: '62%',
    width: BASE * 0.34,
    height: 22,
    borderRadius: 14,
    backgroundColor: '#E63946',
    opacity: 0.3,
    left: '33%',
  },
  eye: { position: 'absolute', top: '26%' },
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
  },
  iris: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5B3A29',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#0A0A0A' },
  eyeShine: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  bigMouth: {
    position: 'absolute',
    top: '58%',
    left: '22%',
    width: BASE * 0.56,
    height: 56,
    alignItems: 'center',
  },
  upperLip: {
    width: '100%',
    height: 26,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#C9184A',
    opacity: 0.9,
  },
  lowerLip: {
    width: '92%',
    height: 28,
    marginTop: -6,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: '#FF4D6D',
    opacity: 0.92,
  },
  flower: { position: 'absolute', fontSize: 54 },
  flowerSmall: { position: 'absolute', fontSize: 28 },
  glassesWrap: {
    position: 'absolute',
    top: '30%',
    left: '8%',
    flexDirection: 'row',
    alignItems: 'center',
    width: BASE * 0.84,
  },
  glassLens: {
    width: BASE * 0.36,
    height: BASE * 0.28,
    borderRadius: 12,
    backgroundColor: 'rgba(10,10,10,0.75)',
    borderWidth: 3,
    borderColor: '#111',
  },
  glassBridge: { width: 16, height: 6, backgroundColor: '#111' },
  bearEarL: { position: 'absolute', top: 6, left: 10, fontSize: 48 },
  bearEarR: { position: 'absolute', top: 6, right: 10, fontSize: 48 },
  bearNose: { position: 'absolute', top: '48%', left: '42%', fontSize: 36 },
  catEarL: {
    position: 'absolute',
    top: 8,
    left: 28,
    fontSize: 36,
    color: '#FF9F1C',
    transform: [{ rotate: '-20deg' }],
  },
  catEarR: {
    position: 'absolute',
    top: 8,
    right: 28,
    fontSize: 36,
    color: '#FF9F1C',
    transform: [{ rotate: '20deg' }],
  },
  whiskerL: { position: 'absolute', top: '50%', left: 14, color: '#fff', fontSize: 14, opacity: 0.85 },
  whiskerR: { position: 'absolute', top: '50%', right: 14, color: '#fff', fontSize: 14, opacity: 0.85 },
  catNose: { position: 'absolute', top: '46%', left: '44%', fontSize: 22 },
  sparkTL: { position: 'absolute', top: 24, left: 20, fontSize: 30 },
  sparkTR: { position: 'absolute', top: 36, right: 20, fontSize: 28 },
  sparkBL: { position: 'absolute', bottom: 56, left: 28, fontSize: 26 },
  sparkBR: { position: 'absolute', bottom: 48, right: 24, fontSize: 30 },
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
