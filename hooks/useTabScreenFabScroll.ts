import { useCallback, useRef } from "react";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";

const TOP_SHOW_THRESHOLD = 20;
const DIRECTION_THRESHOLD = 10;
/** Total downward slide (px); motion continues invisibly after opacity is 0. */
export const TAB_FAB_SCROLL_HIDE_TRANSLATE = 96;
/**
 * Opacity reaches 0 at this translateY so the FAB vanishes before overlapping
 * the floating tab bar; slide can continue to {@link TAB_FAB_SCROLL_HIDE_TRANSLATE}.
 */
export const TAB_FAB_SCROLL_FADE_OUT_BY_TRANSLATE = 44;
const TIMING = { duration: 220 };

/**
 * Telegram-style FAB: hide when scrolling down, show at top or when scrolling up.
 * Keeps FAB visible when the list does not scroll.
 */
export function useTabScreenFabScroll() {
  const scrollTranslateY = useSharedValue(0);
  const lastY = useRef(0);
  const layoutH = useRef(0);
  const contentH = useRef(0);

  const isScrollable = useCallback(
    () => contentH.current > layoutH.current + 8,
    [],
  );

  const ensureVisibleIfNotScrollable = useCallback(() => {
    if (!isScrollable()) {
      scrollTranslateY.value = withTiming(0, TIMING);
    }
  }, [isScrollable, scrollTranslateY]);

  const onListLayout = useCallback(
    (e: LayoutChangeEvent) => {
      layoutH.current = e.nativeEvent.layout.height;
      ensureVisibleIfNotScrollable();
    },
    [ensureVisibleIfNotScrollable],
  );

  const onContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentH.current = h;
      ensureVisibleIfNotScrollable();
    },
    [ensureVisibleIfNotScrollable],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isScrollable()) {
        scrollTranslateY.value = withTiming(0, TIMING);
        return;
      }
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastY.current;
      lastY.current = y;

      if (y <= TOP_SHOW_THRESHOLD) {
        scrollTranslateY.value = withTiming(0, TIMING);
        return;
      }
      if (dy > DIRECTION_THRESHOLD) {
        scrollTranslateY.value = withTiming(TAB_FAB_SCROLL_HIDE_TRANSLATE, TIMING);
      } else if (dy < -DIRECTION_THRESHOLD) {
        scrollTranslateY.value = withTiming(0, TIMING);
      }
    },
    [isScrollable, scrollTranslateY],
  );

  const resetScrollFab = useCallback(() => {
    lastY.current = 0;
    scrollTranslateY.value = withTiming(0, TIMING);
  }, [scrollTranslateY]);

  return {
    onScroll,
    onListLayout,
    onContentSizeChange,
    scrollTranslateY,
    resetScrollFab,
  };
}
