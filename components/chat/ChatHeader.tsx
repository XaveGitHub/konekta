import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Chat } from '@/lib/mocks/chatStore';
import { useCall } from '@/context/CallContext';
import { getChannelMetaLine } from '@/lib/chatListPreview';
import { appAccentHex } from '@/lib/theme';

interface ChatHeaderProps {
  chat: Chat | undefined;
  onToggleMenu?: () => void;
}

export const ChatHeader = ({ chat, onToggleMenu }: ChatHeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accent = appAccentHex(isDark);
  const iconColor = isDark ? '#ffffff' : '#1C1C1E';
  const { activeCall, restoreCall, startAudioCall, startVideoCall, updateCallType } = useCall();

  if (!chat) return null;

  const handleCallAction = (type: 'audio' | 'video') => {
    if (activeCall && activeCall.id !== chat.id) {
      Alert.alert('Call in Progress', `You are already in a call with ${activeCall.title}. Please end it before starting a new one.`);
      return;
    }
    
    // If returning to an existing background call of the same user
    if (activeCall && activeCall.id === chat.id) {
      if (type === 'video' && !activeCall.isLocalVideoEnabled) {
        updateCallType('video');
      } else if (type === 'audio' && activeCall.isLocalVideoEnabled) {
        updateCallType('audio');
      }
      restoreCall();
      return router.push(`/call/${chat.id}?type=${type}`);
    }

    if (type === 'video') {
      startVideoCall(chat);
    } else {
      startAudioCall(chat);
    }

    router.push(`/call/${chat.id}?type=${type}`);
  };

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top + 4, 10),
        paddingBottom: 6,
        zIndex: 50,
      }}
      className="bg-background border-b border-border/10 px-4 items-center flex-row"
    >
      <Pressable
        onPress={() => router.back()}
        className="p-2 -ml-2 rounded-full active:bg-muted/50 shrink-0"
      >
        <Ionicons name="chevron-back" size={28} color={accent} />
      </Pressable>

      <Pressable
        onPress={() => router.push(`/chat/details/${chat.id}`)}
        className="flex-row items-center flex-1 ml-1 min-w-0 active:opacity-60"
        accessibilityLabel="Chat info"
      >
        <Avatar alt={chat.title} className="h-10 w-10 shrink-0">
          <AvatarImage src={chat.avatarUrl || undefined} />
          <AvatarFallback>
            <Text className="text-sm font-inter-bold">
              {(chat.title || "C").charAt(0)}
            </Text>
          </AvatarFallback>
        </Avatar>
        <View className="ml-3 justify-center flex-1 min-w-0 pr-1">
          <Text
            className="text-base font-inter-bold text-foreground leading-5"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {chat.title}
          </Text>
          <Text className="text-xs text-muted-foreground font-inter-medium leading-4" numberOfLines={1}>
            {chat.isChannel
              ? getChannelMetaLine(chat) ?? "Channel"
              : chat.isGroup
                ? `${chat.members?.length ?? 0} members${
                    chat.myRole === "admin" ? " · Admin" : ""
                  }`
                : "last seen recently"}
          </Text>
        </View>
      </Pressable>

      <View className="flex-row items-center gap-2 shrink-0">
        {!chat.isChannel && !chat.isGroup ? (
          <>
            <Pressable
              onPress={() => handleCallAction('audio')}
              className="p-2.5 rounded-full active:bg-muted/50"
            >
              <Ionicons name="call-outline" size={24} color={accent} />
            </Pressable>
            <Pressable
              onPress={() => handleCallAction('video')}
              className="p-2.5 rounded-full active:bg-muted/50"
            >
              <Ionicons name="videocam-outline" size={24} color={accent} />
            </Pressable>
          </>
        ) : null}
        <Pressable 
          onPress={onToggleMenu}
          className="p-2.5 rounded-full active:bg-muted/50"
        >
          <Ionicons name="ellipsis-vertical" size={20} color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
};
