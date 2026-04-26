import { Portal } from "@rn-primitives/portal";
import React, { useEffect } from "react";
import { Dimensions, Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    FadeIn,
    FadeOut,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type MuteSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  title: string;
  hasExistingMute?: boolean;
};

export function MuteSheet({
  isOpen,
  onClose,
  onSelect,
  title,
  hasExistingMute = false,
}: MuteSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (isOpen) {
      // Spring animation for that premium bounce
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        mass: 0.8,
      });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    }
  }, [isOpen, translateY]);

  const closeSheet = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(closeSheet)();
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

  if (!isOpen) return null;

  const options: { label: string; value: string; destructive?: boolean; highlight?: boolean }[] = [
    { label: "mute for 1 hour", value: "1h" },
    { label: "mute for 8 hours", value: "8h" },
    { label: "mute for 2 days", value: "2d" },
    { label: "mute forever", value: "forever", destructive: true },
  ];

  return (
    <Portal name="mute-sheet">
      <View className="absolute inset-0 z-50">
        {/* Backdrop */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/40"
        >
          <Pressable className="flex-1" onPress={closeSheet} />
        </Animated.View>

        {/* Sheet Content */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={animatedStyle}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[28px] pb-8 pt-2 shadow-2xl self-center max-w-[500px] w-full"
          >
            {/* Drag Handle */}
            <View className="items-center mb-2">
              <View className="w-10 h-1 bg-muted rounded-full opacity-30" />
            </View>

            {/* Title Section */}
            <View className="mb-3 px-6">
              <Text variant="sheetTitle">mute notifications</Text>
              <Text variant="sheetDescription" className="mt-0.5">
                how long would you like to mute {title}?
              </Text>
            </View>

            {/* Options List */}
            <View className="mb-2">
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onSelect(option.value);
                    closeSheet();
                  }}
                  className="px-6 py-3.5 flex-row items-center active:bg-muted/50"
                >
                  <Text
                    variant="listBody"
                    className={
                      option.destructive
                        ? "font-inter-semibold text-destructive"
                        : option.highlight
                          ? "font-inter-semibold text-primary"
                          : "text-foreground"
                    }
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Portal>
  );
}
