import { supabase, auth } from '../lib/supabase';
import { mapLive } from '../lib/mappers';
import type { LiveSession, LiveStatus } from '../types/models';

export type { LiveSession, LiveStatus };

type CreateLiveInput = {
  title: string;
  hostUsername: string;
  hostDisplayName: string;
  hostPhotoURL?: string;
  roomName: string;
  roomUrl?: string;
  provider?: LiveSession['provider'];
};

export const livesService = {
  async createLive(input: CreateLiveInput): Promise<LiveSession> {
    const user = auth.currentUser;
    if (!user) throw new Error('Faça login para iniciar uma LIVE.');

    const { data, error } = await supabase
      .from('lives')
      .insert({
        host_id: user.uid,
        host_username: input.hostUsername,
        host_display_name: input.hostDisplayName,
        host_photo_url: input.hostPhotoURL || null,
        title: input.title.trim() || 'Minha LIVE',
        status: 'live',
        room_name: input.roomName,
        room_url: input.roomUrl || null,
        viewer_count: 0,
        provider: input.provider || 'local',
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapLive(data);
  },

  async endLive(liveId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado');

    const { data } = await supabase.from('lives').select('host_id').eq('id', liveId).maybeSingle();
    if (!data) return;
    if (data.host_id !== user.uid) {
      throw new Error('Só o host pode encerrar a LIVE.');
    }

    const { error } = await supabase
      .from('lives')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', liveId);
    if (error) throw new Error(error.message);
  },

  async endActiveLivesForHost(hostId: string): Promise<void> {
    await supabase
      .from('lives')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('host_id', hostId)
      .eq('status', 'live');
  },

  async getLive(liveId: string): Promise<LiveSession | null> {
    const { data, error } = await supabase.from('lives').select('*').eq('id', liveId).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapLive(data) : null;
  },

  async listActiveLives(max = 40): Promise<LiveSession[]> {
    try {
      // Encerra LIVEs órfãs (ex.: app fechou sem end) — evita card fantasma no topo
      const staleBefore = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('lives')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('status', 'live')
        .lt('started_at', staleBefore);

      const { data, error } = await supabase
        .from('lives')
        .select('*')
        .eq('status', 'live')
        .order('started_at', { ascending: false })
        .limit(max);
      if (error) throw error;
      return (data || []).map(mapLive);
    } catch (e: any) {
      console.warn('listActiveLives fallback:', e?.message || e);
      return [];
    }
  },

  subscribeActiveLives(onChange: (lives: LiveSession[]) => void): () => void {
    const reload = async () => {
      const lives = await this.listActiveLives(50);
      onChange(lives);
    };

    const channel = supabase
      .channel('lives:active')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lives' },
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

  async incrementViewers(liveId: string, delta = 1): Promise<void> {
    const { data } = await supabase
      .from('lives')
      .select('viewer_count')
      .eq('id', liveId)
      .maybeSingle();
    if (!data) return;
    await supabase
      .from('lives')
      .update({ viewer_count: Math.max(0, (data.viewer_count || 0) + delta) })
      .eq('id', liveId);
  },
};
