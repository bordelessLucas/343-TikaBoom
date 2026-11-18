import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, setCachedUserFromSession } from "../lib/supabase";

export type ScreenName =
  | "Login"
  | "Register"
  | "Home"
  | "MyBets"
  | "ProfileConfig"
  | "Wallet"
  | "Profile"
  | "Messages"
  | "CreateVideo"
  | "MyProfile"
  | "Chat"
  | "Live"
  | "Search"
  | "Friends"
  | "Settings"
  | "StoriesCreate"
  | "StoriesViewer"
  | "Groups"
  | "GroupChat"
  | "LiveWatch"
  | "GiftProfile";

interface NavigationContextType {
  currentScreen: ScreenName;
  navigate: (screen: ScreenName, params?: any) => void;
  authReady: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>("Login");
  const [authReady, setAuthReady] = useState(false);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setCachedUserFromSession(data.session);
      if (!bootstrappedRef.current) {
        bootstrappedRef.current = true;
        setCurrentScreen(data.session?.user ? "Home" : "Login");
        setAuthReady(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setCachedUserFromSession(session);

      if (!bootstrappedRef.current) {
        bootstrappedRef.current = true;
        setCurrentScreen(session?.user ? "Home" : "Login");
        setAuthReady(true);
        return;
      }

      if (!session?.user) {
        setCurrentScreen("Login");
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const navigate = (screen: ScreenName, params?: any) => {
    if (params?.userId) {
      AsyncStorage.setItem("viewingUserId", params.userId).catch(() => {});
    }
    setCurrentScreen(screen);
  };

  if (!authReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#C0F93C" />
      </View>
    );
  }

  return (
    <NavigationContext.Provider value={{ currentScreen, navigate, authReady }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: "#0a0a1a",
    justifyContent: "center",
    alignItems: "center",
  },
});
