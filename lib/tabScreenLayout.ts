import { Platform } from "react-native";
import type { ViewStyle } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";

/** Must stay in sync with `app/(tabs)/_layout.tsx` tab bar height. */
export const TAB_BAR_HEIGHT = 64;

export function tabBarBottomInset(insets: EdgeInsets): number {
  // Unifies the bottom spacing for both Tab Bar and Chat Input.
  // On iOS (insets.bottom ~34), this reduces the gap to tight 16px-22px above the screen edge.
  // On Android (insets.bottom ~0), it enforces a strict 16px bottom gap.
  return Platform.OS === 'ios' 
    ? Math.max(insets.bottom - 12, 16)
    : Math.max(insets.bottom + 8, 16);
}

/** FAB diameter on Chats / Contacts — keep in sync with Pressable size. */
export const TAB_SCREEN_FAB_SIZE = 52;
const FAB_GAP_ABOVE_TAB_BAR = 12;

/** Gap from top of floating tab bar to bottom edge of toast. */
const TOAST_MARGIN_ABOVE_TAB_BAR = 8;
/**
 * Approx. one-line toast height (padding + row). Used to lift FAB when toast is visible;
 * adjust if `Toast` layout changes.
 */
export const TAB_SCREEN_TOAST_BLOCK_HEIGHT = 54;
const FAB_GAP_ABOVE_TOAST = 10;

/** Distance from screen bottom to the FAB container’s bottom edge. */
export function tabScreenFabBottom(insets: EdgeInsets): number {
  return tabBarBottomInset(insets) + TAB_BAR_HEIGHT + FAB_GAP_ABOVE_TAB_BAR;
}

/** FAB bottom when a toast is shown — sits above the toast block. */
export function tabScreenFabBottomWithToast(insets: EdgeInsets): number {
  return (
    toastBottomOffsetTabScreen(insets) +
    TAB_SCREEN_TOAST_BLOCK_HEIGHT +
    FAB_GAP_ABOVE_TOAST
  );
}

/** List padding so the last row clears the FAB (including FAB lifted for toast). */
export function tabScreenListPaddingBottom(insets: EdgeInsets): number {
  return tabScreenFabBottomWithToast(insets) + TAB_SCREEN_FAB_SIZE + 20;
}

/** ~Tailwind `right-6`; use in style — Reanimated `Animated.View` + NativeWind often drops `right` when mixing `className` with `style`. */
const TAB_SCREEN_FAB_FROM_END = 24;

export function tabScreenFabHorizontalStyle(insets: EdgeInsets): ViewStyle {
  return {
    position: "absolute",
    right: Math.max(insets.right, TAB_SCREEN_FAB_FROM_END),
    zIndex: 50,
  };
}

/**
 * Static FAB position (no toast animation). Prefer `tabScreenFabHorizontalStyle` +
 * animated `bottom` when toast can show.
 */
export function tabScreenFabContainerStyle(insets: EdgeInsets): ViewStyle {
  return {
    ...tabScreenFabHorizontalStyle(insets),
    bottom: tabScreenFabBottom(insets),
  };
}

/** Toast sits just above the tab pill; FAB moves up separately when toast is visible. */
export function toastBottomOffsetTabScreen(insets: EdgeInsets): number {
  return tabBarBottomInset(insets) + TAB_BAR_HEIGHT + TOAST_MARGIN_ABOVE_TAB_BAR;
}

/** Toast on full-screen stack routes (no tab bar), e.g. Archived. */
export function toastBottomOffsetStackScreen(insets: EdgeInsets): number {
  return Math.max(insets.bottom + 24, 36);
}
