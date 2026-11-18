import { supabase } from '../lib/supabase';
import { mapProfile } from '../lib/mappers';
import type { UserProfile } from '../types/models';

export type { UserProfile };

export const usersService = {
  async searchUsers(searchTerm: string, limitCount: number = 20): Promise<UserProfile[]> {
    try {
      const searchLower = searchTerm.toLowerCase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .gte('username', searchLower)
        .lte('username', searchLower + '\uffff')
        .limit(limitCount);
      if (error) throw error;
      return (data || []).map(mapProfile);
    } catch (error: any) {
      console.warn('searchUsers:', error?.message);
      return [];
    }
  },

  async searchUsersByName(searchTerm: string, limitCount: number = 20): Promise<UserProfile[]> {
    try {
      const searchLower = searchTerm.toLowerCase();
      const { data, error } = await supabase.from('profiles').select('*').limit(limitCount * 10);
      if (error) throw error;
      return (data || [])
        .map(mapProfile)
        .filter(
          (user) =>
            user.displayName.toLowerCase().includes(searchLower) ||
            user.username.toLowerCase().includes(searchLower)
        )
        .slice(0, limitCount);
    } catch (error: any) {
      console.warn('searchUsersByName:', error?.message);
      return [];
    }
  },

  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Você não pode seguir a si mesmo');
    }

    const already = await this.isFollowing(followerId, followingId);
    if (already) throw new Error('Você já está seguindo este usuário');

    const { error } = await supabase.from('follows').insert({
      follower_id: followerId,
      following_id: followingId,
    });
    if (error) throw new Error(error.message || 'Erro ao seguir usuário');

    try {
      const { notificationsService } = await import('./notificationsService');
      const { authService } = await import('./authService');
      const followerProfile = await authService.getUserProfile(followerId);
      if (followerProfile) {
        await notificationsService.createNotification({
          userId: followingId,
          type: 'follow',
          actorId: followerId,
          actorUsername: followerProfile.username,
          actorPhotoURL: followerProfile.photoURL,
          read: false,
        });
      }
    } catch (notifError) {
      console.error('Erro ao criar notificação de follow:', notifError);
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) throw new Error('Operação inválida');

    const isFollowing = await this.isFollowing(followerId, followingId);
    if (!isFollowing) throw new Error('Você não está seguindo este usuário');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw new Error(error.message || 'Erro ao deixar de seguir usuário');
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    } catch {
      return false;
    }
  },

  async getFollowers(userId: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);
      if (error) throw error;
      const ids = (data || []).map((r) => r.follower_id);
      if (!ids.length) return [];

      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids);
      if (pErr) throw pErr;
      return (profiles || []).map(mapProfile);
    } catch {
      return [];
    }
  },

  async getFollowing(userId: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      if (error) throw error;
      const ids = (data || []).map((r) => r.following_id);
      if (!ids.length) return [];

      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids);
      if (pErr) throw pErr;
      return (profiles || []).map(mapProfile);
    } catch {
      return [];
    }
  },

  async getSuggestedUsers(currentUserId: string, limitCount: number = 10): Promise<UserProfile[]> {
    try {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);
      const followingIds = new Set((following || []).map((f) => f.following_id));

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('followers', { ascending: false })
        .limit(limitCount * 3);
      if (error) throw error;

      return (data || [])
        .map(mapProfile)
        .filter((user) => user.uid !== currentUserId && !followingIds.has(user.uid))
        .slice(0, limitCount);
    } catch {
      return [];
    }
  },
};
