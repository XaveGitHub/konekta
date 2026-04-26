import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { useChat } from "@/context/ChatContext";
import { CURRENT_USER_ID } from "@/lib/mocks/chatStore";
import { getDeterministicAvatarColor } from "@/lib/avatarColor";
import { THEME } from "@/lib/theme";
import { getUserProfile, type UserProfile } from "@/lib/mocks/profileStore";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Lock, MessageCircle, Pencil } from "lucide-react-native";
import { MyQrSheet } from "@/components/profile/MyQrSheet";
import { useColorScheme } from "nativewind";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MenuRow } from "@/components/ui/MenuRow";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ProfileScreen() {
  const { userId: rawUserId, via: rawVia } = useLocalSearchParams<{
    userId: string;
    via?: string;
  }>();
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const viaRaw = Array.isArray(rawVia) ? rawVia[0] : rawVia;
  const viaContext = useMemo(() => {
    if (!viaRaw || typeof viaRaw !== "string") return null;
    try {
      return decodeURIComponent(viaRaw);
    } catch {
      return viaRaw;
    }
  }, [viaRaw]);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const palette = THEME[isDark ? "dark" : "light"];
  const tint = palette.primary;
  const onPrimary = palette.primaryForeground;
  const { chats, currentUserProfile } = useChat();
  const [myQrOpen, setMyQrOpen] = useState(false);

  const isMe = userId === CURRENT_USER_ID;

  const profile: UserProfile | null = useMemo(() => {
    if (isMe) return currentUserProfile;
    const fromMock = getUserProfile(userId);
    if (fromMock) return fromMock;
    const fromChat = chats.find(
      (c) => !c.isGroup && !c.isChannel && c.peerUserId === userId,
    );
    if (fromChat) {
      return {
        id: userId,
        displayName: fromChat.title,
        username: fromChat.username?.startsWith("@")
          ? fromChat.username
          : `@${fromChat.username ?? "user"}`,
        avatarUrl: fromChat.avatarUrl,
      };
    }
    return null;
  }, [userId, isMe, currentUserProfile, chats]);

  const dmChatId = useMemo(() => {
    if (isMe) return undefined;
    return chats.find(
      (c) => !c.isGroup && !c.isChannel && c.peerUserId === userId,
    )?.id;
  }, [chats, userId, isMe]);

  if (!userId || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-xs font-inter-medium lowercase tracking-tight text-muted-foreground">
          profile not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-5 rounded-full px-4 py-2 active:bg-muted/50"
        >
          <Text className="text-center text-sm font-inter-semibold lowercase text-primary">
            go back
          </Text>
        </Pressable>
      </View>
    );
  }

  /** Hero + sections — same chrome for self and others (self: edit + my qr; others: message + via) */
  const heroColor = getDeterministicAvatarColor(profile.displayName);

  return (
    <View className="flex-1 bg-muted/15">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View className="relative h-44 w-full overflow-hidden">
          <View
            style={{ backgroundColor: heroColor }}
            className="h-full w-full opacity-90"
          />
        </View>

        <View className="z-10 mx-4 -mt-14 mb-6 rounded-[24px] border border-border/40 bg-card shadow-sm shadow-black/10">
          <View className="px-6 pb-6">
            <View className="-mt-[46px] flex-row items-end justify-between">
              <View className="h-[96px] w-[96px] overflow-hidden rounded-full border-[4px] border-card bg-card shadow-lg">
                <Avatar alt={profile.displayName} className="h-full w-full">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback
                    style={{ backgroundColor: heroColor }}
                    className="items-center justify-center"
                  >
                    <Text className="text-3xl font-inter-semibold text-white">
                      {profile.displayName.charAt(0)}
                    </Text>
                  </AvatarFallback>
                </Avatar>
              </View>
              {!isMe ? (
                <View className="mb-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
              ) : (
                <View className="mb-1 h-3 w-3" />
              )}
            </View>

            <View className="mt-4">
              <Text className="text-[26px] font-inter-bold leading-8 tracking-tight text-foreground lowercase">
                {profile.displayName}
              </Text>
              {isMe ? (
                <Text className="mt-1.5 text-xs font-inter-medium lowercase leading-4 text-muted-foreground/80">
                  how you appear to others on konekta
                </Text>
              ) : viaContext ? (
                <Text
                  className="mt-1.5 text-xs font-inter-medium lowercase leading-4 text-muted-foreground/80"
                  numberOfLines={2}
                >
                  opened from · {viaContext}
                </Text>
              ) : (
                <Text className="mt-1 text-xs font-inter-medium lowercase tracking-tight text-muted-foreground/80">
                  active recently
                </Text>
              )}
            </View>

            {isMe ? (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setMyQrOpen(true);
                }}
                className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl border border-border/10 bg-muted/20 py-3.5 active:bg-muted/40"
              >
                <Ionicons name="qr-code" size={20} color={tint} />
                <Text className="text-[16px] font-inter-semibold lowercase text-foreground">
                  my qr
                </Text>
              </Pressable>
            ) : dmChatId ? (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/chat/${dmChatId}`);
                }}
                className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 active:opacity-90"
              >
                <MessageCircle size={20} color={onPrimary} />
                <Text className="text-[16px] font-inter-semibold lowercase text-primary-foreground">
                  message
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <SectionHeader label="information" />
        <View className="mx-5 mb-8 overflow-hidden rounded-2xl border border-border/40 bg-card">
          <MenuRow
            icon={<Ionicons name="at" size={18} color={tint} />}
            label="username"
            value={profile.username.startsWith("@") ? profile.username : `@${profile.username}`}
            onPress={() => {}} // Read-only for now but feels interactive
          />
          {profile.phone && (
            <MenuRow
              icon={<Ionicons name="phone-portrait-outline" size={18} color="#10b981" />}
              label="phone"
              value={profile.phone}
              isLast={!profile.bio}
              onPress={() => {}}
            />
          )}
          {profile.bio && (
            <MenuRow
              icon={<Ionicons name="information-circle-outline" size={18} color={tint} />}
              label="about"
              description={profile.bio}
              isLast
              showChevron={false}
            />
          )}
        </View>

        <SectionHeader label="trust & privacy" />
        <View className="mx-5 mb-8 overflow-hidden rounded-2xl border border-border/40 bg-card">
          <MenuRow
            icon={<Lock size={18} color="#f97316" />}
            label="end-to-end encrypted"
            description="messages are secured between you and this contact"
            isLast
            onPress={() => {}}
          />
        </View>

        <View className="mb-10 items-center px-6 opacity-40">
          <Text className="text-center text-[13.5px] font-inter-semibold lowercase tracking-[0.2em] text-muted-foreground">
            konekta v1.0.0
          </Text>
          <Text className="mt-4 text-center text-[12px] font-inter-medium leading-5 text-muted-foreground/60 lowercase">
            all data in this build is mock-only · no database or backend
          </Text>
        </View>
      </ScrollView>

      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-5"
        style={{ paddingTop: Math.max(insets.top + 8, 16) }}
      >
        <Pressable
          onPress={() => router.back()}
          className="rounded-full border border-white/20 bg-black/25 p-2.5 active:bg-black/40"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <View className="flex-1" />
        {isMe ? (
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/profile/edit");
            }}
            accessibilityLabel="Edit profile"
            className="rounded-full border border-white/20 bg-black/25 p-2.5 active:bg-black/40"
          >
            <Pencil size={20} color="white" />
          </Pressable>
        ) : (
          <View className="w-11" />
        )}
      </View>

      {isMe ? (
        <MyQrSheet
          open={myQrOpen}
          onOpenChange={setMyQrOpen}
          profile={
            myQrOpen
              ? {
                  displayName: profile.displayName,
                  username: profile.username,
                  avatarUrl: profile.avatarUrl,
                }
              : null
          }
        />
      ) : null}
    </View>
  );
}
