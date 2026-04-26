import React, { useState, useEffect } from 'react';
import { View, Pressable, Image, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, MicOff, Video, VideoOff, Volume2, Phone, ChevronDown, SwitchCamera, Users } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { useChat } from '@/context/ChatContext';
import { useCall, type CallParticipant } from '@/context/CallContext';
import { findSeedChatById } from '@/lib/mocks/chatStore';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withRepeat,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIP_WIDTH = 112; // w-28 = 112px
const PIP_HEIGHT = 176; // h-44 = 176px

export default function CallScreen() {
  const params = useLocalSearchParams();
  const t = Array.isArray(params.t) ? params.t[params.t.length - 1] : params.t;
  const keyStr = t || 'default';
  
  return <CallScreenInner key={keyStr} />;
}

function AudioWaves() {
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);

  useEffect(() => {
    wave1.value = withRepeat(withTiming(1, { duration: 5000 }), -1, false);
    wave2.value = withDelay(1500, withRepeat(withTiming(1, { duration: 5000 }), -1, false));
    wave3.value = withDelay(3000, withRepeat(withTiming(1, { duration: 5000 }), -1, false));
  }, [wave1, wave2, wave3]);

  const style1 = useAnimatedStyle(() => ({ transform: [{ scale: 1 + wave1.value * 2 }], opacity: 0.6 - (wave1.value * 0.6) }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ scale: 1 + wave2.value * 2 }], opacity: 0.6 - (wave2.value * 0.6) }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ scale: 1 + wave3.value * 2 }], opacity: 0.6 - (wave3.value * 0.6) }));

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]} className="items-center justify-center pointer-events-none">
      <Animated.View style={[{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.4)' }, style1]} />
      <Animated.View style={[{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.4)' }, style2]} />
      <Animated.View style={[{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.4)' }, style3]} />
    </View>
  );
}

function GroupCallBackdrop({ participants }: { participants: CallParticipant[] }) {
  const slots: CallParticipant[] = [...participants];
  while (slots.length < 4) {
    slots.push({ id: `pad-${slots.length}`, name: '', avatarUrl: null });
  }
  const top4 = slots.slice(0, 4);
  return (
    <View className="absolute inset-0">
      <View className="absolute inset-0 flex-row flex-wrap">
        {top4.map((p) => (
          <View key={p.id} style={{ width: '50%', height: '50%' }} className="overflow-hidden">
            {p.avatarUrl ? (
              <Image
                source={{ uri: p.avatarUrl }}
                style={{ width: '100%', height: '100%', opacity: 0.45 }}
                blurRadius={55}
              />
            ) : (
              <View className="h-full w-full bg-zinc-800" />
            )}
          </View>
        ))}
      </View>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      <View className="absolute inset-0 bg-black/35" />
    </View>
  );
}

function GroupRemoteVideoGrid({ participants }: { participants: CallParticipant[] }) {
  const pad = 12;
  const tileGap = 8;
  const tileW = (SCREEN_WIDTH - pad * 2 - tileGap) / 2;
  return (
    <View className="absolute inset-0 bg-zinc-950" style={{ paddingTop: 56, paddingBottom: 140 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: pad,
          paddingTop: 8,
          gap: tileGap,
          paddingBottom: 32,
        }}
      >
        {participants.map((p) => (
          <View
            key={p.id}
            style={{ width: tileW }}
            className="aspect-[4/3] rounded-2xl border border-white/10 bg-zinc-800/95 overflow-hidden"
          >
            <View className="flex-1 items-center justify-center">
              <Video size={34} color="#52525b" />
              <Text className="text-zinc-500 text-xs font-inter-medium mt-2">Mock video</Text>
            </View>
            <View className="absolute bottom-0 left-0 right-0 flex-row items-center gap-2 border-t border-white/10 bg-black/60 px-2 py-2">
              {p.avatarUrl ? (
                <Image source={{ uri: p.avatarUrl }} className="h-8 w-8 rounded-full" />
              ) : (
                <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                  <Text className="text-xs font-inter-medium text-white">
                    {(p.name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text className="flex-1 text-sm font-inter-medium text-white" numberOfLines={1}>
                {p.name}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function CallScreenInner() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawType = Array.isArray(params.type) ? params.type[params.type.length - 1] : params.type;
  const isVideoCall = rawType === 'video';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { chats } = useChat();
  const chat = chats.find(c => c.id === id) || findSeedChatById(id as string);

  const { 
    activeCall, endCall, minimizeCall, restoreCall, duration,
    toggleLocalVideo, toggleLocalMute, updateCallType
  } = useCall();
  const [permission, requestPermission] = useCameraPermissions();

  const [isSpeaker, setIsSpeaker] = useState(isVideoCall); 
  const [facing, setFacing] = useState<'front' | 'back'>('front');

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const groupParticipants = React.useMemo((): CallParticipant[] => {
    if (!chat) return [];
    if (activeCall?.kind === 'group' && activeCall.participants.length > 0) {
      return activeCall.participants;
    }
    if (chat.isGroup && chat.members?.length) {
      return chat.members.map((m) => ({
        id: m.id,
        name: m.name,
        avatarUrl: m.avatarUrl ?? null,
      }));
    }
    return [];
  }, [activeCall, chat]);

  const isGroupCall = groupParticipants.length > 0;

  const statusLine = React.useMemo(() => {
    const n = groupParticipants.length;
    if (activeCall?.status === 'active') {
      const t = formatDuration(duration);
      return isGroupCall && n > 0 ? `Group call · ${t}` : t;
    }
    if (isGroupCall && n > 0) return `Calling ${n} people…`;
    return 'Ringing…';
  }, [activeCall?.status, duration, groupParticipants.length, isGroupCall]);

  // Gestures for Local Video PiP
  const pipX = useSharedValue(SCREEN_WIDTH - PIP_WIDTH - 16); // right-4
  const pipY = useSharedValue(128); // top-32
  const pipScale = useSharedValue(1); // Default scale 1x
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  const contextScale = useSharedValue(1);

  const lastTypeRef = React.useRef(isVideoCall);

  // Since ChatHeader and UserProfile unconditionally trigger startAudioCall/startVideoCall synchronously
  // before the Router even begins pushing, `activeCall` is guaranteed to be hydrated perfectly by Context.
  // There is no longer any need to extract URL params to auto-initialize the call here.
  // We simply observe routing differences to upgrade/downgrade dynamically if the user taps a different UI button.
  useEffect(() => {
    if (!chat || !activeCall) return;

    if (lastTypeRef.current !== isVideoCall) {
      if (isVideoCall && !activeCall.isLocalVideoEnabled) {
        updateCallType('video');
      } else if (!isVideoCall && activeCall.isLocalVideoEnabled) {
        updateCallType('audio');
      }
      lastTypeRef.current = isVideoCall;
    }
  }, [chat, isVideoCall, activeCall, updateCallType]);

  const isLocalVideoOn = activeCall?.isLocalVideoEnabled ?? isVideoCall;
  const isLocalMuted = activeCall?.isLocalMuted ?? false;
  const isRemoteVideoOn = activeCall?.isRemoteVideoEnabled ?? isVideoCall;
  const isRemoteMuted = activeCall?.isRemoteMuted ?? false;

  // Request Camera permissions safely
  useEffect(() => {
    if (isLocalVideoOn && !permission?.granted) {
      requestPermission();
    }
  }, [isLocalVideoOn, permission?.granted, requestPermission]);

  const isEndingRef = React.useRef(false);

  // Auto-Minimize when screen closes (Swipe down, Android Back) ONLY if not explicitly ended
  useEffect(() => {
    // Override Strict Mode double-invocations: absolutely ensure the call is maximized when this screen mounts
    restoreCall();
    
    return () => {
      // Fast ref check guarantees we don't accidentally minimize a call we just ended
      if (!isEndingRef.current) {
        minimizeCall();
      }
    };
  }, [minimizeCall, restoreCall]); 

  const handleEndCall = () => {
    isEndingRef.current = true;
    endCall();
    router.back();
  };

  const handleMinimize = () => {
    minimizeCall();
    router.back();
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = pipX.value;
      contextY.value = pipY.value;
    })
    .onUpdate((event) => {
      pipX.value = contextX.value + event.translationX;
      pipY.value = contextY.value + event.translationY;
    })
    .onEnd(() => {
      const snapLeft = 16;
      const snapRight = SCREEN_WIDTH - (PIP_WIDTH * pipScale.value) - 16;
      const targetX = pipX.value < SCREEN_WIDTH / 2 ? snapLeft : snapRight;
      
      const minTop = insets.top + 80;
      const maxBottom = SCREEN_HEIGHT - insets.bottom - (PIP_HEIGHT * pipScale.value) - 120;
      
      let targetY = pipY.value;
      if (targetY < minTop) targetY = minTop;
      if (targetY > maxBottom) targetY = maxBottom;

      pipX.value = withSpring(targetX, { damping: 15, stiffness: 150 });
      pipY.value = withSpring(targetY, { damping: 15, stiffness: 150 });
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      contextScale.value = pipScale.value;
    })
    .onUpdate((event) => {
      pipScale.value = Math.min(Math.max(contextScale.value * event.scale, 0.5), 1.5);
    });

  const composedGestures = Gesture.Simultaneous(panGesture, pinchGesture);

  const pipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pipX.value },
      { translateY: pipY.value },
      { scale: pipScale.value }
    ]
  }));

  if (!chat) return null;

  return (
    <View className="flex-1 bg-zinc-950">
      <Stack.Screen options={{ presentation: 'fullScreenModal', animation: 'fade' }} />

      {/* Background Layer */}
      {isRemoteVideoOn ? (
        isGroupCall ? (
          <GroupRemoteVideoGrid participants={groupParticipants} />
        ) : (
          <View className="absolute inset-0 bg-zinc-900 items-center justify-center">
            <Video size={64} color="#3f3f46" />
            <Text className="text-zinc-500 font-inter-medium mt-4">Waiting for remote video...</Text>
          </View>
        )
      ) : isGroupCall ? (
        <GroupCallBackdrop participants={groupParticipants} />
      ) : (
        <View className="absolute inset-0">
          {chat.avatarUrl ? (
            <Image source={{ uri: chat.avatarUrl }} className="w-full h-full opacity-60" blurRadius={60} />
          ) : (
            <View className="w-full h-full bg-blue-900 opacity-60" />
          )}
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          <View className="absolute inset-0 bg-black/30" />
        </View>
      )}

      {/* Local Video PiP (Draggable & Resizable) */}
      {isLocalVideoOn && (
        <GestureDetector gesture={composedGestures}>
          <Animated.View 
            style={[{ position: 'absolute', width: PIP_WIDTH, height: PIP_HEIGHT, zIndex: 50 }, pipAnimatedStyle]}
            className="bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl items-center justify-center origin-top-left"
          >
            {permission?.granted ? (
              <CameraView style={StyleSheet.absoluteFill} facing={facing} mute={true} />
            ) : (
              <Text className="text-zinc-500 text-xs font-inter-semibold">Camera off</Text>
            )}
            {/* Outline overlay to preserve border when masked by camera */}
            <View className="absolute inset-0 border-[1.5px] border-white/20 rounded-2xl pointer-events-none" />
            
            {/* Swap Camera Button inside PiP */}
            <Pressable 
              onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 backdrop-blur-md border border-white/10"
            >
              <SwitchCamera size={16} color="#ffffff" />
            </Pressable>

            {/* Local Mute Indicator */}
            {isLocalMuted && (
              <View className="absolute bottom-2 left-2 bg-black/50 rounded-full p-1 border border-white/10 backdrop-blur-md">
                <MicOff size={14} color="#ef4444" />
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      )}

      {/* Foreground Layer */}
      <View 
        className="flex-1 justify-between z-10" 
        style={{ paddingTop: Math.max(insets.top, 10), paddingBottom: Math.max(insets.bottom, 20) }}
        pointerEvents="box-none"
      >
        <View pointerEvents="box-none">
          {/* Telegram Top Header Layer */}
          <View className="flex-row items-center px-4 py-2">
            <Pressable onPress={handleMinimize} className="p-3">
              <ChevronDown size={30} color="#fff" />
            </Pressable>
          </View>

          {/* Caller info */}
          <View className="mt-4 flex-row items-center justify-center px-6" pointerEvents="none">
            {isGroupCall && (
              <View className="mr-2 rounded-full bg-white/10 p-2">
                <Users size={20} color="#fff" />
              </View>
            )}
            <Text
              className="mr-2 shrink text-center text-[26px] font-inter-semibold text-white drop-shadow-md"
              numberOfLines={2}
            >
              {chat.title}
            </Text>
            {isRemoteMuted && <MicOff size={20} color="#ef4444" />}
          </View>
          <View className="items-center px-4" pointerEvents="none">
            <Text className="mt-1.5 text-center text-[16px] font-normal text-white/60">{statusLine}</Text>
            {isGroupCall && activeCall?.status === 'active' && (
              <Text className="mt-1 text-[13px] text-white/45">
                {groupParticipants.length} in this call
              </Text>
            )}
          </View>

          {/* Center: single avatar (direct) or participant grid (group) — hidden when remote video grid shows */}
          {!isRemoteVideoOn && !isGroupCall && (
            <View className="mt-20 items-center justify-center" pointerEvents="none">
              <View className="relative items-center justify-center shadow-2xl">
                {activeCall?.status === 'ringing' && <AudioWaves />}
                {chat.avatarUrl ? (
                  <Image
                    source={{ uri: chat.avatarUrl }}
                    className="h-36 w-36 rounded-full border-[3px] border-white/20"
                  />
                ) : (
                  <View className="h-36 w-36 items-center justify-center rounded-full border-[3px] border-white/20 bg-blue-500">
                    <Text className="text-5xl font-inter-semibold text-white">
                      {chat.title.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {!isRemoteVideoOn && isGroupCall && (
            <View className="mt-10 items-center px-5" pointerEvents="none">
              <View className="relative w-full max-w-[360px] items-center">
                {activeCall?.status === 'ringing' && (
                  <View className="absolute inset-0 items-center justify-center" style={{ top: -24, bottom: -24 }}>
                    <AudioWaves />
                  </View>
                )}
                <View
                  className="flex-row flex-wrap justify-center"
                  style={{ gap: 14, rowGap: 18 }}
                >
                  {groupParticipants.map((p) => (
                    <View key={p.id} className="w-[76px] items-center">
                      {p.avatarUrl ? (
                        <Image
                          source={{ uri: p.avatarUrl }}
                          className="h-[68px] w-[68px] rounded-full border-2 border-white/25"
                        />
                      ) : (
                        <View className="h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-white/25 bg-blue-500">
                          <Text className="text-xl font-inter-semibold text-white">
                            {(p.name || '?').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text className="mt-1.5 text-center text-[11px] font-inter-medium text-white/85" numberOfLines={1}>
                        {p.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Section: Premium Floating Controls Hub - Aligned with Tab Bar Position */}
        <View 
          style={{ 
            position: 'absolute', 
            bottom: 22, 
            left: 0, 
            right: 0, 
            paddingHorizontal: 28 
          }}
        >
          <View className="flex-row justify-between items-center bg-black/40 backdrop-blur-3xl rounded-[40px] px-4 py-3 border border-white/10 shadow-2xl">
            
            {/* Persistent Speaker Toggle Button */}
            <Pressable 
              onPress={() => setIsSpeaker(!isSpeaker)}
              className={`w-[52px] h-[52px] rounded-full items-center justify-center ${isSpeaker ? 'bg-white' : 'bg-white/10 active:bg-white/20'}`}
            >
              <Volume2 size={24} color={isSpeaker ? '#000' : '#fff'} />
            </Pressable>

            {/* Video Toggle Button */}
            <Pressable 
              onPress={toggleLocalVideo}
              className={`w-[52px] h-[52px] rounded-full items-center justify-center ${isLocalVideoOn ? 'bg-white' : 'bg-white/10 active:bg-white/20'}`}
            >
              {isLocalVideoOn ? <Video size={24} color="#000" /> : <VideoOff size={24} color="#fff" />}
            </Pressable>

            {/* Mute Button */}
            <Pressable 
              onPress={toggleLocalMute}
              className={`w-[52px] h-[52px] rounded-full items-center justify-center ${isLocalMuted ? 'bg-white' : 'bg-white/10 active:bg-white/20'}`}
            >
              {isLocalMuted ? <MicOff size={24} color="#000" /> : <Mic size={24} color="#fff" />}
            </Pressable>

            {/* End Call Button */}
            <Pressable 
              onPress={handleEndCall}
              className="w-[52px] h-[52px] rounded-full items-center justify-center bg-red-500 shadow-lg shadow-red-500/30 active:bg-red-600"
            >
              <View style={{ transform: [{ rotate: '135deg' }] }}>
                <Phone size={24} color="#fff" />
              </View>
            </Pressable>

          </View>
        </View>
      </View>
    </View>
  );
}
