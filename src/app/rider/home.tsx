import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon } from '@/components/icons';
import { DeliveryCard } from '@/components/rider/delivery-card';
import { OfflineMoon, SearchingRadar } from '@/components/rider/idle-illustrations';
import { RiderTabBar } from '@/components/rider/rider-tab-bar';
import { StatTile } from '@/components/rider/stat-tile';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { useRiderVehicle } from '@/hooks/use-rider-vehicle';
import { formatNaira } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { useAuthStore } from '@/lib/auth-store';
import { getCurrentLocation } from '@/lib/location';
import {
  getMyCashInHand,
  getMyDeliveries,
  getMyRiderProfile,
  reportShiftLocation,
  setAvailability,
  type CashInHand,
  type RiderJob,
  type VehicleType,
} from '@/lib/rider-api';
import { isCompletedDelivery } from '@/lib/rider-jobs';

/** While on shift: how often to refresh the position dispatch sees, and how
 *  often to check for new assignments (push notifications are the fast path). */
const LOCATION_INTERVAL_MS = 60_000;
const ASSIGNMENTS_INTERVAL_MS = 20_000;

/** Parcels already in hand first, then the oldest assignment. */
function byPriority(a: RiderJob, b: RiderJob): number {
  const aHolding = a.stage !== 'PICKUP_ASSIGNED';
  const bHolding = b.stage !== 'PICKUP_ASSIGNED';
  if (aHolding !== bHolding) return aHolding ? -1 : 1;
  return new Date(a.acceptedAt ?? 0).getTime() - new Date(b.acceptedAt ?? 0).getTime();
}

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

  const profileQuery = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });
  const isOnline = profileQuery.data?.isAvailable ?? false;
  const isSuspended = profileQuery.data?.isSuspended ?? false;

  const availabilityMutation = useMutation({
    mutationFn: (next: boolean) => setAvailability(next),
    onSuccess: (profile) => queryClient.setQueryData(['rider-profile'], profile),
  });
  const toggleOnline = () => {
    tapFeedback();
    availabilityMutation.mutate(!isOnline);
  };

  // Only fetch a location (and prompt for the permission) once on shift, and
  // keep it fresh so dispatch can see who is closest to a pickup.
  const locationQuery = useQuery({
    queryKey: ['rider-location'],
    queryFn: getCurrentLocation,
    staleTime: LOCATION_INTERVAL_MS,
    refetchInterval: isOnline ? LOCATION_INTERVAL_MS : false,
    enabled: isOnline,
  });
  const location = locationQuery.data;

  useEffect(() => {
    if (isOnline && location) {
      // Best effort: a missed ping just means a slightly older position on the board.
      reportShiftLocation(location.latitude, location.longitude).catch(() => undefined);
    }
  }, [isOnline, location]);

  const deliveriesQuery = useQuery({
    queryKey: ['rider-deliveries'],
    queryFn: getMyDeliveries,
    refetchInterval: isOnline ? ASSIGNMENTS_INTERVAL_MS : false,
  });
  const myDeliveries = deliveriesQuery.data ?? [];
  const assigned = myDeliveries.filter((job) => job.isActive).sort(byPriority);
  const deliveredToday = myDeliveries.filter(
    (job) =>
      isCompletedDelivery(job) &&
      job.deliveredAt != null &&
      new Date(job.deliveredAt).toDateString() === new Date().toDateString(),
  );
  const cashQuery = useQuery({ queryKey: ['rider-cash'], queryFn: getMyCashInHand });
  const cashInHand = cashQuery.data;

  const earnedToday = deliveredToday.reduce((sum, delivery) => sum + (delivery.feeNaira ?? 0), 0);

  const refresh = () => {
    void profileQuery.refetch();
    void deliveriesQuery.refetch();
    void cashQuery.refetch();
    if (isOnline) void locationQuery.refetch();
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
          disabled={profileQuery.isLoading || isSuspended}
          onToggle={toggleOnline}
        />
      </LinearGradient>

      <FlatList
        data={assigned}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <View className="gap-4 px-6 pb-3 pt-5">
            {isSuspended ? (
              <View className="gap-1 rounded-2xl border border-red-100 bg-red-50 p-4">
                <Text className="font-bold text-red-700">Your account is suspended</Text>
                <Text className="text-sm text-red-600">
                  {profileQuery.data?.suspendedReason
                    ? profileQuery.data.suspendedReason
                    : 'You can’t go online or receive deliveries. Contact your manager.'}
                </Text>
              </View>
            ) : null}

            {isOnline && locationQuery.isError ? (
              <Pressable
                onPress={() => void Linking.openSettings()}
                className="flex-row items-center gap-3 rounded-2xl bg-amber-50 p-4 active:opacity-80"
              >
                <MaterialCommunityIcons name="map-marker-off" size={20} color={Brand.navy} />
                <Text className="flex-1 text-sm text-amber-800">
                  Location is off, so dispatch can’t see where you are. Tap to turn it on.
                </Text>
              </Pressable>
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

            {cashInHand && cashInHand.jobCount > 0 ? <CashToHandIn cash={cashInHand} /> : null}

            {assigned.length > 0 ? (
              <Text className="pt-1 text-lg font-bold text-brand-navy">
                Assigned to you · {assigned.length}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-6">
            <DeliveryCard delivery={item} onPress={() => router.push(`/rider/delivery/${item.id}`)} />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={deliveriesQuery.isRefetching || profileQuery.isRefetching}
            onRefresh={refresh}
            tintColor={Brand.blue}
          />
        }
        ListEmptyComponent={
          <EmptyState
            loading={profileQuery.isLoading || deliveriesQuery.isLoading}
            suspended={isSuspended}
            offline={!isOnline}
            onGoOnline={() => availabilityMutation.mutate(true)}
            goingOnline={availabilityMutation.isPending}
            error={deliveriesQuery.isError ? deliveriesQuery.error : null}
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

/** Cash collected on pay-on-delivery jobs that still has to go to the hub.
 *  It clears when staff record the handover there. */
function CashToHandIn({ cash }: { cash: CashInHand }) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
      <MaterialCommunityIcons name="cash-fast" size={24} color={Brand.navy} />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-amber-800">Cash to hand in</Text>
        <Text className="text-xs text-amber-700">
          From {cash.jobCount} pay-on-delivery {cash.jobCount === 1 ? 'job' : 'jobs'}. Hand it in at the hub.
        </Text>
      </View>
      <Text className="text-lg font-extrabold text-brand-navy">{formatNaira(cash.outstandingNaira)}</Text>
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
            {online ? 'Dispatch can assign you deliveries' : 'Dispatch can’t assign you deliveries'}
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
  loading,
  suspended,
  offline,
  onGoOnline,
  goingOnline,
  error,
  onRetry,
  vehicleType,
  area,
}: {
  loading: boolean;
  suspended: boolean;
  offline: boolean;
  onGoOnline: () => void;
  goingOnline: boolean;
  error: unknown;
  onRetry: () => void;
  vehicleType?: VehicleType;
  area: string | null;
}) {
  if (loading) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }
  if (error) {
    return (
      <EmptyCard
        title="Couldn’t load your deliveries"
        body={errorMessage(error, 'Something went wrong. Please try again.')}
        actionLabel="Try again"
        onAction={onRetry}
      />
    );
  }
  if (suspended) {
    return null;
  }
  if (offline) {
    return (
      <Animated.View entering={FadeIn.duration(400)}>
        <View className="items-center px-8 pt-12">
          <OfflineMoon />
          <Text className="mt-6 text-xl font-bold text-brand-navy">You’re offline</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
            Go online so dispatch can assign you deliveries.
          </Text>
          <View className="mt-6 w-56">
            <Button label={goingOnline ? 'Going online…' : 'Go online'} onPress={onGoOnline} />
          </View>
        </View>
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <View className="items-center px-8 pt-8">
        <SearchingRadar vehicleType={vehicleType} />
        <Text className="mt-4 text-xl font-bold text-brand-navy">Waiting for dispatch</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
          Your manager assigns deliveries. We’ll notify you the moment one is yours.
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

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
});
