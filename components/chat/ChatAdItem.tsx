import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { ExternalLink, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';

interface ChatAdItemProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  onClose?: () => void;
}

export const ChatAdItem: React.FC<ChatAdItemProps> = ({
  title,
  description,
  imageUrl,
  linkUrl,
  onClose,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(linkUrl);
  };

  return (
    <View className="px-3 py-1">
      <Pressable
        onPress={handlePress}
        className={`w-full flex-row items-center gap-3 pl-7 pr-3 py-2.5 rounded-2xl border relative ${
          isDark 
            ? 'bg-zinc-900/50 border-zinc-800' 
            : 'bg-zinc-50 border-zinc-200'
        } active:opacity-90`}
      >
        <View className="absolute top-2 left-2 bg-amber-500 px-1.5 py-0.5 rounded-md border-2 border-background z-20 shadow-sm">
          <Text className="text-[9px] font-inter-bold text-white">
            Ad
          </Text>
        </View>

        <View className="relative">
          <Image
            source={{ uri: imageUrl }}
            className="size-[54px] rounded-xl bg-muted/20"
            contentFit="cover"
            transition={200}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[16px] font-inter-bold text-foreground tracking-tight" numberOfLines={1}>
              {title}
            </Text>
            {onClose && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 -mr-1"
              >
                <X size={16} color={isDark ? '#71717a' : '#a1a1aa'} />
              </Pressable>
            )}
          </View>
          <View className="flex-row items-center justify-between mt-0.5">
            <Text className="flex-1 pr-4 text-[13px] font-inter text-muted-foreground opacity-80" numberOfLines={1}>
              {description}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};
