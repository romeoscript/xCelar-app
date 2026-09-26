import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BikeIcon } from '@/components/icons';
import { CostBreakdown } from '@/components/ship/cost-breakdown';
import { PaidPill, StatusBadge } from '@/components/shipments/badges';
import { LiveTrackingMap } from '@/components/shipments/live-tracking-map';
import { Button } from '@/components/ui/button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { useShipmentTracking } from '@/hooks/use-shipment-tracking';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import {
  getShipmentBreakdown,
  type Shipment,
  type ShipmentStatus,
  type ShipmentTracking,
  type ShipmentType,
} from '@/lib/shipment-api';
import { DELIVERY_STAGES, timeAgo, trackingStatusText } from '@/lib/shipment-status';

const GUTTER = 16;

const TYPE_LABELS: Record<ShipmentType, string> = {
  LOCAL: 'Local delivery',
  EXPORT: 'International export',
  IMPORT: 'International import',
};

export default function ShipmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const { shipmentQuery: query, trackingQuery, trackable } = useShipmentTracking(id);

  const breakdownQuery = useQuery({
    queryKey: ['shipment-breakdown', id],
    queryFn: () => getShipmentBreakdown(id as string),
    enabled: Boolean(id),
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
      <ScreenHeader title="Shipment details" gutter={GUTTER} />

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : shipment ? (
        <>
          <ScrollView contentContainerStyle={{ padding: GUTTER, gap: 12 }}>
            <SummaryCard shipment={shipment} copied={copied} onCopy={copyTracking} />

            {shipment.paid && trackable ? (
              <LiveTrackingCard
                tracking={trackingQuery.data}
                status={shipment.status}
                onExpand={() => router.push({ pathname: '/track/[id]', params: { id } })}
              />
            ) : null}

            {shipment.paid ? (
              <DeliveryTimeline shipment={shipment} />
            ) : (
              <View className="flex-row gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <MaterialCommunityIcons name="clock-outline" size={20} color="#B45309" />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-amber-800">Payment pending</Text>
                  <Text className="mt-1 text-sm text-amber-700">
                    Complete payment to confirm this shipment and get it moving.
                  </Text>
                </View>
              </View>
            )}

            <RouteCard shipment={shipment} />
            <PackageCard shipment={shipment} />

            {breakdownQuery.data ? (
              <CostBreakdown breakdown={breakdownQuery.data} paymentMethod={shipment.paymentMethod} />
            ) : (
              <Card>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-brand-navy">Amount</Text>
                  <Text className="text-lg font-extrabold text-brand-navy">
                    {shipment.priceEstimate != null ? formatNaira(shipment.priceEstimate) : '—'}
                  </Text>
                </View>
              </Card>
            )}
          </ScrollView>

          {!shipment.paid ? (
            <View className="border-t border-gray-100 py-3" style={{ paddingHorizontal: GUTTER }}>
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

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-4">
      {title ? <Text className="mb-4 text-base font-semibold text-brand-navy">{title}</Text> : null}
      {children}
    </View>
  );
}

function SummaryCard({
  shipment,
  copied,
  onCopy,
}: {
  shipment: Shipment;
  copied: boolean;
  onCopy: () => void;
}) {
  const origin = shipment.pickupZone;
  const destination = shipment.deliveryZone ?? shipment.destinationCountryName;

  return (
    <LinearGradient
      colors={[Brand.navy, Brand.indigo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 24 }}
    >
      <View className="p-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2">
            <StatusBadge shipment={shipment} />
            {shipment.paid ? <PaidPill /> : null}
          </View>
          <Text className="text-xs font-medium text-white/60">{TYPE_LABELS[shipment.type]}</Text>
        </View>

        <Text className="mt-5 text-xs uppercase tracking-wider text-white/50">Tracking code</Text>
        <View className="mt-1 flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-2xl font-extrabold tracking-wide text-white" numberOfLines={1}>
            {shipment.trackingCode ?? 'Not booked yet'}
          </Text>
          {shipment.trackingCode ? (
            <Pressable
              onPress={onCopy}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Copy tracking code"
              className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 active:opacity-70"
            >
              <MaterialCommunityIcons
                name={copied ? 'check' : 'content-copy'}
                size={14}
                color="#fff"
              />
              <Text className="text-xs font-semibold text-white">{copied ? 'Copied' : 'Copy'}</Text>
            </Pressable>
          ) : null}
        </View>

        {origin || destination ? (
          <View className="mt-5 flex-row items-center gap-3 border-t border-white/10 pt-4">
            <ZoneLabel caption="From" value={origin} />
            <MaterialCommunityIcons name="arrow-right" size={18} color="rgba(255,255,255,0.5)" />
            <ZoneLabel caption="To" value={destination} alignEnd />
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

function ZoneLabel({
  caption,
  value,
  alignEnd = false,
}: {
  caption: string;
  value: string | null;
  alignEnd?: boolean;
}) {
  return (
    <View className={`flex-1 ${alignEnd ? 'items-end' : ''}`}>
      <Text className="text-xs text-white/50">{caption}</Text>
      <Text className="mt-0.5 text-sm font-semibold text-white" numberOfLines={1}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

function LiveTrackingCard({
  tracking,
  status,
  onExpand,
}: {
  tracking?: ShipmentTracking;
  status: ShipmentStatus;
  onExpand: () => void;
}) {
  const headingTo = status === 'IN_TRANSIT' ? 'dropoff' : 'pickup';
  return (
    <View className="gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-brand-navy">Live tracking</Text>
        {tracking?.courier ? (
          <View className="flex-row items-center gap-1.5">
            <View
              className={`h-2 w-2 rounded-full ${isFresh(tracking.courier.updatedAt) ? 'bg-green-500' : 'bg-gray-300'}`}
            />
            <Text className="text-xs text-gray-500">
              Updated {timeAgo(tracking.courier.updatedAt)}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => {
          tapFeedback();
          onExpand();
        }}
        accessibilityRole="button"
        accessibilityLabel="Open full-screen tracking map"
        className="active:opacity-80"
      >
        <LiveTrackingMap
          courier={tracking?.courier ?? null}
          pickup={tracking?.pickup ?? { lat: null, lng: null }}
          dropoff={tracking?.dropoff ?? { lat: null, lng: null }}
          headingTo={headingTo}
          height={200}
        />
        <View className="absolute bottom-3 right-3 flex-row items-center gap-1 rounded-full bg-white/95 px-3 py-1.5">
          <MaterialCommunityIcons name="arrow-expand" size={13} color={Brand.navy} />
          <Text className="text-xs font-semibold text-brand-navy">Full map</Text>
        </View>
      </Pressable>

      <View className="flex-row items-center gap-3 rounded-xl bg-brand-blue-tint p-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
          <BikeIcon size={18} color={Brand.blue} />
        </View>
        <Text className="flex-1 text-sm font-medium text-brand-navy">
          {trackingStatusText(status, tracking)}
        </Text>
      </View>
    </View>
  );
}

function DeliveryTimeline({ shipment }: { shipment: Shipment }) {
  const currentIndex = DELIVERY_STAGES.findIndex((stage) => stage.status === shipment.status);

  return (
    <Card title="Delivery progress">
      {DELIVERY_STAGES.map((stage, index) => {
        const done = index < currentIndex || shipment.status === 'DELIVERED';
        const current = index === currentIndex && !done;
        const reached = done || current;
        const isLast = index === DELIVERY_STAGES.length - 1;
        const at = reached ? stage.at(shipment) : null;
        return (
          <View key={stage.status} className="flex-row">
            <View className="w-5 items-center">
              {done ? (
                <View className="h-5 w-5 items-center justify-center rounded-full bg-brand-blue">
                  <MaterialCommunityIcons name="check" size={13} color="#fff" />
                </View>
              ) : current ? (
                <View className="h-5 w-5 items-center justify-center rounded-full bg-brand-blue-tint">
                  <View className="h-2.5 w-2.5 rounded-full bg-brand-blue" />
                </View>
              ) : (
                <View className="h-5 w-5 rounded-full border-2 border-gray-200 bg-white" />
              )}
              {!isLast ? (
                <View className={`w-0.5 flex-1 ${done ? 'bg-brand-blue' : 'bg-gray-200'}`} />
              ) : null}
            </View>
            <View className={`ml-3 flex-1 flex-row justify-between gap-3 ${isLast ? '' : 'pb-5'}`}>
              <Text
                className={`text-sm ${reached ? 'font-semibold text-gray-900' : 'text-gray-400'}`}
              >
                {stage.label}
              </Text>
              {at ? <Text className="text-xs text-gray-500">{formatDateTime(at)}</Text> : null}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

function RouteCard({ shipment }: { shipment: Shipment }) {
  return (
    <Card title="Route">
      <Stop
        kind="pickup"
        caption="Pickup"
        name={shipment.senderName}
        phone={shipment.senderPhone}
        address={shipment.senderAddress}
        meta={shipment.pickupDate ? `Scheduled ${formatDate(shipment.pickupDate)}` : null}
      />
      <Stop
        kind="dropoff"
        caption="Drop-off"
        name={shipment.receiverName}
        phone={shipment.receiverPhone}
        address={shipment.receiverAddress ?? shipment.destinationCountryName}
        meta={null}
        isLast
      />
    </Card>
  );
}

function Stop({
  kind,
  caption,
  name,
  phone,
  address,
  meta,
  isLast = false,
}: {
  kind: 'pickup' | 'dropoff';
  caption: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  meta: string | null;
  isLast?: boolean;
}) {
  return (
    <View className="flex-row">
      <View className="w-5 items-center">
        {kind === 'pickup' ? (
          <View className="mt-0.5 h-4 w-4 items-center justify-center rounded-full bg-brand-blue-tint">
            <View className="h-2 w-2 rounded-full bg-brand-blue" />
          </View>
        ) : (
          <MaterialCommunityIcons name="map-marker" size={20} color={Brand.navy} />
        )}
        {!isLast ? <View className="my-1 w-0.5 flex-1 bg-gray-200" /> : null}
      </View>
      <View className={`ml-3 flex-1 ${isLast ? '' : 'pb-5'}`}>
        <Text className="text-xs uppercase tracking-wider text-gray-400">{caption}</Text>
        {name ? <Text className="mt-1 text-base font-semibold text-gray-900">{name}</Text> : null}
        {phone ? <Text className="text-sm text-gray-500">{phone}</Text> : null}
        {address ? <Text className="mt-1 text-sm text-gray-700">{address}</Text> : null}
        {meta ? <Text className="mt-1 text-xs text-gray-400">{meta}</Text> : null}
      </View>
    </View>
  );
}

function PackageCard({ shipment }: { shipment: Shipment }) {
  const rows: [string, string | null][] = [
    ['Category', shipment.packageCategory],
    ['Weight', shipment.weightKg != null ? `${shipment.weightKg} kg` : null],
    ['Quantity', shipment.quantity != null ? String(shipment.quantity) : null],
    ['Declared value', shipment.declaredValue != null ? formatNaira(shipment.declaredValue) : null],
    ['Handling', shipment.fragile ? 'Fragile' : null],
  ];
  const visible = rows.filter((row): row is [string, string] => row[1] != null);

  return (
    <Card title="Package">
      <View className="gap-2.5">
        {visible.map(([label, value]) => (
          <View key={label} className="flex-row items-center justify-between gap-4">
            <Text className="text-sm text-gray-500">{label}</Text>
            <Text className="text-sm font-medium text-gray-900">{value}</Text>
          </View>
        ))}
      </View>
      {shipment.description ? (
        <View className="mt-4 rounded-xl bg-brand-surface p-3">
          <Text className="text-xs text-gray-500">Note</Text>
          <Text className="mt-0.5 text-sm text-gray-700">{shipment.description}</Text>
        </View>
      ) : null}
    </Card>
  );
}

/** A location report this recent counts as "live" (rider reports every few seconds). */
function isFresh(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 2 * 60_000;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
