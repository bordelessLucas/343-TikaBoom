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
  updateDoc,
  Timestamp,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebaseconfig';

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
  participants: string[]; // Array de UIDs
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: { [userId: string]: number };
  createdAt: number;
  updatedAt: number;
}

export const messagesService = {
  // Criar ou obter chat entre dois usuários
  async getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    try {
      console.log('🔍 Criando/obtendo chat entre:', { userId1, userId2 });
      
      // Criar ID determinístico baseado nos dois user IDs (sempre o mesmo para os mesmos dois usuários)
      // Ordenar os IDs para garantir consistência
      const sortedIds = [userId1, userId2].sort();
      const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
      
      const chatRef = doc(db, 'chats', chatId);
      
      // Verificar se o chat já existe
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const existingChat = chatDoc.data() as Chat;
        // Garantir que participants existe e é um array
        if (!existingChat.participants || !Array.isArray(existingChat.participants)) {
          console.warn('⚠️ Chat existente com participants inválido, corrigindo...');
          await updateDoc(chatRef, {
            participants: [userId1, userId2],
            unreadCount: existingChat.unreadCount || {
              [userId1]: 0,
              [userId2]: 0,
            },
          });
        }
        console.log('✅ Chat existente encontrado:', chatId);
        return chatId;
      }
      
      // Criar novo chat
      console.log('📝 Criando novo chat com ID:', chatId);
      const chat: Chat = {
        id: chatId,
        participants: [userId1, userId2], // Sempre um array
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await setDoc(chatRef, chat);
      console.log('✅ Chat criado com sucesso:', chatId);
      return chatId;
    } catch (error: any) {
      console.error('❌ Erro ao criar/obter chat:', error);
      console.error('   Código:', error.code);
      console.error('   Mensagem:', error.message);
      
      // Mensagem de erro mais descritiva
      if (error.code === 'permission-denied') {
        const errorMsg = 
          'Permissão negada ao criar chat.\n\n' +
          'Verifique as regras de segurança do Firestore para a coleção "chats".\n\n' +
          'A regra de criação deve ser:\n' +
          'allow create: if request.auth != null && ' +
          'request.auth.uid in request.resource.data.participants && ' +
          'request.resource.data.participants.size() == 2;';
        throw new Error(errorMsg);
      }
      throw new Error(error.message || 'Não foi possível criar ou obter o chat');
    }
  },

  // Enviar mensagem
  async sendMessage(chatId: string, senderId: string, text: string, senderUsername: string, senderPhotoURL?: string): Promise<string> {
    try {
      const messageRef = doc(collection(db, 'messages'));
      
      // Criar objeto de mensagem, omitindo campos undefined (Firestore não aceita undefined)
      const messageData: Omit<Message, 'senderPhotoURL'> & { senderPhotoURL?: string } = {
        id: messageRef.id,
        chatId,
        senderId,
        senderUsername,
        text: text.trim(),
        createdAt: Date.now(),
        read: false,
      };
      
      // Adicionar senderPhotoURL apenas se estiver definido e não for vazio
      if (senderPhotoURL && senderPhotoURL.trim() !== '') {
        messageData.senderPhotoURL = senderPhotoURL;
      }
      
      await setDoc(messageRef, messageData);
      
      // Atualizar chat com última mensagem
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chat = chatDoc.data() as Chat;
        // Verificar se participants existe e é um array
        if (chat.participants && Array.isArray(chat.participants)) {
          const otherUserId = chat.participants.find(id => id !== senderId);
          
          await updateDoc(chatRef, {
            lastMessage: text.trim(),
            lastMessageTime: Date.now(),
            updatedAt: Date.now(),
            [`unreadCount.${otherUserId}`]: (chat.unreadCount?.[otherUserId || ''] || 0) + 1,
          });
        }
      }
      
      return messageRef.id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter mensagens de um chat
  async getChatMessages(chatId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => doc.data() as Message)
        .reverse(); // Reverter para ordem cronológica
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter chats de um usuário
  async getUserChats(userId: string): Promise<(Chat & { otherUser?: { uid: string; username: string; photoURL?: string } })[]> {
    try {
      // Tentar buscar com query otimizada primeiro
      let chats: Chat[] = [];
      
      try {
        const q = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', userId),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        chats = snapshot.docs
          .map(doc => doc.data() as Chat)
          .filter(chat => {
            // Filtrar apenas chats com participants válido
            if (!chat.participants || !Array.isArray(chat.participants)) {
              console.warn('⚠️ Chat com participants inválido ignorado:', chat.id);
              return false;
            }
            return true;
          });
        
        // Ordenar por updatedAt
        chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      } catch (queryError: any) {
        // Se a query falhar por permissões, retornar array vazio
        if (queryError.code === 'permission-denied' || queryError.message?.includes('permission')) {
          console.error('❌ Erro de permissão ao buscar chats. Configure as regras de segurança do Firestore:');
          console.error('   - Permita leitura de chats onde o usuário está em participants');
          console.error('   - Exemplo de regra: allow read: if request.auth != null && request.auth.uid in resource.data.participants;');
          return [];
        }
        // Se falhar por falta de índice, também retornar vazio (mais seguro que buscar todos)
        console.warn('⚠️ Não foi possível buscar chats:', queryError.message);
        return [];
      }
      
      // Buscar informações do outro usuário em cada chat
      const chatsWithUsers = await Promise.all(
        chats.map(async (chat) => {
          // Verificar se participants existe e é um array
          if (!chat.participants || !Array.isArray(chat.participants)) {
            return chat;
          }
          
          const otherUserId = chat.participants.find(id => id !== userId);
          if (otherUserId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', otherUserId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...chat,
                  otherUser: {
                    uid: otherUserId,
                    username: userData.username,
                    photoURL: userData.photoURL,
                  },
                };
              }
            } catch (error) {
              console.error('Erro ao buscar usuário:', error);
            }
          }
          return chat;
        })
      );
      
      return chatsWithUsers;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Marcar mensagens como lidas
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const messages = await this.getChatMessages(chatId, 100);
      const unreadMessages = messages.filter(msg => !msg.read && msg.senderId !== userId);
      
      if (unreadMessages.length === 0) return;
      
      const batch = await import('firebase/firestore').then(m => m.writeBatch);
      const batchInstance = batch();
      
      unreadMessages.forEach(msg => {
        const messageRef = doc(db, 'messages', msg.id);
        batchInstance.update(messageRef, { read: true });
      });
      
      // Resetar contador de não lidas
      const chatRef = doc(db, 'chats', chatId);
      batchInstance.update(chatRef, {
        [`unreadCount.${userId}`]: 0,
      });
      
      await batchInstance.commit();
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Listener em tempo real para mensagens
  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void): () => void {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map(doc => doc.data() as Message)
        .reverse();
      callback(messages);
    });
    
    return unsubscribe;
  },

  // Listener em tempo real para chats
  subscribeToUserChats(userId: string, callback: (chats: Chat[]) => void): () => void {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => doc.data() as Chat);
      callback(chats);
    });
    
    return unsubscribe;
  },
};
