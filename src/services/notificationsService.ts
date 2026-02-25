import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebaseconfig';

export interface Notification {
  id: string;
  userId: string; // Usuário que recebe a notificação
  type: 'follow' | 'like' | 'comment';
  actorId: string; // Usuário que realizou a ação
  actorUsername: string;
  actorPhotoURL?: string;
  postId?: string; // ID do post (para like e comment)
  postTitle?: string; // Título do post (para like e comment)
  commentText?: string; // Texto do comentário (para comment)
  read: boolean;
  createdAt: number;
}

export const notificationsService = {
  // Criar notificação
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const newNotificationRef = doc(notificationsRef);
      
      const notificationData = {
        ...notification,
        id: newNotificationRef.id,
        createdAt: Timestamp.now(),
        read: notification.read || false,
      };

      await setDoc(newNotificationRef, notificationData);
      console.log('✅ Notificação criada:', notificationData.id);
    } catch (error: any) {
      console.error('❌ Erro ao criar notificação:', error);
      throw new Error(error.message || 'Erro ao criar notificação');
    }
  },

  // Obter notificações de um usuário
  async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis() || Date.now(),
        } as Notification;
      });
    } catch (error: any) {
      console.error('❌ Erro ao buscar notificações:', error);
      console.error('❌ Detalhes do erro:', {
        code: error.code,
        message: error.message,
        userId,
      });
      
      // Se for erro de índice, retornar array vazio
      if (error.code === 'failed-precondition') {
        console.warn('⚠️ Índice composto necessário. Configure no Firebase Console:');
        console.warn('   Collection: notifications');
        console.warn('   Fields: userId (Ascending) + createdAt (Descending)');
        return [];
      }
      
      // Se for erro de permissão, retornar array vazio e logar aviso
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        console.warn('⚠️ Erro de permissão ao buscar notificações. Verifique as regras do Firebase:');
        console.warn('   - As regras devem permitir leitura se request.auth.uid == resource.data.userId');
        console.warn('   - Certifique-se de que o índice composto foi criado');
        return [];
      }
      
      throw new Error(error.message || 'Erro ao buscar notificações');
    }
  },

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (error: any) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      throw new Error(error.message || 'Erro ao marcar notificação como lida');
    }
  },

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId, 1000);
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) return;

      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });

      await batch.commit();
      console.log('✅ Todas as notificações marcadas como lidas');
    } catch (error: any) {
      console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
      throw new Error(error.message || 'Erro ao marcar todas as notificações como lidas');
    }
  },

  // Obter contagem de notificações não lidas
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getUserNotifications(userId, 1000);
      return notifications.filter(n => !n.read).length;
    } catch (error: any) {
      console.error('❌ Erro ao contar notificações não lidas:', error);
      return 0;
    }
  },
};
