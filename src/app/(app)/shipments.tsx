import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { ShipmentCard } from '@/components/shipments/shipment-card';
import { TabHeader } from '@/components/tab-header';
import { Button } from '@/components/ui/button';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { BOOKING_ROUTE, freshDraftId } from '@/lib/booking';
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

const GUTTER = 20;
const courier = require('@/assets/images/courier-character.webp');

export default function ShipmentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  // Only show the pull-to-refresh spinner for a pull, not the refresh on focus.
  const [pulling, setPulling] = useState(false);
  const [starting, setStarting] = useState(false);

  const sendPackage = async () => {
    setStarting(true);
    try {
      router.push({ pathname: BOOKING_ROUTE.LOCAL, params: { id: await freshDraftId('LOCAL') } });
    } finally {
      setStarting(false);
    }
  };

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

  const moving = counts.active ?? 0;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <TabHeader
        title="Shipments"
        subtitle={moving > 0 ? `${moving} on the way right now` : 'Everything you’ve sent with Xcelar'}
      >
        <View className="flex-row rounded-full bg-white/15 p-1">
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
                className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${selected ? 'bg-white' : ''}`}
              >
                <Text className={`text-sm font-semibold ${selected ? 'text-brand-blue' : 'text-white'}`}>{option.label}</Text>
                {shipmentsQuery.data ? (
                  <View className={`min-w-[20px] items-center rounded-full px-1.5 py-0.5 ${selected ? 'bg-brand-blue' : 'bg-white/20'}`}>
                    <Text className="text-[11px] font-bold text-white">{counts[option.key]}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </TabHeader>

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
          contentContainerStyle={{ padding: GUTTER, gap: 12, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={pulling}
              onRefresh={async () => {
                setPulling(true);
                await shipmentsQuery.refetch();
                setPulling(false);
              }}
              tintColor={Brand.blue}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 50)}>
              <ShipmentCard shipment={item} onPress={() => router.push(`/shipment/${item.id}`)} />
            </Animated.View>
          )}
          ListEmptyComponent={
            filter === 'all' ? (
              <View className="mt-4 items-center px-4">
                <Image source={courier} style={{ width: 150, height: 188 }} contentFit="contain" accessible={false} />
                <Text className="mt-4 text-xl font-extrabold text-brand-navy">No shipments yet</Text>
                <Text className="mt-1.5 text-center text-sm leading-5 text-gray-500">
                  Book your first pickup and you’ll see every stop it makes, right here.
                </Text>
                <View className="mt-5 w-56">
                  <Button label="Send a package" loading={starting} onPress={() => void sendPackage()} />
                </View>
              </View>
            ) : (
              <View className="mt-4 items-center gap-1.5 rounded-3xl bg-brand-surface px-6 py-10">
                <Text className="text-base font-bold text-brand-navy">No {filter} shipments</Text>
                <Text className="text-center text-sm text-gray-500">They’ll show up here as their status changes.</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}
