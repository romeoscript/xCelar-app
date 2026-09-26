import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ComponentProps, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeliveryCard, isActiveDelivery } from '@/components/rider/delivery-card';
import { RiderTabBar } from '@/components/rider/rider-tab-bar';
import { StatTile } from '@/components/rider/stat-tile';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { getMyDeliveries, type RiderDelivery } from '@/lib/rider-api';

type Tab = 'active' | 'completed';

const TABS: { key: Tab; label: string; matches: (delivery: RiderDelivery) => boolean }[] = [
  { key: 'active', label: 'Active', matches: isActiveDelivery },
  { key: 'completed', label: 'Completed', matches: (delivery) => !isActiveDelivery(delivery) },
];

const EMPTY: Record<Tab, { icon: ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; body: string }> = {
  active: {
    icon: 'moped-outline',
    title: 'No active deliveries',
    body: 'Jobs you accept from the home screen show up here while you’re on them.',
  },
  completed: {
    icon: 'package-variant-closed-check',
    title: 'No completed deliveries yet',
    body: 'Finished jobs and what you earned from them will be listed here.',
  },
};

const GUTTER = 16;

export default function RiderDeliveriesScreen() {
  const router = useRouter();
  const deliveriesQuery = useQuery({ queryKey: ['rider-deliveries'], queryFn: getMyDeliveries });
  const [tab, setTab] = useState<Tab>('active');

  const all = useMemo(() => deliveriesQuery.data ?? [], [deliveriesQuery.data]);
  const delivered = all.filter((delivery) => delivery.status === 'DELIVERED');
  const earned = delivered.reduce((sum, delivery) => sum + (delivery.feeNaira ?? 0), 0);
  const counts = Object.fromEntries(
    TABS.map((option) => [option.key, all.filter(option.matches).length]),
  ) as Record<Tab, number>;
  const shown = all.filter((TABS.find((option) => option.key === tab) ?? TABS[0]).matches);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <View className="gap-4 pt-2" style={{ paddingHorizontal: GUTTER }}>
        <Text className="text-2xl font-bold text-brand-navy">Bookings</Text>

        <View className="flex-row gap-3">
          <StatTile icon="check-decagram" label="Completed" value={String(delivered.length)} />
          <StatTile icon="wallet-outline" label="Total earned" value={formatNaira(earned)} />
        </View>

        <View className="flex-row rounded-xl bg-gray-100 p-1">
          {TABS.map((option) => {
            const selected = option.key === tab;
            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  if (!selected) {
                    tapFeedback();
                    setTab(option.key);
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
                {deliveriesQuery.data ? (
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

      {deliveriesQuery.isError && !deliveriesQuery.data ? (
        <QueryError message="Couldn’t load your bookings." onRetry={() => deliveriesQuery.refetch()} />
      ) : deliveriesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Brand.blue} />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: GUTTER, paddingBottom: 110, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={deliveriesQuery.isRefetching}
              onRefresh={() => deliveriesQuery.refetch()}
              tintColor={Brand.blue}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 50)}>
              <DeliveryCard
                delivery={item}
                onPress={() => router.push(`/rider/delivery/${item.id}`)}
              />
            </Animated.View>
          )}
          ListEmptyComponent={<EmptyState tab={tab} />}
        />
      )}
      <RiderTabBar />
    </SafeAreaView>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const copy = EMPTY[tab];
  return (
    <View className="mt-10 items-center px-8">
      <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-surface">
        <MaterialCommunityIcons name={copy.icon} size={34} color={Brand.muted} />
      </View>
      <Text className="mt-4 text-base font-semibold text-gray-800">{copy.title}</Text>
      <Text className="mt-1 text-center text-sm leading-5 text-gray-500">{copy.body}</Text>
    </View>
  );
}

const segmentShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
} as const;
