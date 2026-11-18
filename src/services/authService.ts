import { supabase, auth, refreshAuthUser } from '../lib/supabase';
import { mapProfile } from '../lib/mappers';
import { uploadLocalFile } from '../lib/storageUpload';
import type { UserProfile } from '../types/models';

export type { UserProfile };

export type AuthSessionResult = {
  user: { uid: string; email: string | null; displayName?: string | null };
};

export const authService = {
  async register(
    email: string,
    password: string,
    username: string,
    displayName: string
  ): Promise<AuthSessionResult> {
    try {
      const usernameLower = username.toLowerCase();
      const available = await this.isUsernameAvailable(usernameLower);
      if (!available) {
        throw new Error('Este username já está em uso. Escolha outro.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: usernameLower,
            display_name: displayName,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Erro ao criar conta. Tente novamente.');

      await refreshAuthUser();

      // Garante perfil (trigger + fallback)
      await this.ensureUserProfile(data.user.id, email, displayName, usernameLower);

      return {
        user: {
          uid: data.user.id,
          email: data.user.email ?? email,
          displayName,
        },
      };
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('already registered') || error?.code === 'user_already_exists') {
        throw new Error('Este email já está em uso. Tente fazer login.');
      }
      if (msg.toLowerCase().includes('password')) {
        throw new Error('A senha é muito fraca. Use pelo menos 6 caracteres.');
      }
      if (msg.toLowerCase().includes('email')) {
        throw new Error('Email inválido. Verifique o formato do email.');
      }
      if (msg.includes('username')) {
        throw new Error('Username já está em uso. Escolha outro.');
      }
      throw new Error(error.message || 'Erro ao criar conta. Tente novamente.');
    }
  },

  async login(email: string, password: string): Promise<AuthSessionResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Erro ao fazer login.');

      await refreshAuthUser();
      await this.ensureUserProfile(
        data.user.id,
        email,
        (data.user.user_metadata?.display_name as string) || null
      );

      return {
        user: {
          uid: data.user.id,
          email: data.user.email ?? email,
          displayName: (data.user.user_metadata?.display_name as string) || null,
        },
      };
    } catch (error: any) {
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        throw new Error('Email ou senha incorretos.');
      }
      if (msg.includes('too many')) {
        throw new Error('Muitas tentativas. Espere um pouco e tente de novo.');
      }
      if (msg.includes('network') || msg.includes('fetch')) {
        throw new Error('Sem conexão com o Supabase.');
      }
      throw new Error(error.message || 'Erro ao fazer login.');
    }
  },

  async ensureUserProfile(
    uid: string,
    email: string,
    displayName?: string | null,
    username?: string
  ): Promise<void> {
    try {
      const { data } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
      if (data) return;

      const name = displayName || email.split('@')[0];
      const uname =
        username ||
        email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 20) ||
        'user';

      await supabase.from('profiles').upsert({
        id: uid,
        email,
        display_name: name,
        username: uname,
      });
    } catch (error) {
      console.warn('Perfil não gravado no Supabase.', error);
    }
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) throw error;
      return data ? mapProfile(data) : null;
    } catch (error: any) {
      console.warn('getUserProfile:', error?.message);
      return null;
    }
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (updates.displayName !== undefined) payload.display_name = updates.displayName;
    if (updates.username !== undefined) payload.username = updates.username.toLowerCase();
    if (updates.photoURL !== undefined) payload.photo_url = updates.photoURL;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.isPrivate !== undefined) payload.is_private = updates.isPrivate;

    const { error } = await supabase.from('profiles').update(payload).eq('id', uid);
    if (error) throw new Error(error.message);

    if (auth.currentUser?.uid === uid) {
      const meta: Record<string, string> = {};
      if (updates.displayName) meta.display_name = updates.displayName;
      if (updates.photoURL) meta.photo_url = updates.photoURL;
      if (Object.keys(meta).length > 0) {
        await supabase.auth.updateUser({ data: meta });
        await refreshAuthUser();
      }
    }
  },

  async uploadProfilePhoto(uid: string, uri: string): Promise<string> {
    try {
      await refreshAuthUser();
      const fileExtension = uri.toLowerCase().includes('.png') ? 'png' : 'jpg';
      const contentType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      const path = `${uid}/avatar_${Date.now()}.${fileExtension}`;

      const downloadURL = await uploadLocalFile({
        bucket: 'avatars',
        path,
        uri,
        contentType,
        upsert: true,
      });

      await this.updateUserProfile(uid, { photoURL: downloadURL });
      return downloadURL;
    } catch (error: any) {
      console.error('Erro ao fazer upload de foto:', error);
      throw new Error(error.message || 'Erro ao fazer upload da foto de perfil');
    }
  },

  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return !data;
  },
};
