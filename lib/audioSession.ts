import { ensureExpoAvLoaded, isExpoAvLoaded } from "@/lib/ensureExpoAv";

/**
 * Neutral session after recording or camera so mic/playback behave predictably.
 * Uses expo-av only — same stack as CameraOverlay and voice notes (avoids fighting expo-audio).
 * No-ops if expo-av was never loaded (e.g. text-only chat visit).
 */
export async function resetAudioSessionForChat(): Promise<void> {
  if (!isExpoAvLoaded()) return;
  try {
    const { Audio } = await ensureExpoAvLoaded();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  } catch {
    // Session may already match; ignore.
  }
}
