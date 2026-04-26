import { router } from "expo-router";

/**
 * Global navigation guard to prevent multiple screens from being pushed 
 * if the user taps an item multiple times rapidly.
 */
const COOLDOWN_MS = 700;

let navigationInFlight = false;
let cooldownTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Safely push a new path onto the navigation stack with a cooldown guard.
 */
export function safePush(path: string) {
  if (navigationInFlight) return;
  
  navigationInFlight = true;
  router.push(path as any);
  
  if (cooldownTimer) clearTimeout(cooldownTimer);
  cooldownTimer = setTimeout(() => {
    navigationInFlight = false;
    cooldownTimer = null;
  }, COOLDOWN_MS);
}

/**
 * Reset navigation guard if needed.
 */
export function resetNavigationGuard() {
  if (cooldownTimer) {
    clearTimeout(cooldownTimer);
    cooldownTimer = null;
  }
  navigationInFlight = false;
}
