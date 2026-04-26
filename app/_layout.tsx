import { PortalHost } from "@rn-primitives/portal";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "nativewind";
import { useLayoutEffect, useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black 
} from '@expo-google-fonts/inter';
import "../global.css";

import { FloatingCallWidget } from "@/components/call/FloatingCallWidget";
import { CallProvider } from "@/context/CallContext";
import { ChatProvider } from "@/context/ChatContext";
import { ContactsProvider } from "@/context/ContactsContext";
import { NAV_THEME, ROOT_WINDOW_BACKGROUND } from "@/lib/theme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { colorScheme } = useColorScheme();
  const mode = colorScheme === "dark" ? "dark" : "light";
  const rootBg = ROOT_WINDOW_BACKGROUND[mode];

  useLayoutEffect(() => {
    void SystemUI.setBackgroundColorAsync(rootBg);
  }, [rootBg]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBg }}>
      <SafeAreaProvider>
        <ThemeProvider value={NAV_THEME[mode]}>
          <CallProvider>
            <ChatProvider>
              <ContactsProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: rootBg },
                    // Match native messaging apps: horizontal push (not full-screen fade).
                    ...Platform.select({
                      ios: {
                        animation: "simple_push" as const,
                        animationDuration: 250,
                        fullScreenGestureEnabled: true,
                      },
                      android: {
                        animation: "ios_from_right" as const,
                      },
                      default: {
                        animation: "fade" as const,
                        animationDuration: 220,
                      },
                    }),
                  }}
                />
                <FloatingCallWidget />
                <PortalHost />
              </ContactsProvider>
            </ChatProvider>
          </CallProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }
  
  return <RootLayoutInner />;
}
