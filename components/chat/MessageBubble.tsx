import React, { useState, memo } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Message, MessageReplyPreview } from '@/lib/mocks/chatStore';
import { useColorScheme } from 'nativewind';
import type { MediaViewerItem } from '@/components/chat/MediaViewer';
import { AudioMessageRow } from '@/components/chat/AudioMessageRow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { replyPreviewSnippet } from '@/lib/messages/replyPreview';
import { chatBubbleBackground } from '@/lib/chatBubbleTheme';
import { THEME } from '@/lib/theme';

function ReplyQuoteStrip({
  reply,
  isMe,
}: {
  reply: MessageReplyPreview;
  isMe: boolean;
}) {
  const snippet = replyPreviewSnippet(reply);
  return (
    <View
      className={`mb-2 min-w-0 max-w-full pl-2 border-l-[3px] ${isMe ? "border-foreground/30" : "border-primary"}`}
    >
      <Text
        className={`text-[12px] font-inter-semibold ${isMe ? "text-foreground" : "text-primary"}`}
      >
        {reply.senderName}
      </Text>
      <Text
        numberOfLines={2}
        className={`text-[13px] font-inter mt-0.5 ${isMe ? "text-muted-foreground" : "text-muted-foreground"}`}
      >
        {snippet}
      </Text>
    </View>
  );
}

/**
 * Inline video: poster only (no player in list). Playback mounts in MediaViewer.
 */
function VideoPoster({
  uri,
  aspectRatio,
  contentWidth = 280,
}: {
  uri: string;
  aspectRatio?: number;
  /** Match text bubble max width (Messenger-style). */
  contentWidth?: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const w = contentWidth;
  const h = aspectRatio ? Math.min(w / aspectRatio, 400) : 210;

  return (
    <View
      style={{ width: w, height: h }}
      className="relative overflow-hidden rounded-xl bg-black"
    >
      {!imageFailed ? (
        <Image
          source={{ uri }}
          recyclingKey={uri}
          style={{ width: w, height: h }}
          className="bg-zinc-900"
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          className="absolute inset-0 items-center justify-center bg-zinc-900"
          style={{ width: w, height: h }}
        >
          <Ionicons name="videocam" size={40} color="#52525b" />
        </View>
      )}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        className="items-center justify-center"
      >
        <View className="h-14 w-14 items-center justify-center rounded-full bg-black/50">
          <Ionicons name="play" size={32} color="white" />
        </View>
      </View>
    </View>
  );
}

/** Incoming group rows: avatar on the latest bubble in a sender run; spacer aligns the rest. */
export type GroupIncomingLayout = {
  showAvatar: boolean;
  avatarUrl?: string | null;
  senderName: string;
};

interface MessageBubbleProps {
  message: Message;
  showTail?: boolean;
  onLongPress?: (yPosition: number) => void;
  onReply?: (message: Message) => void;
  /** Open Telegram / IG-style fullscreen media viewer */
  onOpenMedia?: (payload: {
    items: MediaViewerItem[];
    initialIndex: number;
  }) => void;
  /** When set for an incoming message in a group, shows sender avatar / alignment column */
  groupIncoming?: GroupIncomingLayout;
}

function MessageBubbleInner({
  message,
  showTail = true,
  onLongPress,
  onReply,
  onOpenMedia,
  groupIncoming,
}: MessageBubbleProps) {
  const { colorScheme } = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDark = colorScheme === 'dark';
  const isMe = message.isMe;
  /** Max width for text / file content so the bubble hugs short messages; time sits beside the block (Messenger-style). */
  const contentMaxWidth = Math.min(280, windowWidth * 0.78);
  const bubbleBg = chatBubbleBackground(isDark, isMe);
  const brandAccentHex = THEME[isDark ? 'dark' : 'light'].brandAccent;
  const bubbleRef = React.useRef<View>(null);
  const isMediaBubble = message.type === 'image' || message.type === 'video';
  const tickMutedColor = isMediaBubble
    ? 'rgba(255,255,255,0.82)'
    : isMe
      ? isDark
        ? 'rgba(255,255,255,0.5)'
        : 'rgba(9,9,11,0.45)'
      : undefined;
  
  const handleLongPress = React.useCallback((e: any) => {
    const touchY = e.nativeEvent.pageY;
    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      const bubbleTopY = y && y > 0 ? y : touchY;
      onLongPress?.(bubbleTopY);
    });
  }, [onLongPress]);

  // Swipe to Reply Shared Values
  const translateX = useSharedValue(0);
  const replyIconOpacity = useSharedValue(0);
  const replyIconScale = useSharedValue(0.5);

  const renderMainContent = (maxW: number) => {
    const gridW = Math.min(260, maxW);
    const singleW = maxW;
    switch (message.type) {
      case 'image':
        if (message.mediaUrls && message.mediaUrls.length > 0) {
          const count = message.mediaUrls.length;
          const items: MediaViewerItem[] = message.mediaUrls.map((u) => ({
            uri: u,
            type: "image",
          }));
          return (
            <View className="flex-row flex-wrap gap-0.5 rounded-xl overflow-hidden" style={{ width: gridW }}>
              {message.mediaUrls.map((url, idx) => {
                let width: number | `${number}%` = "100%";
                let height = 180;

                if (count === 2) {
                  width = "49.5%";
                  height = 140;
                } else if (count === 3) {
                  if (idx === 0) {
                    width = "100%";
                    height = 150;
                  } else {
                    width = "49.5%";
                    height = 100;
                  }
                } else if (count >= 4) {
                  width = "49.5%";
                  height = 110;
                }

                return (
                  <Pressable
                    key={idx}
                    style={{ width, height }}
                    className="overflow-hidden rounded-sm active:opacity-90"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onOpenMedia?.({ items, initialIndex: idx });
                    }}
                    delayLongPress={200}
                    onLongPress={handleLongPress}
                  >
                    <Image
                      source={{ uri: url }}
                      recyclingKey={url}
                      className="bg-muted/10"
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={0}
                    />
                  </Pressable>
                );
              })}
            </View>
          );
        }
        return message.mediaUrl ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenMedia?.({
                items: [{ uri: message.mediaUrl!, type: "image" }],
                initialIndex: 0,
              });
            }}
            delayLongPress={200}
            onLongPress={handleLongPress}
          >
            <Image
              source={{ uri: message.mediaUrl }}
              recyclingKey={message.mediaUrl}
              className="rounded-xl bg-muted/10 relative"
              style={{
                width: singleW,
                height: message.mediaAspectRatio
                  ? Math.min(singleW / message.mediaAspectRatio, 400)
                  : 210,
              }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
            />
          </Pressable>
        ) : null;
      case 'video':
        return message.mediaUrl ? (
          <Pressable
            delayLongPress={200}
            onLongPress={handleLongPress}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenMedia?.({
                items: [{ uri: message.mediaUrl!, type: "video" }],
                initialIndex: 0,
              });
            }}
            accessibilityLabel="Open video"
            accessibilityRole="button"
          >
            <VideoPoster
              uri={message.mediaUrl}
              aspectRatio={message.mediaAspectRatio}
              contentWidth={singleW}
            />
          </Pressable>
        ) : null;
      case 'file':
        return (
          <View
            className="flex-row items-center gap-3 py-1"
            style={{ maxWidth: maxW, minWidth: Math.min(200, maxW) }}
          >
            <View className={`h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${isMe ? "bg-foreground/12" : "bg-primary/10"}`}>
              <Ionicons
                name="document"
                size={26}
                color={isMe ? (isDark ? "#E4E4E7" : "#27272A") : THEME[isDark ? "dark" : "light"].primary}
              />
              {message.fileName?.toLowerCase().endsWith(".pdf") ? (
                <View className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-red-500 px-1.5 py-0.5 dark:border-muted">
                  <Text className="text-[8px] font-inter-black text-white uppercase">PDF</Text>
                </View>
              ) : null}
            </View>
            <View className="min-w-0 flex-shrink" style={{ maxWidth: maxW - 60 }}>
              <Text className="font-inter-semibold text-[15px] text-foreground" numberOfLines={1} ellipsizeMode="middle">
                {message.fileName}
              </Text>
              <Text className="mt-0.5 text-[12px] font-inter text-muted-foreground">{message.fileSize}</Text>
            </View>
          </View>
        );
      case 'audio':
        return message.mediaUrl ? (
          <AudioMessageRow uri={message.mediaUrl} isMe={isMe} maxContentWidth={maxW} />
        ) : null;
      case 'location': {
        const lat = message.latitude;
        const lng = message.longitude;
        const mapUri =
          lat != null && lng != null
            ? `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=400x200&maptype=mapnik`
            : "https://maps.googleapis.com/maps/api/staticmap?center=40.714224,-73.961452&zoom=14&size=400x200&key=YOUR_API_KEY_MOCK";
        const title = message.locationLabel ?? "Shared location";
        const subtitle =
          lat != null && lng != null
            ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            : message.text ?? "";
        const locMin = Math.min(240, maxW);
        return (
          <View className="overflow-hidden rounded-xl" style={{ width: "100%", maxWidth: maxW, minWidth: locMin }}>
            <Image
              source={{ uri: mapUri }}
              className="w-full bg-muted/20"
              style={{ height: 128 }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
            />
            <View className={`px-3 py-2 ${isMe ? "bg-foreground/6" : "bg-muted/5"}`}>
              <Text className="font-inter-bold text-[14px] text-foreground">{title}</Text>
              {subtitle ? (
                <Text className="text-[12px] text-muted-foreground" numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        );
      }
      default:
        return (
          <View className="min-w-0" style={{ maxWidth: maxW }}>
            <Text className="text-[16px] font-inter leading-6 text-foreground">{message.text}</Text>
          </View>
        );
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      const isSwipingCorrectDirection = isMe ? event.translationX < 0 : event.translationX > 0;
      if (isSwipingCorrectDirection) {
        translateX.value = event.translationX / 1.5;
        const absTranslation = Math.abs(event.translationX);
        const threshold = 50;
        replyIconOpacity.value = withTiming(absTranslation > threshold ? 1 : 0.5);
        replyIconScale.value = withTiming(absTranslation > threshold ? 1.2 : 0.8);
      }
    })
    .onEnd((event) => {
      const isSwipingCorrectDirection = isMe ? event.translationX < -70 : event.translationX > 70;
      if (isSwipingCorrectDirection) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        if (onReply) runOnJS(onReply)(message);
      }
      translateX.value = withSpring(0);
      replyIconOpacity.value = withTiming(0);
    });

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedReplyIconStyle = useAnimatedStyle(() => {
    const transformX = isMe
      ? interpolate(translateX.value, [0, -80], [30, -10])
      : interpolate(translateX.value, [0, 80], [-30, 10]);
      
    return {
      opacity: replyIconOpacity.value,
      transform: [
        { translateX: transformX },
        { scale: replyIconScale.value }
      ],
    };
  });

  if (message.type === 'system') {
    return (
      <View className="items-center justify-center my-3 px-10">
        <Text className="text-center text-[12px] font-inter-medium text-muted-foreground/80 leading-4">
          {message.text}
        </Text>
      </View>
    );
  }

  const bubbleBody = (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        className={`relative ${
          groupIncoming && !isMe ? 'flex-1 min-w-0' : ''
        } max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}
      >
        <Animated.View 
          style={[
            { position: 'absolute', top: '50%', marginTop: -15 }, 
            isMe ? { right: -40 } : { left: -40 },
            animatedReplyIconStyle
          ]}
        >
          <View className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 items-center justify-center">
            <Ionicons name={isMe ? "arrow-redo" : "arrow-undo"} size={18} color={isDark ? '#fff' : '#000'} />
          </View>
        </Animated.View>

        <Animated.View style={[animatedBubbleStyle]}>
          <Pressable
            ref={bubbleRef}
            collapsable={false}
            delayLongPress={200}
            onLongPress={(e) => {
              const touchY = e.nativeEvent.pageY;
              bubbleRef.current?.measureInWindow((x, y, width, height) => {
                const bubbleTopY = y && y > 0 ? y : touchY;
                onLongPress?.(bubbleTopY);
              });
            }}
            style={{ backgroundColor: bubbleBg }}
            className={`min-w-0 rounded-2xl flex-col ${
              message.type === 'image' || message.type === 'video'
                ? 'p-1'
                : 'px-3 py-2'
            } ${
              isMe ? 'rounded-br-sm' : 'rounded-bl-sm'
            } ${
              !isMe && !isDark
                ? 'border border-border/30 shadow-sm'
                : ''
            } ${isMe && !isDark ? 'shadow-sm' : ''}`}
          >
            {message.replyTo ? (
              <ReplyQuoteStrip reply={message.replyTo} isMe={isMe} />
            ) : null}
            {isMediaBubble ? (
              <>
                {renderMainContent(contentMaxWidth)}
                <View className="absolute bottom-2 right-2 z-[1] flex-row items-center justify-end gap-1.5 rounded-lg bg-black/50 px-2 py-1">
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="shrink-0 text-[11px] font-inter tabular-nums text-white/95"
                  >
                    {message.timestamp}
                  </Text>
                  {isMe ? (
                    <View className="items-center justify-center">
                      {message.status === "sending" && (
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color="rgba(255,255,255,0.9)"
                          style={{ marginRight: 1 }}
                        />
                      )}
                      {message.status === "sent" && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="rgba(255,255,255,0.88)"
                        />
                      )}
                      {message.status === "delivered" && (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color="rgba(255,255,255,0.88)"
                        />
                      )}
                      {message.status === "read" && (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color={brandAccentHex}
                        />
                      )}
                    </View>
                  ) : null}
                </View>
              </>
            ) : message.type === "audio" ? (
              <>
                {renderMainContent(contentMaxWidth)}
                <View
                  className="mt-1.5 w-full flex-row items-center justify-end"
                  style={{ gap: 4 }}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="text-[11px] font-inter tabular-nums text-muted-foreground"
                  >
                    {message.timestamp}
                  </Text>
                  {isMe ? (
                    <View className="items-center justify-center">
                      {message.status === "sending" && (
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={tickMutedColor ?? "rgba(0,0,0,0.45)"}
                          style={{ marginRight: 1 }}
                        />
                      )}
                      {message.status === "sent" && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={tickMutedColor ?? "rgba(0,0,0,0.45)"}
                        />
                      )}
                      {message.status === "delivered" && (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color={tickMutedColor ?? "rgba(0,0,0,0.45)"}
                        />
                      )}
                      {message.status === "read" && (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color={brandAccentHex}
                        />
                      )}
                    </View>
                  ) : null}
                </View>
              </>
            ) : (
              <View className="min-w-0 max-w-full flex-row items-end" style={{ gap: 6 }}>
                <View className="min-w-0" style={{ maxWidth: contentMaxWidth, flexShrink: 1 }}>
                  {renderMainContent(contentMaxWidth)}
                </View>
                <View className="shrink-0 flex-row items-end" style={{ gap: 2, marginBottom: 1 }}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="text-[11px] font-inter tabular-nums text-muted-foreground"
                  >
                    {message.timestamp}
                  </Text>
                  {isMe ? (
                    <View className="items-center justify-center">
                      {message.status === "sending" && (
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={tickMutedColor ?? "rgba(0,0,0,0.45)"}
                          style={{ marginRight: 1 }}
                        />
                      )}
                      {message.status === "sent" && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={tickMutedColor ?? "rgba(0,0,0,0.45)"}
                        />
                      )}
                      {message.status === "delivered" && (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color={tickMutedColor ?? "rgba(0,0,0,0.45)"}
                        />
                      )}
                      {message.status === "read" && (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color={brandAccentHex}
                        />
                      )}
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {showTail ? (
              <View
                style={[
                  styles.tailContainer,
                  isMe ? styles.tailRight : styles.tailLeft,
                ]}
              >
                <View
                  style={[
                    styles.tail,
                    {
                      backgroundColor: bubbleBg,
                    },
                    isMe ? styles.tailRightRotation : styles.tailLeftRotation,
                  ]}
                />
              </View>
            ) : null}
          </Pressable>

          {message.reactions && message.reactions.length > 0 ? (
            <View className={`absolute -bottom-4 flex-row gap-1 z-10 ${isMe ? 'right-0' : 'left-0'}`}>
              {message.reactions.map((r, i) => (
                <View 
                  key={i} 
                  className={`flex-row items-center px-1.5 py-0.5 rounded-full border border-background shadow-md ${
                    r.me ? 'bg-[#1C2D4A] border-blue-500/50' : (isDark ? 'bg-[#2C2C2E]' : 'bg-white')
                  }`}
                >
                  <Text className="text-[12px]">{r.emoji}</Text>
                  {r.count > 1 ? (
                    <Text className={`text-[10px] font-inter-bold ml-1 ${r.me ? 'text-blue-500' : 'text-foreground'}`}>
                      {r.count}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );

  if (groupIncoming && !isMe) {
    return (
      <View className={`flex-row items-end gap-2.5 max-w-[92%] self-start my-0.5 ${message.reactions && message.reactions.length > 0 ? 'mb-5' : ''}`}>
        {groupIncoming.showAvatar ? (
          <Avatar
            alt={groupIncoming.senderName}
            className="h-9 w-9 mb-0.5 shrink-0"
          >
            <AvatarImage src={groupIncoming.avatarUrl || undefined} />
            <AvatarFallback className="bg-muted">
              <Text className="text-sm font-inter-semibold text-foreground">
                {(groupIncoming.senderName || '?').charAt(0)}
              </Text>
            </AvatarFallback>
          </Avatar>
        ) : (
          <View
            className="mb-0.5 h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/30 bg-muted/25"
            accessibilityLabel={`More messages from ${groupIncoming.senderName}`}
            accessibilityRole="text"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={isDark ? 'rgba(255,255,255,0.45)' : '#8E8E93'}
            />
          </View>
        )}
        {bubbleBody}
      </View>
    );
  }

  return (
    <View
      className={`max-w-[85%] my-0.5 relative ${
        isMe ? 'self-end' : 'self-start'
      } ${message.reactions && message.reactions.length > 0 ? 'mb-5' : ''}`}
    >
      {bubbleBody}
    </View>
  );
}

function messageBubblePropsAreEqual(
  a: MessageBubbleProps,
  b: MessageBubbleProps,
): boolean {
  return (
    a.message === b.message &&
    a.showTail === b.showTail &&
    a.groupIncoming === b.groupIncoming
  );
}

export const MessageBubble = memo(MessageBubbleInner, messageBubblePropsAreEqual);

const styles = StyleSheet.create({
  tailContainer: {
    position: 'absolute',
    bottom: 0,
    width: 10,
    height: 10,
  },
  tailLeft: {
    left: -5,
  },
  tailRight: {
    right: -5,
  },
  tail: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  tailLeftRotation: {
    transform: [{ rotate: '45deg' }],
  },
  tailRightRotation: {
    transform: [{ rotate: '45deg' }],
  },
});
