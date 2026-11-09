import { Text, View } from 'react-native';

import { type Shipment } from '@/lib/shipment-api';
import { isBooked, shipmentStatusMeta } from '@/lib/shipment-status';

export function StatusBadge({ shipment }: { shipment: Pick<Shipment, 'status' | 'paid' | 'stage'> }) {
  const meta = shipmentStatusMeta(shipment);
  return (
    <View className={`self-start rounded-full px-3 py-1 ${meta.bg}`}>
      <Text className={`text-xs font-bold uppercase tracking-wide ${meta.text}`}>{meta.label}</Text>
    </View>
  );
}

/** "Paid", or "Pay on delivery" for a cash booking the rider hasn't collected yet. */
export function PaymentPill({ shipment }: { shipment: Pick<Shipment, 'status' | 'paid'> }) {
  if (shipment.paid) {
    return (
      <View className="rounded-full bg-green-100 px-2.5 py-1">
        <Text className="text-xs font-bold text-green-700">Paid</Text>
      </View>
    );
  }
  if (!isBooked(shipment)) {
    return null;
  }
  return (
    <View className="rounded-full bg-amber-100 px-2.5 py-1">
      <Text className="text-xs font-bold text-amber-700">Pay on delivery</Text>
    </View>
  );
}
