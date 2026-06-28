import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TruckIcon } from '@/components/icons';
import { RouteLine } from '@/components/rider/route-line';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira } from '@/lib/format';
import { getCurrentLocation } from '@/lib/location';
import { acceptDelivery, getAvailableDeliveries, type RiderDelivery } from '@/lib/rider-api';

const cardShadow = {
  shadowColor: '#0E1330',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export default function RiderHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const firstName = useAuthStore((state) => state.user?.fullName?.split(' ')[0] ?? 'there');

  const locationQuery = useQuery({
    queryKey: ['rider-location'],
    queryFn: getCurrentLocation,
    staleTime: 60_000,
  });
  const location = locationQuery.data;

  const availableQuery = useQuery({
    queryKey: ['rider-available', location?.latitude, location?.longitude],
    queryFn: () => getAvailableDeliveries(location!.latitude, location!.longitude),
    enabled: Boolean(location),
  });

  const accept = useMutation({
    mutationFn: (id: string) => acceptDelivery(id),
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({ queryKey: ['rider-available'] });
      queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
      router.push(`/rider/delivery/${delivery.id}`);
    },
  });

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <View className="rounded-b-3xl bg-brand-night px-6 pb-6" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-green-400" />
              <Text className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Online
              </Text>
            </View>
            <Text className="mt-1 text-2xl font-extrabold text-white">Hi {firstName}</Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push('/rider/deliveries')}
              className="rounded-full bg-white/10 px-4 py-2 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-white">Deliveries</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/rider/account')}
              className="rounded-full bg-white/10 px-4 py-2 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-white">Account</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {locationQuery.isError ? (
        <QueryError
          message="Turn on location to find deliveries near you."
          onRetry={() => locationQuery.refetch()}
        />
      ) : (
        <FlatList
          data={availableQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingTop: 20, paddingBottom: 32 }}
          ListHeaderComponent={
            <Text className="mb-4 text-lg font-bold text-brand-navy">Available nearby</Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={availableQuery.isFetching}
              onRefresh={() => availableQuery.refetch()}
              tintColor={Brand.blue}
            />
          }
          renderItem={({ item }) => (
            <DeliveryCard
              delivery={item}
              accepting={accept.isPending && accept.variables === item.id}
              onAccept={() => accept.mutate(item.id)}
            />
          )}
          ListEmptyComponent={
            !location || availableQuery.isLoading ? (
              <View className="items-center py-16">
                <ActivityIndicator color={Brand.blue} />
              </View>
            ) : (
              <View className="items-center gap-3 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-14">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white">
                  <TruckIcon size={28} color={Brand.muted} />
                </View>
                <Text className="font-semibold text-gray-700">No deliveries nearby</Text>
                <Text className="text-center text-sm text-gray-500">Pull down to check again.</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

function DeliveryCard({
  delivery,
  accepting,
  onAccept,
}: {
  delivery: RiderDelivery;
  accepting: boolean;
  onAccept: () => void;
}) {
  return (
    <View className="mb-4 gap-4 rounded-3xl bg-white p-5" style={cardShadow}>
      <View className="flex-row items-center justify-between">
        <View className="rounded-full bg-brand-blue-tint px-3 py-1">
          <Text className="text-xs font-semibold text-brand-blue">
            {delivery.packageCategory ?? 'Delivery'}
          </Text>
        </View>
        <View className="rounded-full bg-brand-gold-tint px-3 py-1">
          <Text className="text-sm font-extrabold text-brand-navy">
            {delivery.feeNaira != null ? formatNaira(delivery.feeNaira) : '—'}
          </Text>
        </View>
      </View>

      <RouteLine compact pickup={delivery.pickup.address} dropoff={delivery.dropoff.address} />

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">
          {delivery.distanceKm != null ? `${delivery.distanceKm} km away` : ''}
        </Text>
        <View className="w-32">
          <Button label="Accept" loading={accepting} onPress={onAccept} />
        </View>
      </View>
    </View>
  );
}
