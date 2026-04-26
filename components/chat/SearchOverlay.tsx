import { ArrowLeft, Search as SearchIcon, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatListItem, { type SwipeableRowRef } from "@/components/chat/ChatListItem";
import { Text } from "@/components/ui/text";
import { cancelPendingOpenChatFromList } from "@/lib/openChatFromList";
import { useChat } from "@/context/ChatContext";
import type { Chat } from "@/lib/mocks/chatStore";

function chatMatchesInboxSearch(chat: Chat, query: string): boolean {
  if (chat.title.toLowerCase().includes(query)) return true;
  const members = chat.members;
  if (!members?.length) return false;
  return members.some((m) => m.name.toLowerCase().includes(query));
}

export type SearchOverlaySwipeProps = {
  registerSwipeRow: (id: string, ref: SwipeableRowRef | null) => void;
  closeOtherSwipeRows: (exceptId: string) => void;
  closeAllSwipeRows: () => void;
  onSwipeArchive: (chatId: string) => void;
  onSwipeDelete: (chatId: string) => void;
};

type SearchOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
} & SearchOverlaySwipeProps;

/**
 * Full-screen search over the chat list. Rendered in-tree (not Portal) so it stays under the same
 * navigation context as the Chats tab — avoids “navigation context” errors when switching tabs.
 */
export function SearchOverlay({
  isOpen,
  onClose,
  registerSwipeRow,
  closeOtherSwipeRows,
  closeAllSwipeRows,
  onSwipeArchive,
  onSwipeDelete,
}: SearchOverlayProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "white" : "black";

  const { chats, archivedChatIds, selectedChats, toggleSelection } = useChat();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return chats.filter((chat) => chatMatchesInboxSearch(chat, query));
  }, [searchQuery, chats]);

  const handleClose = () => {
    cancelPendingOpenChatFromList();
    closeAllSwipeRows();
    setSearchQuery("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[StyleSheet.absoluteFillObject, { zIndex: 200 }]}
      className="bg-background"
    >
      <View className="flex-1">
        <View
          className="flex-row items-center border-b border-border/50 px-4 py-2"
          style={{ paddingTop: Math.max(insets.top, 8) }}
        >
            <Pressable
              onPress={handleClose}
              className="p-2 -ml-2 rounded-full active:bg-muted/50"
            >
              <ArrowLeft size={24} color={iconColor} />
            </Pressable>

            <View className="flex-1 flex-row items-center bg-muted rounded-full px-4 ml-2 min-h-[44px]">
              <SearchIcon size={18} color="gray" className="mr-2" />
              <TextInput
                autoFocus
                placeholder="Search"
                placeholderTextColor="gray"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-[17px] text-foreground p-0 m-0"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  className="p-1 rounded-full active:bg-muted/80"
                >
                  <X size={18} color="gray" />
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={filteredResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={closeAllSwipeRows}
            ListEmptyComponent={
              searchQuery.trim().length > 0 ? (
                <View className="flex-1 items-center justify-center pt-20">
                  <Text className="text-muted-foreground text-lg text-center px-10">
                    No results for &quot;{searchQuery}&quot;
                  </Text>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center pt-20">
                  <Text className="text-muted-foreground text-lg text-center px-10">
                    Search by chat title or member name
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <View className="relative">
                <ChatListItem
                  chat={item}
                  isSelectionMode={selectedChats.size > 0}
                  isSelected={selectedChats.has(item.id)}
                  onToggleSelection={() => toggleSelection(item.id)}
                  onSwipeArchive={() => onSwipeArchive(item.id)}
                  onSwipeDelete={() => onSwipeDelete(item.id)}
                  setSwipeableRef={(r) => registerSwipeRow(item.id, r)}
                  onSwipeWillOpenRight={() => closeOtherSwipeRows(item.id)}
                />
                {archivedChatIds.has(item.id) && (
                  <View className="absolute right-16 top-1/2 -mt-2 bg-muted px-1.5 py-0.5 rounded">
                    <Text className="text-[10px] text-muted-foreground uppercase font-inter-bold">
                      Archived
                    </Text>
                  </View>
                )}
              </View>
            )}
          />
      </View>
    </Animated.View>
  );
}
