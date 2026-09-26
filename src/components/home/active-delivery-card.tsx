import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BikeIcon, ChevronRightIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { type Shipment } from '@/lib/shipment-api';

export type ActiveDeliveryCardProps = {
  shipment: Shipment;
  onPress: () => void;
};

/** Highlights a delivery that's moving right now, one tap from the live map. */
export function ActiveDeliveryCard({ shipment, onPress }: ActiveDeliveryCardProps) {
  const inTransit = shipment.status === 'IN_TRANSIT';
  const headline = inTransit ? 'On the way to drop-off' : 'Rider heading to pickup';
  const destination = inTransit ? shipment.deliveryZone : shipment.pickupZone;

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Track delivery ${shipment.trackingCode ?? ''}`}
      className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:opacity-90"
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue-tint">
        <BikeIcon size={22} color={Brand.blue} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <LiveDot />
          <Text className="text-xs font-semibold uppercase tracking-wide text-green-600">Live</Text>
          <Text className="text-xs text-gray-400">· {shipment.trackingCode}</Text>
        </View>
        <Text className="mt-0.5 text-base font-bold text-brand-navy" numberOfLines={1}>
          {headline}
        </Text>
        {destination ? (
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {destination}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-0.5 rounded-full bg-brand-blue px-3 py-2">
        <Text className="text-xs font-bold text-white">Track</Text>
        <ChevronRightIcon size={14} color="#ffffff" />
      </View>
    </Pressable>
  );
}

function LiveDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.25, { duration: 900 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[dotStyle, style]} />;
}

const dotStyle = { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' } as const;
