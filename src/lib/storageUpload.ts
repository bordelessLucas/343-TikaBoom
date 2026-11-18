import * as FileSystem from 'expo-file-system/legacy';
import { toByteArray } from 'base64-js';
import { supabase } from './supabase';

type UploadParams = {
  bucket: 'media' | 'avatars';
  path: string;
  uri: string;
  contentType: string;
  upsert?: boolean;
};

function normalizeUri(uri: string): string {
  if (
    uri &&
    !uri.startsWith('file://') &&
    !uri.startsWith('content://') &&
    !uri.startsWith('ph://') &&
    !uri.startsWith('http')
  ) {
    return `file://${uri}`;
  }
  return uri;
}

/** Upload estável no Expo: tenta FileSystem.uploadAsync com JWT; fallback base64. */
export async function uploadLocalFile(params: UploadParams): Promise<string> {
  const { bucket, path, contentType, upsert = false } = params;
  const localUri = normalizeUri(params.uri);

  const info = await FileSystem.getInfoAsync(localUri).catch(() => null);
  if (info && 'exists' in info && !info.exists) {
    throw new Error('Arquivo não encontrado. Capture novamente.');
  }
  if (info && 'size' in info && typeof info.size === 'number' && info.size > 100 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 100MB');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente para publicar.');
  }

  const baseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL não configurada.');
  }

  const uploadUrl = `${baseUrl}/storage/v1/object/${bucket}/${path}`;

  try {
    const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': contentType,
        'x-upsert': upsert ? 'true' : 'false',
      },
    });

    if (result.status >= 200 && result.status < 300) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }

    console.warn('uploadAsync status', result.status, result.body?.slice?.(0, 200));
  } catch (e) {
    console.warn('uploadAsync falhou, tentando base64…', e);
  }

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = toByteArray(base64);
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
