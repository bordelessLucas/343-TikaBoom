import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
} as const;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    '[Firebase] Variáveis EXPO_PUBLIC_FIREBASE_* ausentes. Copie .env.example para .env e reinicie o Expo.'
  );
}

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

function createAuth(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }

  try {
    // Existe no bundle RN do Firebase; tipagem às vezes não exporta
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (s: typeof AsyncStorage) => unknown;
    };

    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage) as any,
    });
  } catch (e: any) {
    // Já inicializado (Fast Refresh) ou fallback
    if (e?.code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    console.warn('[Firebase Auth] Persistência RN indisponível, usando getAuth:', e?.message || e);
    return getAuth(firebaseApp);
  }
}

export const auth = createAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
export default firebaseConfig;
