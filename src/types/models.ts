export interface UserProfile {
  isVerified: any;
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL?: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
  isPrivate: boolean;
  createdAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  mediaType: 'photo' | 'video';
  mediaURL: string;
  thumbnailURL?: string;
  title: string;
  description: string;
  hashtags: string[];
  isPrivate: boolean;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
  likedBy: string[];
  savedBy: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorPhotoURL?: string;
  text: string;
  likes: number;
  likedBy: string[];
  replies: Comment[];
  parentId?: string;
  createdAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername: string;
  senderPhotoURL?: string;
  text: string;
  createdAt: number;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: { [userId: string]: number };
  createdAt: number;
  updatedAt: number;
}

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

export type LiveStatus = 'live' | 'ended';

export interface LiveSession {
  id: string;
  hostId: string;
  hostUsername: string;
  hostDisplayName: string;
  hostPhotoURL?: string;
  title: string;
  status: LiveStatus;
  roomName: string;
  roomUrl?: string;
  viewerCount: number;
  startedAt: number;
  endedAt?: number;
  provider: 'daily' | 'livekit' | 'local';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'follow' | 'like' | 'comment';
  actorId: string;
  actorUsername: string;
  actorPhotoURL?: string;
  postId?: string;
  postTitle?: string;
  commentText?: string;
  read: boolean;
  createdAt: number;
}

export type ClothingSize = 'P' | 'M' | 'G' | 'GG' | 'XG';

/** Dados sensíveis de entrega — só o próprio streamer lê no client. */
export interface StreamerGiftProfile {
  userId: string;
  fullName: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  shoeSize: string;
  heightCm?: number | null;
  weightKg?: number | null;
  clothingSize?: ClothingSize | null;
  bustCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  footLengthCm?: number | null;
  confirmData: boolean;
  acceptPrivacy: boolean;
  receivingEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}
