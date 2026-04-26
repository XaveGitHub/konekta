import ChatListItem, {
    type SwipeableRowRef,
} from "@/components/chat/ChatListItem";
import { MuteSheet } from "@/components/chat/MuteSheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Text } from "@/components/ui/text";
import Toast from "@/components/ui/Toast";
import { useChat } from "@/context/ChatContext";
import { toastBottomOffsetStackScreen } from "@/lib/tabScreenLayout";
import { appAccentHex } from "@/lib/theme";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ArchiveRestore,
  Inbox,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, FlatList, Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";

export default function ArchivedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accent = appAccentHex(isDark);
  const iconColor = isDark ? "white" : "black";

  const {
    chats,
    archivedChatIds,
    toast,
    setToast,
    selectedChats,
    toggleSelection,
    handleClearSelection,
    handleUnarchive,
    handleDelete,
    isMuteDialogOpen,
    isDeleteDialogOpen,
    setIsMuteDialogOpen,
    setIsDeleteDialogOpen,
    handleMuteConfirmed,
  } = useChat();

  const [isDeleteForEveryone, setIsDeleteForEveryone] = useState(false);
  const [swipeDeleteChatId, setSwipeDeleteChatId] = useState<string | null>(
    null,
  );
  const swipeDeleteChatIdRef = useRef<string | null>(null);

  const isSelectionMode = selectedChats.size > 0;

  const currentArchivedChats = chats.filter((c) => archivedChatIds.has(c.id));

  const selectedChatObjects = chats.filter((c) => selectedChats.has(c.id));

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

  const isEverySelectedMuted =
    selectedChatObjects.length > 0 &&
    selectedChatObjects.every((c) => c.isMuted);

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
    swipeRowsRef.current.forEach((row) => row.close());
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
      return () => {
        closeAllSwipeRows();
      };
    }, [closeAllSwipeRows]),
  );

  useEffect(() => {
    if (isMuteDialogOpen) closeAllSwipeRows();
  }, [isMuteDialogOpen, closeAllSwipeRows]);

  const handleMute = () => {
    if (isEverySelectedMuted) {
      handleMuteConfirmed('unmute');
      handleClearSelection();
      return;
    }
    setIsMuteDialogOpen(true);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (isSelectionMode) {
        handleClearSelection();
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [isSelectionMode, handleClearSelection, router]);

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-background">
      <View 
        style={{ paddingTop: Math.max(insets.top + 4, 10) }}
        className="relative z-20 bg-background"
      >
        <Animated.View
          key="normal-header"
          style={{ opacity: isSelectionMode ? 0 : 1 }}
          className="flex-row items-center px-4 pb-2"
          pointerEvents={isSelectionMode ? "none" : "auto"}
        >
          <Pressable
            onPress={() => router.back()}
            className="mr-1 flex-row items-center rounded-full p-2 active:bg-muted/50"
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={28} color={accent} />
          </Pressable>
          <Text className="text-xl font-inter-semibold text-foreground">
            Archived Chats
          </Text>
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
                accessibilityLabel="Unarchive selected"
                className="p-2.5 rounded-full active:bg-muted/50"
                onPress={() => handleUnarchive()}
              >
                <ArchiveRestore size={22} color={iconColor} />
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
            </View>
          </Animated.View>
        )}
      </View>

      {currentArchivedChats.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <View className="size-20 rounded-full bg-muted/30 items-center justify-center mb-4">
            <Inbox size={40} color={isDark ? "#4b5563" : "#9ca3af"} />
          </View>
          <Text
            accessibilityRole="header"
            className="text-xl font-inter-semibold text-foreground text-center"
          >
            No archived chats
          </Text>
          <Text className="text-muted-foreground text-center mt-2">
            Chats you archive will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentArchivedChats}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={closeAllSwipeRows}
          renderItem={({ item }) => (
            <ChatListItem
              chat={item}
              isSelectionMode={isSelectionMode}
              isSelected={selectedChats.has(item.id)}
              onToggleSelection={() => toggleSelection(item.id)}
              swipeLeadingActionVariant="unarchive"
              onSwipeArchive={() => handleUnarchive([item.id])}
              onSwipeDelete={() => {
                setSwipeDeleteChatId(item.id);
                setIsDeleteDialogOpen(true);
              }}
              setSwipeableRef={(r) => registerSwipeRow(item.id, r)}
              onSwipeWillOpenRight={() => closeOtherSwipeRows(item.id)}
            />
          )}
        />
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

      {toast && 
        (!toast.message.toLowerCase().includes("archived") || 
         toast.message.toLowerCase().includes("unarchived")) && (
        <Toast
          key={toast.id}
          message={toast.message}
          icon={toast.icon}
          countdown={toast.countdown}
          onUndo={toast.onUndo}
          onDismiss={toast.onDismiss}
          onHide={() => setToast(null)}
          bottomOffset={toastBottomOffsetStackScreen(insets)}
        />
      )}
    </SafeAreaView>
  );
}
