/**
 * expo-av may throw when stopping a recording that never received samples
 * (very quick tap, immediate discard, or OS race).
 */
export function isBenignRecordingStopError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /no valid audio|valid audio data has been received|no data received/i.test(
    msg,
  );
}
