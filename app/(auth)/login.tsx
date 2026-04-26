import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
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
      className="flex-1 bg-background"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingTop: insets.top + 20 }} className="px-6 flex-1">
          <Pressable 
            onPress={() => router.back()}
            className="size-10 items-center justify-center rounded-full bg-muted/20"
          >
            <ChevronLeft size={24} color="#FF6B00" />
          </Pressable>

          <View className="mt-12 items-center">
            <Image 
              source={require('../../assets/images/logo.png')}
              className="size-24 rounded-3xl shadow-xl"
            />
            <Text className="mt-8 text-[34px] font-inter-bold text-foreground text-center lowercase tracking-tighter">
              welcome to <Text className="text-primary">konekta</Text>
            </Text>
            <Text className="mt-2 text-[17px] font-inter-medium text-muted-foreground text-center lowercase">
              enter your mobile number to get started
            </Text>
          </View>

          <View className="mt-12">
            <View className="flex-row items-center bg-muted/20 h-16 rounded-2xl px-4 border border-border/10 focus-within:border-primary">
              <Text className="text-lg font-inter-semibold text-foreground pr-3 border-r border-border/20">
                +63
              </Text>
              <TextInput
                className="flex-1 h-full ml-3 text-lg font-inter-medium text-foreground"
                placeholder="000 000 0000"
                placeholderTextColor="#A1A1AA"
                keyboardType="phone-pad"
                autoFocus
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                selectionColor="#FF6B00"
                maxLength={11}
              />
            </View>
            
            <Text className="mt-4 text-[13px] text-muted-foreground text-center px-4 leading-5 lowercase">
              {"by continuing, you agree to our terms of service and privacy policy. we'll send a verification code via sms."}
            </Text>
          </View>

          <View className="flex-1" />

          <View style={{ paddingBottom: insets.bottom + 40 }} className="mt-8">
            <Button
              onPress={handleSendCode}
              disabled={phoneNumber.length < 8 || isLoading}
              className="w-full rounded-2xl bg-primary"
            >
              {isLoading ? (
                <View style={{ height: 27, width: 27, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="white" />
                </View>
              ) : (
                <Text className="text-primary-foreground text-lg font-inter-bold lowercase">
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
