import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebaseconfig';

export type LiveStatus = 'live' | 'ended';

export interface LiveSession {
  id: string;
  hostId: string;
  hostUsername: string;
  hostDisplayName: string;
  hostPhotoURL?: string;
  title: string;
  status: LiveStatus;
  /** Nome da sala no provedor (Daily/LiveKit) */
  roomName: string;
  /** URL do player (Daily prebuilt / HLS) */
  roomUrl?: string;
  viewerCount: number;
  startedAt: number;
  endedAt?: number;
  provider: 'daily' | 'livekit' | 'local';
}

type CreateLiveInput = {
  title: string;
  hostUsername: string;
  hostDisplayName: string;
  hostPhotoURL?: string;
  roomName: string;
  roomUrl?: string;
  provider?: LiveSession['provider'];
};

function mapDoc(id: string, data: any): LiveSession {
  const started =
    data.startedAt instanceof Timestamp
      ? data.startedAt.toMillis()
      : typeof data.startedAt === 'number'
        ? data.startedAt
        : Date.now();
  const ended =
    data.endedAt instanceof Timestamp
      ? data.endedAt.toMillis()
      : typeof data.endedAt === 'number'
        ? data.endedAt
        : undefined;

  return {
    id,
    hostId: data.hostId,
    hostUsername: data.hostUsername || 'user',
    hostDisplayName: data.hostDisplayName || 'Host',
    hostPhotoURL: data.hostPhotoURL,
    title: data.title || 'LIVE',
    status: data.status === 'ended' ? 'ended' : 'live',
    roomName: data.roomName,
    roomUrl: data.roomUrl,
    viewerCount: data.viewerCount || 0,
    startedAt: started,
    endedAt: ended,
    provider: data.provider || 'local',
  };
}

export const livesService = {
  async createLive(input: CreateLiveInput): Promise<LiveSession> {
    const user = auth.currentUser;
    if (!user) throw new Error('Faça login para iniciar uma LIVE.');

    const id = `live_${user.uid}_${Date.now()}`;
    const ref = doc(db, 'lives', id);
    const payload = {
      hostId: user.uid,
      hostUsername: input.hostUsername,
      hostDisplayName: input.hostDisplayName,
      hostPhotoURL: input.hostPhotoURL || null,
      title: input.title.trim() || 'Minha LIVE',
      status: 'live' as LiveStatus,
      roomName: input.roomName,
      roomUrl: input.roomUrl || null,
      viewerCount: 0,
      provider: input.provider || 'local',
      startedAt: serverTimestamp(),
      endedAt: null,
      createdAt: serverTimestamp(),
    };

    await setDoc(ref, payload);

    return {
      id,
      hostId: user.uid,
      hostUsername: input.hostUsername,
      hostDisplayName: input.hostDisplayName,
      hostPhotoURL: input.hostPhotoURL,
      title: payload.title,
      status: 'live',
      roomName: input.roomName,
      roomUrl: input.roomUrl,
      viewerCount: 0,
      startedAt: Date.now(),
      provider: input.provider || 'local',
    };
  },

  async endLive(liveId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado');

    const ref = doc(db, 'lives', liveId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    if (snap.data().hostId !== user.uid) {
      throw new Error('Só o host pode encerrar a LIVE.');
    }

    await updateDoc(ref, {
      status: 'ended',
      endedAt: serverTimestamp(),
    });
  },

  async endActiveLivesForHost(hostId: string): Promise<void> {
    const q = query(
      collection(db, 'lives'),
      where('hostId', '==', hostId),
      where('status', '==', 'live')
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) =>
        updateDoc(d.ref, { status: 'ended', endedAt: serverTimestamp() })
      )
    );
  },

  async getLive(liveId: string): Promise<LiveSession | null> {
    const snap = await getDoc(doc(db, 'lives', liveId));
    if (!snap.exists()) return null;
    return mapDoc(snap.id, snap.data());
  },

  async listActiveLives(max = 40): Promise<LiveSession[]> {
    try {
      const q = query(
        collection(db, 'lives'),
        where('status', '==', 'live'),
        orderBy('startedAt', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data()));
    } catch (e: any) {
      // Índice ausente ou regras bloqueando
      console.warn('listActiveLives fallback:', e?.code || e?.message || e);
      try {
        const q = query(collection(db, 'lives'), where('status', '==', 'live'), limit(max));
        const snap = await getDocs(q);
        return snap.docs
          .map((d) => mapDoc(d.id, d.data()))
          .sort((a, b) => b.startedAt - a.startedAt);
      } catch {
        return [];
      }
    }
  },

  subscribeActiveLives(onChange: (lives: LiveSession[]) => void): Unsubscribe {
    const q = query(collection(db, 'lives'), where('status', '==', 'live'), limit(50));
    return onSnapshot(
      q,
      (snap) => {
        const lives = snap.docs
          .map((d) => mapDoc(d.id, d.data()))
          .sort((a, b) => b.startedAt - a.startedAt);
        onChange(lives);
      },
      (err) => {
        console.warn('subscribeActiveLives error:', err);
        onChange([]);
      }
    );
  },

  async incrementViewers(liveId: string, delta = 1): Promise<void> {
    const ref = doc(db, 'lives', liveId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data().viewerCount || 0;
    await updateDoc(ref, { viewerCount: Math.max(0, current + delta) });
  },
};
