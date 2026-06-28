import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { RouteMap } from '@/components/rider/route-map';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { acceptDelivery, getAvailableDelivery } from '@/lib/rider-api';

export default function RouteMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const requestQuery = useQuery({
    queryKey: ['rider-request', id],
    queryFn: () => getAvailableDelivery(id as string),
    enabled: Boolean(id),
  });

  const accept = useMutation({
    mutationFn: () => acceptDelivery(id as string),
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({ queryKey: ['rider-available'] });
      queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
      router.replace(`/rider/delivery/${delivery.id}`);
    },
  });

  if (!id) {
    return <Redirect href="/rider/home" />;
  }

  const request = requestQuery.data;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        {requestQuery.isError ? (
          <QueryError message="This request is no longer available." onRetry={() => router.back()} />
        ) : request ? (
          <RouteMap
            pickupLat={request.pickup.lat}
            pickupLng={request.pickup.lng}
            dropoffLat={request.dropoff.lat}
            dropoffLng={request.dropoff.lng}
            fill
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={Brand.blue} />
          </View>
        )}
      </View>

      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={{ top: insets.top + 8 }}
        className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/95 active:opacity-80"
      >
        <ChevronLeftIcon size={22} color={Brand.navy} />
      </Pressable>

      {request ? (
        <View
          style={{ paddingBottom: insets.bottom + 12 }}
          className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-gray-100 bg-white px-6 pt-3"
        >
          <View className="flex-1">
            <Button label="Reject" variant="secondary" onPress={() => router.back()} />
          </View>
          <View className="flex-1">
            <Button label="Accept" loading={accept.isPending} onPress={() => accept.mutate()} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
