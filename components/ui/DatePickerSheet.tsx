import { Portal } from "@rn-primitives/portal";
import React, { useEffect, useState } from "react";
import { Dimensions, Pressable, View, FlatList } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { Button } from "./button";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITEM_HEIGHT = 44;

const MOCK_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MOCK_DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const MOCK_YEARS = Array.from({ length: 110 }, (_, i) => (1920 + i).toString());

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

function WheelItem({ item, index, scrollY }: { item: string, index: number, scrollY: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const itemCenterOffset = (index - 2) * ITEM_HEIGHT;
    
    // Expand bounds to calculate deep multi-level cylinder curvature 
    const inputRange = [
      itemCenterOffset - 2 * ITEM_HEIGHT,  // 2 slots away
      itemCenterOffset - ITEM_HEIGHT,      // 1 slot away
      itemCenterOffset,                    // Center point
      itemCenterOffset + ITEM_HEIGHT,      // 1 slot away
      itemCenterOffset + 2 * ITEM_HEIGHT,  // 2 slots away
    ];

    const opacity = interpolate(scrollY.value, inputRange, [0.25, 0.6, 1, 0.6, 0.25], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, inputRange, [0.75, 0.9, 1.1, 0.9, 0.75], Extrapolation.CLAMP);
    
    // Softer 3D spatial rotation mapped to the scroll curve
    const rotateX = interpolate(scrollY.value, inputRange, [40, 20, 0, -20, -40], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [
        { perspective: 200 },
        { rotateX: `${rotateX}deg` as const },
        { scale }
      ],
    };
  });

  return (
    <View style={{ height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" }}>
      <Animated.Text
        style={animatedStyle}
        className="font-inter-semibold text-foreground text-lg"
      >
        {item !== "" ? item : " "}
      </Animated.Text>
    </View>
  );
}

function WheelPickerColumn({
  data,
  selectedIndex,
  onValueChange,
}: {
  data: string[];
  selectedIndex: number;
  onValueChange: (idx: number) => void;
}) {
  const [localIndex, setLocalIndex] = useState(() => Math.max(0, selectedIndex));
  const paddedData = ["", "", ...data, "", ""];
  
  const scrollY = useSharedValue(localIndex * ITEM_HEIGHT);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View className="flex-1 h-[220px]">
      <AnimatedFlatList
        data={paddedData}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={localIndex}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e: any) => {
          const offsetY = e.nativeEvent.contentOffset.y;
          const index = Math.round(offsetY / ITEM_HEIGHT);
          if (data[index]) {
            setLocalIndex(index);
            onValueChange(index);
          }
        }}
        renderItem={({ item, index }) => (
          <WheelItem item={item as string} index={index} scrollY={scrollY} />
        )}
        keyExtractor={(item, index) => `${item}-${index}`}
      />
    </View>
  );
}

type DatePickerSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  title: string;
  initialDate?: Date;
};

export function DatePickerSheet({
  isOpen,
  onClose,
  onSelect,
  title,
  initialDate,
}: DatePickerSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  // Default to a 1990 date if none provided
  const safeInitialDate = initialDate || new Date(1990, 0, 1);
  const [monthIdx, setMonthIdx] = useState(safeInitialDate.getMonth());
  const [dayIdx, setDayIdx] = useState(safeInitialDate.getDate() - 1);
  const [yearIdx, setYearIdx] = useState(MOCK_YEARS.indexOf(safeInitialDate.getFullYear().toString()) !== -1 ? MOCK_YEARS.indexOf(safeInitialDate.getFullYear().toString()) : 70);

  useEffect(() => {
    if (isOpen) {
      const resetDate = initialDate || new Date(1990, 0, 1);
      setMonthIdx(resetDate.getMonth());
      setDayIdx(resetDate.getDate() - 1);
      setYearIdx(MOCK_YEARS.indexOf(resetDate.getFullYear().toString()) !== -1 ? MOCK_YEARS.indexOf(resetDate.getFullYear().toString()) : 70);
      
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
        mass: 0.8,
      });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
    }
  }, [isOpen, initialDate, translateY]);

  const closeSheet = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
  };

  const confirmAndClose = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const selectedYear = parseInt(MOCK_YEARS[yearIdx], 10);
    const selectedMonth = monthIdx;
    const selectedDay = parseInt(MOCK_DAYS[dayIdx], 10);
    
    // JS dates auto-wrap days out of bounds, preventing invalid crashes
    const finalDate = new Date(selectedYear, selectedMonth, selectedDay);
    onSelect(finalDate);
    closeSheet();
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(closeSheet)();
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

  if (!isOpen) return null;

  return (
    <Portal name="datepicker-sheet">
      <View className="absolute inset-0 z-50">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/40"
        >
          <Pressable className="flex-1" onPress={closeSheet} />
        </Animated.View>

        <Animated.View
          style={animatedStyle}
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[28px] pb-8 shadow-2xl self-center max-w-[500px] w-full"
        >
          {/* Title Header is the strict Drag Handle (allows nested lists below to scroll safely) */}
          <GestureDetector gesture={gesture}>
            <View className="w-full pt-4 pb-2 items-center bg-transparent z-10">
              <View className="w-10 h-1 bg-muted rounded-full opacity-30 mb-3" />
              <Text className="text-lg font-inter-semibold text-foreground mb-2">
                {title}
              </Text>
            </View>
          </GestureDetector>

          <View className="relative items-center justify-center py-4 w-full h-[220px]">
            
            {/* Highlight Bar Background */}
            <View className="absolute top-[88px] w-[90%] h-[44px] bg-muted/40 rounded-2xl" />

            <View className="flex-row items-center w-full px-6 h-full">
              <WheelPickerColumn 
                 data={MOCK_MONTHS} 
                 selectedIndex={monthIdx} 
                 onValueChange={setMonthIdx} 
              />
              <WheelPickerColumn 
                 data={MOCK_DAYS} 
                 selectedIndex={dayIdx} 
                 onValueChange={setDayIdx} 
              />
              <WheelPickerColumn 
                 data={MOCK_YEARS} 
                 selectedIndex={yearIdx} 
                 onValueChange={setYearIdx} 
              />
            </View>
          </View>

          {/* Proper single-button layout standardized from UnlockChannelsSheet */}
          <View className="mt-6 px-6">
            <Button
              className="w-full rounded-2xl"
              onPress={confirmAndClose}
            >
              <Text className="font-inter-semibold lowercase text-primary-foreground">
                done
              </Text>
            </Button>
          </View>
        </Animated.View>
      </View>
    </Portal>
  );
}
