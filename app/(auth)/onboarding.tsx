import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { Button } from '../../components/ui/button';
import { setOnboarded } from '../../lib/auth-mock';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const logoGlow = useSharedValue(0);

  useEffect(() => {
    logoGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000 }),
        withTiming(0.6, { duration: 4000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoGlow.value,
  }));

  const handleContinue = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOnboarded(true);
    router.push('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-white">
      {/* Ultra-Minimal Background Accent */}
      <View className="absolute top-[-50px] left-[-50px] size-[300px] rounded-full bg-primary/5 blur-[100px]" />

      <View className="flex-1" />

      {/* Branding Block (Clean & Tight) */}
      <View className="items-center justify-center px-10 mb-12">
        <View className="items-center justify-center relative -mb-3">
          <Animated.View 
            style={[styles.logoAura, animatedLogoStyle]} 
            className="absolute size-44 rounded-full bg-primary/15 blur-3xl"
          />
          <Image 
            source={require('../../assets/images/logo.png')}
            style={{ width: 175, height: 175 }}
            className="rounded-[44px] shadow-2xl shadow-primary/10"
            contentFit="contain"
          />
        </View>
        
        <View className="items-center">
          {/* Forced text color to prevent white-on-white on iPhone Dark Mode */}
          <Text className="text-[62px] font-inter-bold text-[#121212] tracking-tighter leading-[62px] lowercase">
            konekta
          </Text>
          <Text className="text-[14px] font-inter-medium text-primary mt-1 lowercase opacity-50 tracking-[0.5px]">
            connect instantly. stay close.
          </Text>
        </View>
      </View>

      {/* Action Section with Stored "Slope" Waves */}
      <View className="relative w-full overflow-hidden" style={{ height: height * 0.45 }}>
        
        {/* Layered Sloped Curves */}
        <View className="absolute bottom-0 left-0 right-0 h-80">
           {/* Back Slope */}
           <View 
             style={{ width: width * 2, height: 400, borderRadius: 180, backgroundColor: '#FF8533', position: 'absolute', bottom: -120, left: -width * 0.5, opacity: 0.15, transform: [{ rotate: '12deg' }] }} 
           />
           {/* Middle Slope */}
           <View 
             style={{ width: width * 2.2, height: 420, borderRadius: 200, backgroundColor: '#FF6B00', position: 'absolute', bottom: -180, right: -width * 0.6, opacity: 0.25, transform: [{ rotate: '-8deg' }] }} 
           />
           {/* Front Main Slope */}
           <View 
             style={{ width: width * 2.5, height: 450, borderRadius: 220, backgroundColor: '#FF6B00', position: 'absolute', bottom: -240, left: -width * 0.3, transform: [{ rotate: '-4deg' }] }} 
           />
        </View>

        {/* The Action Button */}
        <View 
          style={{ paddingBottom: insets.bottom + 60 }} 
          className="px-10 items-center justify-end flex-1"
        >
          <Button
            onPress={handleContinue}
            className="w-full rounded-2xl shadow-xl shadow-primary/30 bg-primary"
          >
            <Text className="text-primary-foreground text-[19px] font-inter-semibold lowercase">
              continue
            </Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoAura: {
    zIndex: -1,
  },
});
