import { Pressable, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { type Shipment } from '@/lib/shipment-api';
import { PaidBadge, StatusBadge } from './badges';

export type ShipmentCardProps = {
  shipment: Shipment;
  onPress: () => void;
};

export function ShipmentCard({ shipment, onPress }: ShipmentCardProps) {
  const route =
    [shipment.pickupZone, shipment.deliveryZone].filter(Boolean).join('  →  ') ||
    shipment.receiverName ||
    'Local delivery';

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-gray-100 bg-white p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 pr-3 text-base font-semibold text-gray-900" numberOfLines={1}>
          {route}
        </Text>
        {shipment.priceEstimate != null ? (
          <Text className="text-sm font-bold text-brand-navy">
            {formatNaira(shipment.priceEstimate)}
          </Text>
        ) : null}
      </View>

      <Text className="mt-0.5 text-xs text-gray-500">
        {shipment.trackingCode ?? 'Not booked yet'}
      </Text>

      <View className="mt-2 flex-row gap-2">
        <StatusBadge status={shipment.status} />
        <PaidBadge paid={shipment.paid} />
      </View>
    </Pressable>
  );
}
