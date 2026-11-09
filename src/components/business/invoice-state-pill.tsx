import { Text, View } from 'react-native';

import type { InvoiceState } from '@/lib/business-api';

const PILL: Record<InvoiceState, { label: string; bg: string; text: string }> = {
  UNPAID: { label: 'Unpaid', bg: 'bg-brand-blue-tint', text: 'text-brand-blue' },
  OVERDUE: { label: 'Overdue', bg: 'bg-red-50', text: 'text-red-600' },
  PAID: { label: 'Paid', bg: 'bg-green-50', text: 'text-green-700' },
  VOID: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-500' },
};

export function InvoiceStatePill({ state }: { state: InvoiceState }) {
  const pill = PILL[state];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${pill.bg}`}>
      <Text className={`text-xs font-semibold ${pill.text}`}>{pill.label}</Text>
    </View>
  );
}
