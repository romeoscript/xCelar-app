import { Text, View } from 'react-native';

export type RouteLineProps = {
  pickup: string | null;
  dropoff: string | null;
  /** Smaller variant for list cards. */
  compact?: boolean;
};

/** Pickup → drop-off shown as a connected timeline: the signature device for a
 *  delivery (a line from A to B), reused on cards and the delivery screen. */
export function RouteLine({ pickup, dropoff, compact = false }: RouteLineProps) {
  return (
    <View className="flex-row gap-3">
      <View className="items-center pt-1">
        <View className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <View className="my-1 w-0.5 flex-1 bg-gray-200" />
        <View className="h-2.5 w-2.5 rounded-full bg-red-500" />
      </View>
      <View className={`flex-1 ${compact ? 'gap-3' : 'gap-5'}`}>
        <View>
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Pickup
          </Text>
          <Text className="text-sm font-medium text-brand-navy" numberOfLines={1}>
            {pickup ?? '—'}
          </Text>
        </View>
        <View>
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Drop-off
          </Text>
          <Text className="text-sm font-medium text-brand-navy" numberOfLines={1}>
            {dropoff ?? '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}
