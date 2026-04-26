import React, { useEffect, useState } from 'react';
import { View, Pressable, Dimensions, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useCall } from '@/context/CallContext';
import { Video as VideoIcon, MicOff } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const WIDGET_WIDTH = 100;
const WIDGET_HEIGHT = 140;

export function FloatingCallWidget() {
  const { activeCall, isMinimized, restoreCall } = useCall();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);

  const translateX = useSharedValue(SCREEN_WIDTH - WIDGET_WIDTH - 20);
  const translateY = useSharedValue(SCREEN_HEIGHT / 2);
  const widgetScale = useSharedValue(1);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  const contextScale = useSharedValue(1);

  // Buffer rendering the actual hardware Camera component until React Navigation full unmount animation finishes (300-400ms)
  // This explicitly prevents Expo Camera hardware locks caused by >1 CameraView instances simultaneously colliding on mobile.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isMinimized && activeCall?.isLocalVideoEnabled) {
      timer = setTimeout(() => setIsCameraReady(true), 400);
    } else {
      setIsCameraReady(false);
    }
    return () => clearTimeout(timer);
  }, [isMinimized, activeCall?.isLocalVideoEnabled]);

  // Request camera permissions if the local camera is enabled
  useEffect(() => {
    if (activeCall?.isLocalVideoEnabled && !permission?.granted) {
      requestPermission();
    }
  }, [activeCall?.isLocalVideoEnabled, permission?.granted, requestPermission]);

  // When the widget appears, ensure it renders within safe bounds
  useEffect(() => {
    if (isMinimized) {
      if (translateY.value < insets.top + 20) {
        translateY.value = withSpring(insets.top + 20);
      }
    }
  }, [isMinimized, insets.top, translateY]);

  const pan = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
      translateY.value = contextY.value + event.translationY;
    })
    .onEnd(() => {
      const snapLeft = 20;
      const snapRight = SCREEN_WIDTH - (WIDGET_WIDTH * widgetScale.value) - 20;
      const targetX = translateX.value < SCREEN_WIDTH / 2 ? snapLeft : snapRight;
      
      const minTop = insets.top + 20;
      const maxBottom = SCREEN_HEIGHT - insets.bottom - (WIDGET_HEIGHT * widgetScale.value) - 60; 
      
      let targetY = translateY.value;
      if (targetY < minTop) targetY = minTop;
      if (targetY > maxBottom) targetY = maxBottom;

      translateX.value = withSpring(targetX, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(targetY, { damping: 15, stiffness: 150 });
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      contextScale.value = widgetScale.value;
    })
    .onUpdate((event) => {
      widgetScale.value = Math.min(Math.max(contextScale.value * event.scale, 0.5), 2.0);
    });

  const composedGestures = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: widgetScale.value }
    ]
  }));

  if (!isMinimized || !activeCall) return null;

  const handlePress = () => {
    restoreCall();
    router.push(`/call/${activeCall.id}?type=${activeCall.type}` as any);
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }} pointerEvents="box-none">
      <GestureDetector gesture={composedGestures}>
        <Animated.View style={[{ position: 'absolute', zIndex: 9999, transformOrigin: 'top left' }, animatedStyle]}>
          <Pressable 
            onPress={handlePress}
            className="w-[100px] h-[140px] rounded-2xl overflow-hidden bg-zinc-800 shadow-xl border-2 border-green-500/50"
          >
            {activeCall.isLocalVideoEnabled ? (
              <View className="flex-1 items-center justify-center bg-zinc-900 rounded-2xl overflow-hidden">
                {permission?.granted && isCameraReady ? (
                  <CameraView style={StyleSheet.absoluteFill} facing="front" mute={true} />
                ) : (
                  <VideoIcon size={32} color="#52525b" />
                )}
                <View className="absolute inset-0 border-2 border-green-500/50 rounded-2xl pointer-events-none" />
              </View>
            ) : activeCall.isRemoteVideoEnabled ? (
              <View className="flex-1 items-center justify-center overflow-hidden rounded-2xl bg-zinc-900">
                <VideoIcon size={32} color="#52525b" />
                {activeCall.kind === 'group' && activeCall.participants.length > 0 && (
                  <Text className="mt-1 text-[10px] font-inter-semibold text-white/55">
                    {activeCall.participants.length} people
                  </Text>
                )}
                <View className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-green-500/50" />
              </View>
            ) : activeCall.kind === 'group' && activeCall.participants.length > 0 ? (
              <View className="flex-1 justify-between overflow-hidden rounded-2xl bg-zinc-900 px-1 pt-3 pb-8">
                <View className="items-center justify-center">
                  <View className="flex-row items-center justify-center">
                    {activeCall.participants.slice(0, 3).map((p, i) => (
                      <View
                        key={p.id}
                        className="-ml-3.5 rounded-full border-2 border-zinc-800 first:ml-0"
                        style={{ zIndex: 10 - i }}
                      >
                        {p.avatarUrl ? (
                          <Image source={{ uri: p.avatarUrl }} className="h-10 w-10 rounded-full" />
                        ) : (
                          <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                            <Text className="text-xs font-inter-bold text-white">
                              {(p.name || '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                  <Text className="mt-2 px-1 text-center text-[9px] font-inter-medium text-white/60" numberOfLines={1}>
                    Group · {activeCall.participants.length}
                  </Text>
                </View>
                <View className="absolute bottom-2.5 self-center rounded-full bg-black/65 px-2.5 py-1">
                  <Text className="text-center text-[9px] font-inter-medium leading-3 text-white">Tap to return</Text>
                </View>
                <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-green-500" />
              </View>
            ) : (
              <View className="flex-1">
                {activeCall.avatarUrl ? (
                  <Image source={{ uri: activeCall.avatarUrl }} className="h-full w-full opacity-50" />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-blue-900 opacity-50">
                    <Text className="text-2xl font-inter-bold text-white">{activeCall.title.charAt(0)}</Text>
                  </View>
                )}
                <View className="absolute right-2 top-2 h-3 w-3 rounded-full bg-green-500" />
                <View className="absolute bottom-3 self-center items-center justify-center rounded-full bg-black/60 px-3 py-1">
                  <Text className="text-center text-[10px] font-inter-medium leading-3 text-white">Tap to return</Text>
                </View>
              </View>
            )}

            {/* Global Mute Overlay Badge */}
            {activeCall.isLocalMuted && (
              <View className="absolute top-2 left-2 bg-black/60 rounded-full p-1 border border-white/20 shadow-md">
                <MicOff size={14} color="#ef4444" />
              </View>
            )}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
