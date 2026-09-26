import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PackageIcon } from '@/components/icons';
import { ShipmentCard } from '@/components/shipments/shipment-card';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { getShipments, type Shipment, type ShipmentStatus } from '@/lib/shipment-api';

type Filter = 'all' | 'active' | 'delivered';

const ACTIVE_STATUSES: ShipmentStatus[] = ['PENDING', 'CONFIRMED', 'IN_TRANSIT'];

const FILTERS: { key: Filter; label: string; matches: (shipment: Shipment) => boolean }[] = [
  { key: 'all', label: 'All', matches: () => true },
  {
    key: 'active',
    label: 'Active',
    matches: (shipment) => ACTIVE_STATUSES.includes(shipment.status),
  },
  { key: 'delivered', label: 'Delivered', matches: (shipment) => shipment.status === 'DELIVERED' },
];

const GUTTER = 16;

export default function ShipmentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');

  const shipmentsQuery = useQuery({ queryKey: ['shipments'], queryFn: getShipments });

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }, [queryClient]),
  );

  const all = useMemo(() => shipmentsQuery.data ?? [], [shipmentsQuery.data]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((option) => [option.key, all.filter(option.matches).length]),
      ) as Record<Filter, number>,
    [all],
  );
  const filtered = useMemo(() => {
    const option = FILTERS.find((item) => item.key === filter) ?? FILTERS[0];
    return all.filter(option.matches);
  }, [all, filter]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <View className="pt-2" style={{ paddingHorizontal: GUTTER }}>
        <Text className="text-2xl font-bold text-brand-navy">Shipments</Text>
        <View className="mt-4 flex-row rounded-xl bg-gray-100 p-1">
          {FILTERS.map((option) => {
            const selected = option.key === filter;
            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  if (!selected) {
                    tapFeedback();
                    setFilter(option.key);
                  }
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2 ${selected ? 'bg-white' : ''}`}
                style={selected ? segmentShadow : undefined}
              >
                <Text
                  className={`text-sm font-semibold ${selected ? 'text-brand-navy' : 'text-gray-500'}`}
                >
                  {option.label}
                </Text>
                {shipmentsQuery.data ? (
                  <View
                    className={`min-w-[20px] items-center rounded-full px-1.5 py-0.5 ${selected ? 'bg-brand-blue' : 'bg-gray-200'}`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${selected ? 'text-white' : 'text-gray-500'}`}
                    >
                      {counts[option.key]}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {shipmentsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : shipmentsQuery.isError && !shipmentsQuery.data ? (
        <QueryError
          message="Couldn’t load your shipments."
          onRetry={() => shipmentsQuery.refetch()}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(shipment) => shipment.id}
          contentContainerStyle={{ padding: GUTTER, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={shipmentsQuery.isRefetching}
              onRefresh={() => shipmentsQuery.refetch()}
              tintColor={Brand.blue}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 50)}>
              <ShipmentCard shipment={item} onPress={() => router.push(`/shipment/${item.id}`)} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View className="mt-6 items-center gap-2 rounded-2xl border border-gray-100 bg-brand-surface px-6 py-12">
              <View className="mb-1 h-14 w-14 items-center justify-center rounded-full bg-white">
                <PackageIcon size={26} color={Brand.muted} />
              </View>
              <Text className="font-semibold text-gray-700">
                {filter === 'all' ? 'No shipments yet' : `No ${filter} shipments`}
              </Text>
              <Text className="text-center text-sm text-gray-500">
                {filter === 'all'
                  ? 'Book your first delivery and track it right here.'
                  : 'Shipments will show up here as their status changes.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const segmentShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
} as const;
