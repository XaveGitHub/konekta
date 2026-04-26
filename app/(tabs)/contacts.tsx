import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchInput from "@/components/ui/SearchInput";
import AddContactSheet from "@/components/contact/AddContactSheet";
import { Text } from "@/components/ui/text";
import { PulsingDot } from "@/components/ui/PulsingDot";
import type { Contact } from "@/lib/mocks/contactsStore";
import { useChat } from "@/context/ChatContext";
import { useContacts } from "@/context/ContactsContext";
import {
  TAB_FAB_SCROLL_FADE_OUT_BY_TRANSLATE,
  useTabScreenFabScroll,
} from "@/hooks/useTabScreenFabScroll";
import {
  tabScreenFabBottom,
  tabScreenFabBottomWithToast,
  tabScreenFabHorizontalStyle,
  tabScreenListPaddingBottom,
} from "@/lib/tabScreenLayout";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { safePush } from "@/lib/safeNavigation";
import { MessageCircle, Phone, X, UserPlus } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";


// --- Subcomponent: Active Now Avatar ---
const ActiveAvatar = memo(({
  contact,
  onOpenPrimary,
}: {
  contact: Contact;
  onOpenPrimary: (c: Contact) => void;
}) => {
  return (
    <Pressable
      className="items-center mr-5"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onOpenPrimary(contact);
      }}
    >
      <View className="relative">
        <View 
          className="rounded-full items-center justify-center border-2 border-primary"
          style={{ 
            width: 62, 
            height: 62, 
            padding: 3,
          }}
        >
          <Avatar alt={contact.name} className="w-14 h-14">
            <AvatarImage src={contact.avatarUrl} />
            <AvatarFallback className="bg-muted items-center justify-center">
              <Text className="text-base font-inter-medium text-foreground">
                {contact.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </Text>
            </AvatarFallback>
          </Avatar>
        </View>
        <View className="absolute bottom-1 right-1 p-0.5 bg-background rounded-full">
            <PulsingDot size={12} />
        </View>
      </View>
      <Text
        className="mt-1.5 text-[12px] font-inter-medium text-foreground"
        numberOfLines={1}
        style={{ maxWidth: 62 }}
      >
        {contact.name.split(" ")[0]}
      </Text>
    </Pressable>
  );
});
ActiveAvatar.displayName = "ActiveAvatar";

// --- Subcomponent: Suggestion Card ---
const SuggestionCard = memo(({
  contact,
  onDismiss,
  onOpenPrimary,
}: {
  contact: Contact;
  onDismiss: () => void;
  onOpenPrimary: (c: Contact) => void;
}) => {
  return (
    <View
      className="rounded-2xl bg-card border border-border/40 mr-3 overflow-hidden"
      style={{ width: 150 }}
    >
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onOpenPrimary(contact);
        }}
      >
        <View className="items-center pt-5 pb-3 px-3">
          <View className="relative mb-3">
            <Avatar alt={contact.name} className="w-16 h-16">
              <AvatarImage src={contact.avatarUrl} />
              <AvatarFallback>
                <Text className="text-xl font-inter-medium text-foreground">
                  {contact.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </Text>
              </AvatarFallback>
            </Avatar>
            {contact.isOnline && (
              <View className="absolute bottom-0.5 right-0.5 p-0.5 bg-card rounded-full">
                <PulsingDot size={10} />
              </View>
            )}
          </View>
          <Text className="text-[14px] font-inter-semibold text-foreground text-center" numberOfLines={1}>
            {contact.name.split(" ")[0]}
          </Text>
          <Text className="text-[12px] text-muted-foreground text-center mt-0.5" numberOfLines={1}>
            {contact.username}
          </Text>
        </View>

        <View className="px-3 pb-3">
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (contact.chatId) {
                router.push(`/chat/${contact.chatId}` as any);
              } else {
                onOpenPrimary(contact);
              }
            }}
            className="items-center rounded-xl bg-primary/10 py-2 active:opacity-80"
          >
            <Text className="text-[13px] font-inter-semibold text-primary">+ Connect</Text>
          </Pressable>
        </View>
      </Pressable>

      <Pressable
        className="absolute top-2 right-2 w-6 h-6 bg-muted/80 rounded-full items-center justify-center"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDismiss();
        }}
      >
        <X size={12} color="#94A3B8" />
      </Pressable>
    </View>
  );
});
SuggestionCard.displayName = "SuggestionCard";

// --- Subcomponent: Friend Row ---
const FriendRow = memo(({
  contact,
  onOpenPrimary,
  onOpenChat,
}: {
  contact: Contact;
  onOpenPrimary: (c: Contact) => void;
  onOpenChat: (c: Contact) => void;
}) => {
  return (
    <Pressable
      className="flex-row items-center px-5 py-3 active:bg-muted/30"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onOpenPrimary(contact);
      }}
    >
      <View className="relative mr-3.5">
        <Avatar alt={contact.name} className="w-[52px] h-[52px]">
          <AvatarImage src={contact.avatarUrl} />
          <AvatarFallback>
            <Text className="text-[16px] font-inter-semibold text-foreground">
              {contact.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
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
        <Text className="text-[16px] font-inter-semibold text-foreground">{contact.name}</Text>
        <Text className="text-[13px] text-muted-foreground mt-0.5" numberOfLines={1}>
          {contact.status ?? contact.username}
        </Text>
      </View>

      <Pressable
        className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-primary/10"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onOpenChat(contact);
        }}
      >
        <MessageCircle size={18} color="#FF5C00" />
      </Pressable>
    </Pressable>
  );
});
FriendRow.displayName = "FriendRow";

// --- Main Screen ---
export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const { showToast, toast } = useChat();
  const { contacts, addContact } = useContacts();

  const openContactPrimary = (c: Contact) => {
    if (c.profileUserId) {
      safePush(`/profile/${c.profileUserId}`);
      return;
    }
    if (c.chatId) {
      safePush(`/chat/${c.chatId}`);
      return;
    }
    showToast({
      message: "No profile or chat for this contact in the mock list.",
    });
  };

  const openContactChat = (c: Contact) => {
    if (c.chatId) {
      safePush(`/chat/${c.chatId}`);
      return;
    }
    showToast({
      message: "No chat yet — start one from Chats (mock).",
    });
  };

  const fabBottomSv = useSharedValue(tabScreenFabBottom(insets));
  useEffect(() => {
    const target = toast
      ? tabScreenFabBottomWithToast(insets)
      : tabScreenFabBottom(insets);
    fabBottomSv.value = withTiming(target, { duration: 260 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fabBottomSv is a stable Reanimated ref
  }, [toast, insets.bottom, insets.left, insets.right, insets.top]);

  const {
    onScroll: onFabScroll,
    onListLayout: onContactsListLayout,
    onContentSizeChange: onContactsListContentSizeChange,
    scrollTranslateY,
    resetScrollFab,
  } = useTabScreenFabScroll();

  const fabLiftStyle = useAnimatedStyle(() => {
    const t = scrollTranslateY.value;
    return {
      bottom: fabBottomSv.value,
      opacity: interpolate(
        t,
        [0, TAB_FAB_SCROLL_FADE_OUT_BY_TRANSLATE],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [{ translateY: t }],
    };
  });

  const [query, setQuery] = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const onlineContacts = useMemo(() => contacts.filter((c) => c.isOnline), [contacts]);

  const suggestionPool = useMemo(
    () => contacts.filter((c) => !c.isOnline && !dismissedIds.has(c.id)).slice(0, 6),
    [dismissedIds, contacts]
  );

  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q));
    }
    return list;
  }, [query, contacts]);

  useFocusEffect(
    useCallback(() => {
      resetScrollFab();
      return () => resetScrollFab();
    }, [resetScrollFab]),
  );

  useEffect(() => {
    resetScrollFab();
  }, [query, resetScrollFab]);

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-background">
      <View className="relative flex-1">
      <View
        style={{ paddingTop: Math.max(insets.top + 4, 10) }}
        className="relative z-20 bg-background pb-0"
      >
        <View className="pb-1">
          <View className="flex h-[40px] flex-row items-center justify-between px-5">
            <Text className="text-3xl font-inter-bold tracking-tighter text-primary lowercase">
              people
            </Text>
          </View>

          <View className="mt-1 px-5">
            <SearchInput
              placeholder="Search people"
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onLayout={onContactsListLayout}
        onContentSizeChange={onContactsListContentSizeChange}
        onScroll={onFabScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: tabScreenListPaddingBottom(insets),
        }}
        ListHeaderComponent={
          !query ? (
            <View>
              {/* 1. Active Now Section (Highest Priority) */}
              {onlineContacts.length > 0 && (
                <View className="mb-6 mt-5">
                  <Text className="px-5 mb-4 text-[15px] font-inter-bold text-foreground lowercase">
                    active now ({onlineContacts.length})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                  >
                    {onlineContacts.map((c) => (
                      <ActiveAvatar
                        key={c.id}
                        contact={c}
                        onOpenPrimary={openContactPrimary}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 2. Call History Banner (Utility) */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/recents");
                }}
                className="flex-row items-center px-5 py-3 active:bg-muted/50 mb-6"
              >
                <View className="size-[52px] rounded-full bg-primary/10 items-center justify-center">
                   <Phone size={24} color="#FF5C00" />
                </View>
                <View className="flex-1 ml-3.5">
                  <Text className="text-[17px] font-inter-semibold text-foreground lowercase">
                    call history
                  </Text>
                  <Text className="text-[14px] text-muted-foreground mt-0.5">
                    Recent audio and video calls
                  </Text>
                </View>
              </Pressable>

              {/* All friends section header */}
              <Text className="px-5 mb-2 text-[15px] font-inter-semibold text-foreground lowercase">
                all friends
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
            !query && suggestionPool.length > 0 ? (
                <View className="mb-8 mt-8">
                     <Text className="px-5 mb-4 text-[15px] font-inter-semibold text-foreground lowercase">
                        people you may know
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
                    >
                        {suggestionPool.map((c) => (
                        <SuggestionCard
                          key={c.id}
                          contact={c}
                          onDismiss={() =>
                            setDismissedIds((prev) => new Set([...prev, c.id]))
                          }
                          onOpenPrimary={openContactPrimary}
                        />
                        ))}
                    </ScrollView>
                </View>
            ) : null
        }

        renderItem={({ item }) => (
          <FriendRow
            contact={item}
            onOpenPrimary={openContactPrimary}
            onOpenChat={openContactChat}
          />
        )}
        ListEmptyComponent={() => (
          <Animated.View entering={FadeIn} className="items-center py-24 px-8">
            <Text className="text-5xl mb-4">🔍</Text>
            <Text className="text-foreground font-inter-semibold text-lg mb-1 lowercase">no results</Text>
            <Text className="text-muted-foreground text-sm text-center">
              {`We couldn't find anyone matching "${query}"`}
            </Text>
          </Animated.View>
        )}
      />
      {/* Floating Action Button (Add Contact) */}
      {!query && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[tabScreenFabHorizontalStyle(insets), fabLiftStyle]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add contact"
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setIsAddSheetOpen(true);
            }}
            className="w-[52px] h-[52px] bg-primary rounded-full items-center justify-center"
          >
            <UserPlus size={24} color="white" />
          </Pressable>
        </Animated.View>
      )}

      <AddContactSheet
        open={isAddSheetOpen}
        onOpenChange={setIsAddSheetOpen}
        onAddContact={addContact}
      />
      </View>
    </SafeAreaView>
  );
}
