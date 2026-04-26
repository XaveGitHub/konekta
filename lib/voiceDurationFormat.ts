/** Shared voice UI: recording strip, playback row, accessibility. */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Seconds from 0 — used by recording UI (integer seconds). */
export function formatVoiceSeconds(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${pad2(m)}:${pad2(s)}`;
  }
  return `${m}:${pad2(s)}`;
}

/** Milliseconds (playback / status updates). */
export function formatVoiceMs(ms: number): string {
  return formatVoiceSeconds(Math.floor(Math.max(0, ms) / 1000));
}

/** Minimum width (dp) so time column fits longest common label without crushing the waveform. */
export function voiceTimeColumnMinWidth(): number {
  return 72;
}
