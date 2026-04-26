import React, { useCallback, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Haptics from "expo-haptics";
import { ZoomableImage } from "@/components/chat/ZoomableImage";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export type MediaViewerItem = {
  uri: string;
  type: "image" | "video";
};

type MediaViewerProps = {
  visible: boolean;
  items: MediaViewerItem[];
  initialIndex: number;
  onClose: () => void;
};

/** Fullscreen video with system controls (Messenger / Instagram style). */
function ViewerVideoPage({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  useEventListener(player, "playToEnd", () => {
    player.pause();
    player.currentTime = 0;
  });

  return (
    <View style={pageStyles.page}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

const pageStyles = StyleSheet.create({
  page: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: "#000",
    justifyContent: "center",
  },
});

export function MediaViewer({
  visible,
  items,
  initialIndex,
  onClose,
}: MediaViewerProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<MediaViewerItem>>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  React.useEffect(() => {
    if (visible) {
      const idx = Math.min(initialIndex, Math.max(0, items.length - 1));
      setActiveIndex(idx);
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: idx, animated: false });
      });
    }
  }, [visible, initialIndex, items.length]);

  if (!visible || items.length === 0) return null;

  const safeInitial = Math.min(initialIndex, Math.max(0, items.length - 1));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.shell}>
        <View
          style={[
            styles.header,
            { paddingTop: Math.max(insets.top, 12), paddingHorizontal: 16 },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={handleClose}
            style={styles.headerBtn}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {items.length > 1 ? (
            <Text style={styles.counter}>
              {activeIndex + 1} / {items.length}
            </Text>
          ) : (
            <View style={{ width: 44 }} />
          )}
          <View style={{ width: 44 }} />
        </View>

        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={items}
          keyExtractor={(item, index) => `${item.uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={safeInitial}
          getItemLayout={(_, index) => ({
            length: SCREEN_W,
            offset: SCREEN_W * index,
            index,
          })}
          removeClippedSubviews={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 85 }}
          renderItem={({ item, index }) => (
            <View style={{ width: SCREEN_W, height: SCREEN_H }}>
              {item.type === "image" ? (
                <ZoomableImage uri={item.uri} />
              ) : (
                <ViewerVideoPage uri={item.uri} />
              )}
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  counter: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
