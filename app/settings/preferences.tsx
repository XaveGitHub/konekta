import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState, useCallback } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MenuRow } from "@/components/ui/MenuRow";
import { THEME } from "@/lib/theme";
import { safePush } from "@/lib/safeNavigation";
import { useChat } from "@/context/ChatContext";
import { ProFeatureSheet, type ProFeature } from "@/components/chat/ProFeatureSheet";
import { Smartphone, Sun, Moon, Lock, ShieldCheck, Bell } from "lucide-react-native";

type AppearancePreference = "system" | "light" | "dark";

export default function PreferencesSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const tint = THEME[isDark ? "dark" : "light"].primary;
  const iconColor = isDark ? "#A1A1AA" : "#8E8E93";

  const { currentUserProfile } = useChat();

  const [appearance, setAppearance] = useState<AppearancePreference>("system");

  const applyAppearance = useCallback(
    (next: AppearancePreference) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAppearance(next);
      setColorScheme(next);
    },
    [setColorScheme],
  );

  const [proGateFeature, setProGateFeature] = useState<ProFeature | null>(null);

  const handleProFeaturePress = (feature: ProFeature) => {
    if (currentUserProfile.subscriptionTier !== "pro") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setProGateFeature(feature);
    } else {
      // Logic for toggling when pro is enabled
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Removed inline return for ProUpgradeBridge


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
          preferences
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
            appearance
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

        <View className="mx-5 mb-8 overflow-hidden rounded-[24px] border border-border/40 bg-card shadow-sm">
          <Text variant="sectionLabel" className="px-5 pt-5">
            privacy & elite features
          </Text>
          <View className="mt-2" />
          <MenuRow
            icon={<ShieldCheck size={18} color="#10b981" />}
            label="security checkup"
            description="clerk: 2fa and active sessions"
            onPress={() => {}}
          />
          <MenuRow
            icon={<Lock size={18} color="#f59e0b" />}
            label="privacy info"
            description="manage who can see your status"
            onPress={() => {}}
          />
          <MenuRow
            icon={<Ionicons name="eye-off-outline" size={18} color={tint} />}
            label="stealth mode"
            value={currentUserProfile.subscriptionTier === "pro" ? "enabled" : "disabled"}
            onPress={() => handleProFeaturePress("stealth")}
          />
          <MenuRow
            icon={<Ionicons name="chatbubble-ellipses-outline" size={18} color={tint} />}
            label="hide typing status"
            value={currentUserProfile.subscriptionTier === "pro" ? "enabled" : "disabled"}
            isLast
            onPress={() => handleProFeaturePress("ghost")}
          />
        </View>

        {/* Removed Pro Dialog */}

        <View className="mx-5 mb-8 overflow-hidden rounded-[24px] border border-border/40 bg-card shadow-sm">
          <Text variant="sectionLabel" className="px-5 pt-5">
            alerts
          </Text>
          <View className="mt-2" />
          <MenuRow
            icon={<Bell size={18} color="#ef4444" />}
            label="notifications"
            description="tones, banners, and mentions"
            isLast
            onPress={() => safePush("/settings/notifications")}
          />
        </View>
      </ScrollView>
      <ProFeatureSheet
        open={proGateFeature !== null}
        onOpenChange={(open) => !open && setProGateFeature(null)}
        feature={proGateFeature || "stealth"}
      />
    </View>
  );
}
