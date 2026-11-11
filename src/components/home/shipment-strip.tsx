import { Pressable, ScrollView, Text, View } from 'react-native';

import { PackageIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { type Shipment } from '@/lib/shipment-api';
import { areaName, shipmentStatusMeta } from '@/lib/shipment-status';

const CARD_WIDTH = 216;

const TYPE_LABEL: Record<Shipment['type'], string> = {
  LOCAL: 'Local',
  EXPORT: 'Export',
  IMPORT: 'Import',
};

/** Recent shipments as a sideways row of cards: where from, where to, and where it is now. */
export function ShipmentStrip({ shipments, onOpen }: { shipments: Shipment[]; onOpen: (shipment: Shipment) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + 12}
    >
      {shipments.map((shipment) => (
        <ShipmentTile key={shipment.id} shipment={shipment} onPress={() => onOpen(shipment)} />
      ))}
    </ScrollView>
  );
}

function ShipmentTile({ shipment, onPress }: { shipment: Shipment; onPress: () => void }) {
  const status = shipmentStatusMeta(shipment);
  const from = areaName(shipment.pickupZone) ?? 'Pickup';
  const to = areaName(shipment.deliveryZone) ?? shipment.destinationCountryName ?? 'Drop-off';

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${from} to ${to}, ${status.label}`}
      className="rounded-3xl border border-gray-100 bg-brand-surface p-4 active:opacity-80"
      style={{ width: CARD_WIDTH }}
    >
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
          <PackageIcon size={18} color={Brand.blue} />
        </View>
        <View className={`rounded-full px-2.5 py-1 ${status.bg}`}>
          <Text className={`text-xs font-semibold ${status.text}`}>{status.label}</Text>
        </View>
      </View>
      <Text className="mt-4 text-base font-bold text-brand-navy" numberOfLines={1}>
        {from} → {to}
      </Text>
      <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
        {TYPE_LABEL[shipment.type]} · {shipment.trackingCode ?? 'Not booked yet'}
      </Text>
    </Pressable>
  );
}
