import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
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

const app = initializeApp(firebaseConfig);

// Usar initializeAuth com persistência do AsyncStorage para React Native
// Isso garante que o token seja propagado corretamente para o Firestore
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export { app };
export default firebaseConfig;