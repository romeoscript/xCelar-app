import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { tapFeedback } from '@/lib/haptics';
import { type Warehouse } from '@/lib/shipment-api';

/** Read-only warehouse address shown once an origin country is picked, with a
 *  copy button on each field so customers can paste it into the vendor's site. */
export function WarehouseCard({ warehouse }: { warehouse: Warehouse }) {
  return (
    <View className="rounded-2xl border border-brand-blue-light bg-brand-blue-tint p-4">
      <Text className="text-xs font-bold uppercase tracking-wider text-brand-blue">
        Ship your purchase here
      </Text>
      <Text className="mt-1 text-xs text-brand-muted">
        Use this as the delivery address on the vendor&apos;s site, with your name as the receiver.
      </Text>

      <CopyField label="Address" value={warehouse.address} />
      <View className="mt-3 flex-row gap-3">
        <CopyField label="Phone" value={warehouse.phone} />
        <CopyField label="State" value={warehouse.state} />
      </View>
      <View className="mt-3 flex-row gap-3">
        <CopyField label="City" value={warehouse.city} />
        <CopyField label="Postcode" value={warehouse.postcode} />
      </View>
    </View>
  );
}

function CopyField({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <View className="flex-1" />;
  }

  const copy = async () => {
    tapFeedback();
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Pressable onPress={copy} className="flex-1 active:opacity-70">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-brand-blue">{label}</Text>
        <Text className="text-xs text-brand-blue">{copied ? 'Copied ✓' : 'Copy'}</Text>
      </View>
      <Text className="mt-0.5 text-sm font-medium text-brand-navy">{value}</Text>
    </Pressable>
  );
}
