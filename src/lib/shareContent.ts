import { Alert, Linking, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export type SharePayload = {
  title?: string;
  message?: string;
  url?: string;
};

function buildText(payload: SharePayload): string {
  const parts = [payload.message, payload.url].filter(Boolean);
  return parts.join('\n').trim();
}

/** Abre a folha nativa do sistema (WhatsApp, Instagram, etc. conforme o aparelho). */
export async function shareNative(payload: SharePayload): Promise<boolean> {
  const message = buildText(payload) || payload.title || 'Confira no TikaBoom';
  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? {
            message: payload.url ? `${payload.message || payload.title || ''}\n${payload.url}`.trim() : message,
            url: payload.url,
            title: payload.title,
          }
        : {
            message: payload.url ? `${message}` : message,
            title: payload.title,
          }
    );
    return result.action !== Share.dismissedAction;
  } catch (error: any) {
    console.error('Share nativo falhou:', error);
    Alert.alert('Compartilhar', error?.message || 'Não foi possível abrir o compartilhamento.');
    return false;
  }
}

export async function copyShareLink(url: string): Promise<void> {
  await Clipboard.setStringAsync(url);
  Alert.alert('Link copiado', 'O link foi copiado para a área de transferência.');
}

export async function shareViaWhatsApp(payload: SharePayload): Promise<void> {
  const text = encodeURIComponent(buildText(payload));
  const appUrl = `whatsapp://send?text=${text}`;
  const webUrl = `https://wa.me/?text=${text}`;
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpen ? appUrl : webUrl);
  } catch {
    await shareNative(payload);
  }
}

export function buildPostShareUrl(postId?: string, mediaUrl?: string): string {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tikaboom.app').replace(/\/$/, '');
  if (postId) return `${base}/post/${postId}`;
  return mediaUrl || 'https://tikaboom.app';
}
