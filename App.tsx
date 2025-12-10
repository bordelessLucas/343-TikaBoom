import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationProvider } from "./src/routes/NavigationContext";
import { Router } from "./src/routes/Router";

function App() {
  return (
    <SafeAreaProvider>
      <NavigationProvider>
        <Router />
      </NavigationProvider>
    </SafeAreaProvider>
  );
}

export default App;
