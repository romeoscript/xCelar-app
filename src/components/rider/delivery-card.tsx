import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { type RiderJob } from '@/lib/rider-api';
import { jobBadge } from '@/lib/rider-jobs';

export function DeliveryCard({
  delivery,
  onPress,
}: {
  delivery: RiderJob;
  onPress: () => void;
}) {
  const active = delivery.isActive;
  const meta = jobBadge(delivery);
  const when = delivery.deliveredAt ?? delivery.acceptedAt;
  const details = [
    delivery.packageCategory,
    delivery.cashToCollectNaira != null ? `Collect ${formatNaira(delivery.cashToCollectNaira)}` : null,
    when ? formatWhen(when) : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      className={`rounded-2xl border bg-white p-4 active:opacity-90 ${active ? 'border-brand-blue/30' : 'border-gray-100'}`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          <View className={`rounded-full px-2.5 py-1 ${meta.pill}`}>
            <Text className={`text-xs font-semibold ${meta.text}`}>{meta.label}</Text>
          </View>
          {delivery.trackingCode ? (
            <Text className="text-xs font-medium text-gray-400" numberOfLines={1}>
              {delivery.trackingCode}
            </Text>
          ) : null}
        </View>
        {delivery.feeNaira != null ? (
          <Text className="text-base font-extrabold text-brand-navy">
            {formatNaira(delivery.feeNaira)}
          </Text>
        ) : null}
      </View>

      <View className="mt-4 flex-row">
        <View className="w-3 items-center pt-1.5">
          <View className="h-2 w-2 rounded-full bg-brand-blue" />
          <View className="my-1 w-px flex-1 bg-gray-200" />
          <View className="h-2 w-2 rounded-full border-2 border-brand-navy" />
        </View>
        <View className="ml-3 flex-1 gap-2.5">
          <Text className="text-sm text-gray-900" numberOfLines={1}>
            {stopLabel(delivery.from)}
          </Text>
          <Text className="text-sm text-gray-900" numberOfLines={1}>
            {stopLabel(delivery.to)}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
        <Text className="flex-1 text-xs text-gray-500" numberOfLines={1}>
          {details.join(' · ')}
        </Text>
        {active ? (
          <View className="flex-row items-center gap-1 rounded-full bg-brand-blue px-3 py-1.5">
            <MaterialCommunityIcons name="navigation-variant" size={13} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Continue</Text>
          </View>
        ) : (
          <ChevronRightIcon size={16} color={Brand.muted} />
        )}
      </View>
    </Pressable>
  );
}

function stopLabel(stop: RiderJob['from']): string {
  if (stop.kind === 'HUB') return stop.name ?? 'Hub';
  return stop.address ?? '—';
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === today.toDateString()) {
    return `Today, ${time}`;
  }
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${time}`;
}
