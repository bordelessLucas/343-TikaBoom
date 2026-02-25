import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  increment,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebaseconfig';
import { UserProfile } from './authService';

export const usersService = {
  // Buscar usuários por username
  async searchUsers(searchTerm: string, limitCount: number = 20): Promise<UserProfile[]> {
    try {
      const searchLower = searchTerm.toLowerCase();
      const q = query(
        collection(db, 'users'),
        where('username', '>=', searchLower),
        where('username', '<=', searchLower + '\uf8ff'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Buscar usuários por nome
  async searchUsersByName(searchTerm: string, limitCount: number = 20): Promise<UserProfile[]> {
    try {
      const searchLower = searchTerm.toLowerCase();
      const q = query(
        collection(db, 'users'),
        limit(limitCount * 10) // Buscar mais para filtrar localmente
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(user => 
          user.displayName.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower)
        )
        .slice(0, limitCount);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Seguir usuário
  async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      if (followerId === followingId) {
        throw new Error('Você não pode seguir a si mesmo');
      }

      // Verificar se já está seguindo
      const isAlreadyFollowing = await this.isFollowing(followerId, followingId);
      if (isAlreadyFollowing) {
        throw new Error('Você já está seguindo este usuário');
      }

      const { writeBatch } = await import('firebase/firestore');
      const batchInstance = writeBatch(db);
      
      // Buscar documentos atuais para garantir que os arrays existam
      const followerDoc = await getDoc(doc(db, 'users', followerId));
      const followingDoc = await getDoc(doc(db, 'users', followingId));
      
      if (!followerDoc.exists()) {
        throw new Error('Usuário seguidor não encontrado');
      }
      if (!followingDoc.exists()) {
        throw new Error('Usuário a ser seguido não encontrado');
      }

      const followerData = followerDoc.data();
      const followingData = followingDoc.data();
      
      // Verificar novamente se já está seguindo (verificação local)
      const followerFollowingList = (followerData.followingList as string[]) || [];
      if (followerFollowingList.includes(followingId)) {
        throw new Error('Você já está seguindo este usuário');
      }
      
      // Preparar atualizações
      const followerRef = doc(db, 'users', followerId);
      const followingRef = doc(db, 'users', followingId);
      
      // Se os arrays não existem, criar primeiro usando setDoc com merge
      if (!followerData.followingList) {
        await setDoc(followerRef, { followingList: [] }, { merge: true });
      }
      if (!followingData.followersList) {
        await setDoc(followingRef, { followersList: [] }, { merge: true });
      }
      
      // Agora fazer as atualizações com arrayUnion
      batchInstance.update(followerRef, {
        following: increment(1),
        followingList: arrayUnion(followingId),
      });
      
      batchInstance.update(followingRef, {
        followers: increment(1),
        followersList: arrayUnion(followerId),
      });
      
      await batchInstance.commit();

      // Criar notificação de follow
      try {
        const { notificationsService } = await import('./notificationsService');
        const { authService } = await import('./authService');
        const followerProfile = await authService.getUserProfile(followerId);
        if (followerProfile) {
          await notificationsService.createNotification({
            userId: followingId,
            type: 'follow',
            actorId: followerId,
            actorUsername: followerProfile.username,
            actorPhotoURL: followerProfile.photoURL,
            read: false,
          });
        }
      } catch (notifError) {
        console.error('⚠️ Erro ao criar notificação de follow:', notifError);
        // Não falhar a operação de follow por causa da notificação
      }
    } catch (error: any) {
      console.error('Erro ao seguir usuário:', {
        followerId,
        followingId,
        error: error.message,
        code: error.code,
      });
      throw new Error(error.message || 'Erro ao seguir usuário');
    }
  },

  // Deixar de seguir usuário
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      if (followerId === followingId) {
        throw new Error('Operação inválida');
      }

      // Verificar se está seguindo
      const isFollowing = await this.isFollowing(followerId, followingId);
      if (!isFollowing) {
        throw new Error('Você não está seguindo este usuário');
      }

      const { writeBatch } = await import('firebase/firestore');
      const batchInstance = writeBatch(db);
      
      // Remover dos seguindo do follower
      const followerRef = doc(db, 'users', followerId);
      batchInstance.update(followerRef, {
        following: increment(-1),
        followingList: arrayRemove(followingId),
      });
      
      // Remover dos seguidores do following
      const followingRef = doc(db, 'users', followingId);
      batchInstance.update(followingRef, {
        followers: increment(-1),
        followersList: arrayRemove(followerId),
      });
      
      await batchInstance.commit();
    } catch (error: any) {
      console.error('Erro ao deixar de seguir usuário:', {
        followerId,
        followingId,
        error: error.message,
        code: error.code,
      });
      throw new Error(error.message || 'Erro ao deixar de seguir usuário');
    }
  },

  // Verificar se está seguindo
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', followerId));
      if (userDoc.exists()) {
        const user = userDoc.data() as UserProfile & { followingList?: string[] };
        return user.followingList?.includes(followingId) || false;
      }
      return false;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter seguidores
  async getFollowers(userId: string): Promise<UserProfile[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const user = userDoc.data() as UserProfile & { followersList?: string[] };
        const followersIds = user.followersList || [];
        
        if (followersIds.length === 0) return [];
        
        const followers: UserProfile[] = [];
        for (const id of followersIds) {
          const followerDoc = await getDoc(doc(db, 'users', id));
          if (followerDoc.exists()) {
            followers.push(followerDoc.data() as UserProfile);
          }
        }
        return followers;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter seguindo
  async getFollowing(userId: string): Promise<UserProfile[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const user = userDoc.data() as UserProfile & { followingList?: string[] };
        const followingIds = user.followingList || [];
        
        if (followingIds.length === 0) return [];
        
        const following: UserProfile[] = [];
        for (const id of followingIds) {
          const followingDoc = await getDoc(doc(db, 'users', id));
          if (followingDoc.exists()) {
            following.push(followingDoc.data() as UserProfile);
          }
        }
        return following;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter sugestões de usuários (usuários que você não segue)
  async getSuggestedUsers(currentUserId: string, limitCount: number = 10): Promise<UserProfile[]> {
    try {
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      const followingList: string[] = currentUserDoc.exists() 
        ? (currentUserDoc.data() as UserProfile & { followingList?: string[] }).followingList || []
        : [];
      
      const q = query(collection(db, 'users'), limit(limitCount * 3));
      const snapshot = await getDocs(q);
      
      return snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(user => 
          user.uid !== currentUserId && 
          !followingList.includes(user.uid)
        )
        .sort((a, b) => b.followers - a.followers)
        .slice(0, limitCount);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
};
