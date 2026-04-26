import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import type { Chat } from "@/lib/mocks/chatStore";
import { useChat } from "@/context/ChatContext";
import {
  getChannelMetaLine,
  getChatListPreviewLine,
  getGroupMetaLine,
} from "@/lib/chatListPreview";
import * as Haptics from "expo-haptics";
import { openChatFromList } from "@/lib/openChatFromList";
import {
  Archive,
  ArchiveRestore,
  Check,
  LogOut,
  Megaphone,
  Trash2,
  Users,
  VolumeX,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { memo, useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";

const SWIPE_ACTION_SLOT_WIDTH = 78;
const SWIPE_RIGHT_ACTIONS_WIDTH = SWIPE_ACTION_SLOT_WIDTH * 2;
const SWIPE_ACTION_ICON_SIZE = 22;
const SWIPE_ACTION_ICON_STROKE = 2;
const SWIPE_RIGHT_OPEN_THRESHOLD = Math.round(SWIPE_RIGHT_ACTIONS_WIDTH * 0.88);

const panelOpacityFromProgress = (
  progress: RNAnimated.AnimatedInterpolation<number>,
) =>
  progress.interpolate({
    inputRange: [0, 0.06, 0.35, 1],
    outputRange: [0, 0.92, 1, 1],
    extrapolate: "clamp",
  });

export type SwipeableRowRef = React.ElementRef<typeof Swipeable>;

type Props = {
  chat: Chat;
  isSelectionMode?: boolean;
  swipeEnabled?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  onSwipeDelete?: () => void;
  onSwipeArchive?: () => void;
  swipeLeadingActionVariant?: "archive" | "unarchive";
  setSwipeableRef?: (ref: SwipeableRowRef | null) => void;
  onSwipeWillOpenRight?: () => void;
};

const AVATAR_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#22c55e", // Green
  "#eab308", // Yellow
  "#a855f7", // Purple
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#ec4899", // Pink
];

const getDeterministicColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const ChatListItemComponent = ({
  chat,
  isSelectionMode,
  swipeEnabled = true,
  isSelected,
  onToggleSelection,
  onSwipeDelete,
  onSwipeArchive,
  swipeLeadingActionVariant = "archive",
  setSwipeableRef,
  onSwipeWillOpenRight,
}: Props) => {
  const { messagesByChatId } = useChat();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const swipeRowRef = useRef<SwipeableRowRef | null>(null);
  const [rightActionsInteractive, setRightActionsInteractive] = useState(false);

  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    if (isSelectionMode) {
      swipeRowRef.current?.close();
      setRightActionsInteractive(false);
    }
  }, [isSelectionMode]);

  useEffect(() => {
    setRightActionsInteractive(false);
  }, [chat.id]);

  const handlePressIn = () => {
    bgOpacity.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    bgOpacity.value = withTiming(0, { duration: 250 });
  };

  const handlePress = () => {
    if (isSelectionMode && onToggleSelection) {
      bgOpacity.value = withTiming(1, { duration: 50 }, () => {
        bgOpacity.value = withTiming(0, { duration: 200 });
      });
      onToggleSelection();
      return;
    }
    openChatFromList(chat.id);
  };

  const handleLongPress = () => {
    if (!isSelectionMode && onToggleSelection) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onToggleSelection();
    }
  };

  const initials = chat.title
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const profileColor = getDeterministicColor(chat.title);
  const previewLine = getChatListPreviewLine(
    chat,
    messagesByChatId[chat.id],
  );
  const groupMeta = getGroupMetaLine(chat);
  const channelMeta = getChannelMetaLine(chat);
  const listMeta = groupMeta ?? channelMeta;

  const activeColor = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(2, 6, 23, 0.08)";

  const animatedBgStyle = useAnimatedStyle(() => {
    return {
      opacity: bgOpacity.value,
      backgroundColor: activeColor,
    };
  });

  const renderRightActions = (
    progress: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    const panelOpacity = panelOpacityFromProgress(progress);
    return (
      <View
        style={{ width: SWIPE_RIGHT_ACTIONS_WIDTH }}
        pointerEvents={rightActionsInteractive ? "box-none" : "none"}
      >
        <RNAnimated.View
          style={{
            flexDirection: "row",
            alignItems: "stretch",
            opacity: panelOpacity,
            height: "100%",
          }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSwipeArchive?.();
              swipeRowRef.current?.close();
            }}
            style={{
              width: SWIPE_ACTION_SLOT_WIDTH,
              backgroundColor: isDark ? "#4b5563" : "#6b7280",
            }}
            className="items-center justify-center"
          >
            {swipeLeadingActionVariant === "unarchive" ? (
              <ArchiveRestore size={SWIPE_ACTION_ICON_SIZE} color="white" strokeWidth={SWIPE_ACTION_ICON_STROKE} />
            ) : (
              <Archive size={SWIPE_ACTION_ICON_SIZE} color="white" strokeWidth={SWIPE_ACTION_ICON_STROKE} />
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSwipeDelete?.();
            }}
            style={{
              width: SWIPE_ACTION_SLOT_WIDTH,
              backgroundColor: "#ef4444",
            }}
            className="items-center justify-center"
          >
            {chat.isGroup || chat.isChannel ? (
              <LogOut size={SWIPE_ACTION_ICON_SIZE} color="white" strokeWidth={SWIPE_ACTION_ICON_STROKE} />
            ) : (
              <Trash2 size={SWIPE_ACTION_ICON_SIZE} color="white" strokeWidth={SWIPE_ACTION_ICON_STROKE} />
            )}
          </Pressable>
        </RNAnimated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={(instance) => {
        swipeRowRef.current = instance;
        setSwipeableRef?.(instance);
      }}
      enabled={!isSelectionMode && swipeEnabled}
      renderRightActions={isSelectionMode ? undefined : renderRightActions}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      rightThreshold={SWIPE_RIGHT_OPEN_THRESHOLD}
      onSwipeableWillOpen={(direction) => {
        if (direction === "right") onSwipeWillOpenRight?.();
      }}
      onSwipeableOpen={(direction) => {
        if (direction === "right") setRightActionsInteractive(true);
      }}
      onSwipeableWillClose={() => setRightActionsInteractive(false)}
      onSwipeableClose={() => setRightActionsInteractive(false)}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        onPressOut={handlePressOut}
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? "#09090b" : "#ffffff" }]}
        />
        {isSelected && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: isDark ? "rgba(96, 165, 250, 0.15)" : "rgba(37, 99, 235, 0.08)" },
            ]}
          />
        )}
        <Animated.View pointerEvents="none" style={[{ ...StyleSheet.absoluteFillObject }, animatedBgStyle]} />
        <View className="w-full flex-row items-center gap-3 px-5 py-3">
          <View className="relative">
            <Avatar alt={chat.title} className="size-[58px]">
              <AvatarImage src={chat.avatarUrl || undefined} />
              <AvatarFallback style={{ backgroundColor: profileColor }}>
                <Text className="text-[17px] font-inter-bold text-white">
                  {initials}
                </Text>
              </AvatarFallback>
            </Avatar>

            {chat.isGroup && (
              <View
                className="absolute -bottom-0.5 -right-0.5 size-6 rounded-full bg-primary items-center justify-center border-2 border-background shadow-sm"
                pointerEvents="none"
              >
                <Users size={12} color="white" strokeWidth={2.5} />
              </View>
            )}
            {chat.isChannel && !chat.isGroup && (
              <View
                className="absolute -bottom-0.5 -right-0.5 size-6 rounded-full bg-violet-600 items-center justify-center border-2 border-background shadow-sm"
                pointerEvents="none"
              >
                <Megaphone size={11} color="white" strokeWidth={2.5} />
              </View>
            )}

            {isSelectionMode && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                className="absolute -bottom-1 -right-1 bg-background rounded-full p-[2px]"
              >
                <View
                  className={`size-6 rounded-full border-[1.5px] items-center justify-center
                      ${isSelected ? "border-primary bg-primary" : "border-muted-foreground bg-card"}`}
                >
                  {isSelected && <Check size={14} color={isDark ? "black" : "white"} strokeWidth={3} />}
                </View>
              </Animated.View>
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 min-w-0 pr-2">
                <Text className="text-[17px] font-inter-semibold text-foreground shrink min-w-0 tracking-tight" numberOfLines={1}>
                  {chat.title}
                </Text>
                {chat.isMuted && (
                  <View style={{ marginLeft: 6 }} className="flex-shrink-0 opacity-40">
                    <VolumeX size={14} color={isDark ? "#FFF" : "#333333"} />
                  </View>
                )}
              </View>
              <Text
                className={`text-[12px] ${
                  ((chat.unreadCount ?? 0) > 0 || chat.isMessageRequest) && !chat.isMuted
                    ? "font-inter-semibold text-muted-foreground"
                    : "font-inter-medium text-muted-foreground opacity-60"
                }`}
                numberOfLines={1}
              >
                {chat.lastMessageAt}
              </Text>
            </View>
            <View className={`flex-row items-center justify-between ${listMeta ? "mt-0.5" : "mt-1"}`}>
              <Text
                className={`flex-1 pr-2 text-[14px] ${
                  (chat.unreadCount ?? 0) > 0 || chat.isMessageRequest
                    ? "font-inter-medium text-foreground opacity-90"
                    : "font-inter text-muted-foreground opacity-60"
                }`}
                numberOfLines={1}
              >
                {previewLine}
              </Text>
              {(chat.unreadCount ?? 0) > 0 && (
                <View
                  className={`items-center justify-center rounded-full ${
                    chat.isMuted ? "bg-primary/50" : "bg-primary"
                  } h-[20px] min-w-[20px] px-1`}
                >
                  <Text className={`text-[11px] font-inter-semibold text-primary-foreground mt-[0.5px]`}>
                    {chat.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
};

const ChatListItem = memo(ChatListItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelectionMode === nextProps.isSelectionMode &&
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.lastMessage === nextProps.chat.lastMessage &&
    prevProps.chat.unreadCount === nextProps.chat.unreadCount &&
    prevProps.chat.isOnline === nextProps.chat.isOnline &&
    prevProps.chat.isMuted === nextProps.chat.isMuted &&
    prevProps.chat.lastMessageAt === nextProps.chat.lastMessageAt
  );
});

export default ChatListItem;
