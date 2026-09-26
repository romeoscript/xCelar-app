import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ReactNode } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActiveDeliveryCard } from '@/components/home/active-delivery-card';
import { BannerCarousel } from '@/components/home/banner-carousel';
import { QuickActions } from '@/components/home/quick-actions';
import { ResumeDraftsSheet } from '@/components/home/resume-drafts-sheet';
import { ShipmentCard } from '@/components/shipments/shipment-card';
import { ChevronRightIcon, PackageIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { SupportWidget } from '@/components/support-widget';
import { Brand } from '@/constants/theme';
import { isTrackable } from '@/hooks/use-shipment-tracking';
import { getBanners } from '@/lib/banner-api';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira } from '@/lib/format';
import {
  createDraft,
  discardShipment,
  getOpenDraft,
  getOpenDrafts,
  getShipmentByTracking,
  getShipments,
  type Shipment,
  type ShipmentType,
} from '@/lib/shipment-api';

const TOTAL_STEPS = 4;

// Each shipment type resumes in its own booking flow.
const SHIP_ROUTE: Record<ShipmentType, '/ship-local' | '/ship-export' | '/ship-import'> = {
  LOCAL: '/ship-local',
  EXPORT: '/ship-export',
  IMPORT: '/ship-import',
};

const QUICK_ACTION_TYPE: Record<string, ShipmentType> = {
  'ship-local': 'LOCAL',
  export: 'EXPORT',
  import: 'IMPORT',
};

function draftProgress(currentStep: number): number {
  return Math.min(100, Math.max(0, Math.round((currentStep / TOTAL_STEPS) * 100)));
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [trackingId, setTrackingId] = useState('');
  const [trackError, setTrackError] = useState<string | null>(null);
  const [resumeDrafts, setResumeDrafts] = useState<Shipment[]>([]);
  const [busy, setBusy] = useState(false);

  const trackMutation = useMutation({
    mutationFn: (code: string) => getShipmentByTracking(code),
    onSuccess: (shipment) => {
      setTrackingId('');
      setTrackError(null);
      router.push(`/shipment/${shipment.id}`);
    },
    onError: () => setTrackError('No shipment found with that tracking code.'),
  });

  const handleTrack = () => {
    const code = trackingId.trim();
    if (!code) {
      return;
    }
    Keyboard.dismiss();
    setTrackError(null);
    trackMutation.mutate(code);
  };

  const queryClient = useQueryClient();
  const bannersQuery = useQuery({ queryKey: ['banners'], queryFn: getBanners });
  const draftQuery = useQuery({
    queryKey: ['shipment-draft', 'LOCAL'],
    queryFn: () => getOpenDraft('LOCAL'),
  });
  const shipmentsQuery = useQuery({ queryKey: ['shipments'], queryFn: getShipments });

  // Refresh draft + shipments whenever the home tab regains focus (e.g. after
  // booking or abandoning a draft).
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['shipment-draft'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    }, [queryClient]),
  );

  const draft = draftQuery.data;
  const shipments = shipmentsQuery.data ?? [];
  const activeShipment = shipments.find((shipment) => shipment.paid && isTrackable(shipment));
  const name = user?.fullName ?? 'there';

  const openFlow = (type: ShipmentType, id: string) =>
    router.push({ pathname: SHIP_ROUTE[type], params: { id } });

  // Reuse an untouched (0%) draft or create a brand-new one, then open its flow.
  const startFresh = async (type: ShipmentType) => {
    const existing = await getOpenDraft(type);
    const draft = existing && existing.currentStep === 0 ? existing : await createDraft(type);
    openFlow(type, draft.id);
  };

  // Quick action: prompt to resume when in-progress drafts exist, else start fresh.
  const startFlow = async (type: ShipmentType) => {
    setBusy(true);
    try {
      const drafts = await getOpenDrafts(type);
      if (drafts.length > 0) {
        setResumeDrafts(drafts);
      } else {
        await startFresh(type);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleQuickAction = (key: string) => {
    if (key === 'quote') {
      router.push('/quote');
      return;
    }
    const type = QUICK_ACTION_TYPE[key];
    if (type && !busy) {
      void startFlow(type);
    }
  };

  const handleResume = (draft: Shipment) => {
    setResumeDrafts([]);
    openFlow(draft.type, draft.id);
  };

  const handleDiscardDraft = async (draft: Shipment) => {
    setResumeDrafts((current) => current.filter((item) => item.id !== draft.id));
    await discardShipment(draft.id);
    queryClient.invalidateQueries({ queryKey: ['shipment-draft'] });
    queryClient.invalidateQueries({ queryKey: ['shipments'] });
  };

  const handleStartNew = async () => {
    const type = resumeDrafts[0]?.type;
    if (!type) {
      return;
    }
    setResumeDrafts([]);
    setBusy(true);
    try {
      await startFresh(type);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 104 }}>
        <LinearGradient
          colors={[Brand.navy, Brand.indigo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          {/* Soft decorative rings for depth behind the header content. */}
          <View className="absolute -right-16 -top-10 h-56 w-56 rounded-full bg-white/5" />
          <View className="absolute -bottom-16 -left-20 h-44 w-44 rounded-full bg-white/5" />

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-white/60">{greeting()}</Text>
              <Text className="text-2xl font-bold text-white">{name.split(' ')[0]}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/account')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Account"
              className="h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-brand-gold active:opacity-80"
            >
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} className="h-11 w-11" resizeMode="cover" />
              ) : (
                <Text className="text-base font-bold text-brand-navy">{initials(name)}</Text>
              )}
            </Pressable>
          </View>

          <View className="mt-6 flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4">
            <View>
              <Text className="text-xs text-white/60">Wallet balance</Text>
              <Text className="mt-1 text-3xl font-extrabold text-white">
                {formatNaira((user?.balanceKobo ?? 0) / 100)}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/wallet')}
              accessibilityRole="button"
              className="flex-row items-center gap-1 rounded-full bg-brand-gold px-4 py-2.5 active:opacity-90"
            >
              <PlusIcon size={16} color={Brand.navy} />
              <Text className="text-sm font-bold text-brand-navy">Top up</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View
          className="-mt-7 mx-4 flex-row items-center gap-2 rounded-2xl bg-white p-2 pl-4"
          style={cardShadow}
        >
          <SearchIcon size={20} color={Brand.muted} />
          <TextInput
            value={trackingId}
            onChangeText={(value) => {
              setTrackingId(value);
              if (trackError) {
                setTrackError(null);
              }
            }}
            placeholder="Enter tracking ID"
            placeholderTextColor={Brand.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleTrack}
            className="flex-1 text-base text-gray-900"
          />
          <Pressable
            onPress={handleTrack}
            disabled={trackMutation.isPending}
            className="rounded-xl bg-brand-blue px-5 py-3 active:opacity-90"
          >
            <Text className="text-sm font-semibold text-white">
              {trackMutation.isPending ? '…' : 'Track'}
            </Text>
          </Pressable>
        </View>

        {trackError ? (
          <Text className="mx-4 mt-2 text-sm text-red-500">{trackError}</Text>
        ) : null}

        {activeShipment ? (
          <Reveal delay={60}>
            <View className="mx-4 mt-5">
              <ActiveDeliveryCard
                shipment={activeShipment}
                onPress={() =>
                  router.push({ pathname: '/track/[id]', params: { id: activeShipment.id } })
                }
              />
            </View>
          </Reveal>
        ) : null}

        {draft && draft.currentStep > 0 && draft.currentStep < 3 ? (
          <View className="mx-4 mt-5 rounded-3xl bg-white p-5" style={cardShadow}>
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue-tint">
                <PackageIcon size={22} color={Brand.blue} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-brand-navy">Continue your shipment</Text>
                <Text className="mt-0.5 text-sm text-gray-500">Pick up where you left off</Text>
              </View>
              <Text className="text-lg font-extrabold text-brand-blue">
                {draftProgress(draft.currentStep)}%
              </Text>
            </View>
            <View className="mt-4 h-2 overflow-hidden rounded-full bg-brand-surface">
              <View
                className="h-2 rounded-full bg-brand-blue"
                style={{ width: `${draftProgress(draft.currentStep)}%` }}
              />
            </View>
            <Pressable
              onPress={() => openFlow('LOCAL', draft.id)}
              className="mt-4 flex-row items-center justify-center gap-1 rounded-full bg-brand-blue py-3 active:opacity-90"
            >
              <Text className="text-sm font-semibold text-white">Continue</Text>
              <ChevronRightIcon size={18} color="#ffffff" />
            </Pressable>
          </View>
        ) : null}

        <Reveal delay={120}>
          <View className="mt-7 px-4">
            <QuickActions onSelect={handleQuickAction} />
          </View>
        </Reveal>

        {bannersQuery.data && bannersQuery.data.length > 0 ? (
          <Reveal delay={180}>
            <View className="mt-7 gap-3">
              <Text className="px-4 text-lg font-bold text-brand-navy">Promotions</Text>
              <BannerCarousel banners={bannersQuery.data} />
            </View>
          </Reveal>
        ) : null}

        <Reveal delay={240}>
          <View className="mt-7 px-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-brand-navy">Recent shipments</Text>
              {shipments.length > 0 ? (
                <Pressable onPress={() => router.push('/shipments')} hitSlop={8} className="active:opacity-70">
                  <Text className="text-sm font-semibold text-brand-blue">See all</Text>
                </Pressable>
              ) : null}
            </View>
            {shipments.length > 0 ? (
              <View className="gap-2">
                {shipments.slice(0, 3).map((shipment) => (
                  <ShipmentCard
                    key={shipment.id}
                    shipment={shipment}
                    onPress={() => router.push(`/shipment/${shipment.id}`)}
                  />
                ))}
              </View>
            ) : (
              <View className="items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-10">
                <PackageIcon size={32} color={Brand.muted} />
                <Text className="font-semibold text-gray-700">No shipments yet</Text>
                <Text className="text-center text-sm text-gray-500">
                  Book your first delivery and track it right here.
                </Text>
              </View>
            )}
          </View>
        </Reveal>
      </ScrollView>

      <SupportWidget />

      <ResumeDraftsSheet
        drafts={resumeDrafts}
        busy={busy}
        onResume={handleResume}
        onDiscard={handleDiscardDraft}
        onStartNew={handleStartNew}
        onClose={() => setResumeDrafts([])}
      />
    </View>
  );
}

/** Staggered fade-and-rise as the screen's sections first appear. */
function Reveal({ delay, children }: { delay: number; children: ReactNode }) {
  return <Animated.View entering={FadeInDown.duration(420).delay(delay)}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingBottom: 48,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
});

const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;
