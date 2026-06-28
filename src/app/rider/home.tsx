import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon, SearchIcon } from '@/components/icons';
import { RiderTabBar } from '@/components/rider/rider-tab-bar';
import { BikeGlyph } from '@/components/rider/vehicle-icons';
import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { getCurrentLocation } from '@/lib/location';
import { getAvailableDeliveries, type RiderDelivery } from '@/lib/rider-api';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'R';
}

export default function RiderHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fullName = useAuthStore((state) => state.user?.fullName ?? '');
  const displayName = (fullName.trim().split('@')[0] || 'Rider').trim();

  const [whereTo, setWhereTo] = useState('');
  const [rejected, setRejected] = useState<string[]>([]);

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

  const term = whereTo.trim().toLowerCase();
  const shown = (availableQuery.data ?? [])
    .filter((delivery) => !rejected.includes(delivery.id))
    .filter((delivery) => term === '' || (delivery.dropoff.address ?? '').toLowerCase().includes(term));

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <View
        style={{ paddingTop: insets.top + 14 }}
        className="rounded-b-3xl bg-brand-navy px-6 pb-6"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm text-white/60">Welcome back</Text>
            <Text className="text-2xl font-extrabold text-white" numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.push('/rider/notifications')}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:opacity-70"
            >
              <BellIcon size={22} color="#ffffff" />
              <View className="absolute right-3 top-3 h-2 w-2 rounded-full bg-brand-gold" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/rider/account')}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/15 active:opacity-80"
            >
              <Text className="text-base font-bold text-white">{initials(displayName)}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <View className="gap-5 px-6 pb-1 pt-5">
            <View className="flex-row items-center gap-2 rounded-2xl bg-brand-surface px-4 py-3">
              <SearchIcon size={20} color={Brand.muted} />
              <TextInput
                value={whereTo}
                onChangeText={setWhereTo}
                placeholder="Filter by drop-off area"
                placeholderTextColor={Brand.muted}
                className="flex-1 text-base text-gray-900"
              />
            </View>

            <Text className="text-lg font-bold text-brand-navy">Available requests</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RequestCard
            delivery={item}
            onView={() => router.push(`/rider/request/${item.id}`)}
            onReject={() => setRejected((ids) => [...ids, item.id])}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={availableQuery.isFetching}
            onRefresh={() => availableQuery.refetch()}
            tintColor={Brand.blue}
          />
        }
        ListEmptyComponent={
          !location || availableQuery.isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={Brand.blue} />
            </View>
          ) : (
            <View className="mx-6 items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-14">
              <Text className="font-semibold text-gray-700">No requests right now</Text>
              <Text className="text-center text-sm text-gray-500">Pull down to check again.</Text>
            </View>
          )
        }
      />
      <RiderTabBar />
    </View>
  );
}

function RequestCard({
  delivery,
  onView,
  onReject,
}: {
  delivery: RiderDelivery;
  onView: () => void;
  onReject: () => void;
}) {
  return (
    <View className="mx-6 mb-4 gap-3 border-b border-gray-100 pb-5">
      <View>
        <Text className="text-base font-bold text-brand-navy">
          {delivery.packageCategory ?? 'Delivery'}
        </Text>
        <Text className="text-sm text-gray-500">Recipient: {delivery.dropoff.name ?? '—'}</Text>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="h-12 w-14 items-center justify-center rounded-xl bg-brand-surface">
          <BikeGlyph color={Brand.navy} />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Drop off{delivery.distanceKm != null ? ` · ${delivery.distanceKm} km` : ''}
          </Text>
          <Text className="text-sm font-medium text-brand-navy" numberOfLines={1}>
            {delivery.dropoff.address ?? '—'}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={onReject}
          className="flex-1 items-center rounded-xl bg-brand-surface py-3.5 active:opacity-70"
        >
          <Text className="text-base font-semibold text-brand-navy">Reject</Text>
        </Pressable>
        <Pressable
          onPress={onView}
          className="flex-1 items-center rounded-xl bg-brand-blue py-3.5 active:opacity-80"
        >
          <Text className="text-base font-semibold text-white">View details</Text>
        </Pressable>
      </View>
    </View>
  );
}
