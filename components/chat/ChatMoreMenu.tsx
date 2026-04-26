import {
  ChevronLeft,
  Clock,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChatMoreMenuProps {
  isVisible: boolean;
  isMuted: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  /** Red row label for leave/delete (default: Delete Chat). */
  deleteActionTitle?: string;
}

export const ChatMoreMenu: React.FC<ChatMoreMenuProps> = ({
  isVisible,
  isMuted,
  onClose,
  onAction,
  deleteActionTitle = "Delete Chat",
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = useState<"main" | "mute">("main");

  const menuTop = Platform.select({
    ios: insets.top + 56,
    android: 84,
  });

  if (!isVisible) return null;

  const iconColor = isDark ? "#ffffff" : "#1C1C1E";

  const mainItems = [
    {
      id: isMuted ? "unmute" : "mute",
      title: isMuted ? "unmute" : "mute",
      icon: isMuted ? Volume2 : VolumeX,
      color: iconColor,
    },
    { id: "delete", title: deleteActionTitle.toLowerCase(), icon: Trash2, color: "#FF3B30" },
  ];

  const muteOptions = [
    { id: "1h", title: "1 hour", icon: Clock },
    { id: "8h", title: "8 hours", icon: Clock },
    { id: "2d", title: "2 days", icon: Clock },
    { id: "forever", title: "forever", icon: Clock },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
        style={{ top: menuTop }}
        className={`absolute right-3 bg-card rounded-xl border border-border z-[100] ${
          currentView === "main" ? "w-44" : "w-[138px]"
        }`}
      >
        <View className="overflow-hidden rounded-xl">
          {currentView === "main" ? (
            mainItems.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (item.id === "mute" && !isMuted) {
                    setCurrentView("mute");
                  } else {
                    onAction(item.id);
                    onClose();
                  }
                }}
                className={`flex-row items-center px-4 py-3 active:bg-muted/50 ${
                  index !== mainItems.length - 1
                    ? "border-b border-border/10"
                    : ""
                }`}
              >
                <item.icon size={20} color={item.color} />
                <Text
                  style={{ color: item.color }}
                  className="ml-3 text-base font-inter-medium"
                >
                  {item.title}
                </Text>
              </Pressable>
            ))
          ) : (
            <View>
              <Pressable
                onPress={() => setCurrentView("main")}
                className="flex-row items-center px-4 py-2 border-b border-border/10 active:bg-muted/30"
              >
                <ChevronLeft
                  size={18}
                  color={iconColor}
                  className="opacity-50"
                />
                <Text className="ml-1 text-xs text-muted-foreground font-inter-semibold uppercase tracking-wider">
                  Back
                </Text>
              </Pressable>
              {muteOptions.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    onAction(`mute_${item.id}`);
                    onClose();
                    setCurrentView("main");
                  }}
                  className={`flex-row items-center px-4 py-3 active:bg-muted/50 ${
                    index !== muteOptions.length - 1
                      ? "border-b border-border/10"
                      : ""
                  }`}
                >
                  <item.icon
                    size={18}
                    color={iconColor}
                    className="opacity-60"
                  />
                  <Text className="ml-3 text-base text-foreground font-inter-medium">
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};
