import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SearchInput from "@/components/ui/SearchInput";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Portal } from "@rn-primitives/portal";
import * as Haptics from "expo-haptics";
import {
  Camera,
  Check,
  ChevronLeft,
  Globe,
  Lock,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardEvent,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  StyleSheet,
  BackHandler
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChat } from "@/context/ChatContext";
import { useContacts } from "@/context/ContactsContext";
import type { Contact } from "@/lib/mocks/contactsStore";
import { type Chat, type Message } from "@/lib/mocks/chatStore";

interface NewChannelSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (chatId: string) => void;
}

type Step = "info" | "type" | "subscribers";
type ChannelType = "public" | "private";

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function NewChannelSheet({
  open,
  onOpenChange,
  onCreated
}: NewChannelSheetProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { setChats, addMessage } = useChat();
  const { contacts } = useContacts();

  const [step, setStep] = useState<Step>("info");
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("public");
  const [handle, setHandle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard adjustment
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Back handler for steps
  useEffect(() => {
    if (!open) {
      setStep("info");
      setChannelName("");
      setDescription("");
      setHandle("");
      setSelectedIds(new Set());
      return;
    }
    const onBack = () => {
      if (step === "subscribers") { setStep("type"); return true; }
      if (step === "type") { setStep("info"); return true; }
      onOpenChange(false);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [open, step, onOpenChange]);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections = useMemo(() => {
    const groups: { [key: string]: Contact[] } = {};
    filteredContacts.forEach((c) => {
      const char = c.name[0].toUpperCase();
      if (!groups[char]) groups[char] = [];
      groups[char].push(c);
    });
    return Object.keys(groups)
      .sort()
      .map((char) => ({ title: char, data: groups[char] }));
  }, [filteredContacts]);

  const toggleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateChannel = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCreating(true);

    await new Promise((r) => setTimeout(r, 1000));

    const newChannelId = `chan-${Date.now()}`;
    const newChan: Chat = {
      id: newChannelId,
      title: channelName.trim(),
      lastMessage: "Channel created",
      lastMessageAt: "Just now",
      unreadCount: 0,
      isChannel: true,
      myRole: "admin",
      username: channelType === "public" ? handle.trim() : `invite-${newChannelId.slice(-6)}`,
      channelSubscriberCount: selectedIds.size + 1,
      groupDescription: description.trim(),
      avatarUrl: null,
    };

    setChats((prev) => [newChan, ...prev]);

    const msg: Message = {
      id: `sys-${Date.now()}`,
      chatId: newChannelId,
      senderId: "system",
      text: "Channel created",
      timestamp: "Just now",
      date: new Date().toISOString().split("T")[0],
      fullTimestamp: Math.floor(Date.now() / 1000),
      status: "sent",
      type: "system",
      isMe: false,
    };
    addMessage(newChannelId, msg);

    setIsCreating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onOpenChange(false);
    onCreated?.(newChannelId);
  };

  if (!open) return null;

  const bottomPadding = Math.max(insets.bottom, 24);

  return (
    <Portal name="new-channel">
      <View style={StyleSheet.absoluteFill} className="z-[999]">
        <Animated.View 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/30"
        >
          <Pressable className="flex-1" onPress={() => onOpenChange(false)} />
        </Animated.View>

        <Animated.View 
          style={{ 
            flex: 1, 
            justifyContent: 'flex-end',
            transform: [{ translateY: -keyboardHeight * 0.7 }] // Softer lift for taller sheet
          }}
          className="justify-end"
          pointerEvents="box-none"
        >
          <Animated.View 
            entering={SlideInDown.duration(300).easing(Easing.out(Easing.quad))}
            exiting={SlideOutDown.duration(250)}
            className="bg-background rounded-t-[36px] w-full border-t border-border/20 overflow-hidden"
            style={{
              height: SCREEN_HEIGHT * 0.88,
              paddingBottom: bottomPadding,
            }}
          >
            {/* Header */}
            <View className="px-6 pt-4 pb-4 flex-row items-center justify-between border-b border-border/5 bg-background">
               <View className="flex-row items-center gap-3">
                 {step !== 'info' && (
                   <Pressable 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setStep(step === 'subscribers' ? 'type' : 'info');
                    }}
                    className="p-2 -ml-2 rounded-full active:bg-muted/30"
                   >
                     <ChevronLeft size={24} color={isDark ? "white" : "black"} />
                   </Pressable>
                 )}
                 <Text className="text-xl font-inter-semibold text-foreground lowercase tracking-tight">
                    {step === 'info' ? 'new channel' : step === 'type' ? 'settings' : 'subscribers'}
                 </Text>
               </View>
               <Pressable 
                onPress={() => onOpenChange(false)}
                className="rounded-full bg-muted/30 p-2 active:bg-muted/50"
               >
                 <X size={20} color={isDark ? "#A1A1AA" : "#8E8E93"} />
               </Pressable>
            </View>

            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
              {step === 'info' && (
                <Animated.View entering={FadeIn} className="p-6">
                   <View className="items-center mb-8">
                     <View className="w-24 h-24 rounded-full bg-muted/20 items-center justify-center border-2 border-dashed border-border/20">
                        <Camera size={32} color={isDark ? "#52525B" : "#A1A1AA"} />
                     </View>
                     <Text className="text-[13px] font-inter-semibold text-primary mt-3 lowercase">Set photo</Text>
                   </View>

                   <View className="gap-6">
                      <View>
                        <Text className="mb-2 text-[13px] font-inter-medium lowercase text-muted-foreground ml-1">channel name</Text>
                        <Input 
                          value={channelName}
                          onChangeText={setChannelName}
                          placeholder="What is your channel called?"
                          className="h-14 rounded-2xl bg-muted/10 border-0 text-[17px] px-5"
                          autoFocus
                        />
                      </View>
                      <View>
                        <Text className="mb-2 text-[13px] font-inter-medium lowercase text-muted-foreground ml-1">description</Text>
                        <Textarea 
                          value={description}
                          onChangeText={setDescription}
                          placeholder="Tell us what this channel is about..."
                          className="min-h-[100px] rounded-2xl bg-muted/10 border-0 p-5 text-[16px]"
                        />
                      </View>
                   </View>
                </Animated.View>
              )}

              {step === 'type' && (
                <Animated.View entering={FadeIn} className="p-6 gap-4">
                   <Pressable 
                    onPress={() => setChannelType("public")}
                    className={`flex-row items-center p-5 rounded-[24px] border ${channelType === 'public' ? 'bg-primary/5 border-primary/40' : 'bg-muted/15 border-transparent'}`}
                   >
                     <View className={`w-12 h-12 rounded-2xl items-center justify-center ${channelType === 'public' ? 'bg-primary/20' : 'bg-muted/30'}`}>
                        <Globe size={24} color={channelType === 'public' ? "#3B82F6" : "#A1A1AA"} />
                     </View>
                     <View className="flex-1 ml-4">
                        <Text className="text-[17px] font-inter-semibold text-foreground lowercase">public</Text>
                        <Text className="text-[13px] text-muted-foreground lowercase mt-0.5">Anyone can find and join</Text>
                     </View>
                     <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${channelType === 'public' ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                        {channelType === 'public' && <Check size={14} color="white" strokeWidth={4} />}
                     </View>
                   </Pressable>

                   <Pressable 
                    onPress={() => setChannelType("private")}
                    className={`flex-row items-center p-5 rounded-[24px] border ${channelType === 'private' ? 'bg-primary/5 border-primary/40' : 'bg-muted/15 border-transparent'}`}
                   >
                     <View className={`w-12 h-12 rounded-2xl items-center justify-center ${channelType === 'private' ? 'bg-primary/20' : 'bg-muted/30'}`}>
                        <Lock size={24} color={channelType === 'private' ? "#3B82F6" : "#A1A1AA"} />
                     </View>
                     <View className="flex-1 ml-4">
                        <Text className="text-[17px] font-inter-semibold text-foreground lowercase">private</Text>
                        <Text className="text-[13px] text-muted-foreground lowercase mt-0.5">Only joinable via link</Text>
                     </View>
                     <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${channelType === 'private' ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                        {channelType === 'private' && <Check size={14} color="white" strokeWidth={4} />}
                     </View>
                   </Pressable>

                   {channelType === 'public' && (
                     <View className="mt-4">
                        <Text className="mb-2 text-[13px] font-inter-medium lowercase text-muted-foreground ml-1">public handle</Text>
                        <View className="flex-row items-center h-14 bg-muted/10 rounded-2xl px-5">
                           <Text className="text-muted-foreground text-[17px] lowercase opacity-50">konekta.me/</Text>
                           <TextInput 
                              value={handle}
                              onChangeText={setHandle}
                              placeholder="link"
                              className="flex-1 h-full text-[17px] text-foreground"
                              autoCapitalize="none"
                           />
                        </View>
                     </View>
                   )}
                </Animated.View>
              )}

              {step === 'subscribers' && (
                <Animated.View entering={FadeIn} className="flex-1">
                   <View className="px-6 py-4">
                      <SearchInput 
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Invite contacts..."
                      />
                   </View>
                   
                   {sections.map(sec => (
                     <View key={sec.title}>
                        <View className="bg-muted/10 px-6 py-1.5 flex-row items-center">
                           <Text className="text-[12px] font-inter-bold text-muted-foreground/50 lowercase">{sec.title}</Text>
                        </View>
                        {sec.data.map(item => {
                          const active = selectedIds.has(item.id);
                          return (
                            <Pressable 
                              key={item.id}
                              onPress={() => toggleSelect(item.id)}
                              className="flex-row items-center px-6 py-3.5 active:bg-muted/10"
                            >
                               <Avatar alt={item.name} className="w-11 h-11 rounded-2xl">
                                  <AvatarImage src={item.avatarUrl} />
                                  <AvatarFallback>
                                     <Text className="text-[14px] font-inter-semibold">{item.name[0]}</Text>
                                  </AvatarFallback>
                               </Avatar>
                               <View className="flex-1 ml-4 pr-4">
                                  <Text className="text-[16px] font-inter-semibold text-foreground leading-5">{item.name}</Text>
                                  <Text className="text-[12px] text-muted-foreground lowercase mt-0.5">{(item.isOnline ? "online" : item.status) || "available"}</Text>
                               </View>
                               <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${active ? 'bg-primary border-primary' : 'border-border/30'}`}>
                                  {active && <Check size={14} color="white" strokeWidth={4} />}
                               </View>
                            </Pressable>
                          )
                        })}
                     </View>
                   ))}
                </Animated.View>
              )}
            </ScrollView>

            {/* Footer */}
            <View className="p-6 border-t border-border/5 bg-background shadow-2xl">
                <Button 
                  className="h-14 rounded-2xl bg-primary"
                  onPress={() => {
                    if (step === 'info') setStep('type');
                    else if (step === 'type') setStep('subscribers');
                    else handleCreateChannel();
                  }}
                  disabled={(step === 'info' && !channelName.trim()) || (step === 'type' && channelType === 'public' && !handle.trim())}
                >
                   {isCreating ? (
                     <ActivityIndicator color="white" />
                   ) : (
                     <Text className="text-[17px] font-inter-bold text-primary-foreground lowercase">
                        {step === 'subscribers' ? 'Create channel' : 'Next'}
                     </Text>
                   )}
                </Button>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Portal>
  );
}
