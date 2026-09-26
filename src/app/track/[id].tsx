import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { LiveTrackingMap } from '@/components/shipments/live-tracking-map';
import { Brand } from '@/constants/theme';
import { useShipmentTracking } from '@/hooks/use-shipment-tracking';
import { timeAgo, trackingStatusText } from '@/lib/shipment-status';

/** Full-screen, pan-and-zoom version of the shipment's live tracking map. */
export default function TrackShipmentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shipmentQuery, trackingQuery, trackable } = useShipmentTracking(id);

  if (!id) {
    return <Redirect href="/home" />;
  }

  const shipment = shipmentQuery.data;
  const tracking = trackingQuery.data;
  const headingTo = shipment?.status === 'IN_TRANSIT' ? 'dropoff' : 'pickup';

  return (
    <View className="flex-1 bg-brand-surface">
      <StatusBar style="dark" />

      {shipmentQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : shipment && trackable ? (
        <LiveTrackingMap
          courier={tracking?.courier ?? null}
          pickup={tracking?.pickup ?? { lat: null, lng: null }}
          dropoff={tracking?.dropoff ?? { lat: null, lng: null }}
          headingTo={headingTo}
          fill
          interactive
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-gray-500">
            Live tracking isn’t available for this shipment right now.
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityLabel="Back"
        style={{ top: insets.top + 8 }}
        className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/95 active:opacity-80"
      >
        <ChevronLeftIcon size={22} color={Brand.navy} />
      </Pressable>

      {shipment && trackable ? (
        <View
          style={{ paddingBottom: insets.bottom + 16 }}
          className="absolute inset-x-0 bottom-0 gap-3 rounded-t-3xl bg-white px-6 pt-5"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xs uppercase tracking-wider text-gray-500">
              {shipment.trackingCode}
            </Text>
            {tracking?.courier ? (
              <Text className="text-xs text-gray-400">
                Updated {timeAgo(tracking.courier.updatedAt)}
              </Text>
            ) : null}
          </View>
          <Text className="text-base font-semibold text-brand-navy">
            {trackingStatusText(shipment.status, tracking)}
          </Text>
          <Stop label="Pickup" address={shipment.senderAddress} />
          <Stop label="Drop off" address={shipment.receiverAddress} />
        </View>
      ) : null}
    </View>
  );
}

function Stop({ label, address }: { label: string; address: string | null }) {
  if (!address) {
    return null;
  }
  return (
    <View>
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="text-sm text-gray-900" numberOfLines={1}>
        {address}
      </Text>
    </View>
  );
}
