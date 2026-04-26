/** Small layout helpers for the chat recording strip (ChatInput). */

export function recordingSlideCancelBorder(
  slideCancel: boolean,
): Record<string, string | number> {
  if (!slideCancel) return {};
  return { borderLeftWidth: 3, borderLeftColor: '#EF4444' };
}

export function recordingStripElevation(isDark: boolean) {
  return {
    shadowOpacity: isDark ? 0.06 : 0.12,
    shadowRadius: isDark ? 5 : 8,
    elevation: isDark ? 2 : 6,
  };
}

export function recordingStripAccessibilityLabel(params: {
  slideCancel: boolean;
  durationLabel: string;
}): string {
  const { slideCancel, durationLabel } = params;
  if (slideCancel) {
    return `Cancelling, ${durationLabel}. Tap trash to cancel, or move finger back and tap send.`;
  }
  return `Recording, ${durationLabel}. Tap send to finish, tap trash to cancel, or swipe left on the bar to cancel.`;
}

export function micButtonAccessibility(params: {
  isTyping: boolean;
  isRecordingActive: boolean;
}): { label: string; hint?: string } {
  const { isTyping, isRecordingActive } = params;
  if (isTyping) {
    return { label: 'Send message' };
  }
  if (isRecordingActive) {
    return {
      label: 'Send voice message',
      hint: 'Tap to send. Tap trash to cancel, or swipe left on the waveform to cancel.',
    };
  }
  return {
    label: 'Start voice recording',
    hint: 'Tap to start recording.',
  };
}
