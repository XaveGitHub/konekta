import { router } from "expo-router";

/**
 * First tap wins: navigate immediately to the first row tapped; ignore further
 * opens until cooldown (avoids a second person “taking over” the stack).
 */
const COOLDOWN_MS = 400;

let openInFlight = false;
let cooldownTimer: ReturnType<typeof setTimeout> | null = null;

export function openChatFromList(chatId: string) {
  if (openInFlight) return;
  openInFlight = true;
  router.push(`/chat/${chatId}`);
  if (cooldownTimer) clearTimeout(cooldownTimer);
  cooldownTimer = setTimeout(() => {
    openInFlight = false;
    cooldownTimer = null;
  }, COOLDOWN_MS);
}

/** Reset guard (e.g. search dismissed without opening). */
export function cancelPendingOpenChatFromList() {
  if (cooldownTimer) {
    clearTimeout(cooldownTimer);
    cooldownTimer = null;
  }
  openInFlight = false;
}
