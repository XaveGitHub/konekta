import React, { useMemo, useState, useEffect, useCallback } from "react";
import Animated, {
  FadeInDown,
  FadeOutDown,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { useChat } from "@/context/ChatContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Message } from "@/lib/mocks/chatStore";
import {
  channelComposerLockMessage,
  isChannelComposerReadOnly,
} from "@/lib/channel";
import { resetAudioSessionForChat } from "@/lib/audioSession";
import { messageToReplyPreview } from "@/lib/messages/replyPreview";
import { formatFileSize } from "@/lib/utils";
import { tabBarBottomInset } from "@/lib/tabScreenLayout";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatMoreMenu } from "@/components/chat/ChatMoreMenu";
import { ReactionTray } from "@/components/chat/ReactionTray";
import { AttachmentTray } from "@/components/chat/AttachmentTray";
import { CustomMediaGallery, type SelectedMedia } from "@/components/chat/CustomMediaGallery";
import { CameraOverlay } from "@/components/chat/CameraOverlay";
import { MediaPreview } from "@/components/chat/MediaPreview";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import {
  MediaViewer,
  type MediaViewerItem,
} from "@/components/chat/MediaViewer";
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Toast from "@/components/ui/Toast";
import { useColorScheme } from "nativewind";

function MessageRequestOverlay({
  isGroup,
  contactName,
  onAccept,
  onDecline,
  bottomInset,
  topInset,
}: {
  isGroup?: boolean;
  contactName: string;
  onAccept: () => void;
  onDecline: () => void;
  bottomInset: number;
  topInset: number;
}) {
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { zIndex: 100, top: 0, left: 0, right: 0, bottom: 0 },
      ]}
      pointerEvents="auto"
    >
      <View style={StyleSheet.absoluteFillObject} className="bg-background/80 dark:bg-background/90" />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingTop: topInset + 8,
            paddingBottom: bottomInset + 12,
          },
        ]}
        pointerEvents="box-none"
      >
        <View
          className="rounded-2xl border border-border/50 bg-card p-5 shadow-lg"
          accessibilityLabel="Message request"
        >
          <Text className="mb-2 text-[18px] font-inter-semibold text-foreground">Message request</Text>
          <Text className="mb-5 text-[14px] font-inter leading-5 text-muted-foreground">
            {isGroup
              ? `“${contactName}” is a pending conversation. Accept to keep it in your chats, or archive it.`
              : `${contactName} isn’t in your contacts yet. Accept the request to start messaging, or archive it.`}
          </Text>
          <Pressable
            onPress={onAccept}
            accessibilityRole="button"
            accessibilityLabel="Accept message request"
            className="mb-2.5 w-full items-center justify-center rounded-xl bg-primary py-3.5 active:opacity-90"
          >
            <Text className="text-[15px] font-inter-semibold text-primary-foreground">Accept</Text>
          </Pressable>
          <Pressable
            onPress={onDecline}
            accessibilityRole="button"
            accessibilityLabel="Decline and archive"
            className="w-full items-center justify-center rounded-xl border border-border py-3.5 active:bg-muted/50"
          >
            <Text className="text-[15px] font-inter-semibold text-foreground">Decline</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const DateDivider = ({ date }: { date: string }) => {
  const displayDate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (date === today) return "Today";
    if (date === yesterday) return "Yesterday";
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [date]);

  return (
    <View className="items-center my-6">
      <View className="bg-black/10 dark:bg-white/10 px-3 py-1 rounded-full">
        <Text className="text-[12px] font-inter-medium text-muted-foreground">
          {displayDate}
        </Text>
      </View>
    </View>
  );
};

function buildOutgoingMessage(
  chatId: string,
  partial: Omit<Message, "id" | "chatId" | "senderId" | "timestamp" | "date" | "fullTimestamp" | "status" | "isMe"> &
    Partial<Pick<Message, "timestamp" | "date" | "fullTimestamp" | "status">>,
): Message {
  const nowMs = Date.now();
  const d = new Date(nowMs);
  const date = d.toISOString().split("T")[0];
  const timestamp = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return {
    id: `local_${nowMs}_${Math.random().toString(36).slice(2, 9)}`,
    chatId,
    senderId: "me",
    timestamp,
    date,
    fullTimestamp: Math.floor(nowMs / 1000),
    status: "sending",
    isMe: true,
    ...partial,
  };
}

function removedMessageTombstone(
  original: Message,
  chatId: string,
  who: "self" | "other",
): Message {
  return {
    id: `removed_${original.id}_${Date.now()}`,
    chatId,
    senderId: "system",
    text:
      who === "self"
        ? "You removed a message."
        : "This message was removed.",
    timestamp: original.timestamp,
    date: original.date,
    fullTimestamp: original.fullTimestamp,
    status: "read",
    type: "system",
    isMe: false,
  };
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    acceptMessageRequest,
    declineMessageRequest,
    messagesByChatId,
    addMessage,
    setMessagesByChatId,
    chats,
    showToast,
    toast,
    setToast,
    handleMuteConfirmed,
    handleClearSelection,
    setSelectedChats,
    setIsDeleteDialogOpen,
    isDeleteDialogOpen,
    handleDelete,
    currentUserProfile,
  } = useChat();
  const { colorScheme } = useColorScheme();
  const isKonektaPlus = currentUserProfile.subscriptionTier === "plus";
  const isDark = colorScheme === "dark";
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isDeleteForEveryone, setIsDeleteForEveryone] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isDeleteMsgForEveryone, setIsDeleteMsgForEveryone] = useState(false);
  const [activeReactionTarget, setActiveReactionTarget] = useState<{ msg: Message, yPos: number, isMe: boolean } | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isTrayVisible, setIsTrayVisible] = useState(false);
  const [isCustomGalleryVisible, setIsCustomGalleryVisible] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ uri: string, type: 'photo' | 'video' } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [mediaViewer, setMediaViewer] = useState<{
    items: MediaViewerItem[];
    initialIndex: number;
  } | null>(null);

  const handleSendCustomGallery = (assets: SelectedMedia[]) => {
    if (!id || assets.length === 0) return;

    if (assets.length === 1) {
      const asset = assets[0];
      const aspect = asset.width && asset.height ? asset.width / asset.height : undefined;
      const replyTo = replyingTo
        ? messageToReplyPreview(replyingTo, chat?.title)
        : undefined;
      const msg = buildOutgoingMessage(id as string, {
        type: asset.type === 'video' ? "video" : "image",
        mediaUrl: asset.uri,
        mediaAspectRatio: aspect,
        ...(replyTo ? { replyTo } : {}),
      });
      addMessage(id as string, msg);
    } else {
      const urls = assets.map((a) => a.uri);
      const replyTo = replyingTo
        ? messageToReplyPreview(replyingTo, chat?.title)
        : undefined;
      const msg = buildOutgoingMessage(id as string, {
        type: "image",
        mediaUrls: urls,
        ...(replyTo ? { replyTo } : {}),
      });
      addMessage(id as string, msg);
    }

    setReplyingTo(null);
  };

  const triggerTypingSimulation = () => {
    // Wait a second, then show typing indicator for 3 seconds
    setTimeout(() => {
      setIsOtherUserTyping(true);
      setTimeout(() => {
        setIsOtherUserTyping(false);
      }, 3000);
    }, 1000);
  };

  const handleCameraCapture = (uri: string, type: "photo" | "video") => {
    setPreviewMedia({ uri, type });
    setIsCameraVisible(false);
    void resetAudioSessionForChat();
  };

  const handleSendMedia = () => {
    if (!previewMedia || !id) return;
    const replyTo = replyingTo
      ? messageToReplyPreview(replyingTo, chat?.title)
      : undefined;
    const msg = buildOutgoingMessage(id as string, {
      type: previewMedia.type === "photo" ? "image" : "video",
      mediaUrl: previewMedia.uri,
      ...(replyTo ? { replyTo } : {}),
    });
    addMessage(id as string, msg);
    setPreviewMedia(null);
    setReplyingTo(null);
    void resetAudioSessionForChat();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    triggerTypingSimulation();
  };

  const handleSendText = (text: string) => {
    if (!id) return;
    const replyTo = replyingTo
      ? messageToReplyPreview(replyingTo, chat?.title)
      : undefined;
    const msg = buildOutgoingMessage(id as string, {
      type: "text",
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    addMessage(id as string, msg);
    setReplyingTo(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerTypingSimulation();
  };

  const handleSendVoice = (uri: string) => {
    if (!id) return;
    const replyTo = replyingTo
      ? messageToReplyPreview(replyingTo, chat?.title)
      : undefined;
    const msg = buildOutgoingMessage(id as string, {
      type: "audio",
      mediaUrl: uri,
      ...(replyTo ? { replyTo } : {}),
    });
    addMessage(id as string, msg);
    setReplyingTo(null);
    triggerTypingSimulation();
  };

  const handlePickDocument = async () => {
    if (!id) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const replyTo = replyingTo
          ? messageToReplyPreview(replyingTo, chat?.title)
          : undefined;
        const msg = buildOutgoingMessage(id as string, {
          type: "file",
          mediaUrl: asset.uri,
          fileName: asset.name ?? "File",
          fileSize: formatFileSize(asset.size ?? 0),
          ...(replyTo ? { replyTo } : {}),
        });
        addMessage(id as string, msg);
        setReplyingTo(null);
        setIsTrayVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error("Document picker error", err);
    }
  };

  const handleGetLocation = async () => {
    if (!id) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      let locationLabel = "Shared location";
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        const g = geo[0];
        if (g) {
          const parts = [g.street, g.city, g.region].filter(Boolean);
          if (parts.length) locationLabel = parts.join(", ");
        }
      } catch {
        /* use default label */
      }
      const replyTo = replyingTo
        ? messageToReplyPreview(replyingTo, chat?.title)
        : undefined;
      const msg = buildOutgoingMessage(id as string, {
        type: "location",
        latitude,
        longitude,
        locationLabel,
        text: locationLabel,
        ...(replyTo ? { replyTo } : {}),
      });
      addMessage(id as string, msg);
      setReplyingTo(null);
      setIsTrayVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Location error", err);
    }
  };

  const messages = useMemo(() => {
    if (!id) return [];
    return [...(messagesByChatId[id] || [])].sort(
      (a, b) => b.fullTimestamp - a.fullTimestamp,
    );
  }, [id, messagesByChatId]);

  useEffect(() => {
    // Platform-specific keyboard triggers
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true);
      if (Platform.OS === 'android') {
        setKeyboardHeight(e.endCoordinates.height);
      }
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      if (Platform.OS === 'android') {
        setKeyboardHeight(0);
      }
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      // Reset hardware audio session on unmount to prevent 'Silent Camera' ghost bug
      resetAudioSessionForChat();
    };
  }, []);

  const insets = useSafeAreaInsets();

  /** Spacer under messages — driven by actual composer stack height (keyboard open vs closed). */
  const [composerStackHeight, setComposerStackHeight] = useState(() => 88);

  const onComposerStackLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setComposerStackHeight(Math.ceil(h));
  }, []);

  // Find the specific chat info
  const chat = useMemo(() => chats.find((c) => c.id === id), [chats, id]);

  // Use context messages

  const getGroupIncomingLayout = useCallback(
    (senderId: string) => {
      const member = chat?.members?.find((m) => m.id === senderId);
      return {
        avatarUrl: member?.avatarUrl ?? null,
        senderName: member?.name ?? "Member",
      };
    },
    [chat?.members],
  );

  const channelComposerLocked = useMemo(
    () => isChannelComposerReadOnly(chat),
    [chat],
  );

  useEffect(() => {
    if (channelComposerLocked) setReplyingTo(null);
  }, [channelComposerLocked]);

  const ListHeader = useMemo(
    () =>
      function ChatThreadListHeader() {
        return (
          <View>
            {isOtherUserTyping && <TypingIndicator />}
            <View style={{ height: composerStackHeight + 30 }} />
          </View>
        );
      },
    [composerStackHeight, isOtherUserTyping],
  );

  const renderMessage = useCallback(
    ({ item, index }: ListRenderItemInfo<Message>) => {
      const isLastInCluster =
        index === 0 ||
        messages[index - 1].senderId !== item.senderId ||
        messages[index - 1].date !== item.date;
      const isFirstInCluster =
        index === messages.length - 1 ||
        messages[index + 1].senderId !== item.senderId ||
        messages[index + 1].date !== item.date;

      const showDateDivider =
        index === messages.length - 1 || messages[index + 1].date !== item.date;
      const marginTop = showDateDivider ? 0 : isFirstInCluster ? 10 : 2;

      const groupIncoming =
        (chat?.isGroup || chat?.isChannel) && !item.isMe
          ? {
              showAvatar: isLastInCluster,
              ...getGroupIncomingLayout(item.senderId),
            }
          : undefined;

      return (
        <View className="px-4">
          {showDateDivider ? <DateDivider date={item.date} /> : null}
          <View style={{ marginTop }}>
            <MessageBubble
              message={item}
              showTail={isLastInCluster}
              groupIncoming={groupIncoming}
              onLongPress={(y) => {
                setActiveReactionTarget({
                  msg: item,
                  yPos: y,
                  isMe: item.isMe,
                });
              }}
              onReply={(msg) => {
                setReplyingTo(msg);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onOpenMedia={setMediaViewer}
            />
          </View>
        </View>
      );
    },
    [messages, chat, getGroupIncomingLayout],
  );

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0 }}
        enabled={true}
        className="bg-background"
      >
        <ChatHeader 
          chat={chat} 
          onToggleMenu={() => setMenuVisible(!isMenuVisible)} 
        />
        
        <View className="flex-1 relative overflow-hidden">
          {/* Subtle background for chat area */}
          <View className={`absolute inset-0 ${isDark ? 'bg-[#0F0F0F]' : 'bg-[#E5E5EA]/30'}`} />
          
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            ListHeaderComponent={ListHeader}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={9}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={Platform.OS === "android"}
            contentContainerStyle={{
              paddingBottom: 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />

          {isTrayVisible && !channelComposerLocked && !chat?.isMessageRequest ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss attachment menu"
              onPress={() => setIsTrayVisible(false)}
              style={[StyleSheet.absoluteFillObject, { zIndex: 45 }]}
              className="bg-transparent"
            />
          ) : null}

          <View
            onLayout={onComposerStackLayout}
            className="absolute bottom-0 left-0 right-0 z-50 bg-transparent"
            style={{
              elevation: 6,
              // Strictly mathematically identical to Tab Bar spacing (e.g. insets.bottom - 12)
              paddingBottom: isKeyboardVisible 
                ? 0 
                : tabBarBottomInset(insets),
            }}
          >
            {replyingTo && !channelComposerLocked && !chat?.isMessageRequest && (
              <Animated.View
                entering={FadeInDown.duration(160)}
                exiting={FadeOutDown.duration(120)}
                className="mx-3 mb-2 bg-background/95 border border-border/50 rounded-2xl px-3 py-2.5 flex-row items-center gap-3 backdrop-blur-xl shadow-sm shadow-black/5"
              >
                <View className="w-1.5 h-10 bg-primary/80 rounded-full" />
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <Ionicons name="arrow-undo" size={14} color="#1E90FF" />
                    <Text className="text-primary font-inter-semibold text-[13px] tracking-tight">
                      Replying to {replyingTo.isMe ? 'yourself' : chat?.title}
                    </Text>
                  </View>
                  <Text className="text-muted-foreground text-[12px] leading-4" numberOfLines={1}>
                    {replyingTo.type === 'text' ? replyingTo.text : (replyingTo.type === 'image' ? 'Photo' : 'Video')}
                  </Text>
                </View>

                {/* Media Thumbnail for Context */}
                {(replyingTo.type === 'image' || replyingTo.type === 'video') && replyingTo.mediaUrl ? (
                  <View className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted/20">
                    <Image
                      source={{ uri: replyingTo.mediaUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={0}
                    />
                    {replyingTo.type === 'video' && (
                      <View className="absolute inset-0 items-center justify-center bg-black/20">
                        <Ionicons name="play" size={16} color="white" />
                      </View>
                    )}
                  </View>
                ) : null}

                <Pressable 
                  onPress={() => setReplyingTo(null)} 
                  className="w-8 h-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 active:bg-black/10"
                >
                  <Ionicons name="close" size={20} color={isDark ? '#AAA' : '#888'} />
                </Pressable>
              </Animated.View>
            )}
            <View className="relative">
              <ChatInput
                isTrayVisible={isTrayVisible}
                setIsTrayVisible={setIsTrayVisible}
                onOpenCamera={() => setIsCameraVisible(true)}
                onSendText={handleSendText}
                onSendVoice={handleSendVoice}
                onVoiceNoteTooShort={() =>
                  showToast({
                    message: "Hold a bit longer to record a voice message",
                  })
                }
                composerReadOnly={!!chat?.isMessageRequest || channelComposerLocked}
                composerReadOnlyMessage={
                  chat?.isMessageRequest
                    ? "Accept the request to send messages."
                    : channelComposerLockMessage()
                }
              />
              {!channelComposerLocked && !chat?.isMessageRequest && (
                <AttachmentTray
                  isVisible={isTrayVisible}
                  onClose={() => setIsTrayVisible(false)}
                  onSelect={(type) => {
                    Keyboard.dismiss();
                    if (type === "gallery") {
                      setIsCustomGalleryVisible(true);
                    }
                    if (type === "camera") setIsCameraVisible(true);
                    if (type === "file") handlePickDocument();
                    if (type === "location") handleGetLocation();
                    if (type === "contact" || type === "poll") {
                      console.log(`${type} selected - coming soon!`);
                    }
                  }}
                />
              )}
            </View>
          </View>

          {chat?.isMessageRequest && id ? (
            <MessageRequestOverlay
              isGroup={!!chat.isGroup}
              contactName={chat.title}
              topInset={0}
              bottomInset={tabBarBottomInset(insets)}
              onAccept={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                acceptMessageRequest(id as string);
              }}
              onDecline={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                declineMessageRequest(id as string);
                router.back();
              }}
            />
          ) : null}
        </View>

        <ReactionTray
          isVisible={!!activeReactionTarget}
          targetY={activeReactionTarget?.yPos}
          isMe={activeReactionTarget?.isMe || false}
          message={activeReactionTarget?.msg}
          onClose={() => setActiveReactionTarget(null)}
          onReply={() => {
            if (activeReactionTarget?.msg) {
              setReplyingTo(activeReactionTarget.msg);
            }
          }}
          onCopy={async () => {
             if (activeReactionTarget?.msg?.text) {
               await Clipboard.setStringAsync(activeReactionTarget.msg.text);
               showToast({ message: "Copied to clipboard" });
             }
          }}
          onForward={() => {
             showToast({ message: "Forwarding coming soon!" });
          }}
          onDelete={() => {
             if (activeReactionTarget?.msg) {
               setMessageToDelete(activeReactionTarget.msg);
               setActiveReactionTarget(null);
             }
          }}
          onSelect={(emoji) => {
            if (!activeReactionTarget) return;
            const targetId = activeReactionTarget.msg.id;
            
            setMessagesByChatId((prev) => {
              const chatId = id as string;
              const list = prev[chatId] || [];
              return {
                ...prev,
                [chatId]: list.map((msg) => {
                  if (msg.id !== targetId) return msg;

                  const existingReactions: {
                    emoji: string;
                    count: number;
                    me: boolean;
                  }[] = msg.reactions || [];
                  const myPreviousReaction = existingReactions.find((r) => r.me);

                  let newReactions = existingReactions
                    .map((r) =>
                      r.me ? { ...r, count: r.count - 1, me: false } : r,
                    )
                    .filter((r) => r.count > 0);

                  if (!myPreviousReaction || myPreviousReaction.emoji !== emoji) {
                    const existingIndex = newReactions.findIndex(
                      (r) => r.emoji === emoji,
                    );
                    if (existingIndex >= 0) {
                      newReactions[existingIndex] = {
                        ...newReactions[existingIndex],
                        count: newReactions[existingIndex].count + 1,
                        me: true,
                      };
                    } else {
                      newReactions = [
                        ...newReactions,
                        { emoji, count: 1, me: true },
                      ];
                    }
                  }

                  return { ...msg, reactions: newReactions };
                }),
              };
            });
          }}
        />

        <ChatMoreMenu 
          isVisible={isMenuVisible} 
          isMuted={chat?.isMuted || false}
          deleteActionTitle={
            chat?.isGroup
              ? "Leave Group"
              : chat?.isChannel
                ? "Leave Channel"
                : "Delete Chat"
          }
          onClose={() => setMenuVisible(false)}
          onAction={(action) => {
            if (action === 'unmute') {
              handleMuteConfirmed('unmute', [id as string]);
            } else if (action.startsWith('mute_')) {
              const duration = action.replace('mute_', '');
              handleMuteConfirmed(duration, [id as string]);
            } else if (action === 'delete') {
              handleClearSelection();
              setSelectedChats(new Set([id as string]));
              setIsDeleteDialogOpen(true);
            }
          }}
        />

        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setIsDeleteForEveryone(false);
          }}
        >
          <DialogContent 
            className="w-[92%] sm:max-w-[400px]"
            onOpenChange={(open) => {
              setIsDeleteDialogOpen(open);
              if (!open) {
                setIsDeleteForEveryone(false);
                handleClearSelection();
              }
            }}
          >
            <DialogHeader className="w-full">
              <DialogTitle>
                {chat?.isGroup
                  ? "Leave Group"
                  : chat?.isChannel
                    ? "Leave Channel"
                    : "Delete Chat"}
              </DialogTitle>
              <DialogDescription>
                {chat?.isGroup
                  ? `Are you sure you want to leave ${chat.title}?`
                  : chat?.isChannel
                    ? `You will stop seeing updates from ${chat?.title}. You can rejoin from discovery later (mock).`
                    : `Are you sure you want to delete your chat with ${chat?.title}?`}
              </DialogDescription>
            </DialogHeader>

            {!chat?.isGroup && !chat?.isChannel ? (
              <Pressable
                className="flex-row items-center gap-3 -mx-6 px-6 py-2.5 active:bg-muted/40"
                onPress={() => setIsDeleteForEveryone(!isDeleteForEveryone)}
              >
                <Checkbox checked={isDeleteForEveryone} onCheckedChange={setIsDeleteForEveryone} />
                <Text className="text-foreground font-inter-medium text-sm">Also delete for {chat?.title}</Text>
              </Pressable>
            ) : null}

            <View className="flex-row gap-2 mt-3 w-full">
              <Pressable
                className="flex-1 py-3 bg-muted/50 active:bg-muted rounded-xl"
                onPress={() => {
                  setIsDeleteDialogOpen(false);
                  setIsDeleteForEveryone(false);
                  handleClearSelection();
                }}
              >
                <Text className="text-foreground font-inter-medium text-center text-sm">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 py-3 bg-destructive/10 active:bg-destructive/20 rounded-xl"
                onPress={() => {
                  handleDelete(!!(chat?.isGroup || chat?.isChannel));
                  setIsDeleteForEveryone(false);
                  router.back();
                }}
              >
                <Text className="text-destructive font-inter-semibold text-center text-sm">
                  {chat?.isGroup
                    ? "Leave Group"
                    : chat?.isChannel
                      ? "Leave Channel"
                      : "Delete"}
                </Text>
              </Pressable>
            </View>
          </DialogContent>
        </Dialog>

        {/* Delete Single Message Dialog */}
        <Dialog 
          open={!!messageToDelete} 
          onOpenChange={(open) => {
            if (!open) {
              setMessageToDelete(null);
              setIsDeleteMsgForEveryone(false);
            }
          }}
        >
          <DialogContent 
            className="w-[92%] sm:max-w-[400px]"
            onOpenChange={(open) => {
              if (!open) {
                setMessageToDelete(null);
                setIsDeleteMsgForEveryone(false);
              }
            }}
          >
            <DialogHeader className="w-full">
              <DialogTitle className="lowercase">delete message</DialogTitle>
              <DialogDescription className="lowercase">
                {messageToDelete?.isMe
                  ? isKonektaPlus
                    ? "this permanently removes the message for everyone. no tombstone is shown."
                    : "others will see that a message was removed in the timeline."
                  : `remove this message from ${chat?.title ?? "this chat"}?`}
              </DialogDescription>
            </DialogHeader>

            {messageToDelete?.isMe ? (
              <Pressable
                className="flex-row items-center gap-3 -mx-6 px-6 py-2.5 active:bg-muted/40"
                onPress={() => setIsDeleteMsgForEveryone(!isDeleteMsgForEveryone)}
              >
                <Checkbox checked={isDeleteMsgForEveryone} onCheckedChange={setIsDeleteMsgForEveryone} />
                <Text className="text-sm font-inter-medium text-foreground">
                  {isKonektaPlus
                    ? `Also delete for everyone (no trace)`
                    : `Also remove for everyone`}
                </Text>
              </Pressable>
            ) : null}

            <View className="flex-row gap-2 mt-3 w-full">
              <Pressable
                className="flex-1 py-3 bg-muted/50 active:bg-muted rounded-xl"
                onPress={() => {
                  setMessageToDelete(null);
                  setIsDeleteMsgForEveryone(false);
                }}
              >
                <Text className="text-center text-sm font-inter-medium lowercase text-foreground">
                  cancel
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 py-3 bg-destructive/10 active:bg-destructive/20 rounded-xl"
                onPress={() => {
                  if (messageToDelete && id) {
                    const chatId = id as string;
                    const msg = messageToDelete;
                    const forEveryone = msg.isMe
                      ? isDeleteMsgForEveryone
                      : true;

                    setMessagesByChatId((prev) => {
                      const list = prev[chatId] || [];

                      if (msg.isMe && !forEveryone) {
                        return {
                          ...prev,
                          [chatId]: list.filter((m) => m.id !== msg.id),
                        };
                      }

                      if (forEveryone && !isKonektaPlus) {
                        const tomb = removedMessageTombstone(
                          msg,
                          chatId,
                          msg.isMe ? "self" : "other",
                        );
                        return {
                          ...prev,
                          [chatId]: list.map((m) =>
                            m.id === msg.id ? tomb : m,
                          ),
                        };
                      }

                      return {
                        ...prev,
                        [chatId]: list.filter((m) => m.id !== msg.id),
                      };
                    });

                    if (msg.isMe && !forEveryone) {
                      showToast({ message: "removed for you" });
                    } else if (forEveryone && !isKonektaPlus) {
                      showToast({
                        message: msg.isMe
                          ? "message removed for everyone"
                          : "message removed",
                      });
                    } else if (forEveryone && isKonektaPlus) {
                      showToast({ message: "message deleted" });
                    }
                  }
                  setMessageToDelete(null);
                  setIsDeleteMsgForEveryone(false);
                }}
              >
                <Text className="text-center text-sm font-inter-semibold lowercase text-destructive">
                  {messageToDelete?.isMe
                    ? isDeleteMsgForEveryone
                      ? isKonektaPlus
                        ? "delete for everyone"
                        : "remove for everyone"
                      : "delete for me"
                    : "remove"}
                </Text>
              </Pressable>
            </View>
          </DialogContent>
        </Dialog>

        {toast ? (
          <Toast
            key={toast.id}
            message={toast.message}
            icon={toast.icon}
            countdown={toast.countdown}
            onUndo={() => {
              toast?.onUndo?.();
            }}
            onDismiss={toast?.onDismiss}
            onHide={() => setToast(null)}
            bottomOffset={96}
          />
        ) : null}
      </KeyboardAvoidingView>

      {isCameraVisible ? (
        <CameraOverlay
          isVisible
          onClose={() => setIsCameraVisible(false)}
          onCapture={handleCameraCapture}
        />
      ) : null}

      {previewMedia ? (
        <MediaPreview 
          uri={previewMedia.uri} 
          type={previewMedia.type} 
          onCancel={() => {
            setPreviewMedia(null);
            setIsCameraVisible(true);
          }}
          onSend={handleSendMedia}
        />
      ) : null}

      {mediaViewer != null ? (
        <MediaViewer
          visible
          items={mediaViewer.items}
          initialIndex={mediaViewer.initialIndex}
          onClose={() => setMediaViewer(null)}
        />
      ) : null}

      {isCustomGalleryVisible ? (
        <CustomMediaGallery
          isVisible
          onClose={() => setIsCustomGalleryVisible(false)}
          onSend={handleSendCustomGallery}
        />
      ) : null}
    </>
  );
}







