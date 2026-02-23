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

  // Upload de mídia
  async uploadMedia(uid: string, uri: string, type: 'photo' | 'video'): Promise<{ mediaURL: string; thumbnailURL?: string }> {
    try {
      console.log('📤 Iniciando upload de mídia...', { uid, type, uri: uri.substring(0, 50) });
      
      // Verificar se o usuário está autenticado
      const { auth } = await import('../lib/firebaseconfig');
      if (!auth.currentUser) {
        throw new Error('Usuário não autenticado. Faça login para publicar.');
      }
      
      // Ler o arquivo usando expo-file-system (compatível com React Native)
      console.log('📖 Lendo arquivo local...');
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('Arquivo não encontrado');
      }
      
      // Criar referência no Storage
      const fileExtension = type === 'video' ? 'mp4' : (uri.includes('.png') ? 'png' : 'jpg');
      const fileName = `${type}_${uid}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `posts/${fileName}`);
      
      console.log('📁 Fazendo upload para:', `posts/${fileName}`);
      console.log('📁 Tamanho do arquivo:', fileInfo.size, 'bytes');
      
      // Verificar tamanho do arquivo (máximo 50MB)
      if (fileInfo.size && fileInfo.size > 50 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 50MB');
      }
      
      // Metadata
      const metadata = {
        contentType: type === 'video' ? 'video/mp4' : (fileExtension === 'png' ? 'image/png' : 'image/jpeg'),
        customMetadata: {
          uploadedBy: uid,
          uploadedAt: Date.now().toString(),
        },
      };
      
      console.log('📋 Metadata:', metadata);
      
      // Ler o arquivo como base64 e converter para Uint8Array
      console.log('📖 Lendo arquivo local como base64...');
      let base64: string;
      try {
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('✅ Arquivo lido como base64, tamanho:', base64.length, 'caracteres');
      } catch (readError: any) {
        console.error('❌ Erro ao ler arquivo:', readError);
        throw new Error(`Erro ao ler arquivo: ${readError.message}`);
      }
      
      // Converter base64 para Uint8Array usando base64-js (compatível com React Native)
      console.log('🔄 Convertendo base64 para bytes...');
      let bytes: Uint8Array;
      try {
        bytes = toByteArray(base64);
        console.log('✅ Bytes convertidos:', bytes.length, 'bytes');
      } catch (convertError: any) {
        console.error('❌ Erro ao converter base64:', convertError);
        throw new Error(`Erro ao converter arquivo: ${convertError.message}`);
      }
      
      console.log('📤 Iniciando upload resumable...');
      console.log('📤 Storage ref path:', storageRef.fullPath);
      console.log('📤 Auth user:', auth.currentUser?.uid);
      
      // Usar uploadBytesResumable com timeout
      const uploadTask = uploadBytesResumable(storageRef, bytes, metadata);
      
      // Criar Promise com timeout
      const uploadPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          uploadTask.cancel();
          reject(new Error('Upload timeout após 60 segundos'));
        }, 60000); // 60 segundos timeout
        
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`📊 Progresso: ${Math.round(progress)}%`);
            
            if (progress === 100) {
              clearTimeout(timeout);
            }
          },
          (error) => {
            clearTimeout(timeout);
            console.error('❌ Erro no upload:', error);
            reject(error);
          },
          () => {
            clearTimeout(timeout);
            console.log('✅ Upload concluído!');
            resolve();
          }
        );
      });
      
      await uploadPromise;
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log('✅ URL obtida:', downloadURL.substring(0, 50) + '...');
      
      // Para vídeos, gerar thumbnail (simplificado - você pode melhorar isso)
      let thumbnailURL: string | undefined;
      if (type === 'video') {
        // Thumbnail será a mesma URL por enquanto (você pode implementar geração de thumbnail)
        thumbnailURL = downloadURL;
      }
      
      return { mediaURL: downloadURL, thumbnailURL };
    } catch (error: any) {
      console.error('❌ Erro no upload:', error);
      console.error('❌ Erro detalhado no upload:', JSON.stringify({
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack,
      }));
      
      // Mensagens de erro mais específicas
      if (error.code === 'storage/unauthorized') {
        throw new Error('Acesso negado. Verifique as regras de segurança do Firebase Storage.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload cancelado.');
      } else if (error.code === 'storage/unknown') {
        throw new Error('Erro desconhecido no Storage. Verifique:\n1. Regras de segurança do Firebase Storage\n2. Se o usuário está autenticado\n3. Conexão com internet\n4. Tamanho do arquivo (máx 50MB)');
      } else if (error.message?.includes('auth')) {
        throw new Error('Você precisa estar logado para publicar posts.');
      } else if (error.message?.includes('não encontrado') || error.message?.includes('not found')) {
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
      throw new Error(error.message);
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
      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1),
      });
      
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
