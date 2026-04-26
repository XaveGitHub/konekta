import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
    Bell,
    BellOff,
    ChevronRight,
    Copy,
    Lock,
    LogOut,
    MoreVertical,
    Phone,
    ShieldAlert,
    ShieldCheck,
    UserPlus,
    Video
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddGroupMembersSheet } from "@/components/chat/AddGroupMembersSheet";
import {
    ChatInfoOverflowSheet,
    type ChatInfoOverflowVariant,
} from "@/components/chat/ChatInfoOverflowSheet";
import {
    MediaViewer,
    type MediaViewerItem,
} from "@/components/chat/MediaViewer";
import { MemberActionSheet } from "@/components/chat/MemberActionSheet";
import { MuteSheet } from "@/components/chat/MuteSheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { GroupMember } from "@/constants/mockChats";
import { useCall } from "@/context/CallContext";
import { useChat } from "@/context/ChatContext";
import { formatChannelSubscribers } from "@/lib/channel";
import { getDeterministicAvatarColor } from "@/lib/avatarColor";
import { CURRENT_USER_ID, type Chat } from "@/lib/mocks/chatStore";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";
import { appAccentHex } from "@/lib/theme";

const { width } = Dimensions.get("window");
const GRID_SPACING = 8;

const SHARED_LIBRARY_TABS = ["media", "files", "links"] as const;

export default function ChatDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const accent = appAccentHex(isDark);

  const {
    chats,
    messagesByChatId,
    handleMuteConfirmed,
    setChats,
    showToast,
    addGroupMembers,
    removeGroupMember,
    updateMemberRole,
    currentUserProfile,
  } = useChat();
  const {
    startAudioCall,
    startVideoCall,
    activeCall,
    updateCallType,
    restoreCall,
  } = useCall();

  const [activeTab, setActiveTab] = useState<"media" | "files" | "links">(
    "media",
  );
  const [isMuteSheetOpen, setIsMuteSheetOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [mediaViewer, setMediaViewer] = useState<{
    initialIndex: number;
  } | null>(null);
  const [isAddMembersSheetOpen, setIsAddMembersSheetOpen] = useState(false);
  const [memberActionTarget, setMemberActionTarget] =
    useState<GroupMember | null>(null);
  const [isInfoOverflowOpen, setIsInfoOverflowOpen] = useState(false);
  const [isDestructiveActionOpen, setIsDestructiveActionOpen] = useState(false);
  const [removeMemberPending, setRemoveMemberPending] = useState<{
    userId: string;
    displayName: string;
  } | null>(null);

  const chat = useMemo(() => chats.find((c) => c.id === id), [id, chats]);

  const isGroup = Boolean(chat?.isGroup && chat.members?.length);
  const isChannel = Boolean(chat?.isChannel);
  const isAdmin = chat?.myRole === "admin";
  const memberCount = chat?.members?.length ?? 0;

  const overflowVariant: ChatInfoOverflowVariant = isChannel
    ? "channel"
    : isGroup
      ? "group"
      : "contact";

  useEffect(() => {
    setDescriptionDraft(chat?.groupDescription ?? "");
  }, [chat?.id, chat?.groupDescription]);

  /** Close overlays when leaving — avoids portal/modal issues; also sidesteps css-interop + nav context edge cases. */
  useFocusEffect(
    useCallback(() => {
      return () => {
        setMediaViewer(null);
        setIsDestructiveActionOpen(false);
        setIsMuteSheetOpen(false);
        setIsAddMembersSheetOpen(false);
        setMemberActionTarget(null);
        setIsInfoOverflowOpen(false);
        setRemoveMemberPending(null);
      };
    }, []),
  );

  const patchChat = useCallback(
    (updater: (prev: Chat) => Chat) => {
      if (!chat) return;
      setChats((prev) => prev.map((c) => (c.id === chat.id ? updater(c) : c)));
    },
    [chat, setChats],
  );

  const handleAddMembers = (contacts: any[]) => {
    if (!id) return;
    addGroupMembers(id, contacts);
  };

  const handleMemberAction = (
    action: "promote" | "demote" | "remove" | "profile" | "message",
  ) => {
    if (!id || !memberActionTarget) return;

    if (action === "promote") {
      updateMemberRole(id, memberActionTarget.id, "admin");
    } else if (action === "demote") {
      updateMemberRole(id, memberActionTarget.id, "member");
    } else if (action === "remove") {
      setRemoveMemberPending({
        userId: memberActionTarget.id,
        displayName: memberActionTarget.name,
      });
    } else if (action === "profile") {
      openMemberProfile(memberActionTarget);
    } else if (action === "message") {
      showToast({ message: "Starting chat..." });
    }
  };

  const openMemberProfile = (member: GroupMember) => {
    if (!chat) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (member.id === CURRENT_USER_ID) {
      router.push("/profile/me" as any);
      return;
    }
    router.push(
      `/profile/${member.id}?via=${encodeURIComponent(chat.title)}` as any,
    );
  };

  const saveGroupDescription = () => {
    if (!chat) return;
    patchChat((c) => ({ ...c, groupDescription: descriptionDraft.trim() }));
    showToast({ message: "Description updated" });
  };

  const copyInviteLink = async () => {
    if (!chat?.groupInviteCode) return;
    const link = `https://konekta.link/g/${chat.groupInviteCode}`;
    await Clipboard.setStringAsync(link);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast({ message: "Invite link copied", icon: Copy });
  };

  const triggerDestructiveAction = () => {
    if (!chat) return;
    setIsDestructiveActionOpen(true);
  };

  const executeDestructiveAction = () => {
    if (!chat) return;
    setChats((prev) => prev.filter((c) => c.id !== chat.id));

    const silentLeave =
      currentUserProfile.subscriptionTier === "plus" &&
      (chat.isChannel || chat.isGroup);

    if (!silentLeave) {
      let toastMessage = "Chat deleted";
      let icon = LogOut;
      if (chat.isChannel) toastMessage = "You left the channel";
      else if (chat.isGroup) toastMessage = "You left the group";
      showToast({ message: toastMessage, icon });
    }

    router.back();
  };

  const handleCallAction = (type: "audio" | "video") => {
    if (!chat) return;
    if (activeCall && activeCall.id !== chat.id) {
      alert(
        `You are already in a call. Please end it before starting a new one.`,
      );
      return;
    }
    if (activeCall && activeCall.id === chat.id) {
      if (type === "video" && !activeCall.isLocalVideoEnabled)
        updateCallType("video");
      else if (type === "audio" && activeCall.isLocalVideoEnabled)
        updateCallType("audio");
      restoreCall();
      return router.push(`/call/${chat.id}?type=${type}`);
    }
    if (type === "video") startVideoCall(chat);
    else startAudioCall(chat);
    router.push(`/call/${chat.id}?type=${type}`);
  };

  const chatMediaItems = useMemo(() => {
    const items: MediaViewerItem[] = [];
    const messages = messagesByChatId[id as string] || [];

    messages.forEach((msg) => {
      if (msg.type === "image" && msg.mediaUrls) {
        msg.mediaUrls.forEach((url) => items.push({ uri: url, type: "image" }));
      } else if (msg.type === "image" && msg.mediaUrl) {
        items.push({ uri: msg.mediaUrl, type: "image" });
      } else if (msg.type === "video" && msg.mediaUrl) {
        items.push({ uri: msg.mediaUrl, type: "video" });
      }
    });

    return items.reverse();
  }, [id, messagesByChatId]);

  const sharedFiles = useMemo(() => {
    const messages = messagesByChatId[id as string] || [];
    return messages
      .filter((m) => m.type === "file")
      .map((m) => ({
        id: m.id,
        name: m.fileName || "Untitled File",
        size: m.fileSize || "0 KB",
        date: m.date,
      }))
      .reverse();
  }, [id, messagesByChatId]);

  const sharedLinks = useMemo(() => {
    const messages = messagesByChatId[id as string] || [];
    const links: { id: string; url: string; date: string }[] = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    messages.forEach((m) => {
      if (m.text) {
        const found = m.text.match(urlRegex);
        if (found) {
          found.forEach((url) => links.push({ id: m.id, url, date: m.date }));
        }
      }
    });
    return links.reverse();
  }, [id, messagesByChatId]);

  /** Standardized Segmented Control (matches Subscriptions Hub) */
  const sharedLibraryPickerStyles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          flexDirection: "row",
          height: 42,
          borderRadius: 100,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
          padding: 3,
          marginHorizontal: 16,
          marginBottom: 16,
          marginTop: 12,
        },
        tab: {
          flex: 1,
          height: "100%",
          borderRadius: 100,
          justifyContent: "center",
          alignItems: "center",
        },
        tabActive: {
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#ffffff",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 2,
        },
        label: {
          fontSize: 13,
          fontWeight: "600",
          color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
        },
        labelActive: {
          color: isDark ? "#ffffff" : "#000000",
        },
      }),
    [isDark],
  );

  const sharedLibraryThumbSize = (width - 64 - GRID_SPACING * 2) / 3;

  const sharedLibraryMediaThumbStyle = useMemo(
    () => ({
      width: sharedLibraryThumbSize,
      height: sharedLibraryThumbSize,
      borderRadius: 22,
      overflow: "hidden" as const,
      backgroundColor: isDark
        ? "rgba(39, 39, 42, 0.45)"
        : "rgba(244, 244, 245, 0.9)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(0, 0, 0, 0.06)",
    }),
    [isDark, sharedLibraryThumbSize],
  );

  if (!chat) return null;

  const staffMembers = chat.members?.filter((m) => m.role === "admin") || [];
  const participantMembers =
    chat.members?.filter((m) => m.role !== "admin") || [];

  // --- Identity System UI Tokens ---

  const ProCard = ({
    children,
    className = "",
    noOverflow = false,
  }: {
    children: React.ReactNode;
    className?: string;
    noOverflow?: boolean;
  }) => (
    <View
      className={`mx-4 mb-6 ${!noOverflow ? "overflow-hidden" : ""} rounded-[24px] bg-card border border-border/40 shadow-sm ${className}`}
    >
      {children}
    </View>
  );

  const ProSectionLabel = ({
    label,
    className = "",
  }: {
    label: string;
    className?: string;
  }) => (
    <Text
      className={`px-6 mb-2.5 text-sm font-inter-medium lowercase text-muted-foreground/70 tracking-tight ${className}`}
    >
      {label}
    </Text>
  );

  const ActionTile = ({
    icon: Icon,
    label,
    onPress,
    color,
    isDestructive = false,
  }: {
    icon: any;
    label: string;
    onPress: () => void;
    color?: string;
    isDestructive?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center justify-center h-16 rounded-[18px] bg-muted/20 border border-border/5 active:bg-muted/30`}
    >
      <Icon size={20} color={color || (isDark ? "#FFF" : "#222")} />
      <Text
        className={`mt-1.5 text-[13px] font-inter-medium lowercase tracking-tight ${isDestructive ? "text-destructive" : "text-foreground opacity-80"}`}
      >
        {label}
      </Text>
    </Pressable>
  );

  const MemberRow = ({
    member,
    index,
    isLast,
    isMe,
  }: {
    member: GroupMember;
    index: number;
    isLast: boolean;
    isMe: boolean;
  }) => {
    const showMore = isGroup && isAdmin && !isMe;
    const mColor = getDeterministicAvatarColor(member.name);
    return (
      <Pressable
        onPress={() => openMemberProfile(member)}
        className={`flex-row items-center px-6 py-5 active:bg-muted/10 ${!isLast ? "border-b border-border/5" : ""}`}
      >
        <Avatar
          alt={member.name}
          className="h-12 w-12 rounded-[18px] border border-border/10"
        >
          <AvatarImage src={member.avatarUrl || undefined} />
          <AvatarFallback style={{ backgroundColor: mColor }}>
            <Text className="text-xs font-inter-medium text-white">
              {(member.name || "?").charAt(0)}
            </Text>
          </AvatarFallback>
        </Avatar>
        <View className="flex-1 ml-4 pr-2">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[17px] font-inter-semibold text-foreground"
              numberOfLines={1}
            >
              {member.name}
              {isMe ? " (you)" : ""}
            </Text>
            {member.role === "admin" && (
              <View className="bg-primary/10 px-1.5 py-0.5 rounded-sm">
                <Text className="text-[11px] font-inter-medium lowercase text-primary">
                  staff
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 text-sm font-inter-medium lowercase tracking-tight text-muted-foreground opacity-50">
            active recently
          </Text>
        </View>
        {showMore ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMemberActionTarget(member);
            }}
            className="p-2"
          >
            <MoreVertical size={18} color="#888" />
          </Pressable>
        ) : (
          <ChevronRight size={18} color="#C7C7CC" />
        )}
      </Pressable>
    );
  };

  const profileColor = getDeterministicAvatarColor(chat.title);

  return (
    <View className="flex-1 bg-muted/15">
      {/* 
        PREMIUM HEADER (Positioned absolute at the end to ensure it stays on top of content)
        This resolves the "cut out" issue by placing it last in the JSX tree.
      */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
      >
        {/* Banner with Gradient Depth */}
        <View className="w-full h-48 overflow-hidden relative">
          <View
            style={{ backgroundColor: profileColor }}
            className="w-full h-full opacity-90"
          />
          <View className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
        </View>

        {/* Unified Identity Header Card - noOverflow allows the avatar to pop the boundary */}
        <ProCard noOverflow className="-mt-14 pt-0 shadow-xl border-t-0">
          <View className="px-6 pb-6">
            <View className="flex-row items-end justify-between -mt-[50px] z-30">
              <View className="relative">
                <View className="w-[100px] h-[100px] rounded-full border-[5px] border-card shadow-2xl overflow-hidden bg-card">
                  <Avatar alt={chat.title} className="w-full h-full">
                    <AvatarImage src={chat.avatarUrl || undefined} />
                    <AvatarFallback style={{ backgroundColor: profileColor }}>
                      <Text className="text-4xl font-inter-medium text-white">
                        {(chat.title || "C").charAt(0)}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                </View>
                <View className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-[3px] border-card shadow-sm" />
              </View>
              <View className="flex-row gap-2 mb-2">
                {isGroup && isAdmin && (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 border-primary/20 h-7"
                  >
                    <ShieldCheck size={12} color={accent} />
                    <Text className="ml-1 text-xs font-inter-medium lowercase text-primary tracking-tight">
                      admin access
                    </Text>
                  </Badge>
                )}
              </View>
            </View>

            <View className="mt-5">
              <Text className="text-[28px] font-inter-semibold text-foreground leading-8 tracking-tight">
                {chat.title}
              </Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <Text className="text-sm font-inter-medium lowercase text-muted-foreground opacity-70">
                  {isChannel
                    ? "universal channel"
                    : isGroup
                      ? "admin managed group"
                      : "verified contact"}
                </Text>
                <View className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <Text className="text-sm font-inter-medium lowercase text-muted-foreground opacity-70">
                  {isChannel
                    ? `${formatChannelSubscribers(chat.channelSubscriberCount || 0)} members`
                    : `${memberCount} members`}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3 mt-8">
              {!isChannel && (
                <>
                  <ActionTile
                    icon={Phone}
                    label="Audio"
                    onPress={() => handleCallAction("audio")}
                  />
                  <ActionTile
                    icon={Video}
                    label="Video"
                    onPress={() => handleCallAction("video")}
                  />
                </>
              )}
              <ActionTile
                icon={chat.isMuted ? BellOff : Bell}
                label={chat.isMuted ? "Unmute" : "Mute"}
                onPress={() =>
                  chat.isMuted
                    ? handleMuteConfirmed("unmute", [chat.id])
                    : setIsMuteSheetOpen(true)
                }
                color={chat.isMuted ? "#f97316" : undefined}
              />
            </View>
          </View>
        </ProCard>

        {/* Security Section */}
        {!isChannel && (
          <>
            <ProSectionLabel label="Trust & Privacy" />
            <ProCard>
              <View className="py-1">
                <Pressable
                  className={`flex-row items-center px-6 py-4 active:bg-muted/10 ${!isGroup ? "border-b border-border/5" : ""}`}
                >
                  <View className="h-9 w-9 rounded-xl bg-orange-500/10 items-center justify-center">
                    <Lock size={18} color="#f97316" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-[16px] font-inter-medium lowercase text-foreground">
                      end-to-end encrypted
                    </Text>
                    <Text className="mt-0.5 text-sm font-inter-medium lowercase text-muted-foreground">
                      messages and calls are secured
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#C7C7CC" />
                </Pressable>
                {!isGroup && (
                  <Pressable className="flex-row items-center px-6 py-4 active:bg-muted/10">
                    <View className="h-9 w-9 rounded-xl bg-blue-500/10 items-center justify-center">
                      <ShieldAlert size={18} color="#3b82f6" />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-[16px] font-inter-medium lowercase text-foreground">
                        safety numbers
                      </Text>
                      <Text className="mt-0.5 text-sm font-inter-medium lowercase text-muted-foreground">
                        verify identity credentials
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#C7C7CC" />
                  </Pressable>
                )}
              </View>
            </ProCard>
          </>
        )}
        {/* Admin Permissions (Strategy: Unified Control) */}
        {isGroup && isAdmin && (
          <>
            <ProSectionLabel label="Member Privileges" />
            <ProCard>
              <View className="py-2">
                {[
                  {
                    id: "msg",
                    label: "Send Messages",
                    icon: "chatbox-ellipses",
                    color: "#10b981",
                  },
                  {
                    id: "media",
                    label: "Send Media",
                    icon: "image",
                    color: "#3b82f6",
                  },
                  {
                    id: "add",
                    label: "Add Participants",
                    icon: "person-add",
                    color: "#a855f7",
                  },
                  {
                    id: "info",
                    label: "Edit Group Info",
                    icon: "create",
                    color: "#f59e0b",
                  },
                ].map((perm, idx, arr) => (
                  <View
                    key={perm.id}
                    className={`flex-row items-center px-6 py-4 ${idx !== arr.length - 1 ? "border-b border-border/5" : ""}`}
                  >
                    <View className="h-9 w-9 rounded-xl items-center justify-center bg-muted/20">
                      <Ionicons
                        name={perm.icon as any}
                        size={18}
                        color={perm.color}
                      />
                    </View>
                    <Text className="ml-4 flex-1 text-[16px] font-inter-medium lowercase text-foreground">
                      {perm.label}
                    </Text>
                    <View className="w-12 h-6 rounded-full bg-primary/20 items-end px-1 justify-center">
                      <View className="w-4 h-4 rounded-full bg-primary shadow-sm" />
                    </View>
                  </View>
                ))}
              </View>
            </ProCard>
          </>
        )}

        {/* Description Section */}
        {(isGroup || isChannel) && (
          <>
            <ProSectionLabel label="Description" />
            <ProCard>
              <View className="p-6">
                {isAdmin && isGroup ? (
                  <View>
                    <Textarea
                      value={descriptionDraft}
                      onChangeText={setDescriptionDraft}
                      placeholder="Set a context for this group..."
                      className="bg-muted/10 rounded-[14px] p-4 text-[16px] min-h-[100px] font-inter-medium leading-5 border-none"
                    />
                    <Pressable
                      onPress={saveGroupDescription}
                      className="mt-4 bg-primary h-12 items-center justify-center rounded-[14px] active:opacity-90 shadow-sm"
                    >
                      <Text className="text-sm font-inter-medium lowercase tracking-tight text-white">
                        update community info
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text className="text-[16px] leading-[24px] text-foreground font-inter-medium">
                    {chat.groupDescription ||
                      "This group has no public description."}
                  </Text>
                )}
                {chat.username && (
                  <View className="mt-5 pt-5 border-t border-border/5 flex-row items-center justify-between">
                    <Text className="text-sm font-inter-medium lowercase tracking-tight text-muted-foreground opacity-70">
                      group id
                    </Text>
                    <Text className="text-sm font-inter-medium text-primary">
                      {chat.username}
                    </Text>
                  </View>
                )}
              </View>
            </ProCard>
          </>
        )}

        {/* Tools Section */}
        {(isGroup || isChannel) && (
          <>
            <ProSectionLabel label="Search & Discover" />
            <ProCard>
              <View className="py-1">
                <Pressable
                  onPress={copyInviteLink}
                  className="flex-row items-center px-6 py-4 border-b border-border/5 active:bg-muted/10"
                >
                  <View className="h-9 w-9 rounded-xl bg-muted/30 items-center justify-center">
                    <Ionicons
                      name="link"
                      size={18}
                      color={isDark ? "#FFF" : "#000"}
                    />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-[16px] font-inter-medium lowercase text-foreground">
                      invite link
                    </Text>
                    <Text
                      className="mt-1 text-sm font-inter-medium text-muted-foreground opacity-70"
                      numberOfLines={1}
                    >
                      konekta.link/g/{chat.groupInviteCode}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </ProCard>
          </>
        )}

        {/* Members Section - Staff */}
        {(isGroup || (isChannel && staffMembers.length > 0)) && (
          <>
            <ProSectionLabel
              label={
                isChannel
                  ? `Channel Admins — ${staffMembers.length}`
                  : `Staff — ${staffMembers.length}`
              }
            />
            <ProCard className="mb-4">
              {staffMembers.map((member, idx) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  index={idx}
                  isLast={idx === staffMembers.length - 1}
                  isMe={member.id === CURRENT_USER_ID}
                />
              ))}
            </ProCard>
          </>
        )}

        {/* Members Section - Participants */}
        {isGroup && (
          <>
            <ProSectionLabel
              label={`Participants — ${participantMembers.length}`}
            />
            <ProCard>
              {isGroup && isAdmin && (
                <Pressable
                  onPress={() => setIsAddMembersSheetOpen(true)}
                  className="flex-row items-center px-6 py-5 border-b border-border/10 active:bg-muted/15"
                >
                  <View className="h-10 w-10 rounded-xl bg-primary/10 items-center justify-center">
                    <UserPlus size={18} color={accent} />
                  </View>
                  <Text className="ml-4 text-sm font-inter-medium lowercase tracking-tight text-primary">
                    add people
                  </Text>
                </Pressable>
              )}

              {participantMembers.map((member, idx) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  index={idx}
                  isLast={idx === participantMembers.length - 1}
                  isMe={member.id === CURRENT_USER_ID}
                />
              ))}
            </ProCard>
          </>
        )}

        <ProCard className="mb-10 p-0 overflow-hidden">
          <View style={sharedLibraryPickerStyles.track}>
            {SHARED_LIBRARY_TABS.map((tab) => {
              const selected = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab);
                  }}
                  style={[
                    sharedLibraryPickerStyles.tab,
                    selected && sharedLibraryPickerStyles.tabActive
                  ]}
                >
                  <Text
                    style={[
                      sharedLibraryPickerStyles.label,
                      selected && sharedLibraryPickerStyles.labelActive
                    ]}
                    className="lowercase"
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeTab === "media" && (
            <View className="px-4 pb-4">
              <View
                className="flex-row flex-wrap"
                style={{ gap: GRID_SPACING }}
              >
                {chatMediaItems.slice(0, 8).map((item, index) => (
                  <Pressable
                    key={index}
                    style={sharedLibraryMediaThumbStyle}
                    onPress={() => setMediaViewer({ initialIndex: index })}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={{
                        width: sharedLibraryThumbSize,
                        height: sharedLibraryThumbSize,
                      }}
                      contentFit="cover"
                      transition={200}
                    />
                  </Pressable>
                ))}
                {chatMediaItems.length === 0 && (
                  <Text className="py-10 text-center w-full text-muted-foreground font-inter-medium text-sm opacity-50 italic">
                    No media shared yet
                  </Text>
                )}
              </View>
            </View>
          )}

          {activeTab === "files" && (
            <View className="px-4 pb-4 gap-3">
              {sharedFiles.length > 0 ? (
                sharedFiles.map((file, idx) => (
                  <View
                    key={`file-${file.id || idx}`}
                    className="flex-row items-center p-3 rounded-full bg-muted/20 border border-border/5"
                  >
                    <View className="w-10 h-10 rounded-full bg-orange-500/10 items-center justify-center">
                      <Ionicons
                        name="document-text"
                        size={20}
                        color="#f97316"
                      />
                    </View>
                    <View className="flex-1 ml-4 pr-4">
                      <Text
                        className="text-[14px] font-inter-semibold text-foreground lowercase"
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>
                      <Text className="text-xs text-muted-foreground font-inter-medium mt-0.5 lowercase">
                        {file.size} • {file.date}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="py-10 text-center text-muted-foreground font-inter-medium text-sm opacity-50 italic lowercase">
                  no files shared yet
                </Text>
              )}
            </View>
          )}

          {activeTab === "links" && (
            <View className="px-4 pb-4 gap-3">
              {sharedLinks.length > 0 ? (
                sharedLinks.map((link, idx) => (
                  <View
                    key={`link-${link.id || idx}`}
                    className="flex-row items-center p-3 rounded-full bg-muted/20 border border-border/5"
                  >
                    <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center">
                      <Ionicons name="link" size={18} color="#3b82f6" />
                    </View>
                    <View className="flex-1 ml-4 pr-4">
                      <Text
                        className="text-[14px] font-inter-semibold text-primary underline lowercase"
                        numberOfLines={1}
                      >
                        {link.url}
                      </Text>
                      <Text className="text-xs text-muted-foreground font-inter-medium mt-0.5 lowercase">
                        {link.date}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="py-10 text-center text-muted-foreground font-inter-medium text-sm opacity-50 italic lowercase">
                  no links shared yet
                </Text>
              )}
            </View>
          )}
        </ProCard>

        {/* Leave channel / Leave group only — not shown for 1:1 DMs */}
        {(isGroup || isChannel) && (
          <View className="px-6">
            <Button
              onPress={triggerDestructiveAction}
              variant="destructive"
              className="w-full rounded-2xl"
            >
              <Text className="font-inter-semibold lowercase text-white">
                {isChannel ? "leave channel" : "leave group"}
              </Text>
            </Button>
          </View>
        )}
      </ScrollView>

      {/* 
        ABSOLUTE HEADER
        Defined at the bottom of the root container to ensure it renders on top (Highest Z-Index)
      */}
      <View
        style={{
          paddingTop: Math.max(insets.top + 10, 20),
          paddingBottom: 16,
          paddingHorizontal: 20,
        }}
        className="flex-row items-center justify-between z-50 absolute top-0 left-0 right-0"
      >
        <Pressable
          onPress={() => router.back()}
          className="rounded-full bg-black/25 backdrop-blur-2xl p-2.5 active:bg-black/40 border border-white/20"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <View className="flex-1" />
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsInfoOverflowOpen(true);
          }}
          accessibilityLabel="More options"
          className="rounded-full border border-white/20 bg-black/25 p-2.5 backdrop-blur-2xl active:bg-black/40"
        >
          <MoreVertical size={20} color="white" />
        </Pressable>
      </View>

      {/* Overlays */}
      <MediaViewer
        visible={mediaViewer != null}
        items={chatMediaItems}
        initialIndex={mediaViewer?.initialIndex ?? 0}
        onClose={() => setMediaViewer(null)}
      />
      <MuteSheet
        isOpen={isMuteSheetOpen}
        onClose={() => setIsMuteSheetOpen(false)}
        onSelect={(value) => {
          handleMuteConfirmed(value, [chat.id]);
          setIsMuteSheetOpen(false);
        }}
        title={`Mute ${chat.title}?`}
        hasExistingMute={chat.isMuted}
      />
      <AddGroupMembersSheet
        open={isAddMembersSheetOpen}
        onOpenChange={setIsAddMembersSheetOpen}
        existingMemberIds={chat.members?.map((m) => m.id) || []}
        onAddMembers={handleAddMembers}
      />
      <MemberActionSheet
        open={!!memberActionTarget}
        onOpenChange={(open) => !open && setMemberActionTarget(null)}
        member={memberActionTarget}
        isAdmin={isAdmin}
        isChannel={isChannel}
        onAction={handleMemberAction}
      />
      <ChatInfoOverflowSheet
        open={isInfoOverflowOpen}
        onClose={() => setIsInfoOverflowOpen(false)}
        variant={overflowVariant}
        title={chat.title}
        chatId={chat.id}
        groupInviteCode={chat.groupInviteCode}
        username={chat.username}
        onOpenMuteSheet={() => setIsMuteSheetOpen(true)}
        showToast={(c) => showToast(c)}
      />

      {removeMemberPending && (
        <Dialog
          open={!!removeMemberPending}
          onOpenChange={(open) => {
            if (!open) setRemoveMemberPending(null);
          }}
        >
          <DialogContent
            className="w-[92%] sm:max-w-[400px]"
            onOpenChange={(open) => {
              if (!open) setRemoveMemberPending(null);
            }}
          >
            <DialogHeader className="w-full">
              <DialogTitle className="lowercase">
                {isChannel ? "remove from channel" : "remove from group"}
              </DialogTitle>
              <DialogDescription className="lowercase">
                {`remove ${removeMemberPending.displayName} from ${chat.title}? they won't be able to see new messages here.`}
              </DialogDescription>
            </DialogHeader>

            <View className="mt-3 w-full flex-row gap-2">
              <Pressable
                className="flex-1 rounded-xl bg-muted/50 py-3 active:bg-muted"
                onPress={() => setRemoveMemberPending(null)}
              >
                <Text className="text-center text-sm font-inter-medium lowercase text-foreground">
                  cancel
                </Text>
              </Pressable>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onPress={() => {
                  if (id && removeMemberPending) {
                    removeGroupMember(id, removeMemberPending.userId);
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    );
                    showToast({
                      message: isChannel
                        ? "removed from channel"
                        : "removed from group",
                    });
                  }
                  setRemoveMemberPending(null);
                }}
              >
                <Text className="font-inter-semibold lowercase text-white">
                  remove
                </Text>
              </Button>
            </View>
          </DialogContent>
        </Dialog>
      )}

      {(isGroup || isChannel) && isDestructiveActionOpen && (
        <Dialog
          open={isDestructiveActionOpen}
          onOpenChange={(open) => {
            setIsDestructiveActionOpen(open);
          }}
        >
          <DialogContent
            className="w-[92%] sm:max-w-[400px]"
            onOpenChange={(open) => {
              setIsDestructiveActionOpen(open);
            }}
          >
            <DialogHeader className="w-full">
              <DialogTitle className="lowercase">
                {isChannel ? "leave channel" : "leave group"}
              </DialogTitle>
              <DialogDescription className="lowercase">
                {isChannel
                  ? `you won't receive updates from ${chat.title} anymore.`
                  : `you won't receive messages from ${chat.title} anymore.`}
              </DialogDescription>
            </DialogHeader>

            <View className="flex-row gap-2 mt-3 w-full">
              <Pressable
                className="flex-1 py-3 bg-muted/50 active:bg-muted rounded-xl"
                onPress={() => setIsDestructiveActionOpen(false)}
              >
                <Text className="text-foreground font-inter-medium text-center text-sm lowercase">
                  cancel
                </Text>
              </Pressable>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onPress={() => {
                  executeDestructiveAction();
                  setIsDestructiveActionOpen(false);
                }}
              >
                <Text className="font-inter-semibold lowercase text-white">
                  leave
                </Text>
              </Button>
            </View>
          </DialogContent>
        </Dialog>
      )}
    </View>
  );
}
