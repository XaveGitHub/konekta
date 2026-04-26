import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchInput from "@/components/ui/SearchInput";
import { Text } from "@/components/ui/text";
import {
    formatCallDuration,
    getCallSections,
    type CallRecord,
} from "@/lib/mocks/callsStore";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ChevronLeft,
    Phone,
    Video,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useMemo, useState } from "react";
import { Pressable, SectionList, View } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { appAccentHex } from "@/lib/theme";

// --- Subcomponent: Call Row ---
function CallRow({ call }: { call: CallRecord }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accent = appAccentHex(isDark);

  const initials = call.contactName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  const StatusIcon = () => {
    if (call.direction === "missed")
      return <ArrowDownLeft size={14} color="#ef4444" />;
    if (call.direction === "incoming")
      return <ArrowDownLeft size={14} color="#22c55e" />;
    return <ArrowUpRight size={14} color="#22c55e" />;
  };

  return (
    <Pressable
      className="flex-row items-center px-5 py-3 active:bg-muted/30"
      onPress={() => {
        if (!call.chatId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/chat/${call.chatId}` as any);
      }}
    >
      <Avatar alt={call.contactName} className="w-[52px] h-[52px] mr-3.5">
        <AvatarImage src={call.avatarUrl} />
        <AvatarFallback>
          <Text className="text-[16px] font-inter-semibold text-foreground">
            {initials}
          </Text>
        </AvatarFallback>
      </Avatar>

      <View className="flex-1">
        <Text
          className={`text-[16px] font-inter-semibold ${call.direction === "missed" ? "text-red-500" : "text-foreground"}`}
        >
          {call.contactName}
        </Text>
        <View className="flex-row items-center mt-1">
          <StatusIcon />
          <Text className="text-[13px] text-muted-foreground ml-1">
            {call.timestamp}{" "}
            {call.duration ? `· ${formatCallDuration(call.duration)}` : ""}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          className="p-2.5 rounded-full bg-muted/40"
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          {call.type === "video" ? (
            <Video size={20} color={accent} />
          ) : (
            <Phone size={20} color={accent} />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function RecentsScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accent = appAccentHex(isDark);


  const [query, setQuery] = useState("");
  const callSections = useMemo(() => getCallSections(), []);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return callSections;
    const q = query.toLowerCase();
    return callSections
      .map((s) => ({
        ...s,
        data: s.data.filter((c) => c.contactName.toLowerCase().includes(q)),
      }))
      .filter((s) => s.data.length > 0);
  }, [query, callSections]);

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-background">
      <View
        style={{ paddingTop: Math.max(insets.top + 4, 10) }}
        className="relative z-20 pb-0 bg-background px-5"
      >
        <View className="pb-1">
          <View className="flex-row items-center h-[40px] mb-2">
            <Pressable
              onPress={() => router.back()}
              className="-ml-2 p-2 rounded-full active:bg-muted/50"
            >
              <ChevronLeft size={28} color={accent} />
            </Pressable>
            <Text className="text-3xl font-inter-black text-primary tracking-tighter ml-1 lowercase">
              recents
            </Text>
          </View>

          <SearchInput
            placeholder="Search calls"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderSectionHeader={({ section: { dateGroup } }) => (
          <Text className="px-5 py-3 text-[15px] font-inter-semibold text-foreground bg-background">
            {dateGroup}
          </Text>
        )}
        renderItem={({ item }) => <CallRow call={item} />}
        ItemSeparatorComponent={() => (
          <View className="ml-[76px] h-[0.5px] bg-border/30" />
        )}
        ListEmptyComponent={() => (
          <View className="items-center py-20 px-8">
            <Text className="text-muted-foreground text-[16px]">
              No call history found
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
