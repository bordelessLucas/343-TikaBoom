import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyD6D_gnDuSfucCiLcdssZboRdT7A9rg4hg",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "tikaboom-5b534.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "tikaboom-5b534",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "tikaboom-5b534.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "144430535742",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:144430535742:web:42dad5decbb6c53a5aed6f"
} as const;

// Inicializar app apenas se não existir
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializar auth com persistência para React Native
// Tentar usar initializeAuth primeiro, se falhar usar getAuth
let auth;
try {
  // Para React Native, tentar inicializar com persistência customizada
  // Se getReactNativePersistence não estiver disponível, usar getAuth padrão
  auth = getAuth(app);
} catch (error: any) {
  // Se houver erro, tentar initializeAuth sem persistência customizada
  try {
    auth = initializeAuth(app);
  } catch (initError: any) {
    // Se já existe uma instância, usar getAuth
    if (initError.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw initError;
    }
  }
}

export { auth };

export const db = getFirestore(app);
export const storage = getStorage(app);

export { app };
export default firebaseConfig;