import { supabase } from '../lib/supabase';
import { mapMessage, toMillis } from '../lib/mappers';
import type { Message, Chat } from '../types/models';

export type { Message, Chat };

export const messagesService = {
  async getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    try {
      const sortedIds = [userId1, userId2].sort();
      const chatId = `${sortedIds[0]}_${sortedIds[1]}`;

      const { data: existing } = await supabase
        .from('chats')
        .select('id')
        .eq('id', chatId)
        .maybeSingle();

      if (existing) return chatId;

      const { error: chatErr } = await supabase.from('chats').insert({ id: chatId });
      if (chatErr && !String(chatErr.message).includes('duplicate')) {
        throw chatErr;
      }

      const { error: partErr } = await supabase.from('chat_participants').upsert(
        [
          { chat_id: chatId, user_id: userId1, unread_count: 0 },
          { chat_id: chatId, user_id: userId2, unread_count: 0 },
        ],
        { onConflict: 'chat_id,user_id' }
      );
      if (partErr) throw partErr;

      return chatId;
    } catch (error: any) {
      throw new Error(error.message || 'Não foi possível criar ou obter o chat');
    }
  },

  async sendMessage(
    chatId: string,
    senderId: string,
    text: string,
    senderUsername: string,
    senderPhotoURL?: string
  ): Promise<string> {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      sender_id: senderId,
      sender_username: senderUsername,
      text: text.trim(),
      read: false,
    };
    if (senderPhotoURL?.trim()) payload.sender_photo_url = senderPhotoURL;

    const { data, error } = await supabase.from('messages').insert(payload).select('id').single();
    if (error) throw new Error(error.message);

    const now = new Date().toISOString();
    await supabase
      .from('chats')
      .update({
        last_message: text.trim(),
        last_message_time: now,
        updated_at: now,
      })
      .eq('id', chatId);

    const { data: parts } = await supabase
      .from('chat_participants')
      .select('user_id, unread_count')
      .eq('chat_id', chatId);

    const other = (parts || []).find((p) => p.user_id !== senderId);
    if (other) {
      await supabase
        .from('chat_participants')
        .update({ unread_count: (other.unread_count || 0) + 1 })
        .eq('chat_id', chatId)
        .eq('user_id', other.user_id);
    }

    return data.id;
  },

  async getChatMessages(chatId: string, limitCount: number = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limitCount);
    if (error) throw new Error(error.message);
    return (data || []).map(mapMessage).reverse();
  },

  async getUserChats(
    userId: string
  ): Promise<(Chat & { otherUser?: { uid: string; username: string; photoURL?: string } })[]> {
    try {
      const { data: parts, error } = await supabase
        .from('chat_participants')
        .select('chat_id, unread_count')
        .eq('user_id', userId);
      if (error) throw error;
      if (!parts?.length) return [];

      const chatIds = parts.map((p) => p.chat_id);
      const unreadMap: Record<string, number> = {};
      parts.forEach((p) => {
        unreadMap[p.chat_id] = p.unread_count || 0;
      });

      const { data: chats } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      const { data: allParts } = await supabase
        .from('chat_participants')
        .select('chat_id, user_id, unread_count')
        .in('chat_id', chatIds);

      const result: (Chat & {
        otherUser?: { uid: string; username: string; photoURL?: string };
      })[] = [];

      for (const chat of chats || []) {
        const participants = (allParts || [])
          .filter((p) => p.chat_id === chat.id)
          .map((p) => p.user_id);
        const unreadCount: Record<string, number> = {};
        (allParts || [])
          .filter((p) => p.chat_id === chat.id)
          .forEach((p) => {
            unreadCount[p.user_id] = p.unread_count || 0;
          });

        const mapped: Chat & {
          otherUser?: { uid: string; username: string; photoURL?: string };
        } = {
          id: chat.id,
          participants,
          lastMessage: chat.last_message ?? undefined,
          lastMessageTime: chat.last_message_time
            ? toMillis(chat.last_message_time)
            : undefined,
          unreadCount,
          createdAt: toMillis(chat.created_at),
          updatedAt: toMillis(chat.updated_at),
        };

        const otherUserId = participants.find((id) => id !== userId);
        if (otherUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, photo_url')
            .eq('id', otherUserId)
            .maybeSingle();
          if (profile) {
            mapped.otherUser = {
              uid: profile.id,
              username: profile.username,
              photoURL: profile.photo_url ?? undefined,
            };
          }
        }
        result.push(mapped);
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .eq('read', false);

    await supabase
      .from('chat_participants')
      .update({ unread_count: 0 })
      .eq('chat_id', chatId)
      .eq('user_id', userId);
  },

  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void): () => void {
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async () => {
          const messages = await this.getChatMessages(chatId, 50);
          callback(messages);
        }
      )
      .subscribe();

    this.getChatMessages(chatId, 50).then(callback).catch(() => callback([]));

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToUserChats(userId: string, callback: (chats: Chat[]) => void): () => void {
    const reload = async () => {
      try {
        const chats = await this.getUserChats(userId);
        callback(chats);
      } catch {
        callback([]);
      }
    };

    const channel = supabase
      .channel(`chats:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => {
          reload();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_participants' },
        () => {
          reload();
        }
      )
      .subscribe();

    reload();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('chat_participants')
        .select('unread_count')
        .eq('user_id', userId);
      return (data || []).reduce((sum, row) => sum + (row.unread_count || 0), 0);
    } catch {
      return 0;
    }
  },
};
