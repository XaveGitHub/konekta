import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Tabs, usePathname } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  StyleSheet,
  Text,
  type ViewStyle,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Toast from "@/components/ui/Toast";
import { useChat } from "@/context/ChatContext";
import {
  TAB_BAR_HEIGHT,
  tabBarBottomInset,
  toastBottomOffsetTabScreen,
} from "@/lib/tabScreenLayout";
import { ROOT_WINDOW_BACKGROUND, THEME } from "@/lib/theme";

type TabName = "chats" | "contacts" | "settings";

const TAB_CONFIG: Record<
  TabName,
  { active: React.ComponentProps<typeof Ionicons>["name"]; inactive: React.ComponentProps<typeof Ionicons>["name"] }
> = {
  chats: { active: "chatbubbles", inactive: "chatbubbles-outline" },
  contacts: { active: "people", inactive: "people-outline" },
  settings: { active: "settings", inactive: "settings-outline" },
};

/** Icon area height — borderRadius = half of this for a true capsule, not a square. */
const TAB_ICON_CHIP_HEIGHT = 36;
const TAB_ICON_SIZE = 24;

/** Softer but clearly visible orange wash; glyph stays full `primary` orange. */
const PILL_ORANGE_LIGHT = "rgba(255, 92, 0, 0.4)";
const PILL_ORANGE_DARK = "rgba(255, 107, 0, 0.45)";

/** Slightly more muted than tab tint so active vs idle reads clearly. */
function mutedTabIconColor(isDark: boolean): string {
  return isDark ? "rgba(255, 255, 255, 0.32)" : "rgba(60, 60, 67, 0.4)";
}

/**
 * - Orange wash lives on a **separate layer** behind the icon: it can scale (bloom) while **TAB_ICON_SIZE** stays fixed.
 * - Spring on select, timed ease-out on deselect.
 */
type TabBarButtonProps = PressableProps & {
  name: string;
  label: string;
  activeColor: string;
  inactiveColor: string;
  unreadCount?: number;
};

const TabBarButton = (raw: TabBarButtonProps) => {
  const {
    onPress,
    style,
    children: _children,
    name,
    label,
    activeColor,
    inactiveColor: _inactiveColor,
    accessibilityState,
    unreadCount = 0,
    ...rest
  } = raw;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const pathname = usePathname();

  const focused = pathname === `/${name}` || (name === "chats" && pathname === "/");

  const focusProgress = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    if (focused) {
      /** Slower, calmer spring: lower stiffness + a touch more mass than “snappy” defaults. */
      focusProgress.value = withSpring(1, {
        damping: 20,
        stiffness: 120,
        mass: 0.55,
      });
    } else {
      focusProgress.value = withTiming(0, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [focused, focusProgress]);

  const showUnread = name === "chats" && unreadCount > 0;
  const cfg = TAB_CONFIG[name as TabName];
  const softPill = isDark ? PILL_ORANGE_DARK : PILL_ORANGE_LIGHT;

  const animatedPillStyle = useAnimatedStyle(() => {
    const t = focusProgress.value;
    const bg = interpolateColor(t, [0, 1], ["rgba(0,0,0,0)", softPill]);
    /** Only the wash scales — gives a “fill / bloom” without growing the icon glyph. */
    const s = interpolate(t, [0, 1], [0.86, 1]);
    return {
      backgroundColor: bg,
      transform: [{ scale: s }],
    };
  });

  if (!cfg) {
    return null;
  }

  const icon = focused ? cfg.active : cfg.inactive;
  const primaryHex = isDark ? THEME.dark.primary : THEME.light.primary;
  const idleMuted = mutedTabIconColor(isDark);
  const iconColor = focused ? primaryHex : idleMuted;
  const labelColor = focused ? activeColor : idleMuted;

  const chipRadius = TAB_ICON_CHIP_HEIGHT / 2;

  /**
   * `BottomTabItem` passes `tabVerticalUiKit` on the default pressable:
   * `justifyContent: "flex-start"` and `padding: 5` (see
   * `@react-navigation/bottom-tabs` / BottomTabItem). That pins the column to the
   * top of the tab — it reads “stuck high” in a fixed-height bar. Spreading those
   * rules and *then* appending the override restores equal top/bottom centering
   * (the layout you had when a broken `style` merge effectively dropped the
   * library defaults and only our centering applied).
   */
  const tabButtonLayoutOverride = {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 0,
  };

  /** Flatten one level so nested style arrays from the tab bar merge predictably. */
  const toStyleArray = (s: unknown): ViewStyle[] => {
    if (s == null) {
      return [];
    }
    return (Array.isArray(s) ? s : [s]).flat() as ViewStyle[];
  };

  const pressableStyle: PressableProps["style"] =
    typeof style === "function"
      ? (state: PressableStateCallbackType) => {
          const resolved = style(state);
          return [...toStyleArray(resolved), tabButtonLayoutOverride];
        }
      : [...toStyleArray(style), tabButtonLayoutOverride];

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={label}
      hitSlop={{ top: 6, bottom: 8, left: 4, right: 4 }}
      // Disable colored ripple — it stacked with the pill and looked like a stray orange flash.
      android_ripple={{ color: "rgba(0,0,0,0)" }}
      style={pressableStyle}
      onPress={(e) => {
        if (!focused) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
      }}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 0,
          minHeight: 48,
        }}
      >
        <View
          style={{
            position: "relative",
            overflow: "visible",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/*
            Badge sits **outside** the `overflow: 'hidden'` chip (otherwise the red pill is clipped).
            Only the wash + icon are clipped to the rounded rect.
          */}
          <View
            style={{
              height: TAB_ICON_CHIP_HEIGHT,
              minWidth: TAB_ICON_CHIP_HEIGHT,
              paddingHorizontal: 11,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: chipRadius,
              overflow: "hidden",
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: chipRadius,
                },
                animatedPillStyle,
              ]}
            />
            <View
              style={{
                zIndex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={icon} size={TAB_ICON_SIZE} color={iconColor} />
            </View>
          </View>
          {showUnread ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                right: -4,
                top: -4,
                zIndex: 2,
                minWidth: 18,
                minHeight: 18,
                paddingHorizontal: 5,
                borderRadius: 9,
                backgroundColor: "#FF3B30",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: isDark ? "rgba(32, 32, 35, 1)" : "rgba(255,255,255,1)",
              }}
            >
              {unreadCount > 99 ? (
                <Text
                  style={{
                    color: "white",
                    fontSize: 8,
                    fontWeight: "700",
                  }}
                >
                  99+
                </Text>
              ) : (
                <Text
                  style={{
                    color: "white",
                    fontSize: 10,
                    fontWeight: "600",
                  }}
                >
                  {unreadCount}
                </Text>
              )}
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 10,
            fontWeight: "600",
            color: labelColor,
            marginTop: 0,
            lineHeight: 12,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { chats, archivedChatIds, toast, setToast } = useChat();

  const tabBarBottom = tabBarBottomInset(insets);

  const totalUnread = chats.reduce(
    (acc, chat) =>
      !archivedChatIds.has(chat.id) ? acc + (chat.unreadCount || 0) : acc,
    0,
  );

  const activeColor = isDark ? "#ffffff" : THEME.light.primary;
  const inactiveColor = isDark
    ? "rgba(255,255,255,0.45)"
    : "rgba(60,60,67,0.5)";

  const sceneBg = isDark
    ? ROOT_WINDOW_BACKGROUND.dark
    : ROOT_WINDOW_BACKGROUND.light;

  return (
    <View style={{ flex: 1, backgroundColor: sceneBg }}>
      <View style={{ flex: 1, zIndex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            /** `fade` cross-fades tab scenes and often reads as a blink. */
            animation: "none",
            lazy: false,
            tabBarShowLabel: false,
            tabBarActiveTintColor: activeColor,
            tabBarInactiveTintColor: inactiveColor,
            // Container: transparent, full-width so RN centers icons properly.
            tabBarStyle: {
              position: "absolute",
              bottom: tabBarBottom,
              left: 0,
              right: 0,
              borderTopWidth: 0,
              elevation: 0,
              backgroundColor: "transparent",
              height: TAB_BAR_HEIGHT,
              paddingTop: 0,
              paddingBottom: 0,
              // Match the marginHorizontal of the visual pill background (28)
              // so buttons reach the 'corners' of the pill.
              paddingHorizontal: 28,
            },
            // Visual pill — the glass look users see with true 3D floating depth
            tabBarBackground: () => (
              <View
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  paddingVertical: 1,
                  // Add a soft shadow to make the bar truly "float"
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: isDark ? 0.5 : 0.15,
                  shadowRadius: 20,
                  elevation: 20,
                }}
              >
                <View
                  style={{
                    marginHorizontal: 28,
                    flex: 1,
                    borderRadius: 100, 
                    // True Glass transparency (0.75 in dark, 0.8 in light)
                    backgroundColor: isDark ? "rgba(24, 24, 27, 0.75)" : "rgba(255, 255, 255, 0.8)",
                    borderWidth: 1.5,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.12)" 
                      : "rgba(0,0,0,0.08)",
                    borderStyle: "solid",
                    overflow: "hidden",
                  }}
                >
                  <BlurView
                    tint={isDark ? "dark" : "light"}
                    intensity={Platform.OS === "ios" ? 80 : 100}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ),
          }}
        >
          <Tabs.Screen
            name="chats"
            options={{
              title: "Chats",
              tabBarButton: (props) => (
                <TabBarButton
                  {...props}
                  name="chats"
                  label="Chats"
                  activeColor={activeColor}
                  inactiveColor={inactiveColor}
                  unreadCount={totalUnread}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="contacts"
            options={{
              title: "Contacts",
              tabBarButton: (props) => (
                <TabBarButton
                  {...props}
                  name="contacts"
                  label="Contacts"
                  activeColor={activeColor}
                  inactiveColor={inactiveColor}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              tabBarButton: (props) => (
                <TabBarButton
                  {...props}
                  name="settings"
                  label="Settings"
                  activeColor={activeColor}
                  inactiveColor={inactiveColor}
                />
              ),
            }}
          />
        </Tabs>
      </View>

      {toast ? (
        <View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}
        >
          <Toast
            key={toast.id}
            message={toast.message}
            icon={toast.icon}
            countdown={toast.countdown}
            onUndo={toast.onUndo}
            onDismiss={toast.onDismiss}
            onHide={() => setToast(null)}
            bottomOffset={toastBottomOffsetTabScreen(insets)}
          />
        </View>
      ) : null}
    </View>
  );
}
