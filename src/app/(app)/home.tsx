import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BannerCarousel } from '@/components/home/banner-carousel';
import { QuickActions } from '@/components/home/quick-actions';
import { ShipmentCard } from '@/components/shipments/shipment-card';
import { ChevronRightIcon, PackageIcon, SearchIcon } from '@/components/icons';
import { SupportWidget } from '@/components/support-widget';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { getBanners } from '@/lib/banner-api';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira } from '@/lib/format';
import {
  createDraft,
  discardShipment,
  getOpenDraft,
  getShipmentByTracking,
  getShipments,
  type Shipment,
} from '@/lib/shipment-api';

const TOTAL_STEPS = 4;

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
  const [resumeDraft, setResumeDraft] = useState<Shipment | null>(null);
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
  const name = user?.fullName ?? 'there';

  const openShipLocal = (shipmentId: string) =>
    router.push({ pathname: '/ship-local', params: { id: shipmentId } });

  const startFreshLocal = async () => {
    const draft = await createDraft('LOCAL');
    openShipLocal(draft.id);
  };

  const handleQuickAction = async (key: string) => {
    if (key === 'quote') {
      router.push('/quote');
      return;
    }
    if (busy) {
      return;
    }
    if (key === 'export' || key === 'import') {
      const type = key === 'export' ? 'EXPORT' : 'IMPORT';
      const route = key === 'export' ? '/ship-export' : '/ship-import';
      setBusy(true);
      try {
        const draft = (await getOpenDraft(type)) ?? (await createDraft(type));
        router.push({ pathname: route, params: { id: draft.id } });
      } finally {
        setBusy(false);
      }
      return;
    }
    if (key !== 'ship-local') {
      return;
    }
    setBusy(true);
    try {
      const draft = await getOpenDraft('LOCAL');
      if (draft) {
        setResumeDraft(draft);
      } else {
        await startFreshLocal();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResume = () => {
    if (!resumeDraft) {
      return;
    }
    const draftId = resumeDraft.id;
    setResumeDraft(null);
    openShipLocal(draftId);
  };

  const handleStartNew = async () => {
    if (!resumeDraft) {
      return;
    }
    const oldId = resumeDraft.id;
    setResumeDraft(null);
    setBusy(true);
    try {
      await discardShipment(oldId);
      await startFreshLocal();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View
          className="rounded-b-[32px] bg-brand-navy px-6 pb-10"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-white/60">{greeting()}</Text>
              <Text className="text-2xl font-bold text-white">{name.split(' ')[0]}</Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-gold">
              <Text className="text-base font-bold text-brand-navy">{initials(name)}</Text>
            </View>
          </View>

          <View className="mt-7 flex-row items-end justify-between">
            <View>
              <Text className="text-xs uppercase tracking-wider text-white/50">Wallet balance</Text>
              <Text className="mt-1 text-3xl font-extrabold text-white">
                {formatNaira((user?.balanceKobo ?? 0) / 100)}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/wallet')}
              className="rounded-full bg-brand-gold px-4 py-2 active:opacity-90"
            >
              <Text className="text-sm font-bold text-brand-navy">Top up</Text>
            </Pressable>
          </View>
        </View>

        <View
          className="-mt-6 mx-6 flex-row items-center gap-2 rounded-2xl bg-white p-2 pl-4"
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
          <Text className="mx-6 mt-2 text-sm text-red-500">{trackError}</Text>
        ) : null}

        {draft && draft.currentStep < 3 ? (
          <View className="mx-6 mt-6 rounded-3xl bg-white p-5" style={cardShadow}>
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
              onPress={() => openShipLocal(draft.id)}
              className="mt-4 flex-row items-center justify-center gap-1 rounded-full bg-brand-blue py-3 active:opacity-90"
            >
              <Text className="text-sm font-semibold text-white">Continue</Text>
              <ChevronRightIcon size={18} color="#ffffff" />
            </Pressable>
          </View>
        ) : null}

        <View className="mt-8 px-6">
          <QuickActions onSelect={handleQuickAction} />
        </View>

        {bannersQuery.data && bannersQuery.data.length > 0 ? (
          <View className="mt-8 gap-3">
            <Text className="px-6 text-lg font-bold text-brand-navy">Promotions</Text>
            <BannerCarousel banners={bannersQuery.data} />
          </View>
        ) : null}

        <View className="mt-8 px-6">
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
      </ScrollView>

      <SupportWidget />

      <BottomSheet visible={resumeDraft != null} onClose={() => setResumeDraft(null)}>
        <Text className="text-xl font-bold text-brand-navy">Unfinished shipment</Text>
        <Text className="mt-2 text-base text-gray-500">
          You have a local shipment in progress. Continue where you left off, or start a new one?
        </Text>
        <View className="mt-6 gap-3">
          <Button label="Resume" onPress={handleResume} />
          <Button label="Start new" variant="secondary" onPress={handleStartNew} />
        </View>
      </BottomSheet>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
} as const;
