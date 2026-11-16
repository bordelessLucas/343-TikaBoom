/**
 * Daily.co — salas de vídeo para LIVE (funciona via WebView no Expo Go).
 *
 * 1) Crie conta free: https://dashboard.daily.co
 * 2) Copie a API key → EXPO_PUBLIC_DAILY_API_KEY no .env
 * 3) (Opcional) EXPO_PUBLIC_DAILY_DOMAIN=seu-subdominio.daily.co
 *
 * Em produção, mova a API key para Cloud Functions.
 */

import Constants from 'expo-constants';

const DAILY_API = 'https://api.daily.co/v1';

export function getDailyApiKey(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_DAILY_API_KEY || '').trim();
  if (fromEnv) return fromEnv;
  const fromExtra = (Constants.expoConfig?.extra?.dailyApiKey || '').trim();
  return fromExtra;
}

export function isDailyConfigured(): boolean {
  return getDailyApiKey().length > 10;
}

export function getDailyDomain(): string {
  const d = (process.env.EXPO_PUBLIC_DAILY_DOMAIN || '').trim();
  if (d) return d.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return '';
}

export type DailyRoom = {
  name: string;
  url: string;
};

/** Cria uma sala efêmera para a LIVE */
export async function createDailyRoom(roomName: string): Promise<DailyRoom> {
  const apiKey = getDailyApiKey();
  if (!apiKey) {
    throw new Error('Daily não configurado. Adicione EXPO_PUBLIC_DAILY_API_KEY no .env');
  }

  const res = await fetch(`${DAILY_API}/rooms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName.slice(0, 60).replace(/[^a-zA-Z0-9_-]/g, '-'),
      privacy: 'public',
      properties: {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6, // 6h
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
        enable_screenshare: false,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Sala já existe → buscar
    if (res.status === 400 && text.toLowerCase().includes('already')) {
      return getDailyRoom(roomName);
    }
    throw new Error(`Daily criar sala falhou (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { name: data.name, url: data.url };
}

export async function getDailyRoom(roomName: string): Promise<DailyRoom> {
  const apiKey = getDailyApiKey();
  const res = await fetch(`${DAILY_API}/rooms/${encodeURIComponent(roomName)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`Daily sala não encontrada: ${roomName}`);
  }
  const data = await res.json();
  return { name: data.name, url: data.url };
}

/** Encerra/deleta a sala (opcional) */
export async function deleteDailyRoom(roomName: string): Promise<void> {
  const apiKey = getDailyApiKey();
  if (!apiKey) return;
  await fetch(`${DAILY_API}/rooms/${encodeURIComponent(roomName)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` },
  }).catch(() => {});
}

/** Lista salas ativas no Daily (fallback se Firestore estiver bloqueado) */
export async function listDailyRooms(): Promise<DailyRoom[]> {
  const apiKey = getDailyApiKey();
  if (!apiKey) return [];

  const res = await fetch(`${DAILY_API}/rooms?limit=50`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.warn('Daily list rooms failed:', res.status);
    return [];
  }
  const data = await res.json();
  const rooms = (data.data || data || []) as any[];
  return rooms
    .filter((r) => r?.name && r?.url && String(r.name).startsWith('tb_'))
    .map((r) => ({ name: r.name as string, url: r.url as string }));
}

export function buildDailyEmbedUrl(roomUrl: string, userName: string, isOwner: boolean): string {
  const url = new URL(roomUrl);
  url.searchParams.set('userName', userName.slice(0, 40));
  if (isOwner) {
    // Prebuilt: host inicia com câmera
    url.searchParams.set('showLeaveButton', 'false');
  }
  return url.toString();
}
