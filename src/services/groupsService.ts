import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebaseconfig';
import { UserProfile } from './authService';

export interface Group {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  interests: string[];
  createdAt: number;
  lastMessage?: string;
  lastMessageTime?: number;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderUsername: string;
  senderPhotoURL?: string;
  text: string;
  createdAt: number;
}

export const groupsService = {
  async createGroup(
    ownerId: string,
    name: string,
    description: string,
    interests: string[],
  ): Promise<string> {
    const groupRef = doc(collection(db, 'groups'));
    const group: Group = {
      id: groupRef.id,
      name: name.trim(),
      description: description.trim(),
      ownerId,
      members: [ownerId],
      interests,
      createdAt: Date.now(),
    };

    await setDoc(groupRef, group);
    return groupRef.id;
  },

  async getUserGroups(userId: string): Promise<Group[]> {
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as Group);
  },

  async getGroupsByInterest(interest: string, limitCount = 20): Promise<Group[]> {
    const q = query(
      collection(db, 'groups'),
      where('interests', 'array-contains', interest.toLowerCase()),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as Group);
  },

  async joinGroup(groupId: string, userId: string): Promise<void> {
    const ref = doc(db, 'groups', groupId);
    await updateDoc(ref, {
      members: arrayUnion(userId),
    });
  },

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const ref = doc(db, 'groups', groupId);
    await updateDoc(ref, {
      members: arrayRemove(userId),
    });
  },

  async getGroup(groupId: string): Promise<Group | null> {
    const ref = doc(db, 'groups', groupId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as Group) : null;
  },

  async sendGroupMessage(
    groupId: string,
    senderId: string,
    text: string,
    senderUsername: string,
    senderPhotoURL?: string,
  ): Promise<string> {
    const messageRef = doc(collection(db, 'groupMessages'));
    const message: GroupMessage = {
      id: messageRef.id,
      groupId,
      senderId,
      senderUsername,
      text: text.trim(),
      createdAt: Date.now(),
      senderPhotoURL,
    };

    await setDoc(messageRef, message);

    // atualizar último recado no grupo
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      lastMessage: message.text,
      lastMessageTime: message.createdAt,
    });

    return messageRef.id;
  },

  async getGroupMessages(groupId: string, limitCount = 50): Promise<GroupMessage[]> {
    const q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    );

    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as GroupMessage)
      .reverse();
  },
};

