import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { BlurView } from 'expo-blur';
import { 
  Ionicons 
} from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface AttachmentOption {
  id: string;
  label: string;
  icon: string;
  color: string;
  library: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
  action: () => void;
}

interface AttachmentTrayProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

export const AttachmentTray: React.FC<AttachmentTrayProps> = ({ isVisible, onClose, onSelect }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!isVisible) return null;

  const options: AttachmentOption[] = [
    { 
      id: 'gallery', 
      label: 'Photo & Video', 
      icon: 'images', 
      color: '#3267e3', 
      library: 'Ionicons',
      action: () => onSelect('gallery') 
    },
    { 
      id: 'file', 
      label: 'File', 
      icon: 'document-text', 
      color: '#34d399', 
      library: 'Ionicons',
      action: () => onSelect('file') 
    },
  ];

  return (
    <View 
      className="absolute bottom-full left-3 mb-2 z-[100] w-52"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      <View 
        className="overflow-hidden rounded-2xl border border-border/20"
        style={{ backgroundColor: isDark ? 'rgba(28,28,30,0.98)' : 'rgba(255,255,255,0.98)' }}
      >
        {Platform.OS === 'ios' ? (
          <BlurView 
            tint={isDark ? "dark" : "light"} 
            intensity={100} 
            style={StyleSheet.absoluteFill} 
          />
        ) : null}
        
        <View className="py-1">
          {options.map((option) => (
            <Pressable 
              key={option.id}
              onPress={() => {
                option.action();
                onClose();
              }}
              className="flex-row items-center px-4 py-3 active:bg-black/5 dark:active:bg-white/10"
            >
              <View 
                className="w-8 h-8 items-center justify-center rounded-lg mr-3"
                style={{ backgroundColor: option.color }}
              >
                <Ionicons name={option.icon as any} size={18} color="#fff" />
              </View>
              <Text className="text-[15px] font-inter-medium text-foreground">
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const StyleSheet = {
  absoluteFill: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }
};
