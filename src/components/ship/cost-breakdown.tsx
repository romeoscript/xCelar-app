import { Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { type PriceBreakdown } from '@/lib/shipment-api';

export type CostBreakdownProps = {
  breakdown: PriceBreakdown;
  /** Shown as a footnote once a shipment has been paid. */
  paymentMethod?: string | null;
};

/** Itemised delivery price: base, distance, weight, fragile, VAT, total. */
export function CostBreakdown({ breakdown, paymentMethod }: CostBreakdownProps) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-5">
      <Text className="mb-3 text-base font-semibold text-brand-navy">Cost breakdown</Text>

      <CostRow label="Base fare" value={breakdown.baseFare} />
      {breakdown.distanceFee > 0 ? (
        <CostRow label={`Distance (${breakdown.distanceKm} km)`} value={breakdown.distanceFee} />
      ) : null}
      <CostRow label="Weight" value={breakdown.weightFee} />
      {breakdown.fragileSurcharge > 0 ? (
        <CostRow label="Fragile handling" value={breakdown.fragileSurcharge} />
      ) : null}

      <View className="my-3 h-px bg-gray-100" />
      <CostRow label="Subtotal" value={breakdown.subtotal} />
      <CostRow label={`VAT (${breakdown.vatPercent}%)`} value={breakdown.vat} />

      <View className="my-3 h-px bg-gray-100" />
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-navy">Total</Text>
        <Text className="text-lg font-extrabold text-brand-navy">
          {formatNaira(breakdown.total)}
        </Text>
      </View>

      {paymentMethod ? (
        <Text className="mt-2 text-sm text-gray-500">
          Paid with {paymentMethod === 'BALANCE' ? 'wallet balance' : 'card / Paystack'}
        </Text>
      ) : null}
    </View>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900">{formatNaira(value)}</Text>
    </View>
  );
}
