import { Text, View } from 'react-native';

import { type ShipmentStatus } from '@/lib/shipment-api';
import { statusMeta } from '@/lib/shipment-status';

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const meta = statusMeta(status);
  return (
    <View className={`rounded-full px-2.5 py-1 ${meta.bg}`}>
      <Text className={`text-xs font-semibold ${meta.text}`}>{meta.label}</Text>
    </View>
  );
}

export function PaidBadge({ paid }: { paid: boolean }) {
  return (
    <View className={`rounded-full px-2.5 py-1 ${paid ? 'bg-green-100' : 'bg-gray-100'}`}>
      <Text className={`text-xs font-semibold ${paid ? 'text-green-700' : 'text-gray-500'}`}>
        {paid ? 'Paid' : 'Unpaid'}
      </Text>
    </View>
  );
}
