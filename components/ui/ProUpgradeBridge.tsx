import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "./text";
import { Button } from "./button";
import { BadgeCheck, ChevronLeft, Megaphone, ShieldCheck, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { THEME } from "@/lib/theme";

interface ProUpgradeBridgeProps {
  onBack: () => void;
  title?: string;
  description?: string;
  feature?: "channels" | "stealth" | "ghost";
}

export function ProUpgradeBridge({ onBack, title, description, feature = "channels" }: ProUpgradeBridgeProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const tint = THEME[colorScheme === "dark" ? "dark" : "light"].primary;

  const config = {
    channels: {
      icon: <Megaphone size={40} color={tint} />,
      title: title || "broadcasting is for the pro's",
      desc: description || "become a pro to create channels and reach up to 10,000+ members instantly.",
    },
    stealth: {
      icon: <ShieldCheck size={40} color={tint} />,
      title: title || "unlock stealth mode",
      desc: description || "hide your typing status and last seen tags forever with a pro subscription.",
    },
    ghost: {
      icon: <Sparkles size={40} color={tint} />,
      title: title || "master of ghosts",
      desc: description || "delete messages without leaving a trace or a 'removed' tag. only for pro's.",
    }
  }[feature];

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: Math.max(insets.top + 4, 10) }}
        className="px-4"
      >
        <Pressable
          onPress={onBack}
          className="p-2 -ml-1 rounded-full active:bg-muted/50 w-12"
        >
          <ChevronLeft size={28} color={tint} />
        </Pressable>
      </View>

      <View className="flex-1 px-8 justify-center items-center">
        <Animated.View entering={FadeInDown.duration(600)} className="items-center">
           <View className="mb-8 h-24 w-24 items-center justify-center rounded-[32px] bg-primary/10">
              {config.icon}
           </View>
           
           <View className="mb-4 flex-row items-center gap-2">
              <BadgeCheck size={20} color={tint} />
              <Text variant="overline" className="text-primary">
                pro feature
              </Text>
           </View>

           <Text variant="h3" className="text-center lowercase leading-tight">
             {config.title}
           </Text>
           
           <Text
             variant="sheetDescription"
             className="mt-4 text-center lowercase"
           >
             {config.desc}
           </Text>

           <Button
             className="mt-12 h-14 w-full rounded-2xl"
             onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                router.push("/settings/subscriptions");
             }}
           >
              <Text className="text-base font-inter-semibold lowercase text-primary-foreground">
                upgrade to pro
              </Text>
           </Button>

           <Pressable 
             onPress={onBack}
             className="mt-6"
           >
              <Text className="text-center font-inter-semibold lowercase text-muted-foreground">
                maybe later
              </Text>
           </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
