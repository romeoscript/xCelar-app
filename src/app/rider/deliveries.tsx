import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QueryError } from '@/components/ui/query-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { getMyDeliveries } from '@/lib/rider-api';

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Accepted',
  IN_TRANSIT: 'Delivering',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function RiderDeliveriesScreen() {
  const router = useRouter();
  const deliveriesQuery = useQuery({ queryKey: ['rider-deliveries'], queryFn: getMyDeliveries });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <ScreenHeader title="My deliveries" />
      {deliveriesQuery.isError ? (
        <QueryError onRetry={() => deliveriesQuery.refetch()} />
      ) : (
        <FlatList
          data={deliveriesQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/rider/delivery/${item.id}`)}
              className="gap-2 rounded-2xl border border-gray-100 bg-white p-4 active:opacity-80"
            >
              <View className="flex-row items-center justify-between">
                <View className="rounded-full bg-brand-blue-tint px-3 py-1">
                  <Text className="text-xs font-semibold text-brand-blue">
                    {DELIVERY_STATUS_LABELS[item.status] ?? item.status}
                  </Text>
                </View>
                <Text className="text-base font-bold text-brand-navy">
                  {item.feeNaira != null ? formatNaira(item.feeNaira) : '—'}
                </Text>
              </View>
              <Text className="text-sm text-gray-700" numberOfLines={1}>
                {item.pickup.address ?? '—'} → {item.dropoff.address ?? '—'}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            deliveriesQuery.isLoading ? (
              <View className="items-center py-16">
                <ActivityIndicator color={Brand.blue} />
              </View>
            ) : (
              <View className="items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-12">
                <Text className="font-semibold text-gray-700">No deliveries yet</Text>
                <Text className="text-center text-sm text-gray-500">
                  Accepted deliveries will appear here.
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
