import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/context/ChatContext";
import { THEME } from "@/lib/theme";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { appAccentHex } from "@/lib/theme";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const tint = THEME[isDark ? "dark" : "light"].primary;
  const { currentUserProfile, updateCurrentUserProfile, showToast } = useChat();

  const [name, setName] = useState(currentUserProfile.displayName);
  const [username, setUsername] = useState(currentUserProfile.username);
  const [phone, setPhone] = useState(currentUserProfile.phone ?? "");
  const [bio, setBio] = useState(currentUserProfile.bio ?? "");

  useEffect(() => {
    setName(currentUserProfile.displayName);
    setUsername(currentUserProfile.username);
    setPhone(currentUserProfile.phone ?? "");
    setBio(currentUserProfile.bio ?? "");
  }, [currentUserProfile]);

  const save = () => {
    const u = username.trim();
    const normalized = u.startsWith("@") ? u : `@${u}`;
    if (!name.trim()) {
      showToast({ message: "name can’t be empty" });
      return;
    }
    updateCurrentUserProfile({
      displayName: name.trim(),
      username: normalized,
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast({ message: "profile updated (mock)" });
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <View
        style={{
          paddingTop: Math.max(insets.top + 4, 10),
          paddingBottom: 10,
        }}
        className="flex-row items-center justify-between bg-background px-4"
      >
        <Pressable
          onPress={() => router.back()}
          className="rounded-full p-2 active:bg-muted/50"
        >
          <Ionicons name="chevron-back" size={26} color={appAccentHex(isDark)} />
        </Pressable>
        <Text className="text-3xl font-inter-bold text-primary tracking-tighter lowercase ml-1">
          edit profile
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 28,
          paddingTop: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader label="your details" />
        <View className="mx-4 overflow-hidden rounded-[24px] border border-border/40 bg-card p-6 shadow-sm shadow-black/5">
          <Text className="mb-2 text-xs font-inter-medium lowercase tracking-tight text-muted-foreground/70">
            display name
          </Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="your name"
            className="mb-6 rounded-xl border-border/40 bg-muted/20"
          />

          <Text className="mb-2 text-xs font-inter-medium lowercase tracking-tight text-muted-foreground/70">
            username
          </Text>
          <Input
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            autoCapitalize="none"
            className="mb-6 rounded-xl border-border/40 bg-muted/20"
          />

          <Text className="mb-2 text-xs font-inter-medium lowercase tracking-tight text-muted-foreground/70">
            phone
          </Text>
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 …"
            keyboardType="phone-pad"
            className="mb-6 rounded-xl border-border/40 bg-muted/20"
          />

          <Text className="mb-2 text-xs font-inter-medium lowercase tracking-tight text-muted-foreground/70">
            bio
          </Text>
          <Textarea
            value={bio}
            onChangeText={setBio}
            placeholder="short bio"
            numberOfLines={4}
            className="min-h-[100px] rounded-xl border-border/40 bg-muted/20"
          />
        </View>

        <Button
          onPress={save}
          className="mx-4 mt-8 rounded-2xl"
        >
          <Text className="font-inter-semibold lowercase text-primary-foreground">
            save profile
          </Text>
        </Button>
      </ScrollView>
    </View>
  );
}
