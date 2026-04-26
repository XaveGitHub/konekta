import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState, useMemo } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Check, 
  Zap,
} from "lucide-react-native";
import { useChat } from "@/context/ChatContext";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { useColorScheme } from "nativewind";
import { THEME, appAccentHex } from "@/lib/theme";

type PlanId = "free" | "plus" | "pro";
type BillingCycle = "monthly" | "annual";

interface Tier {
    id: PlanId;
    name: string;
    tagline: string;
    price: string;
    cycle: string;
    details: string;
    features: string[];
}

export default function SubscriptionsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { currentUserProfile, updateCurrentUserProfile, showToast } = useChat();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const tint = THEME[isDark ? "dark" : "light"].primary;
  const bgColor = THEME[isDark ? "dark" : "light"].background;
  const borderColor = THEME[isDark ? "dark" : "light"].border;
  
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");

  const currentTier = currentUserProfile.subscriptionTier || "free";

  const tiers: Tier[] = useMemo(() => [
    {
      id: "plus",
      name: "konekta plus",
      tagline: "enhanced features for power users.",
      price: billingCycle === 'annual' ? "$2.49" : "$2.99",
      cycle: "/ month",
      details: billingCycle === 'annual' ? "billed annually ($29.88)" : "billed monthly",
      features: [
        "reduced ads (1 per 25 items)",
        "enhanced custom status",
        "2gb file upload limit",
        "premium profile badges",
        "advanced chat folders"
      ]
    },
    {
      id: "pro",
      name: "konekta pro",
      tagline: "unlock the ultimate feature set.",
      price: billingCycle === 'annual' ? "$7.99" : "$9.99",
      cycle: "/ month",
      details: billingCycle === 'annual' ? "billed annually ($95.88)" : "billed monthly",
      features: [
        "completely ad-free experience",
        "everything in plus",
        "unlimited channels & broadcasts",
        "10gb cloud vault storage",
        "hd voice & video calls",
        "exclusive 'elite' app icons"
      ]
    }
  ], [billingCycle]);

  const handleSubscribe = (tier: Tier) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    updateCurrentUserProfile({ subscriptionTier: tier.id });
    showToast({ message: `activated ${tier.name}` });
    router.back();
  };

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => ({
    backgroundColor: bgColor,
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
    opacity: interpolate(scrollY.value, [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

  const pickerStyles = useMemo(() => StyleSheet.create({
    track: {
      flexDirection: "row",
      height: 40,
      borderRadius: 10,
      backgroundColor: isDark ? "#1C1C1E" : "#f4f4f5",
      padding: 3,
      marginHorizontal: 32,
      marginBottom: 32,
    },
    tab: {
      flex: 1,
      height: "100%",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    tabActive: {
      backgroundColor: isDark ? "#3A3A3C" : "#ffffff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    label: {
      fontSize: 13,
      fontFamily: "Inter-SemiBold",
      textTransform: "lowercase",
    },
  }), [isDark]);

  return (
    <View className="flex-1 bg-background">
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: insets.top + 70 }}
      >
        {/* Spacer for the fixed header */}
        <View style={{ height: 20 }} />

        {/* --- BILLING SELECTOR --- */}
        <View style={pickerStyles.track}>
           <Pressable 
             onPress={() => setBillingCycle("monthly")}
             style={[pickerStyles.tab, billingCycle === "monthly" && pickerStyles.tabActive]}
           >
              <Text style={pickerStyles.label} className={billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}>Monthly</Text>
           </Pressable>
           <Pressable 
             onPress={() => setBillingCycle("annual")}
             style={[pickerStyles.tab, billingCycle === "annual" && pickerStyles.tabActive]}
           >
               <View className="flex-row items-center gap-1.5">
                  <Text style={pickerStyles.label} className={billingCycle === "annual" ? "text-foreground" : "text-muted-foreground"}>Yearly</Text>
               </View>
           </Pressable>
        </View>

        {/* --- SYSTEM MONITOR (SIGNAL USAGE UI) --- */}
        <View className="mx-6 mb-12">
            <Text variant="sectionLabel" className="ml-3 mb-3">resource monitor</Text>
            <View className="rounded-[16px] border border-border bg-card p-6 shadow-sm">
                <View className="flex-row items-center justify-between mb-8">
                    <View className="flex-row items-center gap-4">
                        <View className="w-1.5 h-7 rounded-full bg-primary" />
                        <View>
                           <Text className="text-xl font-inter-bold text-foreground lowercase">konekta {currentTier}</Text>
                           <Text className="text-[12px] font-inter-medium text-muted-foreground lowercase">your current active subscription</Text>
                        </View>
                    </View>
                </View>

                <View className="gap-8">
                    {/* Storage Metric */}
                    <View>
                        <View className="flex-row justify-between mb-3">
                             <Text className="text-[14px] font-inter-semibold text-foreground lowercase">encrypted storage</Text>
                             <Text className="text-[14px] font-inter-bold text-primary lowercase">42% used</Text>
                        </View>
                        <View className="h-1.5 w-full rounded-full bg-muted">
                            <View style={{ width: "42%" }} className="h-full rounded-full bg-primary" />
                        </View>
                        <View className="flex-row justify-between mt-2.5">
                           <Text className="text-[11px] font-inter-medium text-tertiary-foreground">420 MB used</Text>
                           <Text className="text-[11px] font-inter-medium text-tertiary-foreground">{currentTier === 'pro' ? '20 GB Limit' : '10 GB Limit'}</Text>
                        </View>
                    </View>

                    <View className="w-full h-px bg-border" />

                    {/* Calling Metric */}
                    <View>
                        <View className="flex-row justify-between mb-3">
                             <Text className="text-[14px] font-inter-semibold text-foreground lowercase">calling voice minutes</Text>
                             <Text className="text-[14px] font-inter-bold text-brand-aqua lowercase">3 <Text className="font-inter-medium text-muted-foreground">/ {currentTier === 'pro' ? '∞' : '120'}</Text></Text>
                        </View>
                        <View className="h-1.5 w-full rounded-full bg-muted">
                            <View style={{ width: "15%" }} className="h-full rounded-full bg-brand-aqua" />
                        </View>
                    </View>
                </View>
            </View>
        </View>

        {/* --- SUBSCRIPTION OFFERS (CLEAN TILES) --- */}
        <View className="px-6 pb-20">
            <Text variant="sectionLabel" className="ml-3 mb-3">choose a plan</Text>
            
            {tiers.map((tier) => (
                <View 
                  key={tier.id}
                  className="mb-6 rounded-[20px] border border-border bg-card p-8 shadow-sm"
                >
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 pr-4">
                            <Text className="text-[24px] font-inter-bold text-foreground">{tier.name}</Text>
                            <Text className="text-[14px] font-inter-medium mt-1 leading-5 text-muted-foreground">{tier.tagline}</Text>
                        </View>
                        <View className="p-2.5 rounded-xl bg-primary">
                            <Zap size={20} color="white" fill="white" />
                        </View>
                    </View>

                    <View className="flex-row items-baseline mt-6 mb-6">
                        <Text className="text-[34px] font-inter-bold text-foreground">{tier.price}</Text>
                        <Text className="text-[14px] font-inter-medium ml-1 text-muted-foreground">{tier.cycle}</Text>
                    </View>

                    <View className="mb-8 gap-3">
                        {tier.features.map((feature, idx) => (
                            <View key={idx} className="flex-row items-center gap-3">
                                <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center">
                                    <Check size={12} color={appAccentHex(isDark)} strokeWidth={3} />
                                </View>
                                <Text className="text-[14px] font-inter-medium text-muted-foreground lowercase">{feature}</Text>
                            </View>
                        ))}
                    </View>

                    <Button 
                       onPress={() => handleSubscribe(tier)}
                       className={`w-full rounded-2xl ${tier.id === currentTier ? 'bg-muted opacity-50' : ''}`}
                       disabled={tier.id === currentTier}
                    >
                        <Text className={`font-inter-semibold lowercase ${tier.id === currentTier ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
                          {tier.id === currentTier ? 'current plan' : 'subscribe'}
                        </Text>
                    </Button>
                    
                    <Text className="text-center text-[12px] mt-4 font-inter-medium text-tertiary-foreground">{tier.details}</Text>
                </View>
            ))}

            <View className="mt-8 px-4">
               <View className="flex-row gap-3 mb-4">
                  <Check size={18} color={tint} />
                  <Text className="text-[14px] font-inter-medium flex-1 text-muted-foreground">By subscribing you support the continuous development of Konekta.</Text>
               </View>
               <View className="flex-row gap-3">
                  <Check size={18} color={tint} />
                  <Text className="text-[14px] font-inter-medium flex-1 text-muted-foreground">Recurring billing. Cancel anytime in App Store settings.</Text>
               </View>
            </View>
        </View>

      </Animated.ScrollView>

      <View 
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: Math.max(insets.top, 12), zIndex: 100, height: insets.top + 56 },
        ]}
        className="flex-row items-center px-5 bg-background border-b border-border/10"
      >
        <Pressable 
          onPress={() => router.back()} 
          className="p-2 -ml-2"
        >
          <Ionicons name="chevron-back" size={28} color={tint} />
        </Pressable>
        <Text className="ml-1 font-inter-bold text-3xl tracking-tighter text-primary lowercase">{currentTier}</Text>
      </View>
    </View>
  );
}
