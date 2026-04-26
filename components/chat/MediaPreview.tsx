import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface MediaPreviewProps {
  uri: string;
  type: 'photo' | 'video';
  onCancel: () => void;
  onSend: () => void;
}

function PreviewVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: true });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Blurred Background to fill empty aspect ratio space */}
      <View style={StyleSheet.absoluteFill} className="opacity-40">
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      </View>
      <View style={StyleSheet.absoluteFill} className="bg-black/20 backdrop-blur-xl" />
      
      {/* Foreground contained video */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />
      
      <Pressable
        onPress={() => {
          if (isPlaying) player.pause();
          else player.play();
        }}
        style={StyleSheet.absoluteFill}
        className="items-center justify-center"
        accessibilityLabel={isPlaying ? 'Pause preview' : 'Play preview'}
      >
        {!isPlaying ? (
          <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center z-10 backdrop-blur-md border border-white/20">
            <Ionicons name="play" size={36} color="white" />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ uri, type, onCancel, onSend }) => {
  return (
    <View style={StyleSheet.absoluteFill} className="bg-black z-[1000]">
      {type === 'photo' ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <PreviewVideo uri={uri} />
      )}

      <SafeAreaView className="flex-1 justify-between py-6">
        <View className="px-6 flex-row justify-start">
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onCancel();
            }}
            className="p-3 rounded-full bg-black/40"
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </Pressable>
        </View>

        <View className="px-6 pb-10 flex-row justify-between items-center">
             <Pressable 
            onPress={onCancel}
            className="px-6 py-3 rounded-full bg-black/40 border border-white/20"
          >
            <Text className="text-white font-inter-semibold lowercase tracking-wider text-[14px]">retake</Text>
          </Pressable>

          <Pressable 
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSend();
            }}
            style={{ overflow: 'hidden', borderRadius: 30 }}
            className="flex-row items-center px-8 py-3 bg-blue-500 shadow-xl"
          >
            <Text className="text-white font-inter-semibold lowercase tracking-wider text-[14px] mr-2">send</Text>
            <Ionicons name="send" size={18} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};
