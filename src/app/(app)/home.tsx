import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { BannerCarousel } from '@/components/home/banner-carousel';
import { HomeHeader, SEARCH_OVERLAP } from '@/components/home/home-header';
import { BusinessCard, HelpLinks, HowItWorks, RecentActivity } from '@/components/home/home-sections';
import { QuickActions } from '@/components/home/quick-actions';
import { ResumeDraftsSheet } from '@/components/home/resume-drafts-sheet';
import { ShipmentStrip } from '@/components/home/shipment-strip';
import { ArrowRightIcon, ChevronRightIcon, PackageIcon, SearchIcon } from '@/components/icons';
import { SupportWidget } from '@/components/support-widget';
import { Brand } from '@/constants/theme';
import { isTrackable } from '@/hooks/use-shipment-tracking';
import { isBooked } from '@/lib/shipment-status';
import { getBanners } from '@/lib/banner-api';
import { useAuthStore } from '@/lib/auth-store';
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

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export default function HomeScreen() {
  const router = useRouter();
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
  const activeShipment = shipments.find((shipment) => isBooked(shipment) && isTrackable(shipment));
  const name = user?.fullName ?? 'there';
  // Newest first; the header already shows the one that's moving.
  const booked = [...shipments.filter(isBooked)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const recent = booked.filter((shipment) => shipment.id !== activeShipment?.id).slice(0, 6);

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }} keyboardShouldPersistTaps="handled">
        <HomeHeader
          firstName={name.split(' ')[0]}
          initials={initials(name)}
          avatarUrl={user?.avatarUrl}
          balanceKobo={user?.balanceKobo ?? 0}
          activeShipment={activeShipment}
          onAccount={() => router.push('/account')}
          onWallet={() => router.push('/wallet')}
          onTrack={(shipment) => router.push({ pathname: '/track/[id]', params: { id: shipment.id } })}
          onBook={() => handleQuickAction('ship-local')}
        />

        <View
          className="mx-5 flex-row items-center gap-2 rounded-full bg-white py-1.5 pl-5 pr-1.5"
          style={[cardShadow, { marginTop: -SEARCH_OVERLAP }]}
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
            placeholder="Enter a tracking number"
            placeholderTextColor={Brand.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleTrack}
            className="h-11 flex-1 text-base text-gray-900"
          />
          <Pressable
            onPress={handleTrack}
            disabled={trackMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Track"
            className="h-11 w-11 items-center justify-center rounded-full bg-brand-blue active:opacity-90"
          >
            <ArrowRightIcon size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {trackError ? <Text className="mx-6 mt-2 text-sm text-red-500">{trackError}</Text> : null}

        {draft && draft.currentStep > 0 && draft.currentStep < 3 ? (
          <Pressable
            onPress={() => openFlow('LOCAL', draft.id)}
            accessibilityRole="button"
            className="mx-5 mt-5 flex-row items-center gap-3 rounded-3xl border border-brand-gold/40 bg-brand-gold-tint p-4 active:opacity-90"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
              <PackageIcon size={20} color={Brand.navy} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-brand-navy">Finish booking your delivery</Text>
              <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <View className="h-1.5 rounded-full bg-brand-gold" style={{ width: `${draftProgress(draft.currentStep)}%` }} />
              </View>
            </View>
            <ChevronRightIcon size={20} color={Brand.navy} />
          </Pressable>
        ) : null}

        <Reveal step={0}>
          <Section title="Services">
            <View className="px-5">
              <QuickActions onSelect={handleQuickAction} />
            </View>
          </Section>
        </Reveal>

        {recent.length > 0 ? (
          <Reveal step={1}>
            <Section title="Your shipments" action={{ label: 'View all', onPress: () => router.push('/shipments') }}>
              <ShipmentStrip shipments={recent} onOpen={(shipment) => router.push(`/shipment/${shipment.id}`)} />
            </Section>
          </Reveal>
        ) : null}

        {bannersQuery.data && bannersQuery.data.length > 0 ? (
          <Reveal step={2}>
            <Section title="For you">
              <BannerCarousel banners={bannersQuery.data} />
            </Section>
          </Reveal>
        ) : null}

        <Reveal step={3}>
          {booked.length > 0 ? (
            <Section title="Recent activity">
              <RecentActivity shipments={booked.slice(0, 4)} onOpen={(shipment) => router.push(`/shipment/${shipment.id}`)} />
            </Section>
          ) : (
            <Section title="How it works">
              <HowItWorks />
            </Section>
          )}
        </Reveal>

        <Reveal step={4}>
          <View className="mt-7">
            <BusinessCard onPress={() => router.push('/business')} />
          </View>
        </Reveal>

        <Reveal step={5}>
          <Section title="Need a hand?">
            <HelpLinks onFaq={() => router.push('/faq')} onContact={() => router.push('/contact')} />
          </Section>
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

/** Sections rise in one after another the first time the screen appears. */
function Reveal({ step, children }: { step: number; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(420).delay(80 + step * 80)}>{children}</Animated.View>;
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
  children: ReactNode;
}) {
  return (
    <View className="mt-7">
      <View className="mb-3 flex-row items-center justify-between px-5">
        <Text className="text-lg font-bold text-brand-navy">{title}</Text>
        {action ? (
          <Pressable onPress={action.onPress} hitSlop={8} className="flex-row items-center active:opacity-70">
            <Text className="text-sm font-semibold text-brand-blue">{action.label}</Text>
            <ChevronRightIcon size={16} color={Brand.blue} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const cardShadow = {
  shadowColor: '#1E1B4B',
  shadowOpacity: 0.1,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 5,
} as const;
