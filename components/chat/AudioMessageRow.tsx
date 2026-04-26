import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, Pressable, StyleSheet, LayoutChangeEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AVPlaybackStatus } from "expo-av";
import type { Sound } from "expo-av/build/Audio/Sound";
import { Text } from "@/components/ui/text";
import { ensureExpoAvLoaded } from "@/lib/ensureExpoAv";
import { resetAudioSessionForChat } from "@/lib/audioSession";
import { formatVoiceMs, voiceTimeColumnMinWidth } from "@/lib/voiceDurationFormat";
import { heightsFromUri } from "@/lib/voiceWaveform";
import { VoiceWaveformBars } from "@/components/chat/VoiceWaveformBars";

type Props = {
  uri: string;
  isMe: boolean;
  /** When set, caps width to match text/media bubbles and avoids over-wide voice rows. */
  maxContentWidth?: number;
};

const TIME_COL_W = voiceTimeColumnMinWidth();

export function AudioMessageRow({ uri, isMe, maxContentWidth }: Props) {
  const heights = useMemo(() => heightsFromUri(uri), [uri]);
  const [sound, setSound] = useState<Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(1);
  const waveWidthRef = useRef(1);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPlaying(status.isPlaying);
    setPositionMs(status.positionMillis ?? 0);
    setDurationMs(status.durationMillis ?? status.positionMillis ?? 1);
    if (status.didJustFinish) {
      setPositionMs(0);
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let snd: Sound | null = null;

    (async () => {
      try {
        const { Audio } = await ensureExpoAvLoaded();
        await resetAudioSessionForChat();
        const { sound: s } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          onStatus,
        );
        if (!active) {
          await s.unloadAsync();
          return;
        }
        snd = s;
        setSound(s);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      active = false;
      void snd?.unloadAsync();
    };
  }, [uri, onStatus]);

  const toggle = async () => {
    if (!sound) return;
    try {
      if (playing) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch {
      /* ignore */
    }
  };

  const progress =
    durationMs > 0 ? Math.min(1, Math.max(0, positionMs / durationMs)) : 0;

  const seekFromX = async (x: number) => {
    if (!sound || durationMs <= 0) return;
    const w = waveWidthRef.current;
    if (w <= 0) return;
    const p = Math.min(1, Math.max(0, x / w));
    try {
      await sound.setPositionAsync(Math.floor(p * durationMs));
    } catch {
      /* ignore */
    }
  };

  const onWaveLayout = (e: LayoutChangeEvent) => {
    waveWidthRef.current = e.nativeEvent.layout.width;
  };

  const subText = "text-muted-foreground";
  const timeStrong = "text-foreground";
  const remainingMs = Math.max(0, durationMs - positionMs);
  const primaryTime = playing ? formatVoiceMs(remainingMs) : formatVoiceMs(durationMs);

  const wrapStyle = maxContentWidth
    ? [
        styles.wrap,
        {
          maxWidth: maxContentWidth,
          minWidth: Math.min(200, maxContentWidth),
          width: "100%" as const,
        },
      ]
    : styles.wrap;

  return (
    <View style={wrapStyle}>
      <View style={styles.row}>
        <Pressable
          style={styles.playBtn}
          className="bg-primary"
          onPress={toggle}
          accessibilityLabel={playing ? "Pause voice message" : "Play voice message"}
          hitSlop={8}
        >
          <Ionicons
            name={playing ? "pause" : "play"}
            size={22}
            color="#fff"
            style={playing ? undefined : { marginLeft: 2 }}
          />
        </Pressable>

        <Pressable
          style={styles.waveSlot}
          onLayout={onWaveLayout}
          onPress={(e) => void seekFromX(e.nativeEvent.locationX)}
          accessibilityLabel="Seek along voice message"
          accessibilityHint="Tap position on the waveform to jump playback"
          accessibilityRole="adjustable"
          hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
        >
          <VoiceWaveformBars
            heights={heights}
            mode="playback"
            progress={progress}
            isMe={isMe}
          />
        </Pressable>

        <View style={styles.timeCol}>
          <Text
            numberOfLines={1}
            className={`text-[15px] font-inter-semibold tabular-nums leading-tight ${timeStrong}`}
          >
            {primaryTime}
          </Text>
        </View>
      </View>

      {playing ? (
        <Text
          numberOfLines={1}
          className={`text-[11px] mt-1.5 ${subText}`}
        >
          {formatVoiceMs(positionMs)} / {formatVoiceMs(durationMs)}
        </Text>
      ) : (
        <Text className={`text-[11px] mt-1.5 ${subText}`}>Tap to seek</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    maxWidth: "100%",
    minWidth: 200,
    paddingVertical: 4,
    paddingRight: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  playBtn: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  waveSlot: {
    flex: 1,
    flexShrink: 1,
    minWidth: 52,
    minHeight: 36,
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  timeCol: {
    width: TIME_COL_W,
    minWidth: TIME_COL_W,
    maxWidth: TIME_COL_W,
    flexShrink: 0,
    flexGrow: 0,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingBottom: 4,
    paddingLeft: 2,
  },
});
