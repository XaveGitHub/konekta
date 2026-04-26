import { Text } from "@/components/ui/text";
import type { LucideIcon } from "lucide-react-native";
import { RotateCcw } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { Pressable, View, Platform } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

export type ToastConfig = {
  message: string;
  icon?: LucideIcon;
  countdown?: number;
  onUndo?: () => void;
  onDismiss?: () => void;
};

type Props = ToastConfig & {
  onHide: () => void;
  bottomOffset?: number;
};

export default function Toast({
  message,
  icon: IconComponent,
  countdown,
  onUndo,
  onDismiss,
  onHide,
  bottomOffset = 32,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const undidRef = useRef(false);

  const [remaining, setRemaining] = useState(countdown ?? 0);

  const animateOut = (cb?: () => void) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(80, { duration: 200 }, (finished) => {
      if (finished) {
        if (cb) runOnJS(cb)();
        runOnJS(onHide)();
      }
    });
  };

  useEffect(() => {
    // Slide in (no bounce)
    translateY.value = withTiming(0, { duration: 220 });
    opacity.value = withTiming(1, { duration: 180 });

    const duration = countdown ? countdown * 1000 : 2500;

    if (countdown && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0 && intervalRef.current)
            clearInterval(intervalRef.current);
          return next;
        });
      }, 1000);
    }

    timeoutRef.current = setTimeout(() => {
      animateOut(() => {
        if (!undidRef.current) onDismiss?.();
      });
    }, duration);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndo = () => {
    undidRef.current = true;
    onUndo?.();
    animateOut();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, { bottom: bottomOffset }]}
      className="absolute left-3 right-3 z-50"
    >
      <View
        style={{
          backgroundColor: isDark ? "rgba(39,39,42,0.9)" : "rgba(24,24,27,0.9)",
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
        }}
      >
        {Platform.OS === 'ios' && (
          <View className="absolute inset-0">
            <BlurView tint={isDark ? "dark" : "light"} intensity={80} style={{ flex: 1 }} />
          </View>
        )}

        {IconComponent && (
          <IconComponent size={18} color="#a1a1aa" strokeWidth={2} style={{ zIndex: 10 }} />
        )}

        <Text
          style={{
            color: "#f4f4f5",
            fontSize: 14,
            flex: 1,
            zIndex: 10,
          }}
        >
          {message}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, zIndex: 10 }}>
          {countdown != null && countdown > 0 && remaining > 0 && (
            <Text style={{ color: "#a1a1aa", fontSize: 13 }}>{remaining}s</Text>
          )}
          {onUndo && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Undo"
              onPress={handleUndo}
              hitSlop={10}
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <RotateCcw size={14} color="#60a5fa" strokeWidth={2.5} />
              <Text
                style={{
                  color: "#60a5fa",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Undo
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
