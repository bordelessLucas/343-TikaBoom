/**
 * Escolhe o provedor de LIVE: LiveKit (preferido) → Daily (fallback).
 */
import { isLiveKitConfigured, createLiveKitSession, joinLiveKitSession } from './livekitService';
import {
  isDailyConfigured,
  createDailyRoom,
  buildDailyEmbedUrl,
  deleteDailyRoom,
} from './dailyService';

export type LiveProviderName = 'livekit' | 'daily' | 'local';

export type PreparedLiveRoom = {
  provider: LiveProviderName;
  roomName: string;
  roomUrl: string;
  embedUrl: string;
};

export function getPreferredLiveProvider(): LiveProviderName {
  if (isLiveKitConfigured()) return 'livekit';
  if (isDailyConfigured()) return 'daily';
  return 'local';
}

export function isAnyLiveProviderConfigured(): boolean {
  return getPreferredLiveProvider() !== 'local';
}

export async function prepareHostLiveRoom(params: {
  roomName: string;
  displayName: string;
}): Promise<PreparedLiveRoom> {
  const preferred = getPreferredLiveProvider();

  if (preferred === 'livekit') {
    const session = await createLiveKitSession({
      roomName: params.roomName,
      displayName: params.displayName,
      asHost: true,
    });
    return {
      provider: 'livekit',
      roomName: session.roomName,
      roomUrl: session.url,
      embedUrl: session.embedUrl,
    };
  }

  if (preferred === 'daily') {
    const room = await createDailyRoom(params.roomName);
    return {
      provider: 'daily',
      roomName: room.name,
      roomUrl: room.url,
      embedUrl: buildDailyEmbedUrl(room.url, params.displayName, true),
    };
  }

  throw new Error(
    'Nenhum provedor de LIVE configurado. Defina EXPO_PUBLIC_LIVEKIT_URL (recomendado) ou EXPO_PUBLIC_DAILY_API_KEY.'
  );
}

export async function prepareViewerLiveRoom(params: {
  roomName: string;
  roomUrl?: string;
  provider?: LiveProviderName;
  displayName: string;
}): Promise<PreparedLiveRoom> {
  const provider = params.provider || getPreferredLiveProvider();

  if (provider === 'livekit' || (!params.roomUrl?.includes('daily.co') && isLiveKitConfigured())) {
    const session = await joinLiveKitSession({
      roomName: params.roomName,
      displayName: params.displayName,
    });
    return {
      provider: 'livekit',
      roomName: session.roomName,
      roomUrl: session.url,
      embedUrl: session.embedUrl,
    };
  }

  if (params.roomUrl) {
    return {
      provider: 'daily',
      roomName: params.roomName,
      roomUrl: params.roomUrl,
      embedUrl: buildDailyEmbedUrl(params.roomUrl, params.displayName, false),
    };
  }

  throw new Error('Sala de LIVE indisponível para assistir.');
}

export async function cleanupHostLiveRoom(provider: LiveProviderName, roomName: string) {
  if (provider === 'daily') {
    await deleteDailyRoom(roomName).catch(() => {});
  }
  // LiveKit: salas efêmeras; nada a deletar no client
}
