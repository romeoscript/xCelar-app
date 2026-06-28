import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteLine } from '@/components/rider/route-line';
import { RouteMap } from '@/components/rider/route-map';
import { BikeGlyph } from '@/components/rider/vehicle-icons';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatNaira } from '@/lib/format';
import { getCurrentLocation } from '@/lib/location';
import { acceptDelivery, getAvailableDelivery } from '@/lib/rider-api';

const PAYMENT_LABEL: Record<string, string> = { BALANCE: 'Wallet', PAYSTACK: 'Card' };
const MAP_SHEET_HEIGHT = Math.round(Dimensions.get('window').height * 0.8);

function initials(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '–';
}

export default function RequestDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const requestQuery = useQuery({
    queryKey: ['rider-request', id],
    queryFn: () => getAvailableDelivery(id as string),
    enabled: Boolean(id),
  });
  const locationQuery = useQuery({
    queryKey: ['rider-location'],
    queryFn: getCurrentLocation,
    staleTime: 60_000,
  });

  const accept = useMutation({
    mutationFn: () => acceptDelivery(id as string),
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({ queryKey: ['rider-available'] });
      queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
      router.replace(`/rider/delivery/${delivery.id}`);
    },
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  if (!id) {
    return <Redirect href="/rider/home" />;
  }

  if (requestQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar style="dark" />
        <ScreenHeader title="Delivery details" />
        <QueryError message="This request is no longer available." onRetry={() => router.back()} />
      </SafeAreaView>
    );
  }

  const request = requestQuery.data;
  if (requestQuery.isLoading || !request) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <StatusBar style="dark" />
        <ActivityIndicator color={Brand.blue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Delivery details" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-blue-tint">
            <Text className="text-base font-bold text-brand-blue">{initials(request.pickup.name)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-brand-navy">{request.pickup.name ?? 'Sender'}</Text>
            <Text className="text-sm text-gray-500">Pickup contact</Text>
          </View>
          <View className="h-10 w-12 items-center justify-center rounded-xl bg-brand-surface">
            <BikeGlyph color={Brand.navy} />
          </View>
        </View>

        <RouteLine pickup={request.pickup.address} dropoff={request.dropoff.address} />

        <View className="flex-row gap-4">
          <Detail label="What you are sending" value={request.packageCategory ?? '—'} />
          <Detail label="Recipient" value={request.dropoff.name ?? '—'} />
        </View>

        <Detail label="Recipient contact number" value={request.dropoff.phone ?? '—'} />

        <View className="flex-row gap-4">
          <Detail
            label="Payment"
            value={request.paymentMethod ? PAYMENT_LABEL[request.paymentMethod] ?? request.paymentMethod : '—'}
          />
          <Detail
            label="Fee"
            value={request.feeNaira != null ? formatNaira(request.feeNaira) : '—'}
            emphasize
          />
        </View>

        <Pressable onPress={() => setShowMap(true)} className="items-center py-1 active:opacity-70">
          <Text className="text-base font-semibold text-brand-blue underline">View map route</Text>
        </Pressable>

        {error ? <Text className="text-center text-sm text-red-500">{error}</Text> : null}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-gray-100 px-6 pb-2 pt-3">
        <View className="flex-1">
          <Button label="Reject" variant="secondary" onPress={() => router.back()} />
        </View>
        <View className="flex-1">
          <Button label="Accept" loading={accept.isPending} onPress={() => accept.mutate()} />
        </View>
      </View>

      <BottomSheet visible={showMap} onClose={() => setShowMap(false)}>
        <View style={{ height: MAP_SHEET_HEIGHT }} className="-mx-6 overflow-hidden rounded-t-2xl">
          <RouteMap
            pickupLat={request.pickup.lat}
            pickupLng={request.pickup.lng}
            dropoffLat={request.dropoff.lat}
            dropoffLng={request.dropoff.lng}
            meLat={locationQuery.data?.latitude}
            meLng={locationQuery.data?.longitude}
            fill
            interactive
          />
          <View className="absolute inset-x-0 bottom-0 flex-row gap-3 bg-white px-6 pb-2 pt-3">
            <View className="flex-1">
              <Button label="Reject" variant="secondary" onPress={() => setShowMap(false)} />
            </View>
            <View className="flex-1">
              <Button label="Accept" loading={accept.isPending} onPress={() => accept.mutate()} />
            </View>
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function Detail({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <View className="flex-1">
      <Text className="text-xs text-gray-400">{label}</Text>
      <Text
        className={`mt-0.5 ${emphasize ? 'text-lg font-extrabold text-brand-navy' : 'text-base font-medium text-brand-navy'}`}
      >
        {value}
      </Text>
    </View>
  );
}
