import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  PanResponder,
  ActivityIndicator,
  Linking,
  BackHandler,
} from "react-native";
import { Text } from "@/components/ui/text";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  CameraType,
  FlashMode,
} from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { ensureExpoAvLoaded } from "@/lib/ensureExpoAv";
import { resetAudioSessionForChat } from "@/lib/audioSession";

interface CameraOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onCapture: (uri: string, type: "photo" | "video") => void;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  isVisible,
  onClose,
  onCapture,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [type, setType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isRecording, setIsRecording] = useState(false);

  const [cameraMode, setCameraMode] = useState<"picture" | "video">("picture");
  const [recordDuration, setRecordDuration] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const [zoom, setZoom] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const isActuallyRecording = useRef(false);
  const recordingStartTime = useRef(0);
  const isHardwareBusy = useRef(false);
  const pendingStartTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const takePhotoRef = useRef<(() => void) | undefined>(undefined);
  const startRecordingRef = useRef<(() => void) | undefined>(undefined);
  const stopRecordingRef = useRef<(() => void) | undefined>(undefined);

  const shutterScale = useSharedValue(1);
  const recordingPulse = useSharedValue(1);
  const flashOpacity = useSharedValue(0);
  const transitionOverlayOpacity = useSharedValue(0);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPressing = useRef<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isPressing.current = Date.now();
        shutterScale.value = withSpring(0.9);

        longPressTimer.current = setTimeout(() => {
          if (isPressing.current) {
            startRecordingRef.current?.();
          }
        }, 400);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isActuallyRecording.current) {
          const newZoom = Math.min(Math.max(-gestureState.dy / 300, 0), 1);
          setZoom(newZoom);
        }
      },
      onPanResponderRelease: () => {
        const elapsed = isPressing.current ? Date.now() - isPressing.current : 0;
        isPressing.current = null;
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        shutterScale.value = withSpring(1);

        if (elapsed < 400 && !isActuallyRecording.current) {
          takePhotoRef.current?.();
        } else {
          stopRecordingRef.current?.();
        }
      },
      onPanResponderTerminate: () => {
        isPressing.current = null;
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        shutterScale.value = withSpring(1);
        stopRecordingRef.current?.();
      },
    }),
  ).current;

  const shutterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingPulse.value }],
    opacity: interpolate(recordingPulse.value, [1, 1.2], [1, 0.6]),
  }));

  const hintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showHint ? 1 : 0, { duration: 500 }),
  }));

  const flashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const transitionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: transitionOverlayOpacity.value,
  }));

  const handleClose = useCallback(async () => {
    await resetAudioSessionForChat();
    onClose();
  }, [onClose]);

  /** Without this, Android hardware back pops the chat screen instead of closing the overlay. */
  useEffect(() => {
    if (!isVisible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      void handleClose();
      return true;
    });
    return () => sub.remove();
  }, [isVisible, handleClose]);

  useEffect(() => {
    if (isVisible) {
      if (permission && !permission.granted) requestPermission();
      setShowHint(true);
      const timer = setTimeout(() => setShowHint(false), 3000);
      setCameraMode("picture");
      return () => clearTimeout(timer);
    }
    setIsCameraReady(false);
  }, [isVisible, permission, requestPermission]);

  useEffect(() => {
    if (isRecording) {
      recordingPulse.value = withRepeat(withTiming(1.2, { duration: 500 }), -1, true);
      timerInterval.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      recordingPulse.value = withTiming(1);
      if (timerInterval.current) clearInterval(timerInterval.current);
      setRecordDuration(0);
      setZoom(0);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [isRecording, recordingPulse]);

  const handleTakePhoto = useCallback(async () => {
    if (isHardwareBusy.current) return;

    try {
      isHardwareBusy.current = true;

      flashOpacity.value = withTiming(0.8, { duration: 50 }, () => {
        flashOpacity.value = withTiming(0, { duration: 150 });
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync();

        if (photo && type === "front") {
          const manipulated = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
          );
          onCapture(manipulated.uri, "photo");
        } else if (photo) {
          onCapture(photo.uri, "photo");
        }
      }
    } catch (err) {
      console.error("Photo error", err);
    } finally {
      isHardwareBusy.current = false;
    }
  }, [onCapture, type, flashOpacity]);

  const handleStartRecording = useCallback(async () => {
    if (!isCameraReady || isHardwareBusy.current || isActuallyRecording.current)
      return;

    if (micPermission?.status !== "granted") {
      const resp = await requestMicPermission();
      if (!resp.granted) return;
    }

    if (!cameraRef.current) return;

    try {
      isHardwareBusy.current = true;
      transitionOverlayOpacity.value = withTiming(1, { duration: 30 }, () => {
        runOnJS(setCameraMode)("video");
      });

      const { Audio } = await ensureExpoAvLoaded();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      pendingStartTimer.current = setTimeout(async () => {
        pendingStartTimer.current = null;
        try {
          if (cameraRef.current) {
            setIsRecording(true);
            isActuallyRecording.current = true;
            recordingStartTime.current = Date.now();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            transitionOverlayOpacity.value = withTiming(0, { duration: 150 });
            const video = await cameraRef.current.recordAsync();
            if (video) onCapture(video.uri, "video");
          }
        } catch (e) {
          console.error("Video record start error", e);
          setIsRecording(false);
          isActuallyRecording.current = false;
          transitionOverlayOpacity.value = withTiming(1, { duration: 30 }, () => {
            runOnJS(setCameraMode)("picture");
            transitionOverlayOpacity.value = withTiming(0, { duration: 150 });
          });
        } finally {
          isHardwareBusy.current = false;
        }
      }, 100);
    } catch (err) {
      console.error("Initial record state error", err);
      isHardwareBusy.current = false;
    }
  }, [
    isCameraReady,
    micPermission?.status,
    requestMicPermission,
    onCapture,
    transitionOverlayOpacity,
  ]);

  const handleStopRecording = useCallback(async () => {
    if (!cameraRef.current) return;

    if (!isActuallyRecording.current && pendingStartTimer.current) {
      clearTimeout(pendingStartTimer.current);
      pendingStartTimer.current = null;
      isHardwareBusy.current = false;
      transitionOverlayOpacity.value = withTiming(1, { duration: 30 }, () => {
        runOnJS(setCameraMode)("picture");
        transitionOverlayOpacity.value = withTiming(0, { duration: 150 });
      });
      return;
    }

    if (isActuallyRecording.current) {
      const elapsed = Date.now() - recordingStartTime.current;
      if (elapsed < 250) {
        setTimeout(() => {
          stopRecordingRef.current?.();
        }, 250 - elapsed);
        return;
      }

      try {
        await cameraRef.current.stopRecording();
      } catch (err) {
        console.error("Stop recording error", err);
      } finally {
        setIsRecording(false);
        isActuallyRecording.current = false;
        transitionOverlayOpacity.value = withTiming(1, { duration: 30 }, () => {
          runOnJS(setCameraMode)("picture");
          transitionOverlayOpacity.value = withTiming(0, { duration: 150 });
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [transitionOverlayOpacity]);

  useEffect(() => {
    takePhotoRef.current = () => {
      void handleTakePhoto();
    };
    startRecordingRef.current = () => {
      void handleStartRecording();
    };
    stopRecordingRef.current = () => {
      void handleStopRecording();
    };
  }, [handleTakePhoto, handleStartRecording, handleStopRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!isVisible) return null;

  if (permission === null) {
    return (
      <View
        style={[StyleSheet.absoluteFill, styles.centered]}
        className="bg-black z-[999]"
      >
        <ActivityIndicator color="#fff" size="large" />
        <Text className="text-white mt-4 text-base">Loading camera…</Text>
        <Pressable
          onPress={handleClose}
          className="mt-8 px-6 py-3 rounded-full bg-white/20"
        >
          <Text className="text-white font-inter-semibold">Close</Text>
        </Pressable>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[StyleSheet.absoluteFill, styles.centered]}
        className="bg-black z-[999] px-8"
      >
        <Ionicons name="camera-outline" size={56} color="white" />
        <Text className="text-white text-center text-lg font-inter-semibold mt-4">
          Camera access
        </Text>
        <Text className="text-white/70 text-center text-sm mt-2">
          Allow camera access to take photos and videos in chat.
        </Text>
        <Pressable
          onPress={() => requestPermission()}
          className="mt-6 px-8 py-3 rounded-full bg-blue-500"
        >
          <Text className="text-white font-inter-bold">Allow camera</Text>
        </Pressable>
        {permission.canAskAgain === false ? (
          <Pressable
            onPress={() => Linking.openSettings()}
            className="mt-4 px-8 py-3 rounded-full bg-white/15"
          >
            <Text className="text-white font-inter-semibold">Open Settings</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={handleClose} className="mt-6 py-3">
          <Text className="text-white/80">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black z-[999]">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={type}
        flash={flash}
        mode={cameraMode}
        zoom={zoom}
        videoQuality="720p"
        mute={false}
        onCameraReady={() => setIsCameraReady(true)}
      />
      
      {/* Intentional Blur/Black Transition Cover */}
      <Animated.View 
        style={[StyleSheet.absoluteFill, transitionAnimatedStyle]} 
        className="bg-black z-10"
        pointerEvents="none"
      />

      <SafeAreaView className="flex-1 justify-between py-6 z-20">
        <View className="flex-row justify-between px-6 items-center">
          <Pressable
            onPress={handleClose}
            className="p-2 rounded-full bg-black/30"
          >
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
          {isRecording ? (
            <View className="bg-red-600 px-4 py-1.5 rounded-full flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-white mr-2" />
              <Text className="text-white font-inter-bold">
                {formatTime(recordDuration)}
              </Text>
            </View>
          ) : null}
          <Pressable
            onPress={() =>
              setFlash((prev) => (prev === "off" ? "on" : "off"))
            }
            className={`p-2 rounded-full ${flash === "on" ? "bg-yellow-400" : "bg-black/30"}`}
          >
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={24}
              color="white"
            />
          </Pressable>
        </View>
        <View className="px-10 pb-10 flex-row justify-between items-center">
          <Pressable
            onPress={() => {}}
            className="p-3 rounded-full bg-black/30 opacity-0"
          >
            <Ionicons name="images" size={28} color="white" />
          </Pressable>
          <View className="items-center justify-center">
            {isRecording ? (
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    width: 90,
                    height: 90,
                    borderRadius: 45,
                    borderWidth: 4,
                    borderColor: "#ef4444",
                  },
                  pulseAnimatedStyle,
                ]}
              />
            ) : null}
            <View {...panResponder.panHandlers}>
              <Animated.View
                style={[
                  {
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: "white",
                    borderWidth: 6,
                    borderColor: isRecording
                      ? "#ef4444"
                      : "rgba(255,255,255,0.3)",
                  },
                  shutterAnimatedStyle,
                ]}
              />
            </View>
            <Animated.View
              style={[
                { position: "absolute", top: -45, alignItems: "center" },
                hintAnimatedStyle,
              ]}
              pointerEvents="none"
            >
              <Text className="text-white font-inter-semibold lowercase tracking-[2px] text-[12px] shadow-lg">
                hold
              </Text>
            </Animated.View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setType((prev) => (prev === "back" ? "front" : "back"));
            }}
            className="p-3 rounded-full bg-black/30"
          >
            <Ionicons name="camera-reverse" size={28} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "white", zIndex: 9999 },
          flashAnimatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
});
