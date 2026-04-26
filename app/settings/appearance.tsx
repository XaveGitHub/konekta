import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState, useCallback } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { THEME } from "@/lib/theme";
import { Smartphone, Sun, Moon } from "lucide-react-native";

type AppearancePreference = "system" | "light" | "dark";

export default function AppearanceSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const tint = THEME[isDark ? "dark" : "light"].primary;
  const iconColor = isDark ? "#A1A1AA" : "#8E8E93";

  const [appearance, setAppearance] = useState<AppearancePreference>("system");

  const applyAppearance = useCallback(
    (next: AppearancePreference) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAppearance(next);
      setColorScheme(next);
    },
    [setColorScheme],
  );

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: Math.max(insets.top + 4, 10), paddingBottom: 10 }}
        className="flex-row items-center justify-between bg-background px-4"
      >
        <Pressable
          onPress={() => router.back()}
          className="rounded-full p-2 active:bg-muted/50"
        >
          <Ionicons name="chevron-back" size={26} color={tint} />
        </Pressable>
        <Text className="text-[17px] font-inter-black tracking-tighter text-primary lowercase">
          appearance
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-5 mb-8 overflow-hidden rounded-[24px] border border-border/40 bg-card p-2 shadow-sm">
          <Text variant="sectionLabel" className="mb-2 px-3 pt-3">
            theme
          </Text>
          <View className="flex-row">
            {(
              [
                { key: "system" as const, label: "system", Icon: Smartphone },
                { key: "light" as const, label: "light", Icon: Sun },
                { key: "dark" as const, label: "dark", Icon: Moon },
              ] as const
            ).map(({ key, label, Icon }) => {
              const active = appearance === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => applyAppearance(key)}
                  className={`flex-1 items-center rounded-2xl py-3.5 ${
                    active ? "bg-primary/10" : "active:bg-muted/40"
                  }`}
                >
                  <Icon size={20} color={active ? tint : iconColor} />
                  <Text
                    className={`mt-1.5 text-sm font-inter-semibold lowercase tracking-tight ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        
        <View className="px-8 mt-4">
            <Text className="text-center text-sm text-muted-foreground font-inter-medium lowercase leading-5">
                konekta matches your system settings by default, but you can override it here.
            </Text>
        </View>
      </ScrollView>
    </View>
  );
}
