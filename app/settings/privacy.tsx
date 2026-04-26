import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MenuRow } from "@/components/ui/MenuRow";
import { THEME } from "@/lib/theme";
import { useChat } from "@/context/ChatContext";
import { ProFeatureSheet, type ProFeature } from "@/components/chat/ProFeatureSheet";
import { Lock, ShieldCheck } from "lucide-react-native";

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const tint = THEME[isDark ? "dark" : "light"].primary;

  const { currentUserProfile } = useChat();
  const [proGateFeature, setProGateFeature] = useState<ProFeature | null>(null);

  const handleProFeaturePress = (feature: ProFeature) => {
    if (currentUserProfile.subscriptionTier !== "pro") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setProGateFeature(feature);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

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
          privacy & security
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-5 mb-8 overflow-hidden rounded-[24px] border border-border/40 bg-card shadow-sm">
          <Text variant="sectionLabel" className="px-5 pt-5">
            elite features
          </Text>
          <View className="mt-2" />
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

        <View className="mx-5 mb-8 overflow-hidden rounded-[24px] border border-border/40 bg-card shadow-sm">
          <Text variant="sectionLabel" className="px-5 pt-5 text-emerald-600 dark:text-emerald-500">
            security (clerk managed)
          </Text>
          <View className="mt-2" />
          <MenuRow
            icon={<ShieldCheck size={18} color="#10b981" />}
            label="security checkup"
            description="2fa, sessions, and active devices"
            onPress={() => {}}
          />
          <MenuRow
            icon={<Lock size={18} color="#f59e0b" />}
            label="privacy & blocking"
            description="manage blocked users and status"
            isLast
            onPress={() => {}}
          />
        </View>
        
        <View className="px-8">
            <Text className="text-center text-xs text-muted-foreground font-inter-medium lowercase leading-5">
                konekta uses end-to-end encryption for all chats. your data is never stored on our servers.
            </Text>
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
