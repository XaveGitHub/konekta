import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VOICE_WAVE_BAR_COUNT, VOICE_WAVE_BLUE, VOICE_WAVE_RED } from '@/lib/voiceWaveform';

type Mode = 'recording' | 'playback';

type Props = {
  heights: number[];
  mode: Mode;
  /** Recording: mic level 0–1 for bar opacity. */
  meterNorm?: number;
  slideCancel?: boolean;
  /** Playback: 0–1 how much is played (left → right); bars split played / unplayed. */
  progress?: number;
  /** Playback: outgoing (white) vs incoming (primary). */
  isMe?: boolean;
  /** Shorter bars / row — inline composer while recording. */
  compact?: boolean;
  /** Recording: bar color instead of default blue (e.g. match composer bubble). */
  recordingTint?: string;
};

/**
 * One visual system for voice: same bar count, gaps, and blue as the recording strip.
 * Recording: all bars “lit” with live opacity. Playback: left portion = played color.
 */
export function VoiceWaveformBars({
  heights,
  mode,
  meterNorm = 0.35,
  slideCancel = false,
  progress = 0,
  isMe = false,
  compact = false,
  recordingTint,
}: Props) {
  const barH = (h: number) =>
    compact ? Math.max(3, Math.round(h * 0.55)) : h;
  const activeIndex =
    mode === 'playback'
      ? Math.min(VOICE_WAVE_BAR_COUNT - 1, Math.floor(Math.min(1, Math.max(0, progress)) * VOICE_WAVE_BAR_COUNT))
      : -1;

  const baseColor = slideCancel
    ? VOICE_WAVE_RED
    : recordingTint ?? VOICE_WAVE_BLUE;

  const gapClass = compact ? 'gap-[3px] h-5' : 'gap-[3px] h-7';

  return (
    <View className={`flex-row items-end justify-between ${gapClass}`}>
      {heights.map((h, i) => {
        const hOut = barH(h);
        if (mode === 'recording') {
          const opacity = 0.4 + Math.min(1, Math.max(0, meterNorm)) * 0.6;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                { height: hOut, opacity, backgroundColor: baseColor },
              ]}
            />
          );
        }

        const played = i <= activeIndex;
        return (
          <View
            key={i}
            style={[styles.bar, { height: hOut }]}
            className={
              played
                ? isMe
                  ? 'bg-primary'
                  : 'bg-primary'
                : isMe
                  ? 'bg-foreground/22'
                  : 'bg-primary/25'
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flex: 1,
    maxWidth: 5,
    minWidth: 2,
    borderRadius: 2,
  },
});
