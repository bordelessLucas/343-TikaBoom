import { supabase } from '../lib/supabase';
import { toMillis } from '../lib/mappers';
import type { Group, GroupMessage } from '../types/models';

export type { Group, GroupMessage };

async function mapGroup(row: any): Promise<Group> {
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', row.id);

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    ownerId: row.owner_id,
    members: (members || []).map((m) => m.user_id),
    interests: row.interests || [],
    createdAt: toMillis(row.created_at),
    lastMessage: row.last_message ?? undefined,
    lastMessageTime: row.last_message_time ? toMillis(row.last_message_time) : undefined,
  };
}

export const groupsService = {
  async createGroup(
    ownerId: string,
    name: string,
    description: string,
    interests: string[]
  ): Promise<string> {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description.trim(),
        owner_id: ownerId,
        interests,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);

    const { error: memErr } = await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: ownerId,
    });
    if (memErr) throw new Error(memErr.message);

    return data.id;
  },

  async getUserGroups(userId: string): Promise<Group[]> {
    const { data: memberships, error } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    const ids = (memberships || []).map((m) => m.group_id);
    if (!ids.length) return [];

    const { data: groups, error: gErr } = await supabase
      .from('groups')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false })
      .limit(50);
    if (gErr) throw new Error(gErr.message);

    return Promise.all((groups || []).map(mapGroup));
  },

  async getGroupsByInterest(interest: string, limitCount = 20): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .contains('interests', [interest.toLowerCase()])
      .limit(limitCount);
    if (error) throw new Error(error.message);
    return Promise.all((data || []).map(mapGroup));
  },

  async joinGroup(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('group_members').upsert({
      group_id: groupId,
      user_id: userId,
    });
    if (error) throw new Error(error.message);
  },

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  async getGroup(groupId: string): Promise<Group | null> {
    const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapGroup(data);
  },

  async sendGroupMessage(
    groupId: string,
    senderId: string,
    text: string,
    senderUsername: string,
    senderPhotoURL?: string
  ): Promise<string> {
    const payload: Record<string, unknown> = {
      group_id: groupId,
      sender_id: senderId,
      sender_username: senderUsername,
      text: text.trim(),
    };
    if (senderPhotoURL) payload.sender_photo_url = senderPhotoURL;

    const { data, error } = await supabase
      .from('group_messages')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from('groups')
      .update({
        last_message: text.trim(),
        last_message_time: new Date().toISOString(),
      })
      .eq('id', groupId);

    return data.id;
  },

  async getGroupMessages(groupId: string, limitCount = 50): Promise<GroupMessage[]> {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limitCount);
    if (error) throw new Error(error.message);

    return (data || [])
      .map((row) => ({
        id: row.id,
        groupId: row.group_id,
        senderId: row.sender_id,
        senderUsername: row.sender_username,
        senderPhotoURL: row.sender_photo_url ?? undefined,
        text: row.text,
        createdAt: toMillis(row.created_at),
      }))
      .reverse();
  },
};
