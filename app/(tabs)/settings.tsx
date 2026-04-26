import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { LogOut, Settings, User, ShieldCheck, Sparkles, Palette, Bell } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { MyQrSheet } from "@/components/profile/MyQrSheet";
import { useChat } from "@/context/ChatContext";
import { THEME } from "@/lib/theme";
import { MenuRow } from "@/components/ui/MenuRow";
import { safePush } from "@/lib/safeNavigation";
import { ChatAdItem } from "@/components/chat/ChatAdItem";
import { MOCK_ADS, AD_CAPS } from "@/lib/mocks/adStore";

export default function SettingsScreen() {
  const { currentUserProfile, adImpressionsToday, incrementAdImpression, dismissAd, adDismissedUntil } = useChat();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [myQrOpen, setMyQrOpen] = useState(false);

  // Managed Dialog State
  const [dialogInfo, setDialogInfo] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const showManagedAlert = (title: string, description: string) => {
    setDialogInfo({ open: true, title, description });
  };

  const tint = THEME[isDark ? "dark" : "light"].primary;


  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-background">
      <View className="flex-1">
      <View
        style={{
          paddingTop: Math.max(insets.top + 4, 10),
        }}
        className="relative z-20 bg-background px-5 pb-2"
      >
        <View className="flex h-[40px] flex-row items-center">
            <Text className="text-3xl font-inter-bold tracking-tighter text-primary lowercase">
              settings
            </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Centered hero — soft capsule card like preferences / tab headers */}
        <View className="mx-4 mb-6 items-center rounded-3xl bg-muted/15 px-5 py-6">
          <Avatar
            alt={currentUserProfile.displayName}
            className="h-24 w-24 shadow-sm"
          >
            <AvatarImage src={currentUserProfile.avatarUrl || undefined} />
            <AvatarFallback className="bg-muted">
              <Text className="text-3xl font-inter-semibold">
                {currentUserProfile.displayName.slice(0, 1).toUpperCase()}
              </Text>
            </AvatarFallback>
          </Avatar>
          
          <View className="mt-4 items-center">
            <Text className="text-2xl font-inter-bold text-foreground lowercase">
              {currentUserProfile.displayName}
            </Text>
            <Text
              variant="listSubtitle"
              className="mt-1 text-center text-[15px] text-muted-foreground/80 lowercase"
            >
              {currentUserProfile.phone ?? "no phone"} · {currentUserProfile.username}
            </Text>
          </View>

          <Pressable
            onPress={() => setMyQrOpen(true)}
            className="mt-6 flex-row items-center gap-2 rounded-2xl bg-primary/10 px-5 py-2.5 active:bg-primary/20"
          >
            <Ionicons name="qr-code-outline" size={18} color={tint} />
            <Text className="text-sm font-inter-bold lowercase text-foreground">
              my qr code
            </Text>
          </Pressable>
        </View>

        <Text variant="sectionLabel" className="px-5 mb-2">
          personal
        </Text>
        <View className="mx-4 mb-5 overflow-hidden rounded-3xl border border-border/25 bg-card">
          <MenuRow
            icon={<User size={18} color={tint} />}
            label="account"
            description="manage your info and security"
            onPress={() => safePush("/settings/account")}
          />
          <MenuRow
            icon={<Sparkles size={18} color="#f59e0b" />}
            label="konekta pro"
            description="unlock elite features and stealth mode"
            isLast
            onPress={() => safePush("/settings/subscriptions")}
          />
        </View>

        <Text variant="sectionLabel" className="px-5 mb-2">
          privacy & safety
        </Text>
        <View className="mx-4 mb-5 overflow-hidden rounded-3xl border border-border/25 bg-card">
          <MenuRow
            icon={<ShieldCheck size={18} color={tint} />}
            label="privacy & security"
            description="stealth mode and encryption"
            isLast
            onPress={() => safePush("/settings/privacy")}
          />
        </View>

        <Text variant="sectionLabel" className="px-5 mb-2">
          display & alerts
        </Text>
        <View className="mx-4 mb-5 overflow-hidden rounded-3xl border border-border/25 bg-card">
          <MenuRow
            icon={<Palette size={18} color={tint} />}
            label="appearance"
            description="theme and visual settings"
            onPress={() => safePush("/settings/appearance")}
          />
          <MenuRow
            icon={<Bell size={18} color={tint} />}
            label="notifications"
            description="tones, banners, and mentions"
            isLast
            onPress={() => safePush("/settings/notifications")}
          />
        </View>

        {currentUserProfile.subscriptionTier !== "pro" && Date.now() > adDismissedUntil && adImpressionsToday < AD_CAPS[currentUserProfile.subscriptionTier || 'free'] && (
          <View onLayout={() => incrementAdImpression()} className="mb-5">
            <ChatAdItem
              id={MOCK_ADS[1].id}
              title={MOCK_ADS[1].title}
              description={MOCK_ADS[1].description}
              imageUrl={MOCK_ADS[1].imageUrl}
              linkUrl={MOCK_ADS[1].linkUrl}
              onClose={() => dismissAd(20 * 60 * 1000)}
            />
          </View>
        )}

        <View className="mx-4 mb-5 overflow-hidden rounded-3xl border border-border/25 bg-card">
          <MenuRow
            icon={<LogOut size={18} color="#FF3B30" />}
            label="log out"
            description="sign out of this device"
            isDestructive
            isLast
            onPress={() =>
              showManagedAlert(
                "Log out",
                "Logging out is disabled in this preview build.",
              )
            }
          />
        </View>

        <View className="mb-10 items-center px-6 opacity-30">
          <Text
            variant="listSubtitle"
            className="text-center text-[12px] lowercase leading-5"
          >
            all data in this build is mock-only · no backend sync
          </Text>
        </View>
      </ScrollView>

      <Dialog
        open={dialogInfo.open}
        onOpenChange={(open) => setDialogInfo((prev) => ({ ...prev, open }))}
      >
        <DialogContent
          className="w-[92%] sm:max-w-[400px]"
          onOpenChange={(open) => setDialogInfo((prev) => ({ ...prev, open }))}
        >
          <DialogHeader className="w-full">
            <DialogTitle>{dialogInfo.title}</DialogTitle>
            <DialogDescription>{dialogInfo.description}</DialogDescription>
          </DialogHeader>
          <View className="mt-4">
            <Button
              variant="secondary"
              onPress={() => setDialogInfo((prev) => ({ ...prev, open: false }))}
              className="w-full rounded-2xl"
            >
              <Text className="font-inter-semibold lowercase">close</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      <MyQrSheet
        open={myQrOpen}
        onOpenChange={setMyQrOpen}
        profile={
          myQrOpen
            ? {
                displayName: currentUserProfile.displayName,
                username: currentUserProfile.username,
                avatarUrl: currentUserProfile.avatarUrl,
              }
            : null
        }
      />
    </View>
    </SafeAreaView>
  );
}
