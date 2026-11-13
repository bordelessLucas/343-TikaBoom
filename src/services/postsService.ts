import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  arrayUnion,
  arrayRemove,
  updateDoc,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import { toByteArray } from 'base64-js';
import { db, storage } from '../lib/firebaseconfig';

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
  likedBy: string[]; // Array de UIDs que curtiram
  savedBy: string[]; // Array de UIDs que salvaram
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
  parentId?: string; // Para respostas
  createdAt: number;
}

export const postsService = {
  // Criar novo post
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'shares' | 'views' | 'saves' | 'likedBy' | 'savedBy'>): Promise<string> {
    try {
      const postRef = doc(collection(db, 'posts'));
      const post: Post = {
        id: postRef.id,
        ...postData,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        saves: 0,
        likedBy: [],
        savedBy: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await setDoc(postRef, post);
      
      // Incrementar contador de posts do usuário
      const { updateDoc: updateUserDoc } = await import('firebase/firestore');
      await updateUserDoc(doc(db, 'users', postData.authorId), {
        posts: increment(1),
      });
      
      return postRef.id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  /** Lê URI local (file://, content://, ph://) como Blob via XHR — mais estável no RN */
  async _uriToBlob(uri: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Falha ao ler mídia (HTTP ${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error('Falha ao ler arquivo local'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  },

  async _uriToBytes(uri: string): Promise<Uint8Array> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return toByteArray(base64);
  },

  // Upload de mídia
  async uploadMedia(uid: string, uri: string, type: 'photo' | 'video'): Promise<{ mediaURL: string; thumbnailURL?: string }> {
    try {
      console.log('📤 Iniciando upload de mídia...', { uid, type, uri: uri.substring(0, 80) });

      const { auth } = await import('../lib/firebaseconfig');
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado. Faça login para publicar.');
      }

      let localUri = uri;
      if (localUri && !localUri.startsWith('file://') && !localUri.startsWith('content://') && !localUri.startsWith('ph://') && !localUri.startsWith('http')) {
        localUri = `file://${localUri}`;
      }

      const fileInfo = await FileSystem.getInfoAsync(localUri).catch(() => null);
      if (fileInfo && 'exists' in fileInfo && !fileInfo.exists) {
        throw new Error('Arquivo não encontrado. Grave novamente.');
      }
      if (fileInfo && 'size' in fileInfo && typeof fileInfo.size === 'number' && fileInfo.size > 100 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 100MB');
      }

      const fileExtension = type === 'video' ? 'mp4' : (localUri.includes('.png') ? 'png' : 'jpg');
      const fileName = `${type}_${uid}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `posts/${uid}/${fileName}`);

      const metadata = {
        contentType: type === 'video' ? 'video/mp4' : (fileExtension === 'png' ? 'image/png' : 'image/jpeg'),
        customMetadata: {
          uploadedBy: uid,
          uploadedAt: Date.now().toString(),
        },
      };

      let body: Blob | Uint8Array;
      try {
        body = await this._uriToBlob(localUri);
        console.log('✅ Blob pronto:', (body as Blob).size, 'bytes');
      } catch (blobErr) {
        console.warn('⚠️ Blob falhou, usando base64...', blobErr);
        body = await this._uriToBytes(localUri);
        console.log('✅ Bytes prontos:', body.length);
      }

      const uploadTask = uploadBytesResumable(storageRef, body, metadata);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          uploadTask.cancel();
          reject(new Error('Upload timeout após 120 segundos'));
        }, 120000);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`📊 Progresso: ${Math.round(progress)}%`);
          },
          (error) => {
            clearTimeout(timeout);
            reject(error);
          },
          () => {
            clearTimeout(timeout);
            resolve();
          }
        );
      });

      const downloadURL = await getDownloadURL(storageRef);
      const thumbnailURL = type === 'video' ? downloadURL : undefined;
      return { mediaURL: downloadURL, thumbnailURL };
    } catch (error: any) {
      console.error('❌ Erro no upload:', error?.code, error?.message);

      if (error.code === 'storage/unauthorized') {
        throw new Error(
          'Storage bloqueou o upload. Publique as regras em storage.rules no Firebase Console (Storage → Rules).'
        );
      }
      if (error.code === 'storage/canceled') {
        throw new Error('Upload cancelado.');
      }
      if (error.code === 'storage/unknown' || error.code === 'storage/retry-limit-exceeded') {
        throw new Error(
          'Erro no Firebase Storage. Confirme que as regras estão publicadas e que você está logado.'
        );
      }
      if (error.message?.includes('auth')) {
        throw new Error('Você precisa estar logado para publicar posts.');
      }
      if (error.message?.includes('não encontrado') || error.message?.includes('not found')) {
        throw new Error('Arquivo não encontrado. Tente capturar novamente.');
      }

      throw new Error(error.message || 'Erro ao fazer upload da mídia');
    }
  },

  // Obter post por ID
  async getPost(postId: string): Promise<Post | null> {
    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        const postData = postDoc.data() as Post;
        // Garantir que os arrays existem
        return {
          ...postData,
          likedBy: postData.likedBy || [],
          savedBy: postData.savedBy || [],
          likes: postData.likes || 0,
          saves: postData.saves || 0,
          comments: postData.comments || 0,
          shares: postData.shares || 0,
          views: postData.views || 0,
        };
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter posts do feed (públicos)
  async getFeedPosts(limitCount: number = 20): Promise<Post[]> {
    try {
      const q = query(
        collection(db, 'posts'),
        where('isPrivate', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Post);
    } catch (error: any) {
      // Fallback sem índice composto: ordena no cliente
      try {
        const fallback = query(
          collection(db, 'posts'),
          where('isPrivate', '==', false),
          limit(limitCount)
        );
        const snapshot = await getDocs(fallback);
        return snapshot.docs
          .map(doc => doc.data() as Post)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      } catch (fallbackError: any) {
        console.warn('Feed indisponível:', fallbackError?.message || error?.message || error);
        return [];
      }
    }
  },

  // Obter posts de um usuário
  async getUserPosts(userId: string, includePrivate: boolean = false): Promise<Post[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
      ];
      
      if (!includePrivate) {
        constraints.splice(1, 0, where('isPrivate', '==', false));
      }
      
      const q = query(collection(db, 'posts'), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Post);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Buscar posts por hashtag
  async searchPostsByHashtag(hashtag: string): Promise<Post[]> {
    try {
      const q = query(
        collection(db, 'posts'),
        where('hashtags', 'array-contains', hashtag.toLowerCase()),
        where('isPrivate', '==', false),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Post);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Incrementar visualizações
  async incrementViews(postId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        views: increment(1),
      });
    } catch (error: any) {
      console.error('Erro ao incrementar visualizações:', error);
    }
  },

  // Curtir/descurtir post
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    try {
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      if (!postId) {
        throw new Error('ID do post não fornecido');
      }

      console.log('🔄 Iniciando toggleLike:', { postId, userId });

      // Buscar o post atual
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (!postDoc.exists()) {
        throw new Error('Post não encontrado');
      }
      
      const post = postDoc.data() as Post;
      // Garantir que likedBy existe e é um array
      const likedBy = post.likedBy || [];
      const currentLikes = post.likes || 0;
      const isLiked = likedBy.includes(userId);
      
      console.log('📊 Estado atual do post:', {
        isLiked,
        currentLikes,
        likedByCount: likedBy.length,
      });
      
      if (isLiked) {
        // Remover like
        console.log('❌ Removendo like...');
        await updateDoc(doc(db, 'posts', postId), {
          likedBy: arrayRemove(userId),
          likes: increment(-1),
        });
        
        // Aguardar um pouco para garantir que o Firestore processou
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Recarregar o post para confirmar
        const updatedDoc = await getDoc(doc(db, 'posts', postId));
        if (!updatedDoc.exists()) {
          throw new Error('Post não encontrado após atualização');
        }
        
        const updatedPost = updatedDoc.data() as Post;
        const newLikedBy = updatedPost.likedBy || [];
        const newLikes = updatedPost.likes || 0;
        
        console.log('✅ Like removido e confirmado:', {
          newLikes,
          newLikedByCount: newLikedBy.length,
          userInArray: newLikedBy.includes(userId),
        });
        
        return { liked: false, likes: newLikes };
      } else {
        // Adicionar like
        console.log('❤️ Adicionando like...');
        await updateDoc(doc(db, 'posts', postId), {
          likedBy: arrayUnion(userId),
          likes: increment(1),
        });
        
        // Aguardar um pouco para garantir que o Firestore processou
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Recarregar o post para confirmar
        const updatedDoc = await getDoc(doc(db, 'posts', postId));
        if (!updatedDoc.exists()) {
          throw new Error('Post não encontrado após atualização');
        }
        
        const updatedPost = updatedDoc.data() as Post;
        const newLikedBy = updatedPost.likedBy || [];
        const newLikes = updatedPost.likes || 0;
        
        console.log('✅ Like adicionado e confirmado:', {
          newLikes,
          newLikedByCount: newLikedBy.length,
          userInArray: newLikedBy.includes(userId),
        });

        // Criar notificação de like (se não for o próprio autor)
        try {
          if (updatedPost.authorId !== userId) {
            const { notificationsService } = await import('./notificationsService');
            const { authService } = await import('./authService');
            const actorProfile = await authService.getUserProfile(userId);
            if (actorProfile) {
              await notificationsService.createNotification({
                userId: updatedPost.authorId,
                type: 'like',
                actorId: userId,
                actorUsername: actorProfile.username,
                actorPhotoURL: actorProfile.photoURL,
                postId: postId,
                postTitle: updatedPost.title,
                read: false,
              });
            }
          }
        } catch (notifError) {
          console.error('⚠️ Erro ao criar notificação de like:', notifError);
          // Não falhar a operação de like por causa da notificação
        }
        
        return { liked: true, likes: newLikes };
      }
    } catch (error: any) {
      console.error('❌ Erro detalhado ao curtir post:', {
        postId,
        userId,
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw new Error(error.message || 'Erro ao curtir post');
    }
  },

  // Salvar/remover dos favoritos
  async toggleSave(postId: string, userId: string): Promise<{ saved: boolean; saves: number }> {
    try {
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (!postDoc.exists()) {
        throw new Error('Post não encontrado');
      }
      
      const post = postDoc.data() as Post;
      // Garantir que savedBy existe e é um array
      const savedBy = post.savedBy || [];
      const isSaved = savedBy.includes(userId);
      
      if (isSaved) {
        // Remover dos salvos
        await updateDoc(doc(db, 'posts', postId), {
          savedBy: arrayRemove(userId),
          saves: increment(-1),
        });
        return { saved: false, saves: Math.max(0, (post.saves || 0) - 1) };
      } else {
        // Adicionar aos salvos
        await updateDoc(doc(db, 'posts', postId), {
          savedBy: arrayUnion(userId),
          saves: increment(1),
        });
        return { saved: true, saves: (post.saves || 0) + 1 };
      }
    } catch (error: any) {
      console.error('Erro detalhado ao salvar post:', {
        postId,
        userId,
        error: error.message,
        code: error.code,
      });
      throw new Error(error.message || 'Erro ao salvar post');
    }
  },

  // Compartilhar post
  async sharePost(postId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'posts', postId), {
        shares: increment(1),
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Adicionar comentário
  async addComment(postId: string, commentData: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'replies'>): Promise<string> {
    try {
      const commentRef = doc(collection(db, 'comments'));
      const comment: Comment = {
        id: commentRef.id,
        ...commentData,
        likes: 0,
        likedBy: [],
        replies: [],
        createdAt: Date.now(),
      };
      
      await setDoc(commentRef, comment);
      
      // Incrementar contador de comentários do post
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (!postDoc.exists()) {
        throw new Error('Post não encontrado');
      }
      const post = postDoc.data() as Post;
      
      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1),
      });

      // Criar notificação de comentário (se não for o próprio autor)
      try {
        if (post.authorId !== commentData.authorId) {
          const { notificationsService } = await import('./notificationsService');
          await notificationsService.createNotification({
            userId: post.authorId,
            type: 'comment',
            actorId: commentData.authorId,
            actorUsername: commentData.authorUsername,
            actorPhotoURL: commentData.authorPhotoURL,
            postId: postId,
            postTitle: post.title,
            commentText: commentData.text,
            read: false,
          });
        }
      } catch (notifError) {
        console.error('⚠️ Erro ao criar notificação de comentário:', notifError);
        // Não falhar a operação de comentário por causa da notificação
      }
      
      return commentRef.id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter comentários de um post
  async getPostComments(postId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        where('parentId', '==', null),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map(doc => doc.data() as Comment);
      
      // Buscar respostas para cada comentário
      for (const comment of comments) {
        const repliesQuery = query(
          collection(db, 'comments'),
          where('parentId', '==', comment.id),
          orderBy('createdAt', 'asc')
        );
        const repliesSnapshot = await getDocs(repliesQuery);
        comment.replies = repliesSnapshot.docs.map(doc => doc.data() as Comment);
      }
      
      return comments;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Curtir comentário
  async toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    try {
      const commentDoc = await getDoc(doc(db, 'comments', commentId));
      if (!commentDoc.exists()) {
        throw new Error('Comentário não encontrado');
      }
      
      const comment = commentDoc.data() as Comment;
      const isLiked = comment.likedBy.includes(userId);
      
      if (isLiked) {
        await updateDoc(doc(db, 'comments', commentId), {
          likedBy: arrayRemove(userId),
          likes: increment(-1),
        });
        return { liked: false, likes: comment.likes - 1 };
      } else {
        await updateDoc(doc(db, 'comments', commentId), {
          likedBy: arrayUnion(userId),
          likes: increment(1),
        });
        return { liked: true, likes: comment.likes + 1 };
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter trending hashtags
  async getTrendingHashtags(limitCount: number = 10): Promise<{ hashtag: string; count: number }[]> {
    try {
      // Buscar todos os posts públicos
      const q = query(
        collection(db, 'posts'),
        where('isPrivate', '==', false),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );
      
      const snapshot = await getDocs(q);
      const hashtagCount: { [key: string]: number } = {};
      
      snapshot.docs.forEach(doc => {
        const post = doc.data() as Post;
        post.hashtags.forEach(hashtag => {
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

  // Obter posts curtidos por um usuário
  async getLikedPosts(userId: string): Promise<Post[]> {
    try {
      // Buscar apenas posts públicos (respeitando regras de segurança)
      const publicPosts = await this.getFeedPosts(500);
      
      // Filtrar posts curtidos pelo usuário
      const likedPosts = publicPosts
        .filter(post => {
          const likedBy = post.likedBy || [];
          return likedBy.includes(userId);
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50);
      
      // Também buscar posts privados do próprio usuário que ele curtiu
      try {
        const userPrivatePostsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', userId),
          where('isPrivate', '==', true),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        
        const privateSnapshot = await getDocs(userPrivatePostsQuery);
        const privatePosts = privateSnapshot.docs.map(doc => {
          const postData = doc.data() as Post;
          return {
            ...postData,
            likedBy: postData.likedBy || [],
            savedBy: postData.savedBy || [],
          };
        });
        
        const privateLiked = privatePosts
          .filter(post => {
            const likedBy = post.likedBy || [];
            return likedBy.includes(userId);
          })
          .sort((a, b) => b.createdAt - a.createdAt);
        
        // Combinar e ordenar
        const allLikedPosts = [...likedPosts, ...privateLiked]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 50);
        
        return allLikedPosts;
      } catch (privateError) {
        // Se não conseguir buscar posts privados, retornar apenas públicos
        console.warn('Não foi possível buscar posts privados curtidos:', privateError);
        return likedPosts;
      }
    } catch (error: any) {
      console.error('Erro ao buscar posts curtidos:', error);
      throw new Error(error.message || 'Erro ao buscar posts curtidos');
    }
  },

  // Obter posts salvos por um usuário
  async getSavedPosts(userId: string): Promise<Post[]> {
    try {
      // Buscar apenas posts públicos (respeitando regras de segurança)
      const publicPosts = await this.getFeedPosts(500);
      
      // Filtrar posts salvos pelo usuário
      const savedPosts = publicPosts
        .filter(post => {
          const savedBy = post.savedBy || [];
          return savedBy.includes(userId);
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50);
      
      // Também buscar posts privados do próprio usuário que ele salvou
      try {
        const userPrivatePostsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', userId),
          where('isPrivate', '==', true),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        
        const privateSnapshot = await getDocs(userPrivatePostsQuery);
        const privatePosts = privateSnapshot.docs.map(doc => {
          const postData = doc.data() as Post;
          return {
            ...postData,
            likedBy: postData.likedBy || [],
            savedBy: postData.savedBy || [],
          };
        });
        
        const privateSaved = privatePosts
          .filter(post => {
            const savedBy = post.savedBy || [];
            return savedBy.includes(userId);
          })
          .sort((a, b) => b.createdAt - a.createdAt);
        
        // Combinar e ordenar
        const allSavedPosts = [...savedPosts, ...privateSaved]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 50);
        
        return allSavedPosts;
      } catch (privateError) {
        // Se não conseguir buscar posts privados, retornar apenas públicos
        console.warn('Não foi possível buscar posts privados salvos:', privateError);
        return savedPosts;
      }
    } catch (error: any) {
      console.error('Erro ao buscar posts salvos:', error);
      throw new Error(error.message || 'Erro ao buscar posts salvos');
    }
  },
};
