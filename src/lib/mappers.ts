import type {
  UserProfile,
  Post,
  Comment,
  Message,
  LiveSession,
  Notification,
} from '../types/models';

export function mapProfile(row: any): UserProfile {
  return {
    uid: row.id,
    email: row.email ?? '',
    displayName: row.display_name ?? '',
    username: row.username ?? '',
    photoURL: row.photo_url ?? undefined,
    bio: row.bio ?? undefined,
    followers: row.followers ?? 0,
    following: row.following ?? 0,
    posts: row.posts ?? 0,
    likes: row.likes ?? 0,
    isPrivate: !!row.is_private,
    isVerified: !!row.is_verified,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

export function mapPost(row: any, likedBy: string[] = [], savedBy: string[] = []): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    authorUsername: row.author_username,
    authorDisplayName: row.author_display_name,
    authorPhotoURL: row.author_photo_url ?? undefined,
    mediaType: row.media_type,
    mediaURL: row.media_url,
    thumbnailURL: row.thumbnail_url ?? undefined,
    title: row.title ?? '',
    description: row.description ?? '',
    hashtags: row.hashtags ?? [],
    isPrivate: !!row.is_private,
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    shares: row.shares ?? 0,
    views: row.views ?? 0,
    saves: row.saves ?? 0,
    likedBy,
    savedBy,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

export function mapComment(row: any, likedBy: string[] = [], replies: Comment[] = []): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorUsername: row.author_username,
    authorPhotoURL: row.author_photo_url ?? undefined,
    text: row.text,
    likes: row.likes ?? 0,
    likedBy,
    replies,
    parentId: row.parent_id ?? undefined,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

export function mapMessage(row: any): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    senderUsername: row.sender_username,
    senderPhotoURL: row.sender_photo_url ?? undefined,
    text: row.text,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    read: !!row.read,
  };
}

export function mapLive(row: any): LiveSession {
  return {
    id: row.id,
    hostId: row.host_id,
    hostUsername: row.host_username || 'user',
    hostDisplayName: row.host_display_name || 'Host',
    hostPhotoURL: row.host_photo_url ?? undefined,
    title: row.title || 'LIVE',
    status: row.status === 'ended' ? 'ended' : 'live',
    roomName: row.room_name,
    roomUrl: row.room_url ?? undefined,
    viewerCount: row.viewer_count || 0,
    startedAt: row.started_at ? new Date(row.started_at).getTime() : Date.now(),
    endedAt: row.ended_at ? new Date(row.ended_at).getTime() : undefined,
    provider: row.provider || 'local',
  };
}

export function mapNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    actorId: row.actor_id,
    actorUsername: row.actor_username,
    actorPhotoURL: row.actor_photo_url ?? undefined,
    postId: row.post_id ?? undefined,
    postTitle: row.post_title ?? undefined,
    commentText: row.comment_text ?? undefined,
    read: !!row.read,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

export function toMillis(value: string | number | null | undefined): number {
  if (value == null) return Date.now();
  if (typeof value === 'number') return value;
  return new Date(value).getTime();
}
