import { Portal } from "@rn-primitives/portal";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ShieldAlert, EyeOff, MessageSquareOff, Sparkles, Megaphone } from "lucide-react-native";
import { useCallback, useEffect, useMemo } from "react";
import { Dimensions, Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { appAccentHex } from "@/lib/theme";
import { useColorScheme } from "nativewind";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type CloseKind = "dismiss" | "upgrade";

export type ProFeature = "channels" | "stealth" | "ghost";

type ProFeatureSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: ProFeature;
  /** Fires for maybe later, backdrop, or swipe — not for Upgrade. */
  onDismiss?: () => void;
};

export function ProFeatureSheet({
  open,
  onOpenChange,
  feature = "channels",
  onDismiss,
}: ProFeatureSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accent = appAccentHex(isDark);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const config = useMemo(() => ({
    channels: {
      icon: <Megaphone size={32} color={accent} />,
      title: "unlock channels",
      description: "creating channels is a konekta pro feature. upgrade to broadcast to thousands of subscribers.",
    },
    stealth: {
      icon: <EyeOff size={32} color={accent} />,
      title: "stealth mode",
      description: "hide your last seen and online status from everyone. stay invisible while staying connected.",
    },
    ghost: {
      icon: <MessageSquareOff size={32} color={accent} />,
      title: "hide typing status",
      description: "prevent others from seeing when you are typing a message. total privacy for your thoughts.",
    }
  }[feature]), [feature, accent]);

  const finalizeClose = useCallback(
    (kind: CloseKind) => {
      onOpenChange(false);
      if (kind === "dismiss") {
        onDismiss?.();
      } else {
        setTimeout(() => router.push("/settings/subscriptions"), 100);
      }
    },
    [onOpenChange, onDismiss],
  );

  const beginClose = useCallback(
    (kind: CloseKind) => {
      cancelAnimation(translateY);
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
        runOnJS(finalizeClose)(kind);
      });
    },
    [translateY, finalizeClose],
  );

  useEffect(() => {
    cancelAnimation(translateY);
    if (open) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        mass: 0.8,
      });
    } else {
      translateY.value = SCREEN_HEIGHT;
    }
  }, [open, translateY]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(beginClose)("dismiss");
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
          mass: 0.8,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!open) return null;

  return (
    <Portal name="pro-feature-sheet">
      <View className="absolute inset-0 z-50">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/40"
        >
          <Pressable className="flex-1" onPress={() => beginClose("dismiss")} />
        </Animated.View>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={animatedStyle}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[28px] pb-8 pt-2 shadow-2xl self-center max-w-[500px] w-full"
          >
            <View className="items-center mb-2">
              <View className="w-10 h-1 bg-muted rounded-full opacity-30" />
            </View>

            <View className="px-6 pb-1">
              <View className="items-center mb-3">
                <View className="w-16 h-16 items-center justify-center rounded-full bg-primary/10">
                  {config.icon}
                </View>
              </View>
              <Text
                variant="sheetTitle"
                className="text-center lowercase"
              >
                {config.title}
              </Text>
              <Text
                variant="sheetDescription"
                className="mt-1.5 px-1 text-center lowercase"
              >
                {config.description}
              </Text>
            </View>

            <View className="mt-3 flex-row gap-3 px-6">
              <Button
                variant="secondary"
                className="flex-1 rounded-2xl"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  beginClose("dismiss");
                }}
              >
                <Text className="font-inter-semibold lowercase">maybe later</Text>
              </Button>
              <Button
                className="flex-1 rounded-2xl"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  beginClose("upgrade");
                }}
              >
                <Text className="font-inter-semibold lowercase text-primary-foreground">
                  upgrade
                </Text>
              </Button>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Portal>
  );
}
