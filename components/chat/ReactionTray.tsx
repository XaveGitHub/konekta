import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import type { Message } from '@/lib/mocks/chatStore';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactionTrayProps {
  isVisible: boolean;
  message?: Message;
  onSelect: (emoji: string) => void;
  onReply?: () => void;
  onCopy?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onClose: () => void;
  targetY?: number;
  isMe: boolean;
}

const ActionRow = ({ 
  icon, 
  label, 
  onPress, 
  isDark, 
  color, 
  isLast 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  onPress?: () => void; 
  isDark: boolean; 
  color?: string; 
  isLast?: boolean; 
}) => {
  return (
    <Pressable 
      onPress={() => {
        if (onPress) {
          Haptics.selectionAsync();
          onPress();
        }
      }}
      className={`flex-row items-center justify-between px-4 py-3 active:bg-muted/50 ${!isLast ? 'border-b border-border/10' : ''}`}
    >
      <Text className={`text-[16px] font-inter-medium ${color ? 'text-red-500' : 'text-foreground'}`}>
        {label}
      </Text>
      <Ionicons name={icon} size={20} color={color ? '#ef4444' : (isDark ? '#fff' : '#000')} />
    </Pressable>
  );
};

export const ReactionTray: React.FC<ReactionTrayProps> = ({
  isVisible,
  message,
  onSelect,
  onReply,
  onCopy,
  onForward,
  onDelete,
  onClose,
  targetY,
  isMe,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (isVisible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  // Tighter vertical position above the bubble, adjusting specifically for Android's layout engine
  const yOffset = Platform.OS === 'ios' ? 65 : 45;
  const verticalPosition = targetY ? { top: Math.max(50, targetY - yOffset) } : { top: 100 };
  const horizontalPosition = isMe ? { right: 20 } : { left: 20 };

  return (
    <View style={StyleSheet.absoluteFill} className="z-50" pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      
      <View style={[verticalPosition, horizontalPosition, { position: 'absolute' }]} className={`flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          className={`flex-row items-center px-3 py-2 rounded-full shadow-lg ${
            isDark ? 'bg-[#2C2C2E] border border-white/10' : 'bg-white border border-gray-100'
          }`}
        >
          {EMOJIS.map((emoji, index) => (
            <Animated.View
              key={emoji}
              entering={ZoomIn.duration(150).delay(index * 20)}
            >
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(emoji);
                  onClose();
                }}
                className="px-2 active:scale-125 transition-transform"
              >
                <Text className="text-[24px]">{emoji}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Action Menu (Apple/Telegram Style) */}
        <Animated.View
          entering={FadeIn.duration(150).delay(50)}
          exiting={FadeOut.duration(150)}
          className={`mt-2 rounded-2xl overflow-hidden shadow-lg ${
            isDark ? 'bg-[#2C2C2E] border border-white/10' : 'bg-white border border-gray-100'
          }`}
          style={{ width: 220 }}
        >
          <ActionRow icon="arrow-undo-outline" label="reply" onPress={() => { onReply?.(); onClose(); }} isDark={isDark} />
          {message?.type === 'text' && (
            <ActionRow icon="copy-outline" label="copy" onPress={() => { onCopy?.(); onClose(); }} isDark={isDark} />
          )}
          <ActionRow icon="arrow-redo-outline" label="forward" onPress={() => { onForward?.(); onClose(); }} isDark={isDark} />
          <ActionRow icon="trash-outline" label="delete" color="red" onPress={() => { onDelete?.(); onClose(); }} isDark={isDark} isLast />
        </Animated.View>
      </View>
    </View>
  );
};
