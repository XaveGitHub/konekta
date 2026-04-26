import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Portal } from "@rn-primitives/portal";
import {
  Phone,
  QrCode,
  X,
  Scan,
  User,
  UserPlus,
  ChevronLeft,
} from "lucide-react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Contact } from "@/lib/mocks/contactsStore";
import { THEME } from "@/lib/theme";
import { useColorScheme } from "nativewind";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Pressable,
  View,
  Dimensions,
  ActivityIndicator,
  Platform,
  Keyboard,
  KeyboardEvent,
  BackHandler,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { CameraView, useCameraPermissions } from "expo-camera";

interface AddContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddContact?: (name: string, phone: string) => void;
  /** When the sheet opens, start on this step (e.g. settings → scan). */
  initialFlow?: "choose" | "phone" | "qr";
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function AddContactSheet({
  open,
  onOpenChange,
  onAddContact,
  initialFlow = "choose",
}: AddContactSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const palette = THEME[isDark ? "dark" : "light"];
  const tint = palette.primary;
  const onPrimary = palette.primaryForeground;
  const iconMuted = isDark ? "#A1A1AA" : "#8E8E93";
  const chevronFwd = isDark ? "#6B7280" : "#C7C7CC";

  const [flow, setFlow] = useState<"choose" | "phone" | "qr">("choose");
  const [permission, requestPermission] = useCameraPermissions();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [scannedUser, setScannedUser] = useState<Contact | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSheetSettled, setIsSheetSettled] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  /** Lifts the whole sheet with the keyboard (must be a shared value for useAnimatedStyle). */
  const keyboardOffsetSV = useSharedValue(0);
  const closingRef = useRef(false);

  const finalizeClose = useCallback(() => {
    closingRef.current = false;
    keyboardOffsetSV.value = 0;
    onOpenChange(false);
    setName("");
    setPhone("");
    setFlow("choose");
    setScannedUser(null);
    setIsConnecting(false);
    setKeyboardHeight(0);
    setIsSheetSettled(false);
  }, [onOpenChange, keyboardOffsetSV]);

  const beginClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    Keyboard.dismiss();
    keyboardOffsetSV.value = withTiming(0, { duration: 180 });
    cancelAnimation(translateY);
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(finalizeClose)();
    });
  }, [translateY, finalizeClose, keyboardOffsetSV]);

  useEffect(() => {
    cancelAnimation(translateY);
    closingRef.current = false;
    if (open) {
      keyboardOffsetSV.value = 0;
      translateY.value = SCREEN_HEIGHT;
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        mass: 0.8,
      });
    } else {
      keyboardOffsetSV.value = 0;
      translateY.value = SCREEN_HEIGHT;
    }
  }, [open, translateY, keyboardOffsetSV]);

  // Sync keyboard logic to lift the sheet by exact pixel height
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      const h = e.endCoordinates.height;
      setKeyboardHeight(h);
      keyboardOffsetSV.value = withTiming(h, { duration: 220 });
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      keyboardOffsetSV.value = withTiming(0, { duration: 220 });
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardOffsetSV]);

  // Safe mount for QR scanner after slide animation
  useEffect(() => {
    if (open) {
      setFlow(initialFlow);
      setScannedUser(null);
      const timer = setTimeout(() => setIsSheetSettled(true), 400);
      return () => clearTimeout(timer);
    }
    setIsSheetSettled(false);
  }, [open, initialFlow]);

  // Request permissions when entering QR flow
  useEffect(() => {
    if (flow === "qr" && !permission?.granted && open) {
      requestPermission();
    }
  }, [flow, permission, requestPermission, open]);

  /** Android: consume system back so the stack does not pop under the sheet. */
  useEffect(() => {
    if (!open || Platform.OS !== "android") return;

    const onHardwareBack = () => {
      if (keyboardHeight > 0 && flow === "phone") {
        Keyboard.dismiss();
        return true;
      }
      if (flow === "qr" && scannedUser) {
        setScannedUser(null);
        return true;
      }
      if (flow === "qr" || flow === "phone") {
        setFlow("choose");
        return true;
      }
      beginClose();
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => sub.remove();
  }, [open, flow, scannedUser, keyboardHeight, beginClose]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(beginClose)();
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
          mass: 0.8,
        });
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value - keyboardOffsetSV.value },
    ],
  }));

  if (!open) return null;

  const handleConnect = async () => {
    if (!name.trim() || !phone.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsConnecting(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (onAddContact) {
      onAddContact(name, phone);
    }

    setIsConnecting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    beginClose();
  };

  const applyProfileLinkToScannedUser = (rawHandle: string) => {
    const handle = decodeURIComponent(rawHandle).replace(/^@/, "");
    const pretty = handle
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    setScannedUser({
      id: `qr-user-${handle}`,
      name: pretty || handle,
      username: `@${handle}`,
      phone: "+1 (555) 000-0000",
      avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(handle)}`,
      status: "Available",
      isOnline: true,
    });
  };

  const handleQrScan = ({ data }: { data: string }) => {
    if (scannedUser || isConnecting) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const fromPath = data.match(/konekta\.link\/u\/([^/?#]+)/i);
    if (fromPath) {
      applyProfileLinkToScannedUser(fromPath[1]);
      return;
    }

    const trimmed = data.trim();
    if (trimmed.startsWith("http")) {
      try {
        const u = new URL(trimmed);
        const host = u.hostname.replace(/^www\./i, "");
        const pathMatch = u.pathname.match(/^\/u\/([^/]+)/);
        if (host === "konekta.link" && pathMatch) {
          applyProfileLinkToScannedUser(pathMatch[1]);
          return;
        }
      } catch {
        /* fall through */
      }
    }

    if (data.includes("mock-qr")) {
      setScannedUser({
        id: "qr-user-" + Date.now(),
        name: "Sarah Jenkins",
        username: "@sarah_j",
        phone: "+1 (555) 999-1234",
        avatarUrl: "https://i.pravatar.cc/150?u=sarahj",
        status: "Available",
        isOnline: true,
      });
      return;
    }

    setScannedUser({
      id: "qr-user-" + Date.now(),
      name: "Sarah Jenkins",
      username: "@sarah_j",
      phone: "+1 (555) 999-1234",
      avatarUrl: "https://i.pravatar.cc/150?u=sarahj",
      status: "Available",
      isOnline: true,
    });
  };

  const handleAddScannedUser = async () => {
    if (!scannedUser) return;
    setIsConnecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (onAddContact) {
      onAddContact(scannedUser.name, scannedUser.phone);
    }

    setIsConnecting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    beginClose();
  };

  return (
    <Portal name="add-contact">
      <View className="absolute inset-0 z-50">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/40"
        >
          <Pressable className="flex-1" onPress={beginClose} />
        </Animated.View>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              sheetAnimatedStyle,
              { maxHeight: SCREEN_HEIGHT * 0.85 },
            ]}
            className="absolute bottom-0 left-0 right-0 w-full self-center rounded-t-[28px] bg-card pb-8 pt-2 shadow-2xl max-w-[500px]"
          >
            <View className="relative">
              <View className="items-center mb-2">
                <View className="w-10 h-1 rounded-full bg-muted opacity-30" />
              </View>

              {flow === "choose" ? (
                <>
                  <Pressable
                    accessibilityLabel="Close"
                    hitSlop={16}
                    onPress={beginClose}
                    className="absolute right-3 top-1 z-10 rounded-full bg-muted/30 p-2.5 active:bg-muted/50"
                  >
                    <X size={20} color={iconMuted} />
                  </Pressable>

                  <View className="px-6 pb-2">
                    <View className="mb-4 items-center">
                      <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <UserPlus size={32} color={tint} />
                      </View>
                      <Text className="text-center font-inter-black lowercase text-2xl text-primary tracking-tighter">
                        new connection
                      </Text>
                      <Text className="mt-1.5 px-2 text-center font-inter-medium lowercase text-base text-muted-foreground">
                        add someone by phone or scan their konekta profile qr.
                      </Text>
                    </View>
                  </View>

                  <View className="px-6 pb-6">
                    <Animated.View entering={FadeIn} exiting={FadeOut} key="chooser">
                      <View className="overflow-hidden rounded-2xl bg-muted/15">
                        <Pressable
                          onPress={() => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setFlow("phone");
                          }}
                          className="flex-row items-center border-b border-border/15 px-4 py-3.5 active:bg-muted/40"
                        >
                          <View className="mr-3.5 h-11 w-11 items-center justify-center rounded-full bg-blue-500/12">
                            <Phone size={22} color="#3B82F6" />
                          </View>
                          <View className="min-w-0 flex-1 pr-2">
                            <Text className="font-inter-semibold lowercase tracking-tight text-[17px] text-foreground">
                              add by phone number
                            </Text>
                            <Text
                              className="mt-0.5 font-inter-medium lowercase text-[14px] text-muted-foreground"
                              numberOfLines={2}
                            >
                              nickname and phone (mock)
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={chevronFwd} />
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setFlow("qr");
                          }}
                          className="flex-row items-center px-4 py-3.5 active:bg-muted/40"
                        >
                          <View className="mr-3.5 h-11 w-11 items-center justify-center rounded-full bg-purple-500/12">
                            <QrCode size={22} color="#A855F7" />
                          </View>
                          <View className="min-w-0 flex-1 pr-2">
                            <Text className="font-inter-semibold lowercase tracking-tight text-[17px] text-foreground">
                              scan qr code
                            </Text>
                            <Text
                              className="mt-0.5 font-inter-medium lowercase text-[14px] text-muted-foreground"
                              numberOfLines={2}
                            >
                              point camera at a konekta profile link
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={chevronFwd} />
                        </Pressable>
                      </View>
                    </Animated.View>
                  </View>
                </>
              ) : (
                <>
                  <View className="flex-row items-center justify-between px-6 pb-3">
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setFlow("choose");
                          setScannedUser(null);
                        }}
                        className="-ml-2 rounded-full bg-muted/30 p-2 active:bg-muted/50"
                      >
                        <ChevronLeft size={24} color={tint} />
                      </Pressable>
                      <Text className="font-inter-semibold lowercase tracking-tight text-2xl text-foreground">
                        {flow === "phone" ? "via phone" : "via qr scan"}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel="Close"
                      hitSlop={14}
                      onPress={beginClose}
                      className="rounded-full bg-muted/30 p-2.5 active:bg-muted/50"
                    >
                      <X size={20} color={iconMuted} />
                    </Pressable>
                  </View>

                  <View className="px-6 pb-6">
                  {flow === "phone" ? (
                    <Animated.View entering={FadeIn} exiting={FadeOut} key="phone-flow">
                      <View className="gap-5">
                        <View>
                          <Text className="mb-1.5 ml-0.5 font-inter-medium lowercase tracking-tight text-xs text-muted-foreground">
                            nickname
                          </Text>
                          <View className="flex-row items-center rounded-2xl border border-border/20 bg-muted/10 px-4">
                            <User size={18} color={iconMuted} />
                            <Input
                              value={name}
                              onChangeText={setName}
                              placeholder="contact name"
                              className="h-14 flex-1 border-0 bg-transparent text-[16px]"
                              autoFocus
                            />
                          </View>
                        </View>

                        <View>
                          <Text className="mb-1.5 ml-0.5 font-inter-medium lowercase tracking-tight text-xs text-muted-foreground">
                            phone number
                          </Text>
                          <View className="flex-row items-center rounded-2xl border border-border/20 bg-muted/10 px-4">
                            <Pressable className="mr-3 flex-row items-center gap-1 border-r border-border/30 pr-3">
                              <Text className="font-inter-semibold text-[16px] text-primary">+1</Text>
                              <Ionicons name="caret-down" size={12} color={tint} />
                            </Pressable>
                            <Input
                              value={phone}
                              onChangeText={setPhone}
                              placeholder="555 000 0000"
                              keyboardType="phone-pad"
                              className="h-14 flex-1 border-0 bg-transparent text-[16px]"
                            />
                          </View>
                        </View>

                        <View className="mt-3 w-full">
                          <Button
                            className="w-full rounded-2xl"
                            onPress={handleConnect}
                            disabled={isConnecting || !name.trim() || !phone.trim()}
                          >
                            {isConnecting ? (
                              <ActivityIndicator color={onPrimary} />
                            ) : (
                              <Text className="font-inter-semibold lowercase text-primary-foreground">
                                connect
                              </Text>
                            )}
                          </Button>
                        </View>
                      </View>
                    </Animated.View>
                  ) : (
                    <Animated.View entering={FadeIn} exiting={FadeOut} key="qr-flow">
                      <View className="items-center">
                        {scannedUser ? (
                          <View className="w-full items-center rounded-3xl border border-border/30 bg-card p-6">
                            <Avatar alt={scannedUser?.name || ""} className="mb-4 h-24 w-24">
                              <AvatarImage src={scannedUser?.avatarUrl} />
                              <AvatarFallback className="bg-muted">
                                <Text className="font-inter-semibold text-2xl text-foreground">
                                  {scannedUser?.name
                                    ? scannedUser.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                    : "?"}
                                </Text>
                              </AvatarFallback>
                            </Avatar>

                            <Text className="font-inter-semibold text-xl tracking-tight text-foreground">
                              {scannedUser?.name}
                            </Text>
                            <Text className="mb-6 mt-0.5 font-inter-medium text-sm text-muted-foreground">
                              {scannedUser?.username}
                            </Text>

                            <View className="mt-1 w-full flex-row gap-3">
                              <Button
                                variant="secondary"
                                className="flex-1 rounded-2xl"
                                onPress={() => {
                                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setScannedUser(null);
                                }}
                              >
                                <Text className="font-inter-semibold lowercase">scan again</Text>
                              </Button>
                              <Button
                                className="flex-[2] rounded-2xl"
                                onPress={handleAddScannedUser}
                                disabled={isConnecting}
                              >
                                {isConnecting ? (
                                  <ActivityIndicator color={onPrimary} />
                                ) : (
                                  <Text className="font-inter-semibold lowercase text-primary-foreground">
                                    add
                                  </Text>
                                )}
                              </Button>
                            </View>
                          </View>
                        ) : (
                          <View className="w-full">
                            <View className="relative aspect-square w-full overflow-hidden rounded-3xl bg-black">
                              {permission?.granted && isSheetSettled ? (
                                <CameraView
                                  className="flex-1"
                                  facing="back"
                                  onBarcodeScanned={handleQrScan}
                                  barcodeScannerSettings={{
                                    barcodeTypes: ["qr"],
                                  }}
                                />
                              ) : (
                                <View className="flex-1 items-center justify-center px-10">
                                  <Scan size={48} color="rgba(255,255,255,0.45)" strokeWidth={1} />
                                  <Text className="mt-4 text-center font-inter-medium lowercase leading-5 text-sm text-white/70">
                                    camera access is needed to scan qr codes
                                  </Text>
                                  <Button
                                    variant="outline"
                                    className="mt-6 w-full max-w-[280px] rounded-2xl border-white/25 bg-transparent"
                                    onPress={() => {
                                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      void requestPermission();
                                    }}
                                  >
                                    <Text className="font-inter-semibold lowercase text-white">
                                      allow camera
                                    </Text>
                                  </Button>
                                </View>
                              )}

                              <View
                                className="pointer-events-none absolute inset-0 items-center justify-center bg-black/40"
                              >
                                <View className="relative h-64 w-64 rounded-3xl border-2 border-white/30">
                                  <View className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-primary" />
                                  <View className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-primary" />
                                  <View className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-primary" />
                                  <View className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-primary" />
                                </View>
                              </View>
                            </View>

                            <Button
                              variant="secondary"
                              className="mt-3 w-full rounded-2xl"
                              onPress={() => {
                                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                handleQrScan({ data: "mock-qr" });
                              }}
                            >
                              <QrCode size={20} color={tint} />
                              <Text className="font-inter-semibold lowercase text-secondary-foreground">
                                simulate scan
                              </Text>
                            </Button>
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  )}
                </View>
                </>
              )}
            </View>
          </Animated.View>
          </GestureDetector>
      </View>
    </Portal>
  );
}
