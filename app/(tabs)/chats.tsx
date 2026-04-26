import ChatListItem, {
  type SwipeableRowRef,
} from "@/components/chat/ChatListItem";
import { MuteSheet } from "@/components/chat/MuteSheet";
import { SearchOverlay } from "@/components/chat/SearchOverlay";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchInput from "@/components/ui/SearchInput";
import { Text } from "@/components/ui/text";
import { useChat } from "@/context/ChatContext";
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
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Archive,
  MessageCircle,
  MessageSquareCheck,
  MessageSquareDot,
  MoreVertical,
  PencilLine,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  FlatList,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ChatAdItem } from "@/components/chat/ChatAdItem";
import { MOCK_ADS, AD_CAPS, AD_INTERVALS } from "@/lib/mocks/adStore";

type ChatFilter =
  | "all"
  | "online"
  | "unread"
  | "request"
  | "groups"
  | "channels";

function filterChipLabel(f: ChatFilter): string {
  switch (f) {
    case "all":
      return "all";
    case "online":
      return "online";
    case "unread":
      return "unread";
    case "request":
      return "request";
    case "groups":
      return "groups";
    case "channels":
      return "channels";
  }
}

function chatsListEmptyCopy(
  filter: ChatFilter,
  hasAnyUnarchivedChat: boolean,
): { title: string; subtitle: string } {
  if (!hasAnyUnarchivedChat) {
    return {
      title: "No chats yet",
      subtitle: "Tap the button in the corner to start a message.",
    };
  }
  switch (filter) {
    case "online":
      return {
        title: "No one online",
        subtitle: "Try All or check back later.",
      };
    case "unread":
      return {
        title: "You're all caught up",
        subtitle: "No unread conversations.",
      };
    case "request":
      return {
        title: "No message requests",
        subtitle: "Nothing pending right now.",
      };
    case "groups":
      return {
        title: "No groups",
        subtitle: "Create one from New message.",
      };
    case "channels":
      return {
        title: "No channels",
        subtitle: "Channels you join will show here.",
      };
    default:
      return {
        title: "Nothing here",
        subtitle: "Try another filter.",
      };
  }
}

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "white" : "black";

  const {
    chats,
    selectedChats,
    isMuteDialogOpen,
    isDeleteDialogOpen,
    toast,
    archivedChatIds,
    setIsDeleteDialogOpen,
    setIsMuteDialogOpen,
    toggleSelection,
    handleClearSelection,
    handleMuteConfirmed,
    handleDelete,
    handleArchive,
    handleToggleReadStatus,
    acceptMessageRequest,
    declineMessageRequest,
    currentUserProfile,
    adImpressionsToday,
    incrementAdImpression,
    adDismissedUntil,
    dismissAd,
  } = useChat();

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
    onListLayout: onChatListLayout,
    onContentSizeChange: onChatListContentSizeChange,
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

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDeleteForEveryone, setIsDeleteForEveryone] = useState(false);
  /** When set, delete dialog applies to this chat only (swipe), not selection. */
  const [swipeDeleteChatId, setSwipeDeleteChatId] = useState<string | null>(
    null,
  );
  const swipeDeleteChatIdRef = useRef<string | null>(null);

  const isSelectionMode = selectedChats.size > 0;

  const selectedChatObjects = chats.filter((c) => selectedChats.has(c.id));
  const isEverySelectedMuted =
    selectedChatObjects.length > 0 &&
    selectedChatObjects.every((c) => c.isMuted);
  const isEverySelectedRead =
    selectedChatObjects.length > 0 &&
    selectedChatObjects.every((c) => (c.unreadCount ?? 0) === 0);

  const deleteDialogIds = swipeDeleteChatId
    ? [swipeDeleteChatId]
    : Array.from(selectedChats);
  const deleteDialogChats = chats.filter((c) => deleteDialogIds.includes(c.id));
  const dialogEveryLeaveType =
    deleteDialogChats.length > 0 &&
    deleteDialogChats.every((c) => c.isGroup || c.isChannel);
  const dialogEveryGroup =
    deleteDialogChats.length > 0 &&
    deleteDialogChats.every((c) => c.isGroup);
  const dialogSingleGroup =
    deleteDialogChats.length === 1 && !!deleteDialogChats[0]?.isGroup;
  const dialogSingleChannel =
    deleteDialogChats.length === 1 && !!deleteDialogChats[0]?.isChannel;

  const swipeRowsRef = useRef<Map<string, SwipeableRowRef>>(new Map());

  const registerSwipeRow = useCallback(
    (id: string, ref: SwipeableRowRef | null) => {
      const m = swipeRowsRef.current;
      if (ref) m.set(id, ref);
      else m.delete(id);
    },
    [],
  );

  const closeOtherSwipeRows = useCallback((exceptId: string) => {
    swipeRowsRef.current.forEach((row, id) => {
      if (id !== exceptId) row.close();
    });
  }, []);

  const closeAllSwipeRows = useCallback(() => {
    swipeRowsRef.current.forEach((row) => {
      row.close();
    });
  }, []);

  useEffect(() => {
    swipeDeleteChatIdRef.current = swipeDeleteChatId;
  }, [swipeDeleteChatId]);

  const closeSwipedRowAndClearDeleteTarget = useCallback(() => {
    const id = swipeDeleteChatIdRef.current;
    if (id) swipeRowsRef.current.get(id)?.close();
    swipeDeleteChatIdRef.current = null;
    setSwipeDeleteChatId(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      closeAllSwipeRows();
      resetScrollFab();
      return () => {
        closeAllSwipeRows();
        // Do not clear swipeRowsRef here: Chats can stay mounted under a pushed chat
        // screen; clearing drops Swipeable refs without ref-callback re-fire, so sibling
        // rows never receive closeOtherSwipeRows until remount.
        setIsSearchOpen(false);
        resetScrollFab();
      };
    }, [closeAllSwipeRows, resetScrollFab]),
  );

  useEffect(() => {
    // Don’t close swipes when delete dialog opens — row stays open until cancel/confirm.
    if (isSearchOpen || isMuteDialogOpen) {
      closeAllSwipeRows();
    }
  }, [isSearchOpen, isMuteDialogOpen, closeAllSwipeRows]);

  const [activeFilter, setActiveFilter] = useState<ChatFilter>("all");

  useEffect(() => {
    resetScrollFab();
  }, [activeFilter, resetScrollFab]);

  const filteredChats = useMemo(() => {
    let result = chats.filter((c) => {
      // 1. Filter out archived
      if (archivedChatIds.has(c.id)) return false;

      // 2. Filter by status
      if (activeFilter === "all") return true;
      if (activeFilter === "online") return !!c.isOnline;
      if (activeFilter === "unread") return (c.unreadCount ?? 0) > 0;
      if (activeFilter === "request") return !!c.isMessageRequest;
      if (activeFilter === "groups") return !!c.isGroup;
      if (activeFilter === "channels") return !!c.isChannel;
      return true;
    });

    return result;
  }, [chats, archivedChatIds, activeFilter]);

  const listData = useMemo(() => {
    if (activeFilter !== "all" && activeFilter !== "channels") return filteredChats;

    const tier = currentUserProfile.subscriptionTier || "free";
    const interval = AD_INTERVALS[tier];
    const cap = AD_CAPS[tier];

    const isAdDismissed = Date.now() < adDismissedUntil;

    if (tier === "pro" || adImpressionsToday >= cap || isAdDismissed) return filteredChats;

    const items: (any)[] = [];
    filteredChats.forEach((chat, index) => {
      items.push(chat);
      // Inject ONLY at the 3rd position (index 2)
      if (index === 1 && filteredChats.length >= 2) {
        items.push(MOCK_ADS[0]);
      }
    });
    return items;
  }, [filteredChats, activeFilter, currentUserProfile.subscriptionTier, adImpressionsToday, adDismissedUntil]);

  const handleToggleReadStatusAction = () => {
    handleToggleReadStatus(isEverySelectedRead);
    setIsMoreMenuOpen(false);
  };

  const handleMute = () => {
    if (isEverySelectedMuted) {
      handleMuteConfirmed('unmute');
      return;
    }
    setIsMuteDialogOpen(true);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (isSearchOpen) {
        closeAllSwipeRows();
        swipeRowsRef.current.clear();
        setIsSearchOpen(false);
        return true;
      }
      if (isSelectionMode) {
        handleClearSelection();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [
    isSearchOpen,
    isSelectionMode,
    handleClearSelection,
    closeAllSwipeRows,
  ]);



  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-background">
      <View className="relative flex-1">
      <View 
        style={{ paddingTop: Math.max(insets.top + 4, 10) }}
        className="relative z-20 pb-0 bg-background border-b border-border/5"
      >
        <Animated.View
          key="normal-header"
          style={{ opacity: isSelectionMode ? 0 : 1 }}
          className="pb-1"
          pointerEvents={isSelectionMode ? "none" : "auto"}
        >
          <View className="flex-row items-center justify-between h-[40px] px-5">
            <Text className="text-3xl font-inter-bold tracking-tighter text-primary lowercase">
              konekta
            </Text>
          </View>
          
          <View className="mt-1 px-5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search chats"
              onPress={() => {
                closeAllSwipeRows();
                swipeRowsRef.current.clear();
                setIsSearchOpen(true);
              }}
            >
              <View pointerEvents="none">
                <SearchInput placeholder="Search chats" />
              </View>
            </Pressable>
          </View>

          {/* Filter Chips Layer */}
          <View className="flex-row items-center mt-3 pb-2">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {(
                [
                  "all",
                  "online",
                  "unread",
                  "request",
                  "groups",
                  "channels",
                ] as const
              ).map((filter) => (
                <Pressable
                  key={filter}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeFilter === filter }}
                  accessibilityLabel={`Filter: ${filterChipLabel(filter)}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter(filter);
                  }}
                  className={`px-4 py-1.5 rounded-full mr-2 border ${
                    activeFilter === filter
                      ? "bg-primary border-primary"
                      : "bg-muted/50 border-border/50"
                  }`}
                >
                  <Text
                    className={`text-[13px] font-inter-semibold tracking-tight ${
                      activeFilter === filter ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {filterChipLabel(filter)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Animated.View>

        {isSelectionMode && (
          <Animated.View
            key="action-bar"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={{ top: Math.max(insets.top + 4, 10) }}
            className="absolute left-0 right-0 flex-row items-center px-4"
          >
            <View className="flex-row items-center flex-1">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear selection"
                onPress={handleClearSelection}
                className="p-2 mr-2"
              >
                <X size={24} color={iconColor} />
              </Pressable>
              <Text className="text-xl font-inter-semibold text-foreground">
                {selectedChats.size}
              </Text>
            </View>

            <View className="flex-row items-center justify-end gap-1">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Archive selected chats"
                className="p-2.5 rounded-full active:bg-muted/50"
                onPress={() => handleArchive()}
              >
                <Archive size={22} color={iconColor} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isEverySelectedMuted ? "Unmute selected" : "Mute selected"
                }
                className="p-2.5 rounded-full active:bg-muted/50"
                onPress={handleMute}
              >
                {isEverySelectedMuted ? (
                  <Volume2 size={22} color={iconColor} />
                ) : (
                  <VolumeX size={22} color={iconColor} />
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete selected chats"
                className="p-2.5 rounded-full active:bg-muted/50"
                onPress={() => {
                  setSwipeDeleteChatId(null);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 size={22} color={iconColor} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="More actions"
                className="p-2.5 rounded-full active:bg-muted/50"
                onPress={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              >
                <MoreVertical size={22} color={iconColor} />
              </Pressable>
            </View>

            {isMoreMenuOpen && (
              <Animated.View
                entering={FadeIn.duration(150)}
                exiting={FadeOut.duration(150)}
                className="absolute top-12 right-2 w-52 bg-card rounded-xl border border-border z-50"
              >
                <Pressable className="flex-row items-center gap-3 px-4 py-3 active:bg-muted/50">
                  <PencilLine size={20} color={iconColor} />
                  <Text className="text-base text-foreground font-inter-medium">
                    Add to folder
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center gap-3 px-4 py-3 active:bg-muted/50"
                  onPress={handleToggleReadStatusAction}
                >
                  {isEverySelectedRead ? (
                    <MessageSquareDot size={20} color={iconColor} />
                  ) : (
                    <MessageSquareCheck size={20} color={iconColor} />
                  )}
                  <Text className="text-base text-foreground font-inter-medium">
                    {isEverySelectedRead ? "Mark as unread" : "Mark as read"}
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </View>

      {isMoreMenuOpen && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss menu"
          className="absolute inset-0 z-10"
          onPress={() => setIsMoreMenuOpen(false)}
        />
      )}

      <FlatList
        style={{ flex: 1 }}
        data={listData}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: tabScreenListPaddingBottom(insets),
        }}
        showsVerticalScrollIndicator={false}
        onLayout={onChatListLayout}
        onContentSizeChange={onChatListContentSizeChange}
        onScroll={onFabScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={closeAllSwipeRows}
        ListEmptyComponent={() => {
          const hasAnyUnarchived = chats.some((c) => !archivedChatIds.has(c.id));
          const copy = chatsListEmptyCopy(activeFilter, hasAnyUnarchived);
          return (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="items-center justify-center px-10 py-20"
            >
              <View className="size-20 rounded-full bg-muted/30 items-center justify-center mb-4">
                <MessageCircle
                  size={40}
                  color={isDark ? "#4b5563" : "#9ca3af"}
                />
              </View>
              <Text className="text-xl font-inter-semibold text-foreground text-center">
                {copy.title}
              </Text>
              <Text className="text-muted-foreground text-center mt-2 max-w-sm">
                {copy.subtitle}
              </Text>
            </Animated.View>
          );
        }}
        ListHeaderComponent={
          archivedChatIds.size > 0 ? (
            <Pressable
              onPress={() => {
                if (isSelectionMode) return;
                closeAllSwipeRows();
                router.push("/archived");
              }}
              accessibilityRole="button"
              accessibilityLabel={`Archived chats, ${archivedChatIds.size} hidden`}
              className="flex-row items-center px-5 py-2.5 active:bg-muted/50 transition-colors"
              disabled={isSelectionMode}
            >
              <View className="relative">
                <View className="size-[56px] rounded-full bg-secondary/10 items-center justify-center">
                   <Archive size={26} color="#00D1C1" />
                </View>
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-[17px] font-inter-semibold text-foreground">
                    Archived Chats
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mt-1">
                  <Text className="flex-1 text-[14px] text-muted-foreground mr-2">
                    {archivedChatIds.size === 1
                      ? "1 conversation hidden"
                      : `${archivedChatIds.size} conversations hidden`}
                  </Text>
                </View>
              </View>
            </Pressable>
          ) : null
        }
        ItemSeparatorComponent={() => <View className="h-0" />}
        renderItem={({ item }) => {
          if ('type' in item && item.type === 'ad') {
            return (
              <View onLayout={() => incrementAdImpression()}>
                <ChatAdItem
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  imageUrl={item.imageUrl}
                  linkUrl={item.linkUrl}
                  onClose={() => dismissAd(20 * 60 * 1000)}
                />
              </View>
            );
          }
          return (
            <ChatListItem
              chat={item}
              isSelectionMode={isSelectionMode}
              swipeEnabled={!isSearchOpen}
              isSelected={selectedChats.has(item.id)}
              onToggleSelection={() => toggleSelection(item.id)}
              onSwipeDelete={() => {
                setSwipeDeleteChatId(item.id);
                setIsDeleteDialogOpen(true);
              }}
              onSwipeArchive={() => handleArchive([item.id])}
              setSwipeableRef={
                isSearchOpen
                  ? undefined
                  : (r) => registerSwipeRow(item.id, r)
              }
              onSwipeWillOpenRight={() => closeOtherSwipeRows(item.id)}
            />
          );
        }}
      />

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => {
          closeAllSwipeRows();
          swipeRowsRef.current.clear();
          setIsSearchOpen(false);
        }}
        registerSwipeRow={registerSwipeRow}
        closeOtherSwipeRows={closeOtherSwipeRows}
        closeAllSwipeRows={closeAllSwipeRows}
        onSwipeArchive={(id) => handleArchive([id])}
        onSwipeDelete={(id) => {
          setSwipeDeleteChatId(id);
          setIsDeleteDialogOpen(true);
        }}
      />

      <MuteSheet
        isOpen={isMuteDialogOpen}
        onClose={() => setIsMuteDialogOpen(false)}
        onSelect={handleMuteConfirmed}
        title={
          selectedChats.size === 1
            ? (selectedChatObjects[0]?.title ?? "this chat")
            : `${selectedChats.size} chats`
        }
      />

      {/* Floating Action Button (New Chat) */}
      {!isSearchOpen && !isSelectionMode && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[tabScreenFabHorizontalStyle(insets), fabLiftStyle]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New chat"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/compose/new-chat" as any);
            }}
            className="w-[52px] h-[52px] bg-primary rounded-full items-center justify-center"
          >
             <Plus size={24} color="white" />
          </Pressable>
        </Animated.View>
      )}

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setIsDeleteForEveryone(false);
            closeSwipedRowAndClearDeleteTarget();
          }
        }}
      >
        <DialogContent
          className="w-[92%] sm:max-w-[400px]"
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) {
              setIsDeleteForEveryone(false);
              closeSwipedRowAndClearDeleteTarget();
            }
          }}
        >
          <DialogHeader className="w-full">
            <DialogTitle className="lowercase">
              {dialogSingleChannel
                ? "leave channel"
                : dialogEveryGroup
                  ? "leave group"
                  : dialogEveryLeaveType
                    ? "leave conversations"
                    : "delete chat"}
            </DialogTitle>
            <DialogDescription className="lowercase">
              {deleteDialogIds.length === 1
                ? dialogSingleGroup
                  ? `are you sure you want to leave ${deleteDialogChats[0]?.title ?? "this group"}?`
                  : dialogSingleChannel
                    ? `you will stop seeing updates from ${deleteDialogChats[0]?.title ?? "this channel"} (mock).`
                    : `are you sure you want to delete your chat with ${deleteDialogChats[0]?.title ?? "this contact"}?`
                : dialogEveryGroup
                  ? `are you sure you want to leave ${deleteDialogIds.length} groups?`
                  : dialogEveryLeaveType
                    ? `are you sure you want to leave ${deleteDialogIds.length} groups or channels?`
                    : `are you sure you want to delete ${deleteDialogIds.length} chats?`}
            </DialogDescription>
          </DialogHeader>

          {!dialogEveryLeaveType && (
            <Pressable
              className="flex-row items-center gap-3 -mx-6 px-6 py-2.5 active:bg-muted/40 w-[calc(100%+3rem)]"
              onPress={() => setIsDeleteForEveryone(!isDeleteForEveryone)}
            >
              <Checkbox
                checked={isDeleteForEveryone}
                onCheckedChange={setIsDeleteForEveryone}
              />
              <Text className="text-foreground font-inter-medium text-sm lowercase">
                {deleteDialogIds.length === 1
                  ? `also delete for ${deleteDialogChats[0]?.title ?? "the user"}`
                  : "delete for both sides where possible"}
              </Text>
            </Pressable>
          )}

          <View className="flex-row gap-2 mt-3 w-full">
            <Pressable
              className="flex-1 py-3 bg-muted/50 active:bg-muted rounded-xl"
              onPress={() => setIsDeleteDialogOpen(false)}
            >
              <Text className="text-foreground font-inter-medium text-center text-sm lowercase">
                cancel
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 py-3 bg-destructive/10 active:bg-destructive/20 rounded-xl"
              onPress={() => {
                handleDelete(
                  dialogEveryLeaveType,
                  deleteDialogIds.length > 0 ? deleteDialogIds : undefined,
                );
                setIsDeleteForEveryone(false);
                swipeDeleteChatIdRef.current = null;
                setSwipeDeleteChatId(null);
              }}
            >
              <Text className="text-destructive font-inter-semibold text-center text-sm lowercase">
                {dialogSingleChannel
                  ? "leave channel"
                  : dialogEveryGroup
                    ? "leave group"
                    : dialogEveryLeaveType
                      ? "leave"
                      : "delete"}
              </Text>
            </Pressable>
          </View>
        </DialogContent>
      </Dialog>

      </View>
    </SafeAreaView>
  );
}

