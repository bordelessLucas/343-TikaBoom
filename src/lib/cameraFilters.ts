export type FilterLayer = {
  color: string;
  opacity: number;
};

export type CameraFilter = {
  id: string;
  name: string;
  swatch: string;
  layers: FilterLayer[];
  glow?: number;
};

/** Color grades estilo IG */
export const CAMERA_FILTERS: CameraFilter[] = [
  { id: 'normal', name: 'Normal', swatch: '#888888', layers: [] },
  {
    id: 'clarendon',
    name: 'Clarendon',
    swatch: '#4A90D9',
    layers: [
      { color: '#1E3A8A', opacity: 0.18 },
      { color: '#FFFFFF', opacity: 0.06 },
    ],
  },
  {
    id: 'juno',
    name: 'Juno',
    swatch: '#F4A261',
    layers: [
      { color: '#E76F51', opacity: 0.16 },
      { color: '#F4A261', opacity: 0.1 },
    ],
  },
  {
    id: 'valencia',
    name: 'Valencia',
    swatch: '#E9C46A',
    layers: [
      { color: '#F4A261', opacity: 0.2 },
      { color: '#FFF3CD', opacity: 0.08 },
    ],
  },
  {
    id: 'peach',
    name: 'Peach',
    swatch: '#FFB4A2',
    layers: [
      { color: '#FFB4A2', opacity: 0.2 },
      { color: '#FFCDB2', opacity: 0.1 },
    ],
    glow: 0.12,
  },
  {
    id: 'softglow',
    name: 'Soft Glow',
    swatch: '#FFD6E0',
    layers: [
      { color: '#FFD6E0', opacity: 0.14 },
      { color: '#FFFFFF', opacity: 0.1 },
    ],
    glow: 0.16,
  },
  {
    id: 'cinema',
    name: 'Cinema',
    swatch: '#264653',
    layers: [
      { color: '#1D3557', opacity: 0.25 },
      { color: '#E9C46A', opacity: 0.06 },
    ],
  },
  {
    id: 'neon',
    name: 'Neon',
    swatch: '#FF00AA',
    layers: [
      { color: '#FF006E', opacity: 0.18 },
      { color: '#8338EC', opacity: 0.12 },
    ],
  },
];

export type BeautyConfig = {
  smooth: boolean;
  brighten: boolean;
  blush: boolean;
  softFace: boolean;
  intensity: 1 | 2 | 3;
};

export const DEFAULT_BEAUTY: BeautyConfig = {
  smooth: true,
  brighten: true,
  blush: true,
  softFace: true,
  intensity: 2,
};

/** Efeitos faciais modelados (estilo TikTok do vídeo de referência) */
export type FaceEffectId =
  | 'none'
  | 'anime'
  | 'doll'
  | 'flower'
  | 'sunglasses'
  | 'bear'
  | 'biglips'
  | 'sparkle'
  | 'beauty'
  | 'cat';

export type FaceEffect = {
  id: FaceEffectId;
  name: string;
  emoji: string;
  swatch: string;
};

export const FACE_EFFECTS: FaceEffect[] = [
  { id: 'none', name: 'Original', emoji: '🙂', swatch: '#666' },
  { id: 'anime', name: 'Anime', emoji: '😳', swatch: '#FF8FAB' },
  { id: 'doll', name: 'Boneca', emoji: '🎀', swatch: '#FFB4D9' },
  { id: 'flower', name: 'Flor', emoji: '🌸', swatch: '#FF69B4' },
  { id: 'sunglasses', name: 'Óculos', emoji: '🕶️', swatch: '#222' },
  { id: 'bear', name: 'Ursinho', emoji: '🐻', swatch: '#C4A484' },
  { id: 'biglips', name: 'Boca+', emoji: '💋', swatch: '#E63946' },
  { id: 'beauty', name: 'Beleza', emoji: '✨', swatch: '#FFD6E0' },
  { id: 'sparkle', name: 'Brilho', emoji: '🌟', swatch: '#FFE066' },
  { id: 'cat', name: 'Gato', emoji: '🐱', swatch: '#FF9F1C' },
];

export function getFilterById(id: string): CameraFilter {
  return CAMERA_FILTERS.find((f) => f.id === id) ?? CAMERA_FILTERS[0];
}

export function nextFaceEffect(current: FaceEffectId): FaceEffectId {
  const ids = FACE_EFFECTS.map((e) => e.id);
  const i = ids.indexOf(current);
  return ids[(i + 1) % ids.length];
}
