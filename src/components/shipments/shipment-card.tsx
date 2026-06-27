import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { type Shipment } from '@/lib/shipment-api';
import { PaidPill, StatusBadge } from './badges';

export type ShipmentCardProps = {
  shipment: Shipment;
  onPress: () => void;
};

export function ShipmentCard({ shipment, onPress }: ShipmentCardProps) {
  const origin = shipment.pickupZone || shipment.senderAddress || 'Pickup';
  const destination = shipment.deliveryZone || shipment.receiverAddress || 'Delivery';

  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl border border-gray-100 bg-white p-4 active:opacity-90"
    >
      <View className="flex-row items-center justify-between">
        <StatusBadge shipment={shipment} />
        {shipment.priceEstimate != null ? (
          <Text className="text-base font-extrabold text-brand-navy">
            {formatNaira(shipment.priceEstimate)}
          </Text>
        ) : null}
      </View>

      <View className="mt-3 flex-row">
        <View className="items-center pt-1">
          <View className="h-2.5 w-2.5 rounded-full bg-brand-blue" />
          <View className="my-1 w-0.5 flex-1 bg-gray-200" />
          <View className="h-2.5 w-2.5 rounded-full border-2 border-brand-gold" />
        </View>
        <View className="ml-3 flex-1 gap-3">
          <View>
            <Text className="text-[11px] uppercase tracking-wide text-gray-400">Pickup</Text>
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
              {origin}
            </Text>
          </View>
          <View>
            <Text className="text-[11px] uppercase tracking-wide text-gray-400">Delivery</Text>
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
              {destination}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
        <Text className="text-xs font-medium text-gray-500">
          {shipment.trackingCode ?? 'Not booked yet'}
        </Text>
        <View className="flex-row items-center gap-2">
          {shipment.paid ? <PaidPill /> : null}
          <ChevronRightIcon size={16} color={Brand.muted} />
        </View>
      </View>
    </Pressable>
  );
}
