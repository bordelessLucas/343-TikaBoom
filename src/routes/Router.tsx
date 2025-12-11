import React from "react";
import { Login } from "../pages/Login/Login";
import { Register } from "../pages/Register/Register";
import { Home } from "../pages/Home/Home";
import { Profile } from "../pages/Profile/Profile";
import { Messages } from "../pages/Messages/Messages";
import { CreateVideo } from "../pages/CreateVideo/CreateVideo";
import { MyProfile } from "../pages/MyProfile/MyProfile";
import { Chat } from "../pages/Chat/Chat";
import { Search } from "../pages/Search/Search";
import { Live } from "../pages/Live/Live";
import { Friends } from "../pages/Friends/Friends";
import { useNavigation } from "./NavigationContext";
import { BottomNavigation } from "../components/BottomNavigation/BottomNavigation";

export const Router = () => {
  const { currentScreen } = useNavigation();

  const renderScreen = () => {
    switch (currentScreen) {
      case "Login":
        return <Login />;
      case "Register":
        return <Register />;
      case "Home":
        return <Home />;
      case "Profile":
        return <Profile />;
      case "Messages":
        return <Messages />;
      case "CreateVideo":
        return <CreateVideo />;
      case "MyProfile":
        return <MyProfile />;
      case "Chat":
        return <Chat />;
      case "Search":
        return <Search />;
      case "Live":
        return <Live />;
      case "Friends":
        return <Friends />;
      default:
        return <Login />;
    }
  };

  const showBottomNav = ["Home", "Messages", "CreateVideo", "MyProfile", "Live", "Friends"].includes(currentScreen);

  return (
    <>
      {renderScreen()}
      {showBottomNav && <BottomNavigation />}
    </>
  );
};

