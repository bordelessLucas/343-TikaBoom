import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import { toByteArray } from 'base64-js';
import { auth, db, storage } from '../lib/firebaseconfig';

export interface UserProfile {
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

export const authService = {
  // Registrar novo usuário
  async register(email: string, password: string, username: string, displayName: string): Promise<UserCredential> {
    try {
      console.log('🔄 Iniciando registro de usuário...', { email, username });
      
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Usuário criado no Auth:', userCredential.user.uid);
      
      // Atualizar perfil no Auth
      await updateProfile(userCredential.user, { displayName });
      console.log('✅ Perfil do Auth atualizado');

      // Aguardar o estado de autenticação ser confirmado pelo Firebase
      // antes de tentar gravar no Firestore
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          unsubscribe();
          reject(new Error('Timeout ao aguardar autenticação'));
        }, 10000);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user && user.uid === userCredential.user.uid) {
            clearTimeout(timeout);
            unsubscribe();
            resolve();
          }
        });
      });
      console.log('✅ Estado de autenticação confirmado');

      // Forçar renovação do token
      await userCredential.user.getIdToken(true);
      console.log('✅ Token renovado');
      
      // Verificar se username está disponível (agora que está autenticado)
      const usernameLower = username.toLowerCase();
      const isAvailable = await this.isUsernameAvailable(usernameLower);
      if (!isAvailable) {
        // Deletar o usuário do Auth se o username não estiver disponível
        await userCredential.user.delete();
        throw new Error('Este username já está em uso. Escolha outro.');
      }
      console.log('✅ Username disponível');
      
      // Criar perfil no Firestore
      const userProfile: UserProfile & { followingList?: string[]; followersList?: string[] } = {
        uid: userCredential.user.uid,
        email,
        displayName,
        username: usernameLower,
        followers: 0,
        following: 0,
        posts: 0,
        likes: 0,
        isPrivate: false,
        createdAt: Date.now(),
        followingList: [],
        followersList: [],
      };
      
      console.log('📝 Criando perfil no Firestore...');
      console.log('🔑 UID do usuário:', userCredential.user.uid);
      console.log('🔑 auth.currentUser:', auth.currentUser?.uid);
      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
      console.log('✅ Perfil criado no Firestore');
      
      return userCredential;
    } catch (error: any) {
      console.error('❌ Erro detalhado no registro:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      
      // Mensagens de erro mais amigáveis
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Este email já está em uso. Tente fazer login.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('A senha é muito fraca. Use pelo menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Email inválido. Verifique o formato do email.');
      } else if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        throw new Error('Erro de permissão. Verifique as regras de segurança do Firestore. O usuário precisa ter permissão para criar seu próprio perfil.');
      } else if (error.message?.includes('username')) {
        throw new Error('Username já está em uso. Escolha outro.');
      }
      
      throw new Error(error.message || 'Erro ao criar conta. Tente novamente.');
    }
  },

  // Login
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Obter perfil do usuário
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Atualizar perfil
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), updates);
      
      // Atualizar também no Auth se houver displayName ou photoURL
      const user = auth.currentUser;
      if (user) {
        const authUpdates: any = {};
        if (updates.displayName) authUpdates.displayName = updates.displayName;
        if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
        if (Object.keys(authUpdates).length > 0) {
          await updateProfile(user, authUpdates);
        }
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Upload de foto de perfil
  async uploadProfilePhoto(uid: string, uri: string): Promise<string> {
    try {
      console.log('📤 Fazendo upload de foto de perfil...', { uid });
      
      // Ler o arquivo como base64 usando expo-file-system
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const fileExtension = uri.includes('.png') ? 'png' : 'jpg';
      const storageRef = ref(storage, `profilePhotos/${uid}_${Date.now()}.${fileExtension}`);
      
      const metadata = {
        contentType: fileExtension === 'png' ? 'image/png' : 'image/jpeg',
        customMetadata: {
          uploadedBy: uid,
          uploadedAt: Date.now().toString(),
        },
      };
      
      // Converter base64 para bytes
      const bytes = toByteArray(base64);
      
      // Upload usando uploadBytesResumable com timeout
      const uploadTask = uploadBytesResumable(storageRef, bytes, metadata);
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          uploadTask.cancel();
          reject(new Error('Upload timeout após 30 segundos'));
        }, 30000);
        
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (progress === 100) clearTimeout(timeout);
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
      console.log('✅ Foto de perfil enviada:', downloadURL.substring(0, 50) + '...');
      
      // Atualizar perfil com nova foto
      await this.updateUserProfile(uid, { photoURL: downloadURL });
      
      return downloadURL;
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload de foto:', error);
      throw new Error(error.message || 'Erro ao fazer upload da foto de perfil');
    }
  },

  // Verificar se username está disponível
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      // Buscar usuários com esse username
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
      const snapshot = await getDocs(q);
      return snapshot.empty;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
};
