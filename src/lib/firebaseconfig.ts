import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Inicializar app apenas se não existir
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inicializar auth com persistência para React Native
let auth;
try {
  auth = getAuth(app);
} catch (error: any) {
  try {
    auth = initializeAuth(app);
  } catch (initError: any) {
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
