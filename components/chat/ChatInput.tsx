import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Keyboard,
  Platform,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trash2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import type { Recording } from 'expo-av/build/Audio/Recording';
import { ensureExpoAvLoaded } from '@/lib/ensureExpoAv';
import { resetAudioSessionForChat } from '@/lib/audioSession';
import { heightsFromMeter } from '@/lib/voiceWaveform';
import { formatVoiceSeconds } from '@/lib/voiceDurationFormat';
import {
  micButtonAccessibility,
  recordingStripAccessibilityLabel,
} from '@/lib/chatRecordingUi';
import { VoiceWaveformBars } from '@/components/chat/VoiceWaveformBars';
import { isBenignRecordingStopError } from '@/lib/recordingErrors';
import { appAccentHex } from '@/lib/theme';

const MIN_VOICE_MS = 500;
const CANCEL_MOVE_PX = 44;
const MIC_HIT = 44;
const SIDE_ICON = 42;

function normalizeMetering(db: number | undefined): number {
  if (db === undefined || Number.isNaN(db)) return 0.15;
  const n = (db + 50) / 50;
  return Math.min(1, Math.max(0.08, n));
}

interface ChatInputProps {
  isTrayVisible: boolean;
  setIsTrayVisible: (visible: boolean) => void;
  onOpenCamera: () => void;
  onSendText?: (text: string) => void;
  onSendVoice?: (uri: string) => void;
  onVoiceNoteTooShort?: () => void;
  /** When true, show a read-only notice instead of the composer (e.g. announce channels). */
  composerReadOnly?: boolean;
  composerReadOnlyMessage?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isTrayVisible,
  setIsTrayVisible,
  onOpenCamera,
  onSendText,
  onSendVoice,
  onVoiceNoteTooShort,
  composerReadOnly = false,
  composerReadOnlyMessage = 'You cannot post in this channel.',
}) => {
  const [text, setText] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [slideCancel, setSlideCancel] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [meterNorm, setMeterNorm] = useState(0.2);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accent = appAccentHex(isDark);

  const sessionRef = useRef<'idle' | 'starting' | 'recording'>('idle');
  const cancelAfterPrepareRef = useRef(false);
  const willCancelRef = useRef(false);
  const recordingRef = useRef<Recording | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  /** After lock/cancel gestures, ignore mic onPress briefly (avoids send firing on lift). */
  const suppressMicSendUntilRef = useRef(0);
  /** Reset drag baseline when native recording starts so prep delay doesn’t false-trigger lock/cancel. */
  const resetGestureBaselinePendingRef = useRef(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { showSubscription.remove(); hideSubscription.remove(); };
  }, []);

  useEffect(() => {
    if (composerReadOnly) setIsTrayVisible(false);
  }, [composerReadOnly, setIsTrayVisible]);

  useEffect(() => {
    return () => {
      const r = recordingRef.current;
      if (r) {
        r.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  const applyTouchGesture = useCallback((pageX: number, _pageY: number) => {
    if (sessionRef.current !== 'recording') return;

    if (resetGestureBaselinePendingRef.current) {
      resetGestureBaselinePendingRef.current = false;
      touchStartRef.current = { x: pageX, y: _pageY };
      return;
    }

    const start = touchStartRef.current;
    if (!start) return;

    const dx = pageX - start.x;

    if (dx <= -CANCEL_MOVE_PX) {
      if (!willCancelRef.current) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      willCancelRef.current = true;
      setSlideCancel(true);
      suppressMicSendUntilRef.current = Date.now() + 420;
    }
  }, []);

  const isTyping = text.trim().length > 0;
  /** Inset is applied by the chat screen footer — keep only small inner padding here. */
  const bottomPadding = useMemo(() => {
    if (isKeyboardVisible) {
      return Platform.OS === 'ios' ? 8 : 24;
    }
    return 0; // Pure 0 globally when closed. Let the [id].tsx wrapper handle safe area spacing.
  }, [isKeyboardVisible]);

  const startRecording = async () => {
    if (sessionRef.current !== 'idle') return;
    sessionRef.current = 'starting';
    cancelAfterPrepareRef.current = false;
    willCancelRef.current = false;
    setSlideCancel(false);
    setDurationMs(0);

    try {
      const [expoAv, recordingConstants] = await Promise.all([
        ensureExpoAvLoaded(),
        import('expo-av/build/Audio/RecordingConstants'),
      ]);
      const { Audio, InterruptionModeIOS, InterruptionModeAndroid } = expoAv;
      const { RecordingOptionsPresets } = recordingConstants;

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        sessionRef.current = 'idle';
        return;
      }
      if (cancelAfterPrepareRef.current) {
        sessionRef.current = 'idle';
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      if (cancelAfterPrepareRef.current) {
        sessionRef.current = 'idle';
        await resetAudioSessionForChat().catch(() => {});
        return;
      }

      const recording = new Audio.Recording();
      recordingRef.current = recording;

      await recording.prepareToRecordAsync(RecordingOptionsPresets.HIGH_QUALITY);

      if (cancelAfterPrepareRef.current) {
        await recording.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
        sessionRef.current = 'idle';
        await resetAudioSessionForChat();
        return;
      }

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && typeof status.durationMillis === 'number') {
          setDurationMs(status.durationMillis);
        }
        if (status.metering !== undefined) {
          setMeterNorm(normalizeMetering(status.metering));
        }
      });
      recording.setProgressUpdateInterval(80);

      await recording.startAsync();

      Keyboard.dismiss();
      sessionRef.current = 'recording';
      resetGestureBaselinePendingRef.current = true;
      setIsRecordingActive(true);
      suppressMicSendUntilRef.current = 0;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
      const r = recordingRef.current;
      recordingRef.current = null;
      if (r) {
        await r.stopAndUnloadAsync().catch(() => {});
      }
      sessionRef.current = 'idle';
      setIsRecordingActive(false);
      touchStartRef.current = null;
      await resetAudioSessionForChat().catch(() => {});
    }
  };

  const stopRecording = async (intentSend: boolean) => {
    suppressMicSendUntilRef.current = 0;
    const cancelledBySlide = willCancelRef.current;
    willCancelRef.current = false;
    setSlideCancel(false);
    touchStartRef.current = null;

    const shouldSend = intentSend && !cancelledBySlide;

    if (sessionRef.current === 'starting') {
      cancelAfterPrepareRef.current = true;
      return;
    }

    if (sessionRef.current !== 'recording') {
      return;
    }

    const recording = recordingRef.current;
    recordingRef.current = null;
    sessionRef.current = 'idle';
    setIsRecordingActive(false);
    setDurationMs(0);
    setMeterNorm(0.2);

    if (!recording) {
      await resetAudioSessionForChat().catch(() => {});
      return;
    }

    try {
      const before = await recording.getStatusAsync();
      const ms = before.durationMillis ?? 0;

      const finalStatus = await recording.stopAndUnloadAsync();
      const uri =
        finalStatus.uri ??
        recording.getURI() ??
        null;

      await resetAudioSessionForChat();

      if (shouldSend && uri && ms >= MIN_VOICE_MS) {
        onSendVoice?.(uri);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (shouldSend && intentSend && !cancelledBySlide && ms < MIN_VOICE_MS) {
          onVoiceNoteTooShort?.();
        }
      }
    } catch (err) {
      if (!isBenignRecordingStopError(err)) {
        console.warn('Failed to stop recording', err);
      }
      await resetAudioSessionForChat().catch(() => {});
    }
  };

  const onMicTouchStart = (pageX: number, pageY: number) => {
    touchStartRef.current = { x: pageX, y: pageY };
  };

  const onMicTouchMove = (pageX: number, pageY: number) => {
    if (!isRecordingActive || isTyping) return;
    applyTouchGesture(pageX, pageY);
  };

  const handleOpenCamera = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sessionRef.current !== 'idle') {
      await stopRecording(false);
    }
    await resetAudioSessionForChat();
    onOpenCamera();
  };

  const durationSeconds = Math.floor(durationMs / 1000);
  const durationLabel = formatVoiceSeconds(durationSeconds);

  /** Same footprint as the text composer — fully opaque (no alpha) in both themes. */
  const bubbleStyle = {
    backgroundColor: isDark ? '#2A2A2C' : '#E5E5EA',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    borderRadius: 24,
  };

  const micA11y = micButtonAccessibility({
    isTyping,
    isRecordingActive,
  });

  /** Waveform tint to match message text in the composer bubble (not iMessage-blue). */
  const recordingWaveTint = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.32)';

  const waveHeights = useMemo(
    () => heightsFromMeter(meterNorm, durationMs),
    [meterNorm, durationMs],
  );

  if (composerReadOnly && !isRecordingActive) {
    return (
      <View>
        <View
          style={{ paddingBottom: bottomPadding, paddingHorizontal: 12 }}
          className="bg-transparent pt-2"
        >
          <View
            className="rounded-3xl border border-border/50 bg-muted/25 px-4 py-3.5"
            accessibilityRole="text"
            accessibilityLabel={composerReadOnlyMessage}
          >
            <Text className="text-center text-[15px] leading-5 text-muted-foreground">
              {composerReadOnlyMessage}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View
        style={{ paddingBottom: bottomPadding, paddingHorizontal: 12 }}
        className="bg-transparent pt-2"
      >
        <View className="flex-row items-end">
          <View
            style={[bubbleStyle, styles.composerRow]}
            className="flex-1 flex-row overflow-hidden z-10"
          >
          {!isTyping && !isRecordingActive ? (
            <View style={styles.sideSlot}>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsTrayVisible(!isTrayVisible);
                }}
                className="rounded-full active:bg-black/5 dark:active:bg-white/10"
                style={styles.sideIconButton}
              >
                <Ionicons name="add" size={28} color={accent} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composerCenter} className="justify-center">
            {isRecordingActive ? (
              <View
                className="min-w-0 flex-1 justify-center"
                accessibilityLiveRegion="polite"
                accessibilityLabel={recordingStripAccessibilityLabel({
                  slideCancel,
                  durationLabel,
                })}
              >
                <Pressable
                  onPress={() => void stopRecording(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                  style={styles.recordingTrashCorner}
                  accessibilityLabel="Cancel voice recording"
                  accessibilityHint="Stops recording without sending"
                >
                  <Trash2 size={20} color="#EF4444" strokeWidth={2.25} />
                </Pressable>
                <View
                  className="flex-1 flex-row items-center"
                  style={{
                    marginLeft: 38,
                    marginRight: 4,
                    paddingTop: Platform.OS === 'ios' ? 10 : 8,
                    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
                  }}
                  onTouchStart={(e) => {
                    const { pageX, pageY } = e.nativeEvent;
                    onMicTouchStart(pageX, pageY);
                  }}
                  onTouchMove={(e) => {
                    const { pageX, pageY } = e.nativeEvent;
                    onMicTouchMove(pageX, pageY);
                  }}
                >
                  <View className="min-w-0 flex-1 justify-center px-1">
                    <VoiceWaveformBars
                      heights={waveHeights}
                      mode="recording"
                      meterNorm={meterNorm}
                      slideCancel={slideCancel}
                      compact
                      recordingTint={recordingWaveTint}
                    />
                  </View>
                  <View className="shrink-0 justify-center pl-1 pr-0.5">
                    <Text
                      className="text-[17px] tabular-nums text-foreground"
                      numberOfLines={1}
                      style={{ lineHeight: 22 }}
                    >
                      {durationLabel}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <TextInput
                style={[
                  {
                    paddingTop: Platform.OS === 'ios' ? 10 : 8,
                    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
                    textAlignVertical: 'center',
                    lineHeight: 22,
                    paddingLeft: isTyping ? 10 : 4,
                  },
                ]}
                className="text-[17px] text-foreground max-h-32 px-1"
                placeholder="Message"
                placeholderTextColor="#8E8E93"
                multiline
                value={text}
                onChangeText={setText}
              />
            )}
          </View>

          <View style={styles.trailingActions} className="flex-row items-end">
            {!isTyping && !isRecordingActive ? (
              <View style={styles.sideSlot}>
                <Pressable
                  onPress={handleOpenCamera}
                  className="rounded-full active:bg-black/5 dark:active:bg-white/10"
                  style={styles.sideIconButton}
                >
                  <Ionicons name="camera" size={26} color={accent} />
                </Pressable>
              </View>
            ) : null}
            <View style={[styles.micWrap, { marginLeft: isTyping ? 6 : 0 }]}>
              <Pressable
                onPress={() => {
                  if (isTyping) {
                    const t = text.trim();
                    if (t) {
                      onSendText?.(t);
                      setText('');
                      // Lock the mic for 500ms so a rapid double-tap doesn't start recording logic.
                      suppressMicSendUntilRef.current = Date.now() + 500;
                    }
                    return;
                  }
                  if (Date.now() < suppressMicSendUntilRef.current) return;
                  if (isRecordingActive && slideCancel) return;
                  if (!isRecordingActive) {
                    void startRecording();
                    return;
                  }
                  void stopRecording(true);
                }}
                onTouchStart={(e) => {
                  const { pageX, pageY } = e.nativeEvent;
                  onMicTouchStart(pageX, pageY);
                }}
                onTouchMove={(e) => {
                  const { pageX, pageY } = e.nativeEvent;
                  onMicTouchMove(pageX, pageY);
                }}
                accessibilityLabel={micA11y.label}
                accessibilityHint={micA11y.hint}
                hitSlop={
                  isRecordingActive && !isTyping
                    ? { top: 16, bottom: 16, left: 16, right: 16 }
                    : { top: 10, bottom: 10, left: 10, right: 10 }
                }
                style={[
                  styles.micButton,
                  {
                    backgroundColor:
                      isTyping || isRecordingActive ? accent : 'transparent',
                    paddingHorizontal: isTyping || isRecordingActive ? 16 : 0,
                    minWidth: isTyping || isRecordingActive ? 48 : MIC_HIT,
                    opacity: isRecordingActive && slideCancel ? 0.45 : 1,
                  },
                ]}
                className="justify-center items-center rounded-full"
              >
                <View
                  style={{
                    transform: [
                      { rotate: isTyping || isRecordingActive ? '-35deg' : '0deg' },
                    ],
                    paddingLeft: isTyping || isRecordingActive ? 2 : 0,
                  }}
                >
                  <Ionicons
                    name={isTyping || isRecordingActive ? 'send' : 'mic'}
                    size={isTyping || isRecordingActive ? 18 : 26}
                    color={isTyping || isRecordingActive ? '#FFFFFF' : accent}
                  />
                </View>
              </Pressable>
            </View>
          </View>
        </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  recordingTrashCorner: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 36,
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composerRow: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  sideSlot: {
    width: SIDE_ICON,
    height: MIC_HIT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideIconButton: {
    width: SIDE_ICON,
    height: SIDE_ICON,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composerCenter: {
    flex: 1,
    minWidth: 0,
    minHeight: MIC_HIT,
    position: 'relative',
    justifyContent: 'center',
  },
  trailingActions: {
    gap: 2,
    zIndex: 30,
    elevation: 30,
  },
  micWrap: {
    height: MIC_HIT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 31,
    elevation: 31,
  },
  micButton: {
    height: MIC_HIT,
    borderRadius: MIC_HIT / 2,
  },
});
