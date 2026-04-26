import { Text } from "@/components/ui/text";
import { profileShareUrl } from "@/lib/profileLink";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { Portal } from "@rn-primitives/portal";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export type MyQrProfile = {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
};

type MyQrSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: MyQrProfile | null;
};

export function MyQrSheet({ open, onOpenChange, profile }: MyQrSheetProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconMuted = isDark ? "#A1A1AA" : "#8E8E93";

  const shareUrl = useMemo(() => {
    if (!profile) return "";
    return profileShareUrl(profile.username);
  }, [profile]);

  const qrUri = useMemo(() => {
    if (!shareUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`;
  }, [shareUrl]);

  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  useEffect(() => {
    if (open) setQrLoadFailed(false);
  }, [open, shareUrl]);

  useEffect(() => {
    if (!open || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onOpenChange(false);
      return true;
    });
    return () => sub.remove();
  }, [open, onOpenChange]);

  if (!open || !profile) return null;

  const bottomPad = Math.max(insets.bottom, 24);

  return (
    <Portal name="my-qr-sheet">
      <View style={StyleSheet.absoluteFill} className="z-[999]">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/25"
        >
          <Pressable className="flex-1" onPress={() => onOpenChange(false)} />
        </Animated.View>

        <Animated.View
          style={{ flex: 1, justifyContent: "flex-end" }}
          className="justify-end"
          pointerEvents="box-none"
        >
          <Animated.View
            entering={SlideInDown.duration(280).easing(Easing.out(Easing.quad))}
            exiting={SlideOutDown.duration(200)}
            className="w-full rounded-t-[32px] border-t border-border/20 bg-background"
            style={{ maxHeight: SCREEN_HEIGHT * 0.88, paddingBottom: bottomPad }}
          >
            <View className="items-center py-4">
              <View className="h-1.5 w-10 rounded-full bg-muted/30" />
            </View>

            <View className="flex-row items-center justify-between px-6 pb-4">
              <Text variant="sheetTitle" className="lowercase">
                my qr
              </Text>
              <Pressable
                accessibilityLabel="Close"
                hitSlop={14}
                onPress={() => onOpenChange(false)}
                className="rounded-full bg-muted/30 p-2.5 active:bg-muted/50"
              >
                <X size={20} color={iconMuted} />
              </Pressable>
            </View>

            <View className="items-center px-6 pb-2">
              <Text variant="large" className="text-center tracking-tight">
                {profile.displayName}
              </Text>
              <Text
                variant="listSubtitle"
                className="mt-0.5 text-center"
              >
                {profile.username.startsWith("@")
                  ? profile.username
                  : `@${profile.username}`}
              </Text>
            </View>

            <View className="mx-6 mt-2 items-center rounded-2xl border border-border/40 bg-card p-4">
              <Text
                variant="listSubtitle"
                className="mb-3 text-center text-xs lowercase tracking-tight"
              >
                scan to add (mock)
              </Text>
              <View className="min-h-[220px] min-w-[220px] items-center justify-center overflow-hidden rounded-xl bg-white p-3">
                {qrLoadFailed ? (
                  <Text
                    variant="listSubtitle"
                    className="px-2 text-center text-xs"
                  >
                    couldn’t load qr preview. check your connection.
                  </Text>
                ) : (
                  <Image
                    source={{ uri: qrUri }}
                    style={{ width: 220, height: 220 }}
                    contentFit="contain"
                    transition={200}
                    onError={() => setQrLoadFailed(true)}
                  />
                )}
              </View>
            </View>

            <Text
              variant="listSubtitle"
              className="mx-8 mt-5 text-center text-xs lowercase leading-5"
            >
              qr preview uses a public image api for this build only. swap for on-device
              generation before production.
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </Portal>
  );
}
