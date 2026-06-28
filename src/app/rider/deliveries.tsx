import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteLine } from '@/components/rider/route-line';
import { RiderTabBar } from '@/components/rider/rider-tab-bar';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { getMyDeliveries } from '@/lib/rider-api';

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Accepted',
  IN_TRANSIT: 'Delivering',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const DELIVERY_STATUS_STYLES: Record<string, { pill: string; text: string }> = {
  CONFIRMED: { pill: 'bg-brand-blue-tint', text: 'text-brand-blue' },
  IN_TRANSIT: { pill: 'bg-brand-gold-tint', text: 'text-brand-navy' },
  DELIVERED: { pill: 'bg-green-100', text: 'text-green-700' },
  CANCELLED: { pill: 'bg-red-100', text: 'text-red-700' },
};

const DEFAULT_STATUS_STYLE = { pill: 'bg-brand-surface', text: 'text-gray-600' };

export default function RiderDeliveriesScreen() {
  const router = useRouter();
  const deliveriesQuery = useQuery({ queryKey: ['rider-deliveries'], queryFn: getMyDeliveries });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <Text className="px-6 pb-2 pt-2 text-xl font-extrabold text-brand-navy">Bookings</Text>
      {deliveriesQuery.isError ? (
        <QueryError onRetry={() => deliveriesQuery.refetch()} />
      ) : (
        <FlatList
          data={deliveriesQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 110, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/rider/delivery/${item.id}`)}
              className="gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:opacity-80"
            >
              <View className="flex-row items-center justify-between">
                <View
                  className={`rounded-full px-3 py-1 ${
                    (DELIVERY_STATUS_STYLES[item.status] ?? DEFAULT_STATUS_STYLE).pill
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      (DELIVERY_STATUS_STYLES[item.status] ?? DEFAULT_STATUS_STYLE).text
                    }`}
                  >
                    {DELIVERY_STATUS_LABELS[item.status] ?? item.status}
                  </Text>
                </View>
                <View className="rounded-full bg-brand-gold-tint px-3 py-1">
                  <Text className="text-sm font-extrabold text-brand-navy">
                    {item.feeNaira != null ? formatNaira(item.feeNaira) : '—'}
                  </Text>
                </View>
              </View>
              <RouteLine compact pickup={item.pickup.address} dropoff={item.dropoff.address} />
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
      <RiderTabBar />
    </SafeAreaView>
  );
}
