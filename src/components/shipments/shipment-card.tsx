import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import {
  ChevronRightIcon,
  type IconProps,
  PlaneTakeoffIcon,
  ShipIcon,
  TruckIcon,
} from '@/components/icons';
import { Brand } from '@/constants/theme';
import { isTrackable } from '@/hooks/use-shipment-tracking';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { type Shipment, type ShipmentType } from '@/lib/shipment-api';
import { PaidPill, StatusBadge } from './badges';

// Each shipment type resumes payment in its own booking flow.
const PAY_ROUTE: Record<ShipmentType, '/ship-local' | '/ship-export' | '/ship-import'> = {
  LOCAL: '/ship-local',
  EXPORT: '/ship-export',
  IMPORT: '/ship-import',
};

const TYPE_META: Record<
  ShipmentType,
  { label: string; Icon: (props: IconProps) => React.JSX.Element; tile: string; color: string }
> = {
  LOCAL: { label: 'Local', Icon: TruckIcon, tile: 'bg-brand-blue-tint', color: Brand.blue },
  EXPORT: { label: 'Export', Icon: PlaneTakeoffIcon, tile: 'bg-brand-gold-tint', color: '#D97706' },
  IMPORT: { label: 'Import', Icon: ShipIcon, tile: 'bg-brand-indigo-tint', color: Brand.indigo },
};

export type ShipmentCardProps = {
  shipment: Shipment;
  onPress: () => void;
};

export function ShipmentCard({ shipment, onPress }: ShipmentCardProps) {
  const router = useRouter();
  const origin = shipment.pickupZone || shipment.senderAddress || 'Pickup';
  const destination =
    shipment.deliveryZone ||
    shipment.destinationCountryName ||
    shipment.receiverAddress ||
    'Delivery';
  const type = TYPE_META[shipment.type];
  const live = shipment.paid && isTrackable(shipment);

  const resumePayment = () => {
    tapFeedback();
    router.push({ pathname: PAY_ROUTE[shipment.type], params: { id: shipment.id } });
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="rounded-2xl border border-gray-100 bg-white p-4 active:opacity-90"
    >
      <View className="flex-row items-center gap-3">
        <View className={`h-10 w-10 items-center justify-center rounded-xl ${type.tile}`}>
          <type.Icon size={20} color={type.color} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
            {shipment.trackingCode ?? 'Not booked yet'}
          </Text>
          <Text className="text-xs text-gray-500">
            {type.label} · {formatShortDate(shipment.createdAt)}
          </Text>
        </View>
        {shipment.priceEstimate != null ? (
          <Text className="text-base font-extrabold text-brand-navy">
            {formatNaira(shipment.priceEstimate)}
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
            {origin}
          </Text>
          <Text className="text-sm text-gray-900" numberOfLines={1}>
            {destination}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
        <View className="flex-row items-center gap-2">
          <StatusBadge shipment={shipment} />
          {shipment.paid ? <PaidPill /> : null}
        </View>
        <View className="flex-row items-center gap-1">
          {live ? (
            <View className="flex-row items-center gap-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <Text className="text-xs font-semibold text-green-600">Live</Text>
            </View>
          ) : null}
          <ChevronRightIcon size={16} color={Brand.muted} />
        </View>
      </View>

      {!shipment.paid ? (
        <Pressable
          onPress={resumePayment}
          className="mt-3 items-center rounded-xl bg-brand-blue py-3 active:opacity-90"
        >
          <Text className="text-sm font-bold text-white">
            Resume payment
            {shipment.priceEstimate != null ? ` · ${formatNaira(shipment.priceEstimate)}` : ''}
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
