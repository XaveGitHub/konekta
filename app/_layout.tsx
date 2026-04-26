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
import * as SecureStore from 'expo-secure-store';
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
import { AUTH_MOCK, setLoggedIn, setOnboarded } from "../lib/auth-mock";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Sync SecureStore on Mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('konekta_mock_token');
        if (token === 'logged_in') {
          setOnboarded(true);
          setLoggedIn(true);
        }
      } catch (e) {
        console.log('Auth Init Error:', e);
      } finally {
        setIsReady(true);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const onOnboarding = segments[1] === "onboarding";
    const inTabs = segments[0] === "(tabs)";

    const effectiveOnboarded = AUTH_MOCK.isOnboarded;
    const effectiveLoggedIn = AUTH_MOCK.isLoggedIn;

    // PROTECTION LOGIC
    if (!effectiveOnboarded && !onOnboarding) {
      router.replace("/(auth)/onboarding");
    } else if (effectiveOnboarded && !effectiveLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (effectiveLoggedIn && inAuthGroup) {
      router.replace("/(tabs)/chats");
    }
  }, [isReady, segments, AUTH_MOCK.isLoggedIn, AUTH_MOCK.isOnboarded]);

  if (!isReady) return null;

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
