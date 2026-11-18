import { supabase } from '../lib/supabase';
import { mapNotification } from '../lib/mappers';
import type { Notification } from '../types/models';

export type { Notification };

export const notificationsService = {
  async createNotification(
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<void> {
    try {
      const payload: Record<string, unknown> = {
        user_id: notification.userId,
        type: notification.type,
        actor_id: notification.actorId,
        actor_username: notification.actorUsername,
        read: notification.read || false,
      };

      if (notification.actorPhotoURL?.trim()) {
        payload.actor_photo_url = notification.actorPhotoURL;
      }
      if (notification.postId) payload.post_id = notification.postId;
      if (notification.postTitle) payload.post_title = notification.postTitle;
      if (notification.commentText) payload.comment_text = notification.commentText;

      const { error } = await supabase.from('notifications').insert(payload);
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao criar notificação:', error);
      throw new Error(error.message || 'Erro ao criar notificação');
    }
  },

  async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limitCount);
      if (error) throw error;
      return (data || []).map(mapNotification);
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error?.message);
      return [];
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (error) throw new Error(error.message || 'Erro ao marcar notificação como lida');
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw new Error(error.message || 'Erro ao marcar todas as notificações como lidas');
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false);
      if (error) throw error;
      return data?.length || 0;
    } catch {
      return 0;
    }
  },
};
