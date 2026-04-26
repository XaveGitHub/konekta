import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import {
  User,
  ShieldCheck,
  ShieldX,
  UserMinus,
  MessageSquare,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MemberActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    name: string;
    role: "admin" | "member";
    avatarUrl?: string | null;
  } | null;
  isAdmin: boolean; 
  isChannel?: boolean;
  onAction: (action: "promote" | "demote" | "remove" | "profile" | "message") => void;
}

export function MemberActionSheet({
  open,
  onOpenChange,
  member,
  isAdmin,
  isChannel,
  onAction,
}: MemberActionSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!open || !member) return null;

  const isMemberAdmin = member.role === "admin";
  const iconColor = isDark ? "#ffffff" : "#1C1C1E";

  const ActionRow = ({ 
    icon: Icon, 
    label, 
    onPress, 
    destructive = false,
    color,
    isLast = false,
  }: { 
    icon: any; 
    label: string; 
    onPress: () => void;
    destructive?: boolean;
    color?: string;
    isLast?: boolean;
  }) => (
    <Pressable
      onPress={() => {
        onPress();
        onOpenChange(false);
      }}
      className={`flex-row items-center px-4 py-3.5 active:bg-muted/50 ${!isLast ? 'border-b border-border/10' : ''}`}
    >
      <Icon size={18} color={color || (destructive ? "#EF4444" : iconColor)} className="opacity-80" />
      <Text
        variant="listBody"
        className={`ml-3 text-[15px] ${destructive ? "text-destructive" : "text-foreground"}`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={StyleSheet.absoluteFill} className="z-[1000]" pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={StyleSheet.absoluteFill}
        className="bg-black/20"
      >
        <Pressable className="flex-1" onPress={() => onOpenChange(false)} />
      </Animated.View>

      {/* Floating Menu Container */}
      <View className="flex-1 items-center justify-center p-6">
        <Animated.View
          entering={FadeIn.duration(150).delay(50)}
          exiting={FadeOut.duration(150)}
          className="w-full max-w-[260px] bg-card rounded-[22px] border border-border/50 shadow-2xl overflow-hidden"
        >
          {/* Mini Header */}
          <View className="px-4 py-4 bg-muted/20 border-b border-border/10">
            <View className="flex-row items-center">
              <Avatar className="w-10 h-10" alt={""}>
                <AvatarImage src={member.avatarUrl || undefined} />
                <AvatarFallback>
                  <Text className="text-sm font-inter-semibold text-foreground">
                    {member.name[0]}
                  </Text>
                </AvatarFallback>
              </Avatar>
              <View className="ml-3 flex-1">
                <Text variant="listTitle" numberOfLines={1}>
                  {member.name}
                </Text>
                <Text
                  variant="listSubtitle"
                  className="mt-0.5 text-xs lowercase tracking-tight"
                >
                  {isMemberAdmin
                    ? isChannel
                      ? "channel admin"
                      : "group admin"
                    : isChannel
                      ? "subscriber"
                      : "member"}
                </Text>
              </View>
            </View>
          </View>

          {/* Action List */}
          <View>
            <ActionRow 
               icon={User} 
               label="view profile" 
               onPress={() => onAction("profile")} 
            />
            <ActionRow 
               icon={MessageSquare} 
               label="send message" 
               onPress={() => onAction("message")} 
            />

            {isAdmin && (
              <>
                {isMemberAdmin ? (
                  <ActionRow 
                     icon={ShieldX} 
                     label="dismiss as admin" 
                     onPress={() => onAction("demote")}
                  />
                ) : (
                  <ActionRow 
                     icon={ShieldCheck} 
                     label={isChannel ? "make channel admin" : "make group admin"} 
                     onPress={() => onAction("promote")}
                     color="#3B82F6"
                  />
                )}
                <ActionRow 
                  icon={UserMinus} 
                  label={isChannel ? "remove from channel" : "remove from group"} 
                  destructive 
                  isLast
                  onPress={() => onAction("remove")}
                />
              </>
            )}
          </View>
        </Animated.View>

        {/* Cancel Button below the menu for easier thumb reach */}
        <Pressable 
          onPress={() => onOpenChange(false)}
          className="mt-4 px-8 py-3 rounded-full bg-card border border-border/30 active:bg-muted/50 shadow-sm"
        >
           <Text className="text-[14px] font-inter-semibold text-muted-foreground lowercase">cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
