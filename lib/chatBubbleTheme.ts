/**
 * Chat bubble fills — Signal/Messenger-style neutrals (no saturated primary on body).
 * Tail triangles must use the same hex as the bubble they attach to.
 */
export const chatBubbleTheme = {
  light: {
    incoming: "#F4F4F5", // Neutral page surface
    outgoing: "#FFF0E6", // Very soft orange tint
  },
  dark: {
    incoming: "#27272A", // zinc-800
    outgoing: "#3F3F46", // zinc-700
  },
} as const;

export function chatBubbleBackground(isDark: boolean, isMe: boolean): string {
  const t = isDark ? chatBubbleTheme.dark : chatBubbleTheme.light;
  return isMe ? t.outgoing : t.incoming;
}
