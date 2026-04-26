import { Portal } from '@rn-primitives/portal';
import React, { useEffect } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  Share,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ChatInfoOverflowVariant = 'group' | 'channel' | 'contact';

type SheetAction = {
  key: string;
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  variant: ChatInfoOverflowVariant;
  title: string;
  chatId: string;
  groupInviteCode?: string | null;
  username?: string | null;
  /** Called after the sheet closes (e.g. open MuteSheet on next frame). */
  onOpenMuteSheet: () => void;
  showToast: (config: { message: string }) => void;
};

export function ChatInfoOverflowSheet({
  open,
  onClose,
  variant,
  title,
  chatId,
  groupInviteCode,
  username,
  onOpenMuteSheet,
  showToast,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (open) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        mass: 0.8,
      });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    }
  }, [open, translateY]);

  const dismissAnimated = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(dismissAnimated)();
      } else {
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 150,
          mass: 0.8,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const finishAnd = (fn: () => void | Promise<void>) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    void Promise.resolve(fn());
  };

  const finishMuteFlow = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    requestAnimationFrame(() => onOpenMuteSheet());
  };

  const buildActions = (): SheetAction[] => {
    const list: SheetAction[] = [];

    if (variant === 'group' || variant === 'channel') {
      if (groupInviteCode) {
        list.push({
          key: 'invite',
          label:
            variant === 'channel'
              ? 'copy channel invite link'
              : 'copy group invite link',
          onPress: () =>
            finishAnd(async () => {
              const link = `https://konekta.link/g/${groupInviteCode}`;
              await Clipboard.setStringAsync(link);
              showToast({ message: 'Invite link copied' });
            }),
        });
      }
      if (username) {
        list.push({
          key: 'username',
          label: 'copy username',
          onPress: () =>
            finishAnd(async () => {
              await Clipboard.setStringAsync(username);
              showToast({ message: 'Username copied' });
            }),
        });
      }
      list.push({
        key: 'id',
        label: variant === 'channel' ? 'copy channel id' : 'copy group id',
        onPress: () =>
          finishAnd(async () => {
            await Clipboard.setStringAsync(chatId);
            showToast({ message: 'ID copied' });
          }),
      });
      list.push({
        key: 'mute',
        label: 'mute notifications…',
        onPress: finishMuteFlow,
      });
      list.push({
        key: 'share',
        label: variant === 'channel' ? 'share channel' : 'share group',
        onPress: () =>
          finishAnd(async () => {
            const link = groupInviteCode
              ? `https://konekta.link/g/${groupInviteCode}`
              : undefined;
            try {
              await Share.share({
                title,
                message: link ? `${title}\n${link}` : title,
              });
            } catch {
              showToast({ message: 'Could not open share sheet' });
            }
          }),
      });
      list.push({
        key: 'report',
        label: variant === 'channel' ? 'report channel' : 'report group',
        destructive: true,
        onPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
          Alert.alert(
            variant === 'channel' ? 'report channel?' : 'report group?',
            'Our team will review this conversation. This is a demo — no report is sent yet.',
            [
              { text: 'cancel', style: 'cancel' },
              {
                text: 'report',
                style: 'destructive',
                onPress: () =>
                  showToast({ message: 'Thanks — report submitted (demo).' }),
              },
            ],
          );
        },
      });
    } else {
      if (username) {
        list.push({
          key: 'username',
          label: 'copy username',
          onPress: () =>
            finishAnd(async () => {
              await Clipboard.setStringAsync(username);
              showToast({ message: 'Username copied' });
            }),
        });
      }
      list.push({
        key: 'id',
        label: 'copy contact id',
        onPress: () =>
          finishAnd(async () => {
            await Clipboard.setStringAsync(chatId);
            showToast({ message: 'ID copied' });
          }),
      });
      list.push({
        key: 'mute',
        label: 'mute notifications…',
        onPress: finishMuteFlow,
      });
      list.push({
        key: 'share',
        label: 'share contact',
        onPress: () =>
          finishAnd(async () => {
            try {
              await Share.share({
                title,
                message: username ? `${title} (${username})` : title,
              });
            } catch {
              showToast({ message: 'Could not open share sheet' });
            }
          }),
      });
      list.push({
        key: 'block',
        label: 'block contact',
        destructive: true,
        onPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
          Alert.alert(
            'block contact?',
            'You will no longer receive messages or calls. This is a demo — no block is applied yet.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: () =>
                  showToast({ message: 'Block is not wired in the demo.' }),
              },
            ],
          );
        },
      });
    }

    return list;
  };

  const actions = buildActions();

  if (!open) return null;

  return (
    <Portal name="chat-info-overflow-sheet">
      <View className="absolute inset-0 z-[60]">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/40"
        >
          <Pressable className="flex-1" onPress={dismissAnimated} />
        </Animated.View>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              animatedStyle,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
            className="absolute bottom-0 left-0 right-0 max-w-[500px] self-center rounded-t-[28px] bg-card pt-2 shadow-2xl"
          >
            <View className="mb-2 items-center">
              <View className="h-1 w-10 rounded-full bg-muted opacity-30" />
            </View>

            <View className="mb-3 px-6">
              <Text variant="sheetTitle" numberOfLines={2}>
                {title}
              </Text>
              <Text variant="sheetDescription" className="mt-0.5 lowercase">
                {variant === 'channel'
                  ? 'channel'
                  : variant === 'group'
                    ? 'group'
                    : 'contact'}
              </Text>
            </View>

            <View className="mb-2">
              {actions.map((action) => (
                <Pressable
                  key={action.key}
                  onPress={action.onPress}
                  className="flex-row items-center px-6 py-3.5 active:bg-muted/50"
                >
                  <Text
                    variant="listBody"
                    className={
                      action.destructive
                        ? 'font-inter-semibold text-destructive'
                        : 'text-foreground'
                    }
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                dismissAnimated();
              }}
              className="mx-4 mb-1 items-center rounded-2xl bg-muted/40 py-3.5 active:bg-muted/60"
            >
              <Text variant="listTitle" className="lowercase">
                cancel
              </Text>
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
    </Portal>
  );
}
