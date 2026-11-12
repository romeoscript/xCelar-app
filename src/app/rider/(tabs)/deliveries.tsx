import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ComponentProps, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DeliveryCard } from '@/components/rider/delivery-card';
import { TabHeader } from '@/components/tab-header';
import { QueryError } from '@/components/ui/query-error';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { getMyDeliveries, type RiderJob } from '@/lib/rider-api';
import { isCompletedDelivery } from '@/lib/rider-jobs';

type Tab = 'active' | 'completed';

const TABS: { key: Tab; label: string; matches: (job: RiderJob) => boolean }[] = [
  { key: 'active', label: 'Active', matches: (job) => job.isActive },
  { key: 'completed', label: 'Completed', matches: (job) => !job.isActive },
];

const EMPTY: Record<Tab, { icon: ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; body: string }> = {
  active: {
    icon: 'moped-outline',
    title: 'No active deliveries',
    body: 'Deliveries dispatch assigns to you show up here while you’re on them.',
  },
  completed: {
    icon: 'package-variant-closed-check',
    title: 'No completed deliveries yet',
    body: 'Jobs you finish are listed here, with their proof of delivery.',
  },
};

const GUTTER = 20;

export default function RiderDeliveriesScreen() {
  const router = useRouter();
  const deliveriesQuery = useQuery({ queryKey: ['rider-deliveries'], queryFn: getMyDeliveries });
  const [tab, setTab] = useState<Tab>('active');

  const all = useMemo(() => deliveriesQuery.data ?? [], [deliveriesQuery.data]);
  const delivered = all.filter(isCompletedDelivery);
  const [pulling, setPulling] = useState(false);
  const counts = Object.fromEntries(
    TABS.map((option) => [option.key, all.filter(option.matches).length]),
  ) as Record<Tab, number>;
  const shown = all.filter((TABS.find((option) => option.key === tab) ?? TABS[0]).matches);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <TabHeader
        title="My jobs"
        subtitle={`${delivered.length} delivered so far`}
      >
        <View className="flex-row rounded-full bg-white/15 p-1">
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
                className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${selected ? 'bg-white' : ''}`}
              >
                <Text className={`text-sm font-semibold ${selected ? 'text-brand-blue' : 'text-white'}`}>{option.label}</Text>
                {deliveriesQuery.data ? (
                  <View className={`min-w-[20px] items-center rounded-full px-1.5 py-0.5 ${selected ? 'bg-brand-blue' : 'bg-white/20'}`}>
                    <Text className="text-[11px] font-bold text-white">{counts[option.key]}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </TabHeader>

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
          contentContainerStyle={{ padding: GUTTER, paddingBottom: 32, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={pulling}
              onRefresh={async () => {
                setPulling(true);
                await deliveriesQuery.refetch();
                setPulling(false);
              }}
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
    </View>
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
