import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/button';
import { setOnboarded, setLoggedIn } from '../../lib/auth-mock';

const { width } = Dimensions.get('window');

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = resendTimer > 0 && setInterval(() => setResendTimer(resendTimer - 1), 1000);
    return () => { if (timer) clearInterval(timer); };
  }, [resendTimer]);

  const handleVerify = async (finalCode?: string) => {
    const codeToVerify = finalCode || code;
    if (codeToVerify.length < 6) return;
    
    setIsLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    setTimeout(async () => {
      setIsLoading(false);
      setLoggedIn(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/chats');
    }, 1500);
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const isFocused = code.length === i;
      const digit = code[i] || '';
      boxes.push(
        <Pressable 
          key={i}
          onPress={() => inputRef.current?.focus()}
          style={[
            styles.otpBox,
            isFocused && styles.otpBoxFocused,
            digit !== '' && styles.otpBoxFilled
          ]}
        >
          <Text style={[styles.otpText, isFocused && styles.otpTextFocused]}>
            {digit}
          </Text>
        </Pressable>
      );
    }
    return boxes;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingTop: insets.top + 12 }} className="px-6 flex-1">
          {/* System Back Button */}
          <View className="flex-row items-center -ml-2 mb-4">
            <Pressable 
              onPress={() => router.back()}
              className="p-2"
            >
              <Ionicons name="chevron-back" size={28} color="#FF6B00" />
            </Pressable>
          </View>

          <View className="mt-8 items-center">
            <Image 
              source={require('../../assets/images/logo.png')}
              style={{ width: 100, height: 100 }}
              className="rounded-3xl shadow-xl shadow-primary/10"
            />
            <Text className="mt-6 text-[36px] font-inter-bold text-foreground text-center lowercase tracking-tighter">
              verify it's you
            </Text>
            <Text className="mt-2 text-[15px] font-inter-medium text-muted-foreground text-center lowercase opacity-50">
              code sent to <Text className="text-primary font-inter-semibold">+63 {phone}</Text>
            </Text>
          </View>

          {/* 6-Digit OTP Boxes */}
          <View className="mt-12 items-center">
            <View className="flex-row justify-between w-full px-2">
              {renderOtpBoxes()}
            </View>

            {/* Hidden Input for Keyboard */}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(val) => {
                const cleanVal = val.replace(/[^0-9]/g, '');
                if (cleanVal.length <= 6) {
                  setCode(cleanVal);
                  if (cleanVal.length === 6) handleVerify(cleanVal);
                }
              }}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.hiddenInput}
              autoFocus
            />
            
            {/* Clerk-Style Indigo Resend Timer */}
            <View className="mt-10 items-center">
              <Pressable 
                disabled={resendTimer > 0}
                onPress={() => {
                  setResendTimer(30);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text className={`text-[15px] font-inter-semibold text-center ${resendTimer > 0 ? 'text-[#FF6B00]/50' : 'text-[#FF6B00]'}`}>
                  {resendTimer > 0 
                    ? `didn't receive a code? resend (${resendTimer})` 
                    : "didn't receive a code? resend now"
                  }
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="flex-1" />

          <View style={{ paddingBottom: insets.bottom + 60 }} className="mt-8">
            <Button
              onPress={() => handleVerify()}
              disabled={code.length < 6 || isLoading}
              className="w-full h-15 rounded-2xl shadow-xl shadow-primary/30 bg-primary"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-[18px] font-inter-semibold lowercase">
                  verify
                </Text>
              )}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  otpBox: {
    width: (width - 80) / 6,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(0,0,0,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: '#FF6B00',
    backgroundColor: 'rgba(255,107,0,0.02)',
  },
  otpBoxFilled: {
    borderColor: 'rgba(255,107,0,0.3)',
  },
  otpText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#000',
  },
  otpTextFocused: {
    color: '#FF6B00',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
