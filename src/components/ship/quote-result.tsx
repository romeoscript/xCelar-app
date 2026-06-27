import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { RouteSwapIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { formatMoney } from '@/lib/format';
import { type PriceBreakdown } from '@/lib/shipment-api';
import { CostBreakdown } from './cost-breakdown';

export type QuoteResultProps = {
  pickupLabel: string;
  dropoffLabel: string;
  /** The (animated) total to display, in major currency units. */
  amount: number;
  breakdown: PriceBreakdown;
};

/** Clean quote summary: a route card, a rate card, and an optional breakdown. */
export function QuoteResult({ pickupLabel, dropoffLabel, amount, breakdown }: QuoteResultProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <View className="gap-3">
      <View className="flex-row items-center rounded-2xl border border-gray-100 bg-white p-4">
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-400">Pick-up</Text>
          <Text className="mt-0.5 text-base font-semibold text-brand-navy" numberOfLines={1}>
            {pickupLabel}
          </Text>
        </View>
        <View className="mx-3 h-9 w-9 items-center justify-center rounded-full bg-brand-blue-tint">
          <RouteSwapIcon size={18} color={Brand.blue} />
        </View>
        <View className="flex-1">
          <Text className="text-right text-xs font-medium text-gray-400">Drop-off</Text>
          <Text className="mt-0.5 text-right text-base font-semibold text-brand-navy" numberOfLines={1}>
            {dropoffLabel}
          </Text>
        </View>
      </View>

      <View className="rounded-2xl border border-gray-100 bg-white p-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-medium text-gray-400">Estimated rate</Text>
            <Text className="mt-0.5 text-3xl font-extrabold text-brand-navy">
              {formatMoney(amount, breakdown.currency)}
            </Text>
          </View>
          <View className="rounded-full bg-brand-gold-tint px-3 py-1.5">
            <Text className="text-xs font-bold text-brand-navy">
              {breakdown.minDays}–{breakdown.maxDays} days
            </Text>
          </View>
        </View>

        <Pressable onPress={() => setShowBreakdown((open) => !open)} hitSlop={8} className="mt-3 active:opacity-70">
          <Text className="text-sm font-semibold text-brand-blue">
            {showBreakdown ? 'Hide price breakdown' : 'View price breakdown'}
          </Text>
        </Pressable>
      </View>

      {showBreakdown ? <CostBreakdown breakdown={breakdown} /> : null}
    </View>
  );
}
