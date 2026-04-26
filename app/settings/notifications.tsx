import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appAccentHex } from "@/lib/theme";

/**
 * Mock-only notification toggles — no server, database, or push registration.
 * Resets when the app restarts.
 */
export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accent = appAccentHex(isDark);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mentionsEnabled, setMentionsEnabled] = useState(true);
  const [channelPreviews, setChannelPreviews] = useState(true);

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: Math.max(insets.top + 4, 10) }}
        className="flex-row items-center justify-between border-b border-border/15 px-2 pb-2"
      >
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center rounded-full p-2 active:bg-muted/50"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={28} color={accent} />
        </Pressable>
        <Text className="text-[17px] font-inter-black tracking-tighter text-primary lowercase">
          notifications
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mx-5 mb-4 text-[14px] leading-5 text-muted-foreground">
          These switches are for UI review only. Nothing is stored on a backend and no push keys are
          registered.
        </Text>

        <View className="mx-5 rounded-2xl border border-border/40 bg-card overflow-hidden">
          <Row
            title="Push notifications"
            subtitle="New messages and calls"
            value={pushEnabled}
            onValueChange={(v) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPushEnabled(v);
            }}
            isDark={isDark}
          />
          <Row
            title="Sounds"
            subtitle="In-app message tones (mock)"
            value={soundEnabled}
            onValueChange={(v) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSoundEnabled(v);
            }}
            isDark={isDark}
            isLast={false}
          />
          <Row
            title="@ mentions"
            subtitle="When someone mentions you"
            value={mentionsEnabled}
            onValueChange={(v) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMentionsEnabled(v);
            }}
            isDark={isDark}
            isLast={false}
          />
          <Row
            title="Channel previews"
            subtitle="Show text inside notification banners"
            value={channelPreviews}
            onValueChange={(v) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setChannelPreviews(v);
            }}
            isDark={isDark}
            isLast
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  title,
  subtitle,
  value,
  onValueChange,
  isDark,
  isLast = false,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isDark: boolean;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3.5 ${
        isLast ? "" : "border-b border-border/40"
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-[16px] font-inter-medium text-foreground">{title}</Text>
        <Text className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? "#3f3f46" : "#d4d4d8", true: "#34C759" }}
        thumbColor="#ffffff"
      />
    </View>
  );
}
