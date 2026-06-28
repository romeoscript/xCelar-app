import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QueryError } from '@/components/ui/query-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { getDelivery, type DeliveryParty } from '@/lib/rider-api';
import { DELIVERY_STATUS_LABELS } from '../deliveries';

function openDirections(party: DeliveryParty) {
  if (party.lat == null || party.lng == null) {
    return;
  }
  void Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${party.lat},${party.lng}`,
  );
}

function callNumber(phone: string | null) {
  if (phone) {
    void Linking.openURL(`tel:${phone}`);
  }
}

export default function RiderDeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deliveryQuery = useQuery({
    queryKey: ['rider-delivery', id],
    queryFn: () => getDelivery(id as string),
    enabled: Boolean(id),
  });

  if (!id) {
    return <Redirect href="/rider/home" />;
  }

  if (deliveryQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title="Delivery" />
        <QueryError onRetry={() => deliveryQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const delivery = deliveryQuery.data;
  if (deliveryQuery.isLoading || !delivery) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <StatusBar style="dark" />
        <ActivityIndicator color={Brand.blue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Delivery" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <View className="flex-row items-center justify-between">
          <View className="rounded-full bg-brand-blue-tint px-3 py-1">
            <Text className="text-xs font-semibold text-brand-blue">
              {DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
            </Text>
          </View>
          <Text className="text-lg font-extrabold text-brand-navy">
            {delivery.feeNaira != null ? formatNaira(delivery.feeNaira) : '—'}
          </Text>
        </View>

        <PartyCard dotClass="bg-green-500" label="Pickup" party={delivery.pickup} />
        <PartyCard dotClass="bg-red-500" label="Drop-off" party={delivery.dropoff} />

        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <Text className="text-xs uppercase tracking-wider text-gray-400">Package</Text>
          <Text className="mt-1 text-base font-semibold text-gray-900">
            {delivery.packageCategory ?? 'Delivery'}
          </Text>
          {delivery.description ? (
            <Text className="text-sm text-gray-500">{delivery.description}</Text>
          ) : null}
          {delivery.trackingCode ? (
            <Text className="mt-1 text-xs text-gray-400">Tracking: {delivery.trackingCode}</Text>
          ) : null}
        </View>

        <Text className="text-center text-xs text-gray-400">
          In-app route map and delivery steps are coming next.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PartyCard({
  dotClass,
  label,
  party,
}: {
  dotClass: string;
  label: string;
  party: DeliveryParty;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center gap-2">
        <View className={`h-2 w-2 rounded-full ${dotClass}`} />
        <Text className="text-xs uppercase tracking-wider text-gray-400">{label}</Text>
      </View>
      <View>
        <Text className="text-base font-semibold text-gray-900">{party.name ?? '—'}</Text>
        <Text className="text-sm text-gray-500">{party.address ?? '—'}</Text>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => callNumber(party.phone)}
          className="flex-1 items-center rounded-full bg-brand-surface py-3 active:opacity-70"
        >
          <Text className="text-sm font-semibold text-brand-navy">Call</Text>
        </Pressable>
        <Pressable
          onPress={() => openDirections(party)}
          className="flex-1 items-center rounded-full bg-brand-blue py-3 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">Navigate</Text>
        </Pressable>
      </View>
    </View>
  );
}
