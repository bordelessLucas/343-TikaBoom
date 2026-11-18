/**
 * LiveKit — salas WebRTC para LIVE (WebView via meet.livekit.io).
 *
 * 1) Crie projeto em https://cloud.livekit.io
 * 2) Copie WebSocket URL → EXPO_PUBLIC_LIVEKIT_URL (wss://….livekit.cloud)
 * 3) API Key + Secret → secrets da Edge Function `live-token`
 * 4) Deploy: supabase functions deploy live-token
 */
import { supabase } from '../lib/supabase';

export type LiveKitSession = {
  token: string;
  url: string;
  roomName: string;
  embedUrl: string;
  provider: 'livekit';
};

export function getLiveKitUrl(): string {
  return (process.env.EXPO_PUBLIC_LIVEKIT_URL || '').trim().replace(/\/$/, '');
}

export function isLiveKitConfigured(): boolean {
  const url = getLiveKitUrl();
  return url.startsWith('wss://') || url.startsWith('ws://');
}

export async function createLiveKitSession(params: {
  roomName: string;
  displayName: string;
  asHost: boolean;
}): Promise<LiveKitSession> {
  if (!isLiveKitConfigured()) {
    throw new Error(
      'LiveKit não configurado. Adicione EXPO_PUBLIC_LIVEKIT_URL no .env (wss://….livekit.cloud).'
    );
  }

  const { data, error } = await supabase.functions.invoke('live-token', {
    body: {
      roomName: params.roomName,
      displayName: params.displayName,
      asHost: params.asHost,
    },
  });

  if (error) {
    throw new Error(error.message || 'Falha ao criar token LiveKit');
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  if (!data?.embedUrl || !data?.token) {
    throw new Error(
      'Resposta inválida da function live-token. Confirme o deploy e os secrets LIVEKIT_*.'
    );
  }

  return {
    token: data.token,
    url: data.url || getLiveKitUrl(),
    roomName: data.roomName || params.roomName,
    embedUrl: data.embedUrl,
    provider: 'livekit',
  };
}

/** Join viewer na mesma room */
export async function joinLiveKitSession(params: {
  roomName: string;
  displayName: string;
}): Promise<LiveKitSession> {
  return createLiveKitSession({ ...params, asHost: false });
}

export function buildLiveKitEmbedUrl(liveKitUrl: string, token: string): string {
  return (
    `https://meet.livekit.io/custom?` +
    `liveKitUrl=${encodeURIComponent(liveKitUrl)}&token=${encodeURIComponent(token)}`
  );
}
