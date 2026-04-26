import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

const DOT_SIZE = 6;
const BOUNCE_HEIGHT = -6;
const ANIMATION_DURATION = 350;

export const TypingIndicator = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const config = { duration: ANIMATION_DURATION };
    const createBouncingDot = (sv: typeof dot1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(BOUNCE_HEIGHT, config),
            withTiming(0, config),
            withTiming(0, { duration: ANIMATION_DURATION * 1.5 })
          ),
          -1,
          false
        )
      );
    };

    createBouncingDot(dot1, 0);
    createBouncingDot(dot2, 150);
    createBouncingDot(dot3, 300);
  }, [dot1, dot2, dot3]);

  const style1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <Animated.View 
      entering={FadeIn.duration(150)} 
      exiting={FadeOut.duration(150)}
      className="flex-row items-end my-2 px-3 pl-4"
    >
      <View 
        className={`rounded-2xl flex-row items-center justify-center gap-1.5 ${isDark ? 'bg-[#2C2C2E]' : 'bg-[#E9E9EB]'}`}
        style={{ borderBottomLeftRadius: 4, width: 64, height: 36 }}
      >
        <Animated.View style={[styles.dot, { backgroundColor: isDark ? '#A1A1AA' : '#8E8E93' }, style1]} />
        <Animated.View style={[styles.dot, { backgroundColor: isDark ? '#A1A1AA' : '#8E8E93' }, style2]} />
        <Animated.View style={[styles.dot, { backgroundColor: isDark ? '#A1A1AA' : '#8E8E93' }, style3]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  }
});
