import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/button';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (phoneNumber.length < 8) return;
    
    setIsLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: phoneNumber }
      });
    }, 1500);
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
              welcome to <Text className="text-primary">konekta</Text>
            </Text>
          </View>

          <View className="mt-12">
            <View className="flex-row items-center bg-muted/10 h-16 rounded-2xl px-5 border border-border/10 focus-within:border-primary/50">
              <Text className="text-[18px] font-inter-bold text-primary mr-3">
                +63
              </Text>
              <TextInput
                className="flex-1 h-full text-[18px] font-inter-semibold text-foreground"
                placeholder="000 000 0000"
                placeholderTextColor="#A1A1AA"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                selectionColor="#FF6B00"
                maxLength={11}
              />
            </View>
            
            <Text className="mt-6 text-[13px] text-muted-foreground/50 text-center px-4 leading-5 lowercase font-inter-medium">
              {"by continuing, you agree to our terms of service and privacy policy. we'll send a verification code via sms."}
            </Text>
          </View>

          <View className="flex-1" />

          <View style={{ paddingBottom: insets.bottom + 60 }} className="mt-8">
            <Button
              onPress={handleSendCode}
              disabled={phoneNumber.length < 8 || isLoading}
              className="w-full h-15 rounded-2xl shadow-xl shadow-primary/30 bg-primary"
            >
              {isLoading ? (
                <View style={{ height: 27, width: 27, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              ) : (
                <Text className="text-white text-[18px] font-inter-semibold lowercase">
                  continue
                </Text>
              )}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
