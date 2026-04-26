import { UnlockChannelsSheet } from "@/components/chat/UnlockChannelsSheet";
import AddContactSheet from "@/components/contact/AddContactSheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PulsingDot } from "@/components/ui/PulsingDot";
import SearchInput from "@/components/ui/SearchInput";
import { Text } from "@/components/ui/text";
import { useChat } from "@/context/ChatContext";
import { useContacts } from "@/context/ContactsContext";
import type { Contact } from "@/lib/mocks/contactsStore";
import { appAccentHex } from "@/lib/theme";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
    ChevronLeft,
    Megaphone,
    UserPlus,
    UserRoundPlus,
    Users,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SectionList,
    View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

// --- Action Card (New Group / New Contact) ---
function ActionCard({
  icon: Icon,
  label,
  subtitle,
  onPress,
  iconBg,
  iconColor,
}: {
  icon: any;
  label: string;
  subtitle: string;
  onPress: () => void;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Pressable
      className="flex-row items-center px-5 py-3.5 active:bg-muted/30"
      onPress={onPress}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-inter-semibold text-foreground">
          {label}
        </Text>
        <Text className="text-[13px] text-muted-foreground mt-0.5">
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

// --- Contact Row ---
function ContactRow({
  contact,
  onPress,
}: {
  contact: Contact;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${contact.name}. ${contact.isOnline ? "Online" : (contact.status ?? contact.username ?? "")}`}
      className="flex-row items-center px-5 py-2.5 active:bg-muted/30"
      onPress={onPress}
    >
      <View className="relative mr-3.5">
        <Avatar alt={contact.name} className="w-11 h-11">
          <AvatarImage src={contact.avatarUrl} />
          <AvatarFallback>
            <Text className="text-[14px] font-inter-medium text-foreground">
              {contact.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)}
            </Text>
          </AvatarFallback>
        </Avatar>
        {contact.isOnline && (
          <View className="absolute bottom-0 right-0 p-0.5 bg-background rounded-full">
            <PulsingDot size={10} />
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-inter-semibold text-foreground">
          {contact.name}
        </Text>
        <Text
          className="text-[13px] text-muted-foreground mt-0.5"
          numberOfLines={1}
        >
          {contact.isOnline ? "Online" : (contact.status ?? contact.username)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NewChatScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accent = appAccentHex(isDark);
  const { contacts } = useContacts();
  const { setChats } = useChat();

  const [query, setQuery] = useState("");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isProDialogOpen, setIsProDialogOpen] = useState(false);

  const { currentUserProfile } = useChat();
  const isPro = currentUserProfile?.subscriptionTier === "pro";

  const handleContactPress = (contact: Contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (contact.chatId) {
      router.push(`/chat/${contact.chatId}` as any);
      return;
    }
    // No existing chat — create a new DM
    const newChatId = `dm-${contact.id}-${Date.now()}`;
    setChats((prev) => [
      {
        id: newChatId,
        title: contact.name,
        lastMessage: "",
        lastMessageAt: "",
        unreadCount: 0,
        avatarUrl: contact.avatarUrl ?? null,
        username: contact.username,
        isOnline: contact.isOnline,
      },
      ...prev,
    ]);
    router.replace(`/chat/${newChatId}` as any);
  };

  const sections = useMemo(() => {
    const list = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
    const groups: { [key: string]: Contact[] } = {};
    list.forEach((c) => {
      const char = c.name[0].toUpperCase();
      if (!groups[char]) groups[char] = [];
      groups[char].push(c);
    });
    return Object.keys(groups)
      .sort()
      .map((char) => ({ title: char, data: groups[char] }));
  }, [contacts]);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        data: s.data.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.username.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [query, sections]);

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Math.max(insets.top, 12) + 52}
      >
        {/* Header */}
        <View
          style={{ paddingTop: Math.max(insets.top + 4, 10) }}
          className="relative z-20 pb-0 bg-background"
        >
          <View className="pb-1">
            <View className="flex-row items-center h-[56px] px-5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => router.back()}
                className="-ml-2 p-2 rounded-full active:bg-muted/50"
              >
                <ChevronLeft size={28} color={accent} />
              </Pressable>
              <Text className="text-3xl font-inter-bold text-primary tracking-tighter ml-1 lowercase">
                new message
              </Text>
            </View>

            <View className="px-5">
              <SearchInput
                placeholder="Search contacts"
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </View>
        </View>

        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-background/95 px-5 py-1.5 border-b border-border/10">
              <Text className="text-[13px] font-inter-medium text-primary tracking-tight">
                {title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ContactRow
              contact={item}
              onPress={() => handleContactPress(item)}
            />
          )}
          ListHeaderComponent={
            !query ? (
              <View className="pt-2 pb-1">
                <ActionCard
                  icon={Users}
                  label="New Group"
                  subtitle="Create a group with multiple contacts"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/compose/new-group" as any);
                  }}
                  iconBg={
                    isDark ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.12)"
                  }
                  iconColor="#3B82F6"
                />
                <ActionCard
                  icon={UserRoundPlus}
                  label="New Contact"
                  subtitle="Add someone by phone or QR code"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsAddContactOpen(true);
                  }}
                  iconBg={
                    isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.12)"
                  }
                  iconColor="#22C55E"
                />
                <ActionCard
                  icon={Megaphone}
                  label="New Channel"
                  subtitle="Broadcast your message to many subscribers"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (isPro) {
                      router.push("/compose/new-channel" as any);
                    } else {
                      setIsProDialogOpen(true);
                    }
                  }}
                  iconBg={
                    isDark ? "rgba(168,85,247,0.15)" : "rgba(168,85,247,0.12)"
                  }
                  iconColor="#A855F7"
                />
                <View className="h-[1px] bg-border/10 mx-5 mt-2 mb-1" />
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <Animated.View
              entering={FadeIn.duration(140)}
              className="items-center py-20 px-8"
            >
              <Text className="text-4xl mb-4">🔍</Text>
              <Text className="text-foreground font-inter-semibold text-[16px] mb-1">
                No contacts found
              </Text>
              <Text className="text-muted-foreground text-[14px] text-center mb-6">
                {`No one matched "${query}"`}
              </Text>
              <Pressable
                className="flex-row items-center gap-2 px-5 py-3 bg-primary/10 rounded-2xl active:bg-primary/20"
                onPress={() => {
                  setQuery("");
                  setIsAddContactOpen(true);
                }}
              >
                <UserPlus size={18} color={accent} />
                <Text className="text-primary font-inter-semibold text-[15px]">
                  Add as new contact
                </Text>
              </Pressable>
            </Animated.View>
          )}
        />
      </KeyboardAvoidingView>

      <AddContactSheet
        open={isAddContactOpen}
        onOpenChange={setIsAddContactOpen}
      />



      <UnlockChannelsSheet
        open={isProDialogOpen}
        onOpenChange={setIsProDialogOpen}
      />
    </SafeAreaView>
  );
}
