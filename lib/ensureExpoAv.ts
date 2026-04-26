/**
 * Single dynamic entry for expo-av. Avoids static imports on the chat route so
 * text-only threads do not pay native AV init until mic, voice playback, or
 * camera video recording needs the module.
 */
export type ExpoAvModule = typeof import("expo-av");

let cached: ExpoAvModule | null = null;
let inflight: Promise<ExpoAvModule> | null = null;

export function isExpoAvLoaded(): boolean {
  return cached !== null;
}

export function ensureExpoAvLoaded(): Promise<ExpoAvModule> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = import("expo-av").then((m) => {
      cached = m;
      inflight = null;
      return m;
    });
  }
  return inflight;
}
