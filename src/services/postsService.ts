import { supabase, auth, refreshAuthUser } from '../lib/supabase';
import { mapPost, mapComment } from '../lib/mappers';
import { uploadLocalFile } from '../lib/storageUpload';
import type { Post, Comment } from '../types/models';

export type { Post, Comment };

async function enrichPosts(rows: any[]): Promise<Post[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const uid = auth.currentUser?.uid;

  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase.from('post_likes').select('post_id, user_id').in('post_id', ids),
    supabase.from('post_saves').select('post_id, user_id').in('post_id', ids),
  ]);

  const likesByPost: Record<string, string[]> = {};
  const savesByPost: Record<string, string[]> = {};
  (likes || []).forEach((l) => {
    (likesByPost[l.post_id] ||= []).push(l.user_id);
  });
  (saves || []).forEach((s) => {
    (savesByPost[s.post_id] ||= []).push(s.user_id);
  });

  // Preferir só o current user nos arrays se quiser economizar; UI usa includes(uid)
  return rows.map((row) => {
    const likedBy = likesByPost[row.id] || [];
    const savedBy = savesByPost[row.id] || [];
    // Se não carregamos todos, pelo menos incluir o current user quando soubermos
    if (uid && !likedBy.includes(uid)) {
      // already correct if not liked
    }
    return mapPost(row, likedBy, savedBy);
  });
}

export const postsService = {
  async createPost(
    postData: Omit<
      Post,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'likes'
      | 'comments'
      | 'shares'
      | 'views'
      | 'saves'
      | 'likedBy'
      | 'savedBy'
    >
  ): Promise<string> {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: postData.authorId,
        author_username: postData.authorUsername,
        author_display_name: postData.authorDisplayName,
        author_photo_url: postData.authorPhotoURL || null,
        media_type: postData.mediaType,
        media_url: postData.mediaURL,
        thumbnail_url: postData.thumbnailURL || null,
        title: postData.title,
        description: postData.description,
        hashtags: postData.hashtags || [],
        is_private: postData.isPrivate,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id;
  },

  async uploadMedia(
    uid: string,
    uri: string,
    type: 'photo' | 'video'
  ): Promise<{ mediaURL: string; thumbnailURL?: string }> {
    try {
      await refreshAuthUser();
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado. Faça login para publicar.');
      }

      const fileExtension =
        type === 'video' ? 'mp4' : uri.toLowerCase().includes('.png') ? 'png' : 'jpg';
      const path = `${uid}/${type}_${Date.now()}.${fileExtension}`;
      const contentType =
        type === 'video'
          ? 'video/mp4'
          : fileExtension === 'png'
            ? 'image/png'
            : 'image/jpeg';

      const downloadURL = await uploadLocalFile({
        bucket: 'media',
        path,
        uri,
        contentType,
      });

      const thumbnailURL = type === 'video' ? downloadURL : undefined;
      return { mediaURL: downloadURL, thumbnailURL };
    } catch (error: any) {
      console.error('Erro no upload:', error?.message);
      throw new Error(error.message || 'Erro ao fazer upload da mídia');
    }
  },

  async getPost(postId: string): Promise<Post | null> {
    const { data, error } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const [post] = await enrichPosts([data]);
    return post;
  },

  async getFeedPosts(limitCount: number = 20): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(limitCount);
      if (error) throw error;
      return enrichPosts(data || []);
    } catch (error: any) {
      console.warn('Feed indisponível:', error?.message);
      return [];
    }
  },

  async getUserPosts(userId: string, includePrivate: boolean = false): Promise<Post[]> {
    try {
      let q = supabase
        .from('posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });
      if (!includePrivate) q = q.eq('is_private', false);
      const { data, error } = await q;
      if (error) throw error;
      return enrichPosts(data || []);
    } catch (error: any) {
      console.warn('getUserPosts indisponível:', error?.message);
      return [];
    }
  },

  async searchPostsByHashtag(hashtag: string): Promise<Post[]> {
    const tag = hashtag.toLowerCase();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .contains('hashtags', [tag])
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return enrichPosts(data || []);
  },

  async incrementViews(postId: string): Promise<void> {
    try {
      const { data } = await supabase.from('posts').select('views').eq('id', postId).single();
      if (!data) return;
      await supabase
        .from('posts')
        .update({ views: (data.views || 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', postId);
    } catch (error: any) {
      console.error('Erro ao incrementar visualizações:', error);
    }
  },

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    if (!userId) throw new Error('Usuário não autenticado');
    if (!postId) throw new Error('ID do post não fornecido');

    const { data: existing } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      if (error) throw new Error(error.message);

      try {
        const post = await this.getPost(postId);
        if (post && post.authorId !== userId) {
          const { notificationsService } = await import('./notificationsService');
          const { authService } = await import('./authService');
          const actorProfile = await authService.getUserProfile(userId);
          if (actorProfile) {
            await notificationsService.createNotification({
              userId: post.authorId,
              type: 'like',
              actorId: userId,
              actorUsername: actorProfile.username,
              actorPhotoURL: actorProfile.photoURL,
              postId,
              postTitle: post.title,
              read: false,
            });
          }
        }
      } catch (notifError) {
        console.error('Erro ao criar notificação de like:', notifError);
      }
    }

    const { data: post } = await supabase.from('posts').select('likes').eq('id', postId).single();
    return { liked: !existing, likes: post?.likes ?? 0 };
  },

  async toggleSave(postId: string, userId: string): Promise<{ saved: boolean; saves: number }> {
    if (!userId) throw new Error('Usuário não autenticado');

    const { data: existing } = await supabase
      .from('post_saves')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('post_saves')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('post_saves').insert({ post_id: postId, user_id: userId });
      if (error) throw new Error(error.message);
    }

    const { data: post } = await supabase.from('posts').select('saves').eq('id', postId).single();
    return { saved: !existing, saves: post?.saves ?? 0 };
  },

  async sharePost(postId: string): Promise<void> {
    const { data } = await supabase.from('posts').select('shares').eq('id', postId).single();
    if (!data) return;
    const { error } = await supabase
      .from('posts')
      .update({ shares: (data.shares || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', postId);
    if (error) throw new Error(error.message);
  },

  async addComment(
    postId: string,
    commentData: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'replies'>
  ): Promise<string> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: commentData.authorId,
        author_username: commentData.authorUsername,
        author_photo_url: commentData.authorPhotoURL || null,
        text: commentData.text,
        parent_id: commentData.parentId || null,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);

    try {
      const post = await this.getPost(postId);
      if (post && post.authorId !== commentData.authorId) {
        const { notificationsService } = await import('./notificationsService');
        await notificationsService.createNotification({
          userId: post.authorId,
          type: 'comment',
          actorId: commentData.authorId,
          actorUsername: commentData.authorUsername,
          actorPhotoURL: commentData.authorPhotoURL,
          postId,
          postTitle: post.title,
          commentText: commentData.text,
          read: false,
        });
      }
    } catch (notifError) {
      console.error('Erro ao criar notificação de comentário:', notifError);
    }

    return data.id;
  },

  async getPostComments(postId: string): Promise<Comment[]> {
    const { data: top, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);

    const comments: Comment[] = [];
    for (const row of top || []) {
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('user_id')
        .eq('comment_id', row.id);
      const likedBy = (likes || []).map((l) => l.user_id);

      const { data: replies } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', row.id)
        .order('created_at', { ascending: true });

      const mappedReplies: Comment[] = [];
      for (const r of replies || []) {
        const { data: rLikes } = await supabase
          .from('comment_likes')
          .select('user_id')
          .eq('comment_id', r.id);
        mappedReplies.push(mapComment(r, (rLikes || []).map((l) => l.user_id)));
      }

      comments.push(mapComment(row, likedBy, mappedReplies));
    }
    return comments;
  },

  async toggleCommentLike(
    commentId: string,
    userId: string
  ): Promise<{ liked: boolean; likes: number }> {
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: userId });
      if (error) throw new Error(error.message);
    }

    const { data } = await supabase.from('comments').select('likes').eq('id', commentId).single();
    return { liked: !existing, likes: data?.likes ?? 0 };
  },

  async getTrendingHashtags(limitCount: number = 10): Promise<{ hashtag: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('hashtags')
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;

      const hashtagCount: Record<string, number> = {};
      (data || []).forEach((row) => {
        (row.hashtags || []).forEach((hashtag: string) => {
          hashtagCount[hashtag] = (hashtagCount[hashtag] || 0) + 1;
        });
      });

      return Object.entries(hashtagCount)
        .map(([hashtag, count]) => ({ hashtag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limitCount);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async getLikedPosts(userId: string): Promise<Post[]> {
    try {
      const { data: likes, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .limit(50);
      if (error) throw error;
      const ids = (likes || []).map((l) => l.post_id);
      if (!ids.length) return [];

      const { data: posts, error: pErr } = await supabase
        .from('posts')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      if (pErr) throw pErr;
      return enrichPosts(posts || []);
    } catch (error: any) {
      console.warn('getLikedPosts indisponível:', error?.message);
      return [];
    }
  },

  async getSavedPosts(userId: string): Promise<Post[]> {
    try {
      const { data: saves, error } = await supabase
        .from('post_saves')
        .select('post_id')
        .eq('user_id', userId)
        .limit(50);
      if (error) throw error;
      const ids = (saves || []).map((s) => s.post_id);
      if (!ids.length) return [];

      const { data: posts, error: pErr } = await supabase
        .from('posts')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      if (pErr) throw pErr;
      return enrichPosts(posts || []);
    } catch (error: any) {
      console.warn('getSavedPosts indisponível:', error?.message);
      return [];
    }
  },
};
