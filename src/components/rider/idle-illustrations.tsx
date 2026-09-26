import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ComponentProps, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Brand } from '@/constants/theme';
import { type VehicleType } from '@/lib/rider-api';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const VEHICLE_ICON: Record<VehicleType, IconName> = {
  BACKPACK: 'walk',
  BIKE: 'motorbike',
  CAR: 'car',
  TRUCK: 'truck',
};

const RADAR_SIZE = 220;
const PULSE_MS = 2700;
const RINGS = 3;

export function SearchingRadar({ vehicleType = 'BIKE' }: { vehicleType?: VehicleType }) {
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [bob]);

  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <View style={{ width: RADAR_SIZE, height: RADAR_SIZE }} className="items-center justify-center">
      {Array.from({ length: RINGS }, (_, index) => (
        <PulseRing key={index} delay={(PULSE_MS / RINGS) * index} />
      ))}
      <View className="h-32 w-32 items-center justify-center rounded-full bg-brand-blue-tint">
        <Animated.View style={[bobStyle, circleShadow]}>
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-blue">
            <MaterialCommunityIcons name={VEHICLE_ICON[vehicleType]} size={38} color="#ffffff" />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function PulseRing({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }), -1),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - progress.value),
    transform: [{ scale: 0.55 + progress.value * 0.45 }],
  }));

  return <Animated.View pointerEvents="none" style={[ringBase, style]} />;
}

export function OfflineMoon() {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  return (
    <View className="h-40 w-40 items-center justify-center rounded-full bg-brand-surface">
      <Animated.View style={floatStyle}>
        <MaterialCommunityIcons name="weather-night" size={64} color={Brand.indigo} />
      </Animated.View>
      <MaterialCommunityIcons
        name="star-four-points"
        size={14}
        color={Brand.gold}
        style={{ position: 'absolute', top: 30, right: 36 }}
      />
      <MaterialCommunityIcons
        name="star-four-points"
        size={10}
        color={Brand.gold}
        style={{ position: 'absolute', bottom: 40, left: 34 }}
      />
    </View>
  );
}

const ringBase = {
  position: 'absolute',
  width: RADAR_SIZE,
  height: RADAR_SIZE,
  borderRadius: RADAR_SIZE / 2,
  backgroundColor: Brand.blue,
} as const;

const circleShadow = {
  shadowColor: Brand.blue,
  shadowOpacity: 0.35,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
} as const;
