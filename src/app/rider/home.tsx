import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon, SearchIcon } from '@/components/icons';
import { isActiveDelivery } from '@/components/rider/delivery-card';
import { OfflineMoon, SearchingRadar } from '@/components/rider/idle-illustrations';
import { RiderTabBar } from '@/components/rider/rider-tab-bar';
import { StatTile } from '@/components/rider/stat-tile';
import { BikeGlyph } from '@/components/rider/vehicle-icons';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { useRiderVehicle } from '@/hooks/use-rider-vehicle';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { useAuthStore } from '@/lib/auth-store';
import { getCurrentLocation } from '@/lib/location';
import {
  getAvailableDeliveries,
  getMyDeliveries,
  getMyRiderProfile,
  rejectDelivery,
  setAvailability,
  type RiderDelivery,
  type VehicleType,
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
  const vehicleType = useRiderVehicle();

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

  // Persist the rejection so the job stays gone after a refresh/restart. The
  // local `rejected` list removes it from view instantly; the server call keeps
  // it out of the feed for good.
  const rejectMutation = useMutation({
    mutationFn: (deliveryId: string) => rejectDelivery(deliveryId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rider-available'] }),
  });
  const handleReject = (deliveryId: string) => {
    setRejected((ids) => [...ids, deliveryId]);
    rejectMutation.mutate(deliveryId);
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

  const deliveriesQuery = useQuery({ queryKey: ['rider-deliveries'], queryFn: getMyDeliveries });
  const myDeliveries = deliveriesQuery.data ?? [];
  const activeDelivery = myDeliveries.find(isActiveDelivery);
  const deliveredToday = myDeliveries.filter(
    (delivery) =>
      delivery.status === 'DELIVERED' &&
      delivery.deliveredAt != null &&
      new Date(delivery.deliveredAt).toDateString() === new Date().toDateString(),
  );
  const earnedToday = deliveredToday.reduce((sum, delivery) => sum + (delivery.feeNaira ?? 0), 0);

  const term = whereTo.trim().toLowerCase();
  const shown = (availableQuery.data ?? [])
    .filter((delivery) => !rejected.includes(delivery.id))
    .filter((delivery) => term === '' || (delivery.dropoff.address ?? '').toLowerCase().includes(term));

  // Pull-to-refresh should recover from either a stale location or a failed
  // fetch, so refresh both — location first, since the list depends on it.
  const refresh = () => {
    void locationQuery.refetch();
    void availableQuery.refetch();
    void deliveriesQuery.refetch();
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <LinearGradient
        colors={[Brand.navy, Brand.indigo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View className="absolute -right-16 -top-10 h-56 w-56 rounded-full bg-white/5" />
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
      </LinearGradient>

      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <View className="gap-4 px-6 pb-1 pt-5">
            {activeDelivery ? (
              <ActiveDeliveryBanner
                delivery={activeDelivery}
                onPress={() => router.push(`/rider/delivery/${activeDelivery.id}`)}
              />
            ) : null}

            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-500">Today</Text>
              <View className="flex-row gap-3">
                <StatTile icon="cash-multiple" label="Earnings" value={formatNaira(earnedToday)} />
                <StatTile
                  icon="check-decagram"
                  label="Completed"
                  value={String(deliveredToday.length)}
                />
              </View>
            </View>

            {isOnline && (availableQuery.data?.length ?? 0) > 0 ? (
              <View className="gap-5 pt-1">
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
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <RequestCard
            delivery={item}
            onView={() => router.push(`/rider/request/${item.id}`)}
            onReject={() => handleReject(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={locationQuery.isFetching || availableQuery.isFetching || deliveriesQuery.isRefetching}
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
            vehicleType={vehicleType}
            area={location?.area ?? location?.region ?? null}
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
  vehicleType,
  area,
}: {
  profileLoading: boolean;
  offline: boolean;
  onGoOnline: () => void;
  goingOnline: boolean;
  locationError: unknown;
  requestsError: unknown;
  loading: boolean;
  onRetry: () => void;
  vehicleType?: VehicleType;
  area: string | null;
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
      <Animated.View entering={FadeIn.duration(400)}>
        <View className="items-center px-8 pt-12">
          <OfflineMoon />
          <Text className="mt-6 text-xl font-bold text-brand-navy">You’re offline</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
            Go online to start receiving delivery requests near you.
          </Text>
          <View className="mt-6 w-56">
            <Button label={goingOnline ? 'Going online…' : 'Go online'} onPress={onGoOnline} />
          </View>
        </View>
      </Animated.View>
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
    <Animated.View entering={FadeIn.duration(400)}>
      <View className="items-center px-8 pt-8">
        <SearchingRadar vehicleType={vehicleType} />
        <Text className="mt-4 text-xl font-bold text-brand-navy">Looking for deliveries</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
          New requests near you will appear here, and we’ll notify you the moment one comes in.
        </Text>
        {area ? (
          <View className="mt-5 flex-row items-center gap-1.5 rounded-full bg-brand-surface px-3.5 py-2">
            <MaterialCommunityIcons name="map-marker-radius" size={16} color={Brand.blue} />
            <Text className="text-sm font-medium text-brand-navy">Near {area}</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function ActiveDeliveryBanner({
  delivery,
  onPress,
}: {
  delivery: RiderDelivery;
  onPress: () => void;
}) {
  const inTransit = delivery.status === 'IN_TRANSIT';
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-2xl bg-brand-blue p-4 active:opacity-90"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20">
        <MaterialCommunityIcons
          name={inTransit ? 'map-marker-path' : 'package-variant-closed'}
          size={22}
          color="#ffffff"
        />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Delivery in progress
        </Text>
        <Text className="text-base font-bold text-white" numberOfLines={1}>
          {inTransit ? 'Heading to drop-off' : 'Heading to pickup'}
        </Text>
        <Text className="text-xs text-white/70" numberOfLines={1}>
          {(inTransit ? delivery.dropoff.address : delivery.pickup.address) ?? delivery.trackingCode}
        </Text>
      </View>
      <View className="rounded-full bg-white px-3 py-1.5">
        <Text className="text-xs font-bold text-brand-blue">Continue</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
});

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
