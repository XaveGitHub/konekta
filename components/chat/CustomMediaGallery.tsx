import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPACING = 2;
const COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - SPACING * (COLUMNS + 1)) / COLUMNS;

/** Match app.json expo-media-library `granularPermissions` — do not request `audio` unless plugin adds it. */
const MEDIA_LIBRARY_ACCESS = ['photo', 'video'] as const;

export interface SelectedMedia {
  id: string;
  uri: string;
  type: 'photo' | 'video';
  width: number;
  height: number;
  duration?: number;
}

interface CustomMediaGalleryProps {
  isVisible: boolean;
  onClose: () => void;
  onSend: (assets: SelectedMedia[]) => void;
}

export const CustomMediaGallery: React.FC<CustomMediaGalleryProps> = ({
  isVisible,
  onClose,
  onSend,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<SelectedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadGalleryAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { assets: fetchedAssets } = await MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: ['photo', 'video'],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });
      setAssets(fetchedAssets);
    } catch (err) {
      console.warn('Failed to load gallery', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setSelectedAssets([]);
      setHasPermission(null);
      return;
    }

    (async () => {
      try {
        let perm = await MediaLibrary.getPermissionsAsync(
          false,
          [...MEDIA_LIBRARY_ACCESS],
        );
        if (!perm.granted) {
          perm = await MediaLibrary.requestPermissionsAsync(
            false,
            [...MEDIA_LIBRARY_ACCESS],
          );
        }
        setHasPermission(perm.granted);
        if (perm.granted) {
          await loadGalleryAssets();
        }
      } catch {
        setHasPermission(false);
      }
    })();
  }, [isVisible, loadGalleryAssets]);

  const toggleSelection = useCallback((asset: MediaLibrary.Asset) => {
    // 60-second limit check
    if (asset.mediaType === 'video' && asset.duration > 61) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAssets((prev) => {
      const existingIdx = prev.findIndex(a => a.id === asset.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next.splice(existingIdx, 1);
        return next;
      }
      return [...prev, {
        id: asset.id,
        uri: asset.uri,
        type: asset.mediaType === 'video' ? 'video' : 'photo',
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
      }];
    });
  }, []);

  const handleSend = () => {
    if (selectedAssets.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSend(selectedAssets);
    setSelectedAssets([]);
    onClose();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(250)}
      className="absolute bottom-0 left-0 right-0 z-[100]"
      style={{
        height: 380,
        backgroundColor: isDark ? 'rgba(28,28,30,0.98)' : '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
      }}
    >
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/20">
        <Pressable onPress={onClose} className="py-2 pr-4">
          <Ionicons name="close" size={26} color={isDark ? '#FFF' : '#000'} />
        </Pressable>
        <Text className="text-[17px] font-inter-bold text-foreground">
          Recent Media
        </Text>
        <Pressable 
          onPress={handleSend}
          disabled={selectedAssets.length === 0}
          className={`px-3 py-1.5 rounded-full ${selectedAssets.length > 0 ? 'bg-primary' : 'bg-muted'}`}
        >
          <Text className={`font-inter-semibold text-[15px] ${selectedAssets.length > 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            Send {selectedAssets.length > 0 ? `(${selectedAssets.length})` : ''}
          </Text>
        </Pressable>
      </View>

      {hasPermission === false && (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-muted-foreground mb-4">
            Konekta requires gallery permissions to show your recent photos here.
          </Text>
          <Pressable
            onPress={async () => {
              const perm = await MediaLibrary.requestPermissionsAsync(
                false,
                [...MEDIA_LIBRARY_ACCESS],
              );
              setHasPermission(perm.granted);
              if (perm.granted) await loadGalleryAssets();
            }}
            className="rounded-full bg-primary px-6 py-3"
          >
            <Text className="font-inter-bold text-primary-foreground">Grant Access</Text>
          </Pressable>
        </View>
      )}

      {hasPermission && isLoading && assets.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3267E3" />
        </View>
      )}

      {hasPermission && (
        <FlatList
          data={assets}
          keyExtractor={item => item.id}
          numColumns={COLUMNS}
          contentContainerStyle={{ padding: SPACING }}
          renderItem={({ item }) => {
            const selectedIndex = selectedAssets.findIndex(a => a.id === item.id);
            const isSelected = selectedIndex >= 0;
            const isTooLong = item.mediaType === 'video' && item.duration > 61;

            return (
              <Pressable
                onPress={() => toggleSelection(item)}
                disabled={isTooLong}
                style={{
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  margin: SPACING,
                  borderRadius: 8,
                  overflow: 'hidden',
                  opacity: isTooLong ? 0.4 : 1,
                }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: '100%', height: '100%', opacity: isSelected ? 0.7 : 1 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                
                {/* Video Duration Badge */}
                {item.mediaType === 'video' && item.duration > 0 && (
                  <View className="absolute bottom-1 right-1 bg-black/60 rounded px-1 flex-row items-center">
                    <Ionicons name="videocam" size={10} color="white" style={{ marginRight: 2 }} />
                    <Text className="text-white text-[10px] font-inter-semibold tracking-tight">
                      {formatDuration(item.duration)}
                    </Text>
                  </View>
                )}

                {isTooLong && (
                  <View className="absolute inset-x-0 bottom-0 bg-red-600/80 items-center py-0.5">
                    <Text className="text-white text-[9px] font-inter-black uppercase">Too Long</Text>
                  </View>
                )}

                {/* Selection Badge */}
                <View className="absolute top-2 right-2">
                  {isSelected ? (
                    <View className="w-6 h-6 rounded-full bg-primary items-center justify-center border-2 border-white">
                      <Text className="text-white text-[12px] font-inter-black">{selectedIndex + 1}</Text>
                    </View>
                  ) : (
                    <View className="w-6 h-6 rounded-full border-2 border-white/50 bg-black/20" />
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Animated.View>
  );
};
