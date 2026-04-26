/** Shared voice note waveform math — recording + playback use the same bar count and blue. */

export const VOICE_WAVE_BAR_COUNT = 24;
export const VOICE_WAVE_BLUE = '#3B82F6';
export const VOICE_WAVE_RED = '#EF4444';

/** Live recording: heights from mic metering + subtle motion. */
export function heightsFromMeter(meterNorm: number, durationMs: number): number[] {
  const n = Math.min(1, Math.max(0.08, meterNorm));
  return Array.from({ length: VOICE_WAVE_BAR_COUNT }, (_, i) => {
    const phase = Math.sin((i / VOICE_WAVE_BAR_COUNT) * Math.PI * 2 + durationMs / 200) * 0.35 + 0.65;
    return 4 + n * phase * 20;
  });
}

/** Playback: stable fake waveform per file (no decode). Same length as recording. */
export function heightsFromUri(uri: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < uri.length; i++) {
    h ^= uri.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < VOICE_WAVE_BAR_COUNT; i++) {
    h ^= i * 73856093;
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    const t = ((h >>> 0) % 1000) / 1000;
    out.push(4 + t * 20);
  }
  return out;
}
