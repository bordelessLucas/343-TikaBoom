/**
 * DeepAR — plano FREE (até 10 MAU/mês).
 * Crie a key em: https://developer.deepar.ai
 *
 * 1. New Project → plano Free
 * 2. Add App (iOS / Android / Web domain)
 * 3. Copie a license key → EXPO_PUBLIC_DEEPAR_LICENSE_KEY no .env
 * 4. Domínio Web (opcional) → EXPO_PUBLIC_DEEPAR_APP_DOMAIN
 */

import { FaceEffectId } from '../lib/cameraFilters';

const CDN = 'https://cdn.jsdelivr.net/npm/deepar@5.6.22';

/** Efeitos gratuitos oficiais no CDN do DeepAR */
export const DEEPAR_FREE_EFFECTS = [
  {
    id: 'none',
    name: 'Original',
    emoji: '🙂',
    swatch: '#666666',
    url: null as string | null,
  },
  {
    id: 'aviators',
    name: 'Aviator',
    emoji: '🕶️',
    swatch: '#222222',
    url: `${CDN}/effects/aviators`,
  },
  {
    id: 'koala',
    name: 'Coala',
    emoji: '🐨',
    swatch: '#C4A484',
    url: `${CDN}/effects/koala`,
  },
  {
    id: 'lion',
    name: 'Leão',
    emoji: '🦁',
    swatch: '#E09F3E',
    url: `${CDN}/effects/lion`,
  },
  {
    id: 'dalmatian',
    name: 'Dálmata',
    emoji: '🐶',
    swatch: '#F8F9FA',
    url: `${CDN}/effects/dalmatian`,
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    emoji: '🌌',
    swatch: '#3A0CA3',
    url: `${CDN}/effects/galaxy_background`,
  },
  {
    id: 'blur',
    name: 'Blur BG',
    emoji: '🌫️',
    swatch: '#ADB5BD',
    url: `${CDN}/effects/background_blur.deepar`,
  },
] as const;

export type DeepArEffectId = (typeof DEEPAR_FREE_EFFECTS)[number]['id'];

export function mapFaceEffectToDeepAr(face: FaceEffectId): DeepArEffectId {
  switch (face) {
    case 'sunglasses':
      return 'aviators';
    case 'bear':
      return 'koala';
    case 'cat':
      return 'lion';
    case 'anime':
    case 'doll':
      return 'dalmatian';
    case 'sparkle':
    case 'beauty':
      return 'galaxy';
    case 'flower':
    case 'biglips':
      return 'koala';
    default:
      return 'none';
  }
}

export function getDeepArEffectUrl(id: string): string | null {
  const found = DEEPAR_FREE_EFFECTS.find((e) => e.id === id);
  return found?.url ?? null;
}

export function getDeepArLicenseKey(): string {
  return (process.env.EXPO_PUBLIC_DEEPAR_LICENSE_KEY || '').trim();
}

export function getDeepArAppDomain(): string {
  return (process.env.EXPO_PUBLIC_DEEPAR_APP_DOMAIN || 'localhost').trim();
}

export function isDeepArConfigured(): boolean {
  return getDeepArLicenseKey().length > 10;
}

export const DEEPAR_SDK_JS = `${CDN}/js/deepar.js`;
