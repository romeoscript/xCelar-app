import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PackageIcon } from '@/components/icons';
import { ShipmentCard } from '@/components/shipments/shipment-card';
import { Brand } from '@/constants/theme';
import { getShipments, type ShipmentStatus } from '@/lib/shipment-api';

type Filter = 'all' | 'active' | 'delivered';

const ACTIVE_STATUSES: ShipmentStatus[] = ['PENDING', 'CONFIRMED', 'IN_TRANSIT'];

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
];

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

  const filtered = useMemo(() => {
    const all = shipmentsQuery.data ?? [];
    if (filter === 'active') {
      return all.filter((shipment) => ACTIVE_STATUSES.includes(shipment.status));
    }
    if (filter === 'delivered') {
      return all.filter((shipment) => shipment.status === 'DELIVERED');
    }
    return all;
  }, [shipmentsQuery.data, filter]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <View className="px-6 pt-2">
        <Text className="text-2xl font-bold text-brand-navy">Shipments</Text>
        <View className="mt-4 flex-row gap-2">
          {FILTERS.map((option) => {
            const selected = option.key === filter;
            return (
              <Pressable
                key={option.key}
                onPress={() => setFilter(option.key)}
                className={`rounded-full px-4 py-2 ${selected ? 'bg-brand-blue' : 'bg-gray-100'}`}
              >
                <Text
                  className={`text-sm font-semibold ${selected ? 'text-white' : 'text-gray-600'}`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(shipment) => shipment.id}
        contentContainerStyle={{ padding: 24, gap: 12 }}
        renderItem={({ item }) => (
          <ShipmentCard
            shipment={item}
            onPress={() => router.push(`/shipment/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="mt-10 items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-12">
            <PackageIcon size={32} color={Brand.muted} />
            <Text className="font-semibold text-gray-700">Nothing here yet</Text>
            <Text className="text-center text-sm text-gray-500">
              {filter === 'all'
                ? 'Your shipments will appear here.'
                : 'No shipments match this filter.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
