import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Pressable, ScrollView, View, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";
import { useChat } from "@/context/ChatContext";
import { THEME } from "@/lib/theme";
import { DatePickerSheet } from "@/components/ui/DatePickerSheet";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const tint = THEME[isDark ? "dark" : "light"].primary;
  
  const { currentUserProfile, updateCurrentUserProfile, showToast } = useChat();

  // Local state for editing
  const [name, setName] = useState(currentUserProfile.displayName);
  const [username, setUsername] = useState(currentUserProfile.username);
  const [phone, setPhone] = useState(currentUserProfile.phone ?? "");
  const [birthday, setBirthday] = useState<string | null>(currentUserProfile.birthday ?? null);
  const [bio, setBio] = useState(currentUserProfile.bio ?? "");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date(1990, 0, 1));

  const save = () => {
    updateCurrentUserProfile({
      displayName: name,
      username: username.startsWith("@") ? username : `@${username}`,
      phone,
      birthday: birthday || "",
      bio,
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast({ message: "account updated" });
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: Math.max(insets.top + 4, 10), paddingBottom: 10 }}
        className="flex-row items-center justify-between bg-background px-4"
      >
        <Pressable
          onPress={() => router.back()}
          className="rounded-full p-2 active:bg-muted/50"
        >
          <Ionicons name="chevron-back" size={26} color={tint} />
        </Pressable>
        <Text className="text-[17px] font-inter-black tracking-tighter text-primary lowercase">
          account settings
        </Text>
        <Pressable
          onPress={save}
          className="px-3 py-1"
        >
          <Text className="text-[17px] font-inter-bold lowercase text-primary">
            save
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-4 overflow-hidden rounded-[24px] border border-border/40 bg-card p-6 shadow-sm">
          <Text variant="sectionLabel" className="mb-2">
            display name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="mb-6 rounded-xl border border-border/50 bg-muted/50 px-4 py-3.5 text-base text-foreground font-inter-semibold"
          />

          <Text variant="sectionLabel" className="mb-2">
            phone number
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 …"
            placeholderTextColor={THEME[isDark ? "dark" : "light"].mutedForeground}
            keyboardType="phone-pad"
            className="mb-6 rounded-xl border border-border/50 bg-muted/50 px-4 py-3.5 text-base text-foreground font-inter-semibold"
          />

          <Text variant="sectionLabel" className="mb-2">
            username
          </Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            className="mb-6 rounded-xl border border-border/50 bg-muted/50 px-4 py-3.5 text-base text-foreground font-inter-semibold"
          />

          <Text variant="sectionLabel" className="mb-2">
            birthday
          </Text>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowDatePicker(true);
            }}
            className="mb-6 flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/50 px-4 py-3.5"
          >
            <Text className={`text-base font-inter-semibold ${birthday ? "text-foreground" : "text-muted-foreground"}`}>
              {birthday || "not set"}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={tint} />
          </Pressable>

          <Text variant="sectionLabel" className="mb-2">
            bio
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="tell us about yourself"
            placeholderTextColor={THEME[isDark ? "dark" : "light"].mutedForeground}
            multiline
            numberOfLines={3}
            className="rounded-xl border border-border/50 bg-muted/50 px-4 py-3.5 text-base text-foreground font-inter-semibold min-h-[90px]"
          />
        </View>

        <DatePickerSheet
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          title="select birthday"
          initialDate={dateObj}
          onSelect={(selectedDate) => {
            setDateObj(selectedDate);
            setBirthday(dayjs(selectedDate).format("MMM D, YYYY").toLowerCase());
          }}
        />

        <View className="mb-10 mt-6 px-8 opacity-40">
          <Text className="text-center text-[12px] font-inter-medium leading-5 text-muted-foreground lowercase">
            changes here will sync with your clerk identity and convex database records.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
