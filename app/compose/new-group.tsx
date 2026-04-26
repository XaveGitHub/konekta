import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PulsingDot } from "@/components/ui/PulsingDot";
import SearchInput from "@/components/ui/SearchInput";
import { Text } from "@/components/ui/text";
import type { Contact } from "@/lib/mocks/contactsStore";
import { type Chat, type Message, CURRENT_USER_ID } from "@/lib/mocks/chatStore";
import { useChat } from "@/context/ChatContext";
import { useContacts } from "@/context/ContactsContext";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ChevronLeft, Check, X, Users } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardEvent,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  Easing,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { appAccentHex } from "@/lib/theme";

type Step = "select" | "details";


// --- Member Chip (in the chip tray) ---
function MemberChip({
  contact,
  onRemove,
}: {
  contact: Contact;
  onRemove: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onRemove();
      }}
      className="items-center mr-3"
    >
      <View className="relative">
        <Avatar alt={contact.name} className="w-14 h-14">
          <AvatarImage src={contact.avatarUrl} />
          <AvatarFallback>
            <Text className="text-[13px] font-inter-medium text-foreground">
              {contact.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </Text>
          </AvatarFallback>
        </Avatar>
        <View className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-muted-foreground/80 items-center justify-center">
          <X size={10} color="white" strokeWidth={3} />
        </View>
      </View>
      <Text className="text-[11px] text-foreground mt-1.5 max-w-[56px] text-center" numberOfLines={1}>
        {contact.name.split(" ")[0]}
      </Text>
    </Pressable>
  );
}

// --- Selectable Contact Row ---
function SelectableContactRow({
  contact,
  isSelected,
  onToggle,
}: {
  contact: Contact;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      className="flex-row items-center px-5 py-2.5 active:bg-muted/30"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
    >
      <View className="relative mr-3.5">
        <Avatar alt={contact.name} className="w-11 h-11">
          <AvatarImage src={contact.avatarUrl} />
          <AvatarFallback>
            <Text className="text-[14px] font-inter-medium text-foreground">
              {contact.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </Text>
          </AvatarFallback>
        </Avatar>
        {contact.isOnline && !isSelected && (
          <View className="absolute bottom-0 right-0 p-0.5 bg-background rounded-full">
            <PulsingDot size={10} />
          </View>
        )}
        {isSelected && (
          <Animated.View
            entering={FadeIn.duration(150)}
            className="absolute inset-0 rounded-full bg-primary/90 items-center justify-center"
          >
            <Check size={20} color="white" strokeWidth={3} />
          </Animated.View>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-inter-semibold text-foreground">{contact.name}</Text>
        <Text className="text-[13px] text-muted-foreground mt-0.5" numberOfLines={1}>
          {contact.isOnline ? "Online" : contact.status ?? contact.username}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NewGroupScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accent = appAccentHex(isDark);
  const { setChats, addMessage } = useChat();
  const { contacts } = useContacts();

  const [step, setStep] = useState<Step>("select");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const nameInputRef = useRef<TextInput>(null);
  const chipScrollRef = useRef<ScrollView>(null);

  // Keyboard listener for step 2
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Auto-focus name input on step 2
  useEffect(() => {
    if (step === "details") {
      const t = setTimeout(() => nameInputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [step]);

  const sections = useMemo(() => {
    const list = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
    const groups: { [key: string]: Contact[] } = {};
    list.forEach((c) => {
      const char = c.name[0].toUpperCase();
      if (!groups[char]) groups[char] = [];
      groups[char].push(c);
    });
    return Object.keys(groups).sort().map((char) => ({ title: char, data: groups[char] }));
  }, [contacts]);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        data: s.data.filter(
          (c) => c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [query, sections]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selectedIds.has(c.id)),
    [selectedIds, contacts]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Auto-scroll chip tray to end when adding
    if (!selectedIds.has(id)) {
      setTimeout(() => chipScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedIds.size === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCreating(true);

    // Simulate a brief network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newGroupId = `group-${Date.now()}`;
    const newGroup: Chat = {
      id: newGroupId,
      title: groupName.trim(),
      lastMessage: "Group created",
      lastMessageAt: "Just now",
      unreadCount: 0,
      isGroup: true,
      myRole: "admin",
      members: [
        {
          id: CURRENT_USER_ID,
          name: "You",
          role: "admin",
        },
        ...selectedContacts.map((c) => ({
          id: c.id,
          name: c.name,
          role: "member" as const,
          avatarUrl: c.avatarUrl ?? null,
        })),
      ],
      groupDescription: "",
      groupInviteCode: `grp-${newGroupId.slice(-6)}`,
      avatarUrl: null,
    };

    setChats((prev) => [newGroup, ...prev]);
    
    // Inject "Group created" system message
    const systemMsg: Message = {
      id: `system-${Date.now()}`,
      chatId: newGroupId,
      senderId: 'system',
      text: 'You created this group',
      timestamp: newGroup.lastMessageAt,
      date: new Date().toISOString().split('T')[0],
      fullTimestamp: Math.floor(Date.now() / 1000),
      status: 'sent',
      type: 'system',
      isMe: false,
    };
    addMessage(newGroupId, systemMsg);

    setIsCreating(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate to the new group chat
    router.replace(`/chat/${newGroupId}` as any);
  };

  const avatarInitials = groupName.trim()
    ? groupName.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : null;

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-background">
      {/* ── HEADER ── */}
      <View
        style={{ paddingTop: Math.max(insets.top + 4, 10) }}
        className="z-20 bg-background"
      >
        <View className="flex-row items-center h-[56px] px-5">
          <Pressable
            onPress={() => {
              if (step === "details") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("select");
              } else {
                router.back();
              }
            }}
            className="p-2 -ml-2 rounded-full active:bg-muted/50"
          >
            <ChevronLeft size={28} color={appAccentHex(isDark)} />
          </Pressable>

          <Text className="text-3xl font-inter-bold text-primary tracking-tighter lowercase ml-1 flex-1">
            {step === "select" ? "new group" : "group details"}
          </Text>

          {step === "select" ? (
            <Pressable
              onPress={() => {
                if (selectedIds.size === 0) return;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStep("details");
              }}
              className="active:opacity-60 px-2"
              style={{ opacity: selectedIds.size > 0 ? 1 : 0.3 }}
              disabled={selectedIds.size === 0}
            >
              <Text className="text-primary font-inter-bold text-[17px] lowercase">
                next{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </Text>
            </Pressable>
          ) : (
            <View className="w-8" />
          )}
        </View>
      </View>

      {step === "select" ? (
        /* ───────────────────────────── STEP 1: SELECT ───────────────────────────── */
        <Animated.View
          entering={FadeIn.duration(200)}
          className="flex-1"
        >
          {/* Chip Tray */}
          {selectedContacts.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              className="border-b border-border/15"
            >
              <ScrollView
                ref={chipScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
              >
                {selectedContacts.map((c) => (
                  <MemberChip
                    key={c.id}
                    contact={c}
                    onRemove={() => toggleSelection(c.id)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Search */}
          <View className="px-5 py-3">
            <SearchInput
              placeholder="Search contacts"
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/* Contact list */}
          <SectionList
            sections={filteredSections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
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
              <SelectableContactRow
                contact={item}
                isSelected={selectedIds.has(item.id)}
                onToggle={() => toggleSelection(item.id)}
              />
            )}
            ListEmptyComponent={() => (
              <Animated.View entering={FadeIn} className="items-center py-20">
                <Text className="text-muted-foreground text-[15px]">No contacts found</Text>
              </Animated.View>
            )}
          />
        </Animated.View>
      ) : (
        /* ───────────────────────────── STEP 2: DETAILS ───────────────────────────── */
        <Animated.View
          entering={SlideInRight.duration(220).easing(Easing.out(Easing.quad))}
          className="flex-1 px-6"
          style={{ transform: [{ translateY: -keyboardHeight * 0.4 }] }}
        >
          {/* Avatar + Name input */}
          <View className="items-center mt-10 mb-8">
            <View className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 items-center justify-center mb-2">
              {avatarInitials ? (
                <Text className="text-3xl font-inter-semibold text-primary">{avatarInitials}</Text>
              ) : (
                <Users size={36} color={accent} strokeWidth={1.5} />
              )}
            </View>
            <Text className="text-sm text-muted-foreground mt-1">
              Tap to change photo (coming soon)
            </Text>
          </View>

          {/* Group name */}
          <View className="mb-6">
            <Text className="text-sm font-inter-medium lowercase tracking-tight text-muted-foreground mb-2 ml-1">
              group name
            </Text>
            <View className="flex-row items-center bg-muted/10 rounded-2xl px-4 border border-border/20 h-14">
              <TextInput
                ref={nameInputRef}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
                placeholderTextColor="#8E8E93"
                className="flex-1 text-[16px] text-foreground"
                style={{ flex: 1, fontSize: 16, color: isDark ? "#FFFFFF" : "#000000" }}
                returnKeyType="done"
                onSubmitEditing={handleCreateGroup}
                maxLength={64}
              />
              {groupName.length > 0 && (
                <Pressable onPress={() => setGroupName("")} hitSlop={8}>
                  <X size={18} color="#8E8E93" />
                </Pressable>
              )}
            </View>
            <Text className="text-sm text-muted-foreground mt-1.5 ml-1">
              {groupName.length}/64 · {selectedContacts.length} member{selectedContacts.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Selected members preview */}
          <View className="mb-8">
            <Text className="text-sm font-inter-medium lowercase tracking-tight text-muted-foreground mb-3 ml-1">
              members
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedContacts.map((c) => (
                <View key={c.id} className="items-center mr-4">
                  <Avatar alt={c.name} className="w-12 h-12">
                    <AvatarImage src={c.avatarUrl} />
                    <AvatarFallback>
                      <Text className="text-[12px] font-inter-medium text-foreground">
                        {c.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                  <Text className="text-[11px] text-muted-foreground mt-1 max-w-[48px] text-center" numberOfLines={1}>
                    {c.name.split(" ")[0]}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Create button */}
          <Button
            className="w-full rounded-2xl"
            onPress={handleCreateGroup}
            disabled={isCreating || !groupName.trim()}
          >
            {isCreating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-inter-semibold lowercase">
                create group
              </Text>
            )}
          </Button>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
