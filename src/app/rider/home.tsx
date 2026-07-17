import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon, SearchIcon } from '@/components/icons';
import { RiderTabBar } from '@/components/rider/rider-tab-bar';
import { BikeGlyph } from '@/components/rider/vehicle-icons';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';
import { useAuthStore } from '@/lib/auth-store';
import { getCurrentLocation } from '@/lib/location';
import {
  getAvailableDeliveries,
  getMyRiderProfile,
  setAvailability,
  type RiderDelivery,
} from '@/lib/rider-api';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'R';
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function RiderHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const fullName = useAuthStore((state) => state.user?.fullName ?? '');
  const displayName = (fullName.trim().split('@')[0] || 'Rider').trim();

  const [whereTo, setWhereTo] = useState('');
  const [rejected, setRejected] = useState<string[]>([]);

  const profileQuery = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });
  const isOnline = profileQuery.data?.isAvailable ?? false;

  const availabilityMutation = useMutation({
    mutationFn: (next: boolean) => setAvailability(next),
    onSuccess: (profile) => {
      queryClient.setQueryData(['rider-profile'], profile);
      queryClient.invalidateQueries({ queryKey: ['rider-available'] });
    },
  });
  const toggleOnline = () => {
    tapFeedback();
    availabilityMutation.mutate(!isOnline);
  };

  // Only fetch a location (and prompt for the permission) once on shift.
  const locationQuery = useQuery({
    queryKey: ['rider-location'],
    queryFn: getCurrentLocation,
    staleTime: 60_000,
    enabled: isOnline,
  });
  const location = locationQuery.data;

  const availableQuery = useQuery({
    queryKey: ['rider-available', location?.latitude, location?.longitude],
    queryFn: () => getAvailableDeliveries(location!.latitude, location!.longitude),
    enabled: isOnline && Boolean(location),
  });

  const term = whereTo.trim().toLowerCase();
  const shown = (availableQuery.data ?? [])
    .filter((delivery) => !rejected.includes(delivery.id))
    .filter((delivery) => term === '' || (delivery.dropoff.address ?? '').toLowerCase().includes(term));

  // Pull-to-refresh should recover from either a stale location or a failed
  // fetch, so refresh both — location first, since the list depends on it.
  const refresh = () => {
    void locationQuery.refetch();
    void availableQuery.refetch();
  };

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
            </Pressable>
            <Pressable
              onPress={() => router.push('/rider/account')}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/15 active:opacity-80"
            >
              <Text className="text-base font-bold text-white">{initials(displayName)}</Text>
            </Pressable>
          </View>
        </View>

        <AvailabilityToggle
          online={isOnline}
          pending={availabilityMutation.isPending}
          disabled={profileQuery.isLoading}
          onToggle={toggleOnline}
        />
      </View>

      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          isOnline ? (
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
          ) : null
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
            refreshing={locationQuery.isFetching || availableQuery.isFetching}
            onRefresh={refresh}
            tintColor={Brand.blue}
          />
        }
        ListEmptyComponent={
          <EmptyState
            profileLoading={profileQuery.isLoading}
            offline={!isOnline}
            onGoOnline={() => availabilityMutation.mutate(true)}
            goingOnline={availabilityMutation.isPending}
            locationError={locationQuery.isError ? locationQuery.error : null}
            requestsError={availableQuery.isError ? availableQuery.error : null}
            loading={(!location || availableQuery.isLoading) && !locationQuery.isError}
            onRetry={refresh}
          />
        }
      />
      <RiderTabBar />
    </View>
  );
}

/** On/off-shift control in the header. The whole state lives server-side; this
 *  reflects it and flips it, showing a spinner while the change is in flight. */
function AvailabilityToggle({
  online,
  pending,
  disabled,
  onToggle,
}: {
  online: boolean;
  pending: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
      <View className="flex-row items-center gap-2.5">
        <View className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-green-400' : 'bg-white/40'}`} />
        <View>
          <Text className="text-base font-semibold text-white">
            {online ? 'You’re online' : 'You’re offline'}
          </Text>
          <Text className="text-xs text-white/50">
            {online ? 'Receiving delivery requests' : 'Not receiving requests'}
          </Text>
        </View>
      </View>
      {pending ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Switch
          value={online}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ true: Brand.gold, false: 'rgba(255,255,255,0.25)' }}
          thumbColor="#ffffff"
          ios_backgroundColor="rgba(255,255,255,0.25)"
        />
      )}
    </View>
  );
}

/** A themed card matching the "No requests" empty state — used for the location
 *  and fetch-error branches so failures never masquerade as an empty market. */
function EmptyCard({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mx-6 items-center gap-3 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-14">
      <Text className="font-semibold text-gray-700">{title}</Text>
      <Text className="text-center text-sm text-gray-500">{body}</Text>
      {actionLabel && onAction ? (
        <View className="w-48">
          <Button label={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

function EmptyState({
  profileLoading,
  offline,
  onGoOnline,
  goingOnline,
  locationError,
  requestsError,
  loading,
  onRetry,
}: {
  profileLoading: boolean;
  offline: boolean;
  onGoOnline: () => void;
  goingOnline: boolean;
  locationError: unknown;
  requestsError: unknown;
  loading: boolean;
  onRetry: () => void;
}) {
  if (profileLoading) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }
  if (offline) {
    return (
      <EmptyCard
        title="You’re offline"
        body="Go online to start receiving delivery requests near you."
        actionLabel={goingOnline ? 'Going online…' : 'Go online'}
        onAction={onGoOnline}
      />
    );
  }
  if (locationError) {
    return (
      <EmptyCard
        title="Location needed"
        body={errorMessage(locationError, 'We couldn’t get your location. Enable it to see nearby jobs.')}
        actionLabel="Open settings"
        onAction={() => void Linking.openSettings()}
      />
    );
  }
  if (loading) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }
  if (requestsError) {
    return (
      <EmptyCard
        title="Couldn’t load requests"
        body={errorMessage(requestsError, 'Something went wrong. Please try again.')}
        actionLabel="Try again"
        onAction={onRetry}
      />
    );
  }
  return (
    <EmptyCard title="No requests right now" body="Pull down to check again." />
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
        {delivery.description ? (
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {delivery.description}
          </Text>
        ) : null}
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
