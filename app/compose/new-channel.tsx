import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PulsingDot } from "@/components/ui/PulsingDot";
import SearchInput from "@/components/ui/SearchInput";
import { Text } from "@/components/ui/text";
import type { Contact } from "@/lib/mocks/contactsStore";
import { type Chat, type Message } from "@/lib/mocks/chatStore";
import { useChat } from "@/context/ChatContext";
import { useContacts } from "@/context/ContactsContext";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ProFeatureSheet } from "@/components/chat/ProFeatureSheet";
import {
  Camera,
  Check,
  ChevronLeft,
  Globe,
  Lock,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  SectionList,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInRight,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { appAccentHex } from "@/lib/theme";

type Step = "info" | "type" | "subscribers";
type ChannelType = "public" | "private";

// --- Privacy Radio Row ---
function PrivacyOption({
  selected,
  onPress,
  title,
  description,
  icon: Icon,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  description: string;
  icon: any;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
        selected 
          ? "bg-primary/5 border-primary" 
          : "bg-muted/30 border-transparent"
      }`}
    >
      <View className={`w-12 h-12 rounded-full items-center justify-center ${
        selected ? "bg-primary/10" : "bg-muted/50"
      }`}>
        <Icon
          size={24}
          color={selected ? appAccentHex(isDark) : isDark ? "#8E8E93" : "#636366"}
        />
      </View>
      <View className="flex-1 ml-4 mr-2">
        <Text className={`font-inter-semibold text-[16px] ${selected ? "text-primary" : "text-foreground"}`}>
          {title}
        </Text>
        <Text className="text-sm text-muted-foreground leading-5 mt-0.5">
          {description}
        </Text>
      </View>
      <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
        selected ? "border-primary bg-primary" : "border-muted-foreground/30"
      }`}>
        {selected && <Check size={14} color="white" strokeWidth={4} />}
      </View>
    </Pressable>
  );
}

export default function NewChannelScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accent = appAccentHex(isDark);
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

  // --- Step 3 Selection Logic ---
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

  const selectedContacts = contacts.filter((c) => selectedIds.has(c.id));

  // --- Final Creation ---
  const handleCreateChannel = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCreating(true);

    // Simulate delay
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

    // Inject system message
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

    // Clear the compose stack and land in the new channel
    router.dismissAll();
    router.push(`/chat/${newChannelId}` as any);
  };

  const headerTitle = {
    info: "new channel",
    type: "channel type",
    subscribers: "add subscribers",
  }[step];

  const { currentUserProfile } = useChat();
  const isPro = currentUserProfile?.subscriptionTier === "pro";

  const [isProDialogOpen, setIsProDialogOpen] = useState(false);

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-background">
      {/* ── HEADER ── */}
      <View
        style={{ paddingTop: Math.max(insets.top + 4, 10) }}
        className="z-20 bg-background"
      >
        <View className="flex-row items-center h-[56px] px-5">
          <Pressable
            onPress={() => {
              if (step === "subscribers") setStep("type");
              else if (step === "type") setStep("info");
              else router.back();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="p-2 -ml-2 rounded-full active:bg-muted/50"
          >
            <ChevronLeft size={28} color={appAccentHex(isDark)} />
          </Pressable>

          <Text className="text-3xl font-inter-bold text-primary tracking-tighter lowercase ml-1 flex-1">
            {headerTitle}
          </Text>

          <Pressable
            onPress={() => {
              if (step === "info") setStep("type");
              else if (step === "type") setStep("subscribers");
              else handleCreateChannel();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            disabled={step === "info" && !channelName.trim()}
            style={{ opacity: (step === "info" && !channelName.trim()) ? 0.3 : 1 }}
            className="active:opacity-60 px-2"
          >
            <Text className="text-primary font-inter-bold text-[17px] lowercase">
              {step === "subscribers" ? "create" : "next"}{step === "subscribers" && selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── STEP 1: INFO ── */}
      {step === "info" && (
        <Animated.View entering={FadeIn} className="flex-1 px-6 pt-6">
          <View className="items-center mb-10">
            <Pressable className="relative">
              <View className="w-24 h-24 rounded-full bg-muted/40 items-center justify-center border-2 border-dashed border-muted-foreground/20">
                <Camera size={32} color="#8E8E93" />
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-background">
                <Check size={16} color="white" />
              </View>
            </Pressable>
            <Text className="text-[14px] text-primary font-inter-medium mt-3">
              Set Channel Photo
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-sm font-inter-medium lowercase tracking-tight text-muted-foreground mb-2 ml-1">
                channel name
              </Text>
              <TextInput
                value={channelName}
                onChangeText={setChannelName}
                placeholder="Enter channel name"
                placeholderTextColor="#8E8E93"
                className="h-14 bg-muted/30 px-4 rounded-2xl text-[17px] text-foreground border border-transparent focus:border-primary/30"
                autoFocus
                maxLength={64}
              />
            </View>

            <View className="mt-6">
              <Text className="text-sm font-inter-medium lowercase tracking-tight text-muted-foreground mb-2 ml-1">
                description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your channel"
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={3}
                className="min-h-[100px] bg-muted/30 p-4 rounded-2xl text-[16px] text-foreground border border-transparent focus:border-primary/30 text-start"
                textAlignVertical="top"
                maxLength={255}
              />
              <Text className="text-sm text-muted-foreground mt-2 ml-1">
                Users can find your channel by searching for its name.
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── STEP 2: TYPE ── */}
      {step === "type" && (
        <Animated.View entering={SlideInRight} className="flex-1 px-6 pt-6">
          <PrivacyOption
            icon={Globe}
            title="Public Channel"
            description="Public channels can be found in search and are open to anyone."
            selected={channelType === "public"}
            onPress={() => setChannelType("public")}
          />
          <PrivacyOption
            icon={Lock}
            title="Private Channel"
            description="Private channels can only be joined via invite link."
            selected={channelType === "private"}
            onPress={() => setChannelType("private")}
          />

          {channelType === "public" && (
            <Animated.View entering={FadeIn} className="mt-6">
              <Text className="text-sm font-inter-medium lowercase tracking-tight text-muted-foreground mb-2 ml-1">
                public link
              </Text>
              <View className="flex-row items-center h-14 bg-muted/30 px-4 rounded-2xl border border-transparent focus-within:border-primary/30">
                <Text className="text-[#8E8E93] text-[17px] mr-0.5">konekta.me/</Text>
                <TextInput
                  value={handle}
                  onChangeText={setHandle}
                  placeholder="link"
                  placeholderTextColor="#8E8E93"
                  className="flex-1 h-full text-[17px] text-foreground"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text className="text-sm text-muted-foreground mt-2 ml-1">
                You can use a-z, 0-9 and underscores. Minimum 5 characters.
              </Text>
            </Animated.View>
          )}

          {channelType === "private" && (
            <Animated.View entering={FadeIn} className="mt-6 p-4 rounded-2xl bg-muted/20 border border-dashed border-muted-foreground/20">
              <Text className="text-sm font-inter-medium lowercase tracking-tight text-muted-foreground mb-2">
                invite link
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-primary font-inter-medium text-[15px]">
                  https://konekta.link/c/random_hash
                </Text>
                <Pressable className="p-2 bg-primary/10 rounded-lg active:bg-primary/20">
                  <Text className="text-primary font-inter-semibold text-[13px]">Copy</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      )}

      {/* ── STEP 3: SUBSCRIBERS ── */}
      {step === "subscribers" && (
        <Animated.View entering={SlideInRight} className="flex-1">
          <View className="px-4 pb-4 bg-background">
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Add subscribers..."
            />
          </View>

          {selectedIds.size > 0 && (
            <View className="px-4 py-2 border-b border-border/5 bg-background">
               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedContacts.map(c => (
                    <View key={c.id} className="mr-3 items-center">
                       <Pressable onPress={() => toggleSelect(c.id)} className="relative">
                          <Avatar alt={c.name} className="w-12 h-12">
                            <AvatarImage src={c.avatarUrl} />
                            <AvatarFallback>
                              <Text className="text-xs font-inter-medium">{c.name[0]}</Text>
                            </AvatarFallback>
                          </Avatar>
                          <View className="absolute -top-1 -right-1 bg-muted-foreground rounded-full w-5 h-5 items-center justify-center border-2 border-background">
                            <X size={12} color="white" />
                          </View>
                       </Pressable>
                    </View>
                  ))}
               </ScrollView>
            </View>
          )}

          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section: { title } }) => (
              <View className="bg-muted/30 px-4 py-1.5">
                <Text className="text-[13px] font-inter-medium text-muted-foreground">
                  {title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => {
              const selected = selectedIds.has(item.id);
              return (
                <Pressable
                  onPress={() => toggleSelect(item.id)}
                  className="flex-row items-center px-4 py-3 active:bg-muted/40"
                >
                  <View className="relative">
                    <Avatar alt={item.name} className="w-12 h-12">
                      <AvatarImage src={item.avatarUrl} />
                      <AvatarFallback>
                         <Text className="font-inter-medium">{item.name[0]}</Text>
                      </AvatarFallback>
                    </Avatar>
                    {item.isOnline ? (
                      <View className="absolute bottom-0 right-0 rounded-full border-2 border-background p-0.5 bg-background">
                        <PulsingDot size={10} />
                      </View>
                    ) : null}
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-[16px] font-inter-semibold text-foreground">
                      {item.name}
                    </Text>
                    <Text className="text-[13px] text-muted-foreground">
                      {item.status || "Hey there! I am using Konekta."}
                    </Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {selected && <Check size={14} color="white" strokeWidth={4} />}
                  </View>
                </Pressable>
              );
            }}
          />
        </Animated.View>
      )}

      {/* --- Overlay --- */}
      {isCreating && (
        <View className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 items-center justify-center">
          <ActivityIndicator size="large" color={accent} />
          <Text className="mt-4 font-inter-semibold text-[17px] text-foreground lowercase">
            creating channel...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
