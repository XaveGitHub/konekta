import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Pin, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Image } from 'expo-image';

interface PinnedMessageBannerProps {
  message: {
    text?: string;
    mediaUrl?: string;
    senderName?: string;
  };
  onPress: () => void;
  onClose: () => void;
}

export const PinnedMessageBanner: React.FC<PinnedMessageBannerProps> = ({
  message,
  onPress,
  onClose,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="px-3 py-1 bg-background/80 backdrop-blur-md border-b border-border/10">
      <Pressable
        onPress={onPress}
        className={`flex-row items-center gap-3 px-3 py-2 rounded-xl ${
          isDark ? 'bg-zinc-900/40' : 'bg-zinc-100/50'
        }`}
      >
        <Pin size={14} color="#3b82f6" fill="#3b82f6" />
        
        <View className="flex-1">
          <Text className="text-[12px] font-inter-bold text-primary lowercase" numberOfLines={1}>
            pinned message
          </Text>
          <Text className="text-[13px] font-inter text-foreground opacity-80" numberOfLines={1}>
            {message.text || (message.mediaUrl ? 'Photo' : 'Pinned content')}
          </Text>
        </View>

        {message.mediaUrl && (
          <Image
            source={{ uri: message.mediaUrl }}
            className="size-10 rounded-lg bg-muted/20"
            contentFit="cover"
          />
        )}

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1"
        >
          <X size={16} color={isDark ? '#52525b' : '#a1a1aa'} />
        </Pressable>
      </Pressable>
    </View>
  );
};
