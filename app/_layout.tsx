import { PortalHost } from "@rn-primitives/portal";
import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "nativewind";
import { useLayoutEffect, useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
// import * as SecureStore from 'expo-secure-store'; // Uncomment after installing: npx expo install expo-secure-store
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
import { useRouter, useSegments } from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { AUTH_MOCK } from "../lib/auth-mock";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(AUTH_MOCK.isLoggedIn);
  const [isOnboarded, setIsOnboarded] = useState(AUTH_MOCK.isOnboarded);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoggedIn(AUTH_MOCK.isLoggedIn);
      setIsOnboarded(AUTH_MOCK.isOnboarded);
      setIsReady(true);
    };
    checkAuth();
  }, [segments]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const onOnboarding = segments[1] === "onboarding";

    // Use AUTH_MOCK directly here to avoid React state sync lag
    const effectiveOnboarded = AUTH_MOCK.isOnboarded;
    const effectiveLoggedIn = AUTH_MOCK.isLoggedIn;

    if (!effectiveOnboarded && !onOnboarding) {
      router.replace("/(auth)/onboarding");
    } else if (effectiveOnboarded && !effectiveLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (effectiveLoggedIn && inAuthGroup) {
      router.replace("/(tabs)/chats");
    }
  }, [isLoggedIn, isOnboarded, isReady, segments]);

  return <>{children}</>;
}

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
          <AuthGuard>
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
          </AuthGuard>
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
