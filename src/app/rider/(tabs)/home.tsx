import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon, CheckCircleIcon, ChevronRightIcon, PackageIcon, PinIcon, WalletIcon } from '@/components/icons';
import { DeliveryCard } from '@/components/rider/delivery-card';
import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira, initials } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';
import { getCurrentLocation } from '@/lib/location';
import {
  getMyCashInHand,
  getMyDeliveries,
  getMyRiderProfile,
  reportShiftLocation,
  setAvailability,
  type RiderJob,
} from '@/lib/rider-api';
import { isCompletedDelivery, jobBadge, nextStop } from '@/lib/rider-jobs';

import { IncomingJob } from '../../../../modules/incoming-job';

const courier = require('@/assets/images/courier-character.png');

/** How often the position dispatch sees is refreshed, and new jobs are checked
 *  for, while the app is open. Push notifications are the fast path. */
const LOCATION_INTERVAL_MS = 60_000;
const ASSIGNMENTS_INTERVAL_MS = 20_000;

/** Parcels already in hand first, then the oldest assignment. */
function byPriority(a: RiderJob, b: RiderJob): number {
  const aHolding = a.stage !== 'PICKUP_ASSIGNED';
  const bHolding = b.stage !== 'PICKUP_ASSIGNED';
  if (aHolding !== bHolding) return aHolding ? -1 : 1;
  return new Date(a.acceptedAt ?? 0).getTime() - new Date(b.acceptedAt ?? 0).getTime();
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function isToday(iso: string | null): boolean {
  return iso != null && new Date(iso).toDateString() === new Date().toDateString();
}

/**
 * The rider's day: the job to do next up top, today's numbers, then every job
 * dispatch has assigned. Riders don't switch themselves on: being in the app
 * means being on shift, so it tells dispatch so (and where they are) on its own.
 */
export default function RiderHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const fullName = useAuthStore((state) => state.user?.fullName ?? 'Rider');
  const [pulling, setPulling] = useState(false);
  // Android 14+ asks the rider to allow call-style alerts; re-checked each time Home is shown.
  const [fullScreenBlocked, setFullScreenBlocked] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFullScreenBlocked(IncomingJob.isAvailable && !IncomingJob.canUseFullScreenIntent());
    }, []),
  );

  const profileQuery = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });
  const profile = profileQuery.data;
  const isSuspended = profile?.isSuspended ?? false;
  const onShift = Boolean(profile?.isAvailable) && !isSuspended;

  // Opening the app puts the rider on shift; there's no switch to remember.
  const goOnShift = useMutation({
    mutationFn: () => setAvailability(true),
    onSuccess: (next) => queryClient.setQueryData(['rider-profile'], next),
  });
  const { mutate: startShift, isPending: startingShift } = goOnShift;
  useEffect(() => {
    if (profile && !profile.isAvailable && !profile.isSuspended && !startingShift) startShift();
  }, [profile, startShift, startingShift]);

  const locationQuery = useQuery({
    queryKey: ['rider-location'],
    queryFn: getCurrentLocation,
    staleTime: LOCATION_INTERVAL_MS,
    refetchInterval: onShift ? LOCATION_INTERVAL_MS : false,
    enabled: onShift,
  });
  const location = locationQuery.data;
  useEffect(() => {
    if (onShift && location) {
      // Best effort: a missed ping just means a slightly older position on the board.
      reportShiftLocation(location.latitude, location.longitude).catch(() => undefined);
    }
  }, [onShift, location]);

  const deliveriesQuery = useQuery({
    queryKey: ['rider-deliveries'],
    queryFn: getMyDeliveries,
    refetchInterval: onShift ? ASSIGNMENTS_INTERVAL_MS : false,
  });
  const cashQuery = useQuery({ queryKey: ['rider-cash'], queryFn: getMyCashInHand });

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['rider-cash'] });
    }, [queryClient]),
  );

  const jobs = deliveriesQuery.data ?? [];
  const assigned = jobs.filter((job) => job.isActive).sort(byPriority);
  const deliveredToday = jobs.filter((job) => isCompletedDelivery(job) && isToday(job.deliveredAt)).length;
  const cash = cashQuery.data;
  const [nextJob, ...laterJobs] = assigned;

  // The spinner only shows for a pull, never for the background checks above.
  const refresh = async () => {
    setPulling(true);
    await Promise.all([profileQuery.refetch(), deliveriesQuery.refetch(), cashQuery.refetch()]);
    setPulling(false);
  };
  const openJob = (job: RiderJob) => router.push(`/rider/delivery/${job.id}`);
  const rise = (step: number) => (reduceMotion ? undefined : FadeInDown.duration(380).delay(60 + step * 70));

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={pulling} onRefresh={() => void refresh()} tintColor={Brand.blue} />}
      >
        <Header
          firstName={fullName.split(' ')[0]}
          initials={initials(fullName)}
          onShift={onShift}
          area={location?.area ?? location?.region ?? null}
          nextJob={nextJob}
          loading={deliveriesQuery.isLoading}
          onOpenJob={openJob}
          onNotifications={() => router.push('/rider/notifications')}
          onProfile={() => router.push('/rider/account')}
        />

        <View className="gap-7 px-5 pt-6">
          {isSuspended ? (
            <Notice tone="danger" title="Your account is suspended">
              {profile?.suspendedReason ?? 'You won’t get new deliveries. Contact your manager.'}
            </Notice>
          ) : null}

          {fullScreenBlocked ? (
            <Pressable onPress={() => IncomingJob.openFullScreenSettings()} accessibilityRole="button">
              <Notice tone="warning" title="Let new jobs ring like a call">
                Allow full-screen alerts so a new job can wake your phone and open Xcelar. Tap to open Settings.
              </Notice>
            </Pressable>
          ) : null}

          {onShift && locationQuery.isError ? (
            <Pressable onPress={() => void Linking.openSettings()} accessibilityRole="button">
              <Notice tone="warning" title="Turn on location">
                Dispatch can’t see where you are, so they can’t send you nearby jobs. Tap to open Settings.
              </Notice>
            </Pressable>
          ) : null}

          <Animated.View entering={rise(0)} className="gap-3">
            <Text className="text-lg font-bold text-brand-navy">Today</Text>
            <View className="flex-row gap-3">
              <Stat icon={<CheckCircleIcon size={16} color={Brand.blue} />} value={String(deliveredToday)} label="Delivered" />
              <Stat icon={<PackageIcon size={16} color={Brand.blue} />} value={String(assigned.length)} label="To do" />
              <Stat
                icon={<WalletIcon size={16} color={Brand.blue} />}
                value={formatNaira(cash?.outstandingNaira ?? 0)}
                label="Cash to hand in"
                highlight={(cash?.jobCount ?? 0) > 0}
              />
            </View>
            {cash && cash.jobCount > 0 ? (
              <Text className="text-xs text-gray-500">
                From {cash.jobCount} pay-on-delivery {cash.jobCount === 1 ? 'job' : 'jobs'}. Hand it in at the hub; it clears once
                staff record it.
              </Text>
            ) : null}
          </Animated.View>

          {laterJobs.length > 0 ? (
            <Animated.View entering={rise(1)} className="gap-3">
              <Text className="text-lg font-bold text-brand-navy">Up next · {laterJobs.length}</Text>
              {laterJobs.map((job) => (
                <DeliveryCard key={job.id} delivery={job} onPress={() => openJob(job)} />
              ))}
            </Animated.View>
          ) : null}

          <Animated.View entering={rise(2)}>
            <Pressable
              onPress={() => router.push('/rider/deliveries')}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-3xl bg-brand-surface p-4 active:opacity-80"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
                <PackageIcon size={20} color={Brand.blue} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-brand-navy">All my jobs</Text>
                <Text className="text-xs text-gray-500">Active and completed, with proof of delivery</Text>
              </View>
              <ChevronRightIcon size={18} color={Brand.muted} />
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

type HeaderProps = {
  firstName: string;
  initials: string;
  onShift: boolean;
  area: string | null;
  nextJob?: RiderJob;
  loading: boolean;
  onOpenJob: (job: RiderJob) => void;
  onNotifications: () => void;
  onProfile: () => void;
};

/** Same blue header as the customer app, carrying the one job that matters now. */
function Header({ firstName, initials: letters, onShift, area, nextJob, loading, onOpenJob, onNotifications, onProfile }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[Brand.blue, Brand.blueDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
      }}
    >
      <View className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-white/10" />
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onProfile} accessibilityRole="button" accessibilityLabel="Your profile" className="flex-row items-center gap-3 active:opacity-80">
          <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-white/40 bg-brand-gold">
            <Text className="text-base font-bold text-brand-navy">{letters}</Text>
          </View>
          <View>
            <Text className="text-xs text-white/75">{greeting()}</Text>
            <Text className="text-lg font-bold text-white">{firstName}</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={onNotifications}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={6}
          className="h-11 w-11 items-center justify-center rounded-full bg-white/15 active:opacity-80"
        >
          <BellIcon size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="mt-4 flex-row items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1.5">
        <View className={`h-2 w-2 rounded-full ${onShift ? 'bg-green-300' : 'bg-white/50'}`} />
        <Text className="text-xs font-semibold text-white">
          {onShift ? `On shift${area ? ` · near ${area}` : ''}` : 'Off shift'}
        </Text>
      </View>

      {loading ? (
        <View className="h-36 items-center justify-center">
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : nextJob ? (
        <NextJob job={nextJob} onOpen={() => onOpenJob(nextJob)} />
      ) : (
        <View className="mt-3 flex-row items-end">
          <View className="flex-1 pb-3 pr-2">
            <Text className="text-2xl font-extrabold leading-8 text-white">No jobs right now</Text>
            <Text className="mt-1.5 text-sm leading-5 text-white/80">
              Dispatch assigns your pickups.{'\n'}We’ll buzz you when one is yours.
            </Text>
          </View>
          <Image source={courier} style={{ width: 104, height: 130, marginBottom: -24 }} contentFit="contain" accessible={false} />
        </View>
      )}
    </LinearGradient>
  );
}

function NextJob({ job, onOpen }: { job: RiderJob; onOpen: () => void }) {
  const badge = jobBadge(job);
  const stop = nextStop(job);
  const heading = job.stage === 'PICKUP_ASSIGNED' ? 'Next pickup' : 'Next drop-off';

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onOpen();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${heading}: ${stop?.address ?? stop?.name ?? ''}`}
      className="mt-5 rounded-3xl bg-white p-4 active:opacity-90"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-gray-500">{heading}</Text>
        <View className={`rounded-full px-2.5 py-1 ${badge.pill}`}>
          <Text className={`text-xs font-semibold ${badge.text}`}>{badge.label}</Text>
        </View>
      </View>
      <View className="mt-2 flex-row items-start gap-2">
        <PinIcon size={18} color={Brand.blue} />
        <Text className="flex-1 text-lg font-extrabold leading-6 text-brand-navy" numberOfLines={2}>
          {stop?.address ?? stop?.name ?? 'Open the job for details'}
        </Text>
      </View>
      <Text className="mt-1 text-xs text-gray-500" numberOfLines={1}>
        {[job.trackingCode, job.packageCategory, job.cashToCollectNaira != null ? `Collect ${formatNaira(job.cashToCollectNaira)}` : null]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <View className="mt-4 h-12 flex-row items-center justify-center gap-1 rounded-full bg-brand-blue">
        <Text className="text-base font-bold text-white">Start</Text>
        <ChevronRightIcon size={18} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

function Stat({ icon, value, label, highlight = false }: { icon: React.ReactNode; value: string; label: string; highlight?: boolean }) {
  return (
    <View className={`flex-1 rounded-3xl p-3.5 ${highlight ? 'bg-brand-gold-tint' : 'bg-brand-surface'}`}>
      <View className="h-8 w-8 items-center justify-center rounded-xl bg-white">{icon}</View>
      <Text className="mt-3 text-lg font-extrabold text-brand-navy" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-xs text-gray-500" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Notice({ tone, title, children }: { tone: 'danger' | 'warning'; title: string; children: React.ReactNode }) {
  const danger = tone === 'danger';
  return (
    <View className={`gap-1 rounded-2xl p-4 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
      <Text className={`font-bold ${danger ? 'text-red-700' : 'text-amber-800'}`}>{title}</Text>
      <Text className={`text-sm ${danger ? 'text-red-600' : 'text-amber-700'}`}>{children}</Text>
    </View>
  );
}
