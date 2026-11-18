import 'react-native-url-polyfill/auto';
import { createClient, Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Variáveis EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ausentes. Copie .env.example para .env e reinicie o Expo.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Compatível com o antigo auth.currentUser do Firebase (usa .uid) */
export type AuthUser = {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

function mapUser(user: User): AuthUser {
  const meta = user.user_metadata || {};
  return {
    uid: user.id,
    id: user.id,
    email: user.email ?? null,
    displayName: (meta.display_name as string) || (meta.displayName as string) || null,
    photoURL: (meta.photo_url as string) || (meta.photoURL as string) || null,
  };
}

let cachedUser: AuthUser | null = null;
let bootstrapped = false;

export function getCachedUser(): AuthUser | null {
  return cachedUser;
}

export function setCachedUserFromSession(session: Session | null) {
  cachedUser = session?.user ? mapUser(session.user) : null;
}

supabase.auth.getSession().then(({ data }) => {
  setCachedUserFromSession(data.session);
  bootstrapped = true;
});

supabase.auth.onAuthStateChange((_event, session) => {
  setCachedUserFromSession(session);
  bootstrapped = true;
});

export const auth = {
  get currentUser(): AuthUser | null {
    return cachedUser;
  },
  get ready() {
    return bootstrapped;
  },
};

export async function refreshAuthUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  setCachedUserFromSession(data.session);
  return cachedUser;
}
