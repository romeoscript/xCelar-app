import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { RouteLine } from '@/components/rider/route-line';
import { RouteMap } from '@/components/rider/route-map';
import { BikeGlyph } from '@/components/rider/vehicle-icons';
import { useRiderVehicle } from '@/hooks/use-rider-vehicle';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { getApiErrorMessage } from '@/lib/api-error';
import { getCurrentLocation } from '@/lib/location';
import { acceptDelivery, getAvailableDelivery, rejectDelivery } from '@/lib/rider-api';

function initials(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '–';
}

export default function RequestDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicleType = useRiderVehicle();
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
      setShowMap(false);
      queryClient.invalidateQueries({ queryKey: ['rider-available'] });
      queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
      router.replace(`/rider/delivery/${delivery.id}`);
    },
    onError: (failure) => setError(getApiErrorMessage(failure)),
  });

  // Passing on the job persists so it won't resurface, then returns to the feed.
  const reject = useMutation({
    mutationFn: () => rejectDelivery(id as string),
    onSettled: () => {
      setShowMap(false);
      queryClient.invalidateQueries({ queryKey: ['rider-available'] });
      router.back();
    },
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

        {request.paymentMethod ? (
          <View className="flex-row items-center gap-2 self-start rounded-full bg-green-50 px-3 py-1.5">
            <View className="h-2 w-2 rounded-full bg-green-500" />
            <Text className="text-xs font-semibold text-green-700">
              Prepaid · no cash to collect
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-4">
          <Detail label="What you are sending" value={request.packageCategory ?? '—'} />
          <Detail label="Recipient" value={request.dropoff.name ?? '—'} />
        </View>

        <Detail label="Recipient contact number" value={request.dropoff.phone ?? '—'} />

        <Pressable onPress={() => setShowMap(true)} className="items-center py-1 active:opacity-70">
          <Text className="text-base font-semibold text-brand-blue underline">View map route</Text>
        </Pressable>

        {error ? <Text className="text-center text-sm text-red-500">{error}</Text> : null}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-gray-100 px-6 pb-2 pt-3">
        <View className="flex-1">
          <Button
            label="Reject"
            variant="secondary"
            loading={reject.isPending}
            onPress={() => reject.mutate()}
          />
        </View>
        <View className="flex-1">
          <Button label="Accept" loading={accept.isPending} onPress={() => accept.mutate()} />
        </View>
      </View>

      {/* Full-screen route preview, laid out like the active-delivery map so the
          rider can judge the job before committing to it. */}
      <Modal visible={showMap} animationType="slide" onRequestClose={() => setShowMap(false)}>
        <View className="flex-1 bg-brand-surface">
          <StatusBar style="dark" />
          <RouteMap
            pickupLat={request.pickup.lat}
            pickupLng={request.pickup.lng}
            dropoffLat={request.dropoff.lat}
            dropoffLng={request.dropoff.lng}
            meLat={locationQuery.data?.latitude}
            meLng={locationQuery.data?.longitude}
            vehicleType={vehicleType}
            fill
            interactive
          />

          <Pressable
            onPress={() => setShowMap(false)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close map"
            style={{ top: insets.top + 8 }}
            className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/95 active:opacity-80"
          >
            <ChevronLeftIcon size={22} color={Brand.navy} />
          </Pressable>

          <View
            style={{ paddingBottom: insets.bottom + 12 }}
            className="absolute inset-x-0 bottom-0 gap-4 rounded-t-3xl bg-white px-6 pt-5"
          >
            <RouteLine pickup={request.pickup.address} dropoff={request.dropoff.address} />
            {error ? <Text className="text-center text-sm text-red-500">{error}</Text> : null}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  label="Reject"
                  variant="secondary"
                  loading={reject.isPending}
                  onPress={() => reject.mutate()}
                />
              </View>
              <View className="flex-1">
                <Button label="Accept" loading={accept.isPending} onPress={() => accept.mutate()} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
