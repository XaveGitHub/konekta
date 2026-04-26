import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "./text";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";

interface MenuRowProps {
  label: string;
  description?: string;
  value?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  isDestructive?: boolean;
  isLast?: boolean;
  className?: string;
  children?: React.ReactNode; // Right-side slot (e.g. for Switch)
}

export const MenuRow = ({
  label,
  description,
  value,
  icon,
  onPress,
  showChevron = true,
  isDestructive = false,
  isLast = false,
  className,
  children,
}: MenuRowProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    if (onPress) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      disabled={!onPress}
      className={cn(
        "flex-row items-center py-3.5 px-4 active:bg-muted/40",
        !isLast && "border-b border-border/40",
        className
      )}
    >
      {/* Left Icon Slot */}
      {icon && (
        <View className="mr-4 h-8 w-8 items-center justify-center rounded-lg">
          {icon}
        </View>
      )}

      {/* Label and Description */}
      <View className="min-w-0 flex-1">
        <Text
          variant="listTitle"
          className={cn(
            "lowercase",
            isDestructive ? "text-destructive" : "text-foreground",
          )}
          numberOfLines={1}
        >
          {label}
        </Text>
        {description && (
          <Text
            variant="listSubtitle"
            className="mt-0.5 lowercase"
            numberOfLines={1}
          >
            {description}
          </Text>
        )}
      </View>

      {/* Right Side Slot */}
      <View className="flex-row items-center gap-2">
        {value && (
          <Text
            variant="listSubtitle"
            className="text-[14px] text-muted-foreground/80 lowercase"
          >
            {value}
          </Text>
        )}
        {children}
        {showChevron && onPress && !children && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
          />
        )}
      </View>
    </Pressable>
  );
};
