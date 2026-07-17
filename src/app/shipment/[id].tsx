import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CostBreakdown } from '@/components/ship/cost-breakdown';
import { ChevronLeftIcon } from '@/components/icons';
import { PaidPill, StatusBadge } from '@/components/shipments/badges';
import { LiveTrackingMap } from '@/components/shipments/live-tracking-map';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import {
  getShipment,
  getShipmentBreakdown,
  getShipmentTracking,
  type Shipment,
  type ShipmentStatus,
  type ShipmentTracking,
} from '@/lib/shipment-api';
import { DELIVERY_STAGES } from '@/lib/shipment-status';

export default function ShipmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const query = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => getShipment(id as string),
    enabled: Boolean(id),
  });

  const breakdownQuery = useQuery({
    queryKey: ['shipment-breakdown', id],
    queryFn: () => getShipmentBreakdown(id as string),
    enabled: Boolean(id),
  });

  // Live rider tracking, only while a local delivery is actually moving.
  const trackable =
    query.data?.type === 'LOCAL' &&
    (query.data.status === 'CONFIRMED' || query.data.status === 'IN_TRANSIT');
  const trackingQuery = useQuery({
    queryKey: ['shipment-tracking', id],
    queryFn: () => getShipmentTracking(id as string),
    enabled: Boolean(id) && trackable,
    refetchInterval: 10_000,
  });

  if (!id) {
    return <Redirect href="/home" />;
  }

  const shipment = query.data;

  const copyTracking = async () => {
    if (!shipment?.trackingCode) {
      return;
    }
    tapFeedback();
    await Clipboard.setStringAsync(shipment.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View className="px-6 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
        >
          <ChevronLeftIcon size={22} color={Brand.navy} />
        </Pressable>
      </View>

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : shipment ? (
        <>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <LinearGradient
              colors={[Brand.navy, Brand.indigo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24 }}
            >
              <View className="p-6">
                <Text className="text-xs uppercase tracking-wider text-white/50">Tracking code</Text>
                <Pressable
                  onPress={copyTracking}
                  className="mt-1 flex-row items-center gap-2 active:opacity-70"
                >
                  <Text className="text-2xl font-extrabold text-white">
                    {shipment.trackingCode ?? 'Not booked yet'}
                  </Text>
                  {shipment.trackingCode ? (
                    <Text className="text-sm text-brand-gold">{copied ? 'Copied ✓' : 'Copy'}</Text>
                  ) : null}
                </Pressable>
                <View className="mt-4 flex-row gap-2">
                  <StatusBadge shipment={shipment} />
                  {shipment.paid ? <PaidPill /> : null}
                </View>
              </View>
            </LinearGradient>

            {shipment.paid && trackable ? (
              <LiveTrackingCard tracking={trackingQuery.data} status={shipment.status} />
            ) : null}

            {shipment.paid ? (
              <DeliveryTimeline shipment={shipment} />
            ) : (
              <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Text className="text-base font-semibold text-amber-800">Payment pending</Text>
                <Text className="mt-1 text-sm text-amber-700">
                  Complete payment to confirm this shipment and get it moving.
                </Text>
              </View>
            )}

            <DetailCard
              title="Sender"
              lines={[
                shipment.senderName,
                shipment.senderPhone,
                shipment.senderAddress,
                shipment.pickupZone ? `Zone: ${shipment.pickupZone}` : null,
                shipment.pickupDate ? `Pickup: ${formatDate(shipment.pickupDate)}` : null,
              ]}
            />
            <DetailCard
              title="Receiver"
              lines={[
                shipment.receiverName,
                shipment.receiverPhone,
                shipment.receiverAddress,
                shipment.deliveryZone ? `Zone: ${shipment.deliveryZone}` : null,
              ]}
            />
            <DetailCard
              title="Package"
              lines={[
                shipment.packageCategory,
                shipment.weightKg != null ? `${shipment.weightKg} kg` : null,
                shipment.fragile ? 'Fragile' : null,
                shipment.description,
              ]}
            />

            {breakdownQuery.data ? (
              <CostBreakdown breakdown={breakdownQuery.data} paymentMethod={shipment.paymentMethod} />
            ) : (
              <View className="rounded-2xl bg-brand-surface p-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-brand-navy">Amount</Text>
                  <Text className="text-lg font-extrabold text-brand-navy">
                    {shipment.priceEstimate != null ? formatNaira(shipment.priceEstimate) : '—'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {!shipment.paid ? (
            <View className="border-t border-gray-100 px-6 py-3">
              <Button
                label={
                  shipment.priceEstimate != null
                    ? `Complete payment · ${formatNaira(shipment.priceEstimate)}`
                    : 'Complete payment'
                }
                onPress={() => router.push({ pathname: '/ship-local', params: { id } })}
              />
            </View>
          ) : null}
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-gray-500">Shipment not found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  return `${Math.round(minutes / 60)}h ago`;
}

function LiveTrackingCard({
  tracking,
  status,
}: {
  tracking?: ShipmentTracking;
  status: ShipmentStatus;
}) {
  const headingTo = status === 'IN_TRANSIT' ? 'dropoff' : 'pickup';
  return (
    <View className="gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-brand-navy">Live tracking</Text>
        {tracking?.courier ? (
          <Text className="text-xs text-gray-400">Updated {timeAgo(tracking.courier.updatedAt)}</Text>
        ) : null}
      </View>
      <LiveTrackingMap
        courier={tracking?.courier ?? null}
        pickup={tracking?.pickup ?? { lat: null, lng: null }}
        dropoff={tracking?.dropoff ?? { lat: null, lng: null }}
        headingTo={headingTo}
      />
      <Text className="text-sm text-gray-500">{trackingStatusText(status, tracking)}</Text>
    </View>
  );
}

/** Human-readable rider status, including the "arrived" sub-states. */
function trackingStatusText(status: ShipmentStatus, tracking?: ShipmentTracking): string {
  if (status === 'IN_TRANSIT') {
    return tracking?.arrivedDropoff
      ? 'Your rider has arrived and is handing over your package.'
      : 'Your rider has the package and is on the way to the drop-off.';
  }
  return tracking?.arrivedPickup
    ? 'Your rider has arrived at the pickup point.'
    : 'Your rider is on the way to collect the package.';
}

function DeliveryTimeline({ shipment }: { shipment: Shipment }) {
  const currentIndex = DELIVERY_STAGES.findIndex((stage) => stage.status === shipment.status);

  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-5">
      <Text className="mb-3 text-base font-semibold text-brand-navy">Delivery progress</Text>
      {DELIVERY_STAGES.map((stage, index) => {
        const reached = index <= currentIndex;
        const isLast = index === DELIVERY_STAGES.length - 1;
        return (
          <View key={stage.status} className="flex-row">
            <View className="items-center">
              <View className={`h-4 w-4 rounded-full ${reached ? 'bg-brand-blue' : 'bg-gray-200'}`} />
              {!isLast ? (
                <View className={`my-0.5 w-0.5 flex-1 ${reached ? 'bg-brand-blue' : 'bg-gray-200'}`} />
              ) : null}
            </View>
            <Text
              className={`ml-3 pb-4 text-base ${reached ? 'font-semibold text-gray-900' : 'text-gray-400'}`}
            >
              {stage.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function DetailCard({ title, lines }: { title: string; lines: (string | null)[] }) {
  const visible = lines.filter(Boolean) as string[];
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-4">
      <Text className="text-xs uppercase tracking-wider text-gray-500">{title}</Text>
      {visible.map((line, index) => (
        <Text
          key={index}
          className={`mt-1 ${index === 0 ? 'text-base font-semibold text-gray-900' : 'text-sm text-gray-600'}`}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}
