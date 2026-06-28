import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira } from '@/lib/format';
import { getCurrentLocation } from '@/lib/location';
import { acceptDelivery, getAvailableDeliveries, type RiderDelivery } from '@/lib/rider-api';

export default function RiderHomeScreen() {
  const router = useRouter();
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

  const header = (
    <View className="gap-4 px-6 pb-2 pt-2">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-gray-500">Welcome back</Text>
          <Text className="text-2xl font-extrabold text-brand-navy">{firstName}</Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => router.push('/rider/deliveries')}
            className="rounded-full bg-brand-surface px-4 py-2 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-brand-navy">My deliveries</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/rider/documents')}
            className="rounded-full bg-brand-surface px-4 py-2 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-brand-navy">Profile</Text>
          </Pressable>
        </View>
      </View>
      <Text className="text-lg font-bold text-brand-navy">Available nearby</Text>
    </View>
  );

  if (locationQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar style="dark" />
        <QueryError
          message="We need your location to find deliveries near you."
          onRetry={() => locationQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <FlatList
        data={availableQuery.data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 32 }}
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
            <View className="mx-6 items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-12">
              <Text className="text-3xl">🛵</Text>
              <Text className="font-semibold text-gray-700">No deliveries nearby</Text>
              <Text className="text-center text-sm text-gray-500">Pull to refresh to check again.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
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
    <View className="mx-6 mb-4 gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-brand-blue">
          {delivery.packageCategory ?? 'Delivery'}
        </Text>
        <Text className="text-base font-extrabold text-brand-navy">
          {delivery.feeNaira != null ? formatNaira(delivery.feeNaira) : '—'}
        </Text>
      </View>

      <View className="gap-2">
        <Address dotClass="bg-green-500" label="Pickup" value={delivery.pickup.address} />
        <Address dotClass="bg-red-500" label="Drop-off" value={delivery.dropoff.address} />
      </View>

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

function Address({ dotClass, label, value }: { dotClass: string; label: string; value: string | null }) {
  return (
    <View className="flex-row items-start gap-2">
      <View className={`mt-1.5 h-2 w-2 rounded-full ${dotClass}`} />
      <View className="flex-1">
        <Text className="text-xs text-gray-400">{label}</Text>
        <Text className="text-sm text-gray-700" numberOfLines={1}>
          {value ?? '—'}
        </Text>
      </View>
    </View>
  );
}
