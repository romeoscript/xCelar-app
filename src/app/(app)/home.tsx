import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BannerCarousel } from '@/components/home/banner-carousel';
import { QuickActions } from '@/components/home/quick-actions';
import { PackageIcon, SearchIcon } from '@/components/icons';
import { SupportWidget } from '@/components/support-widget';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { getBanners } from '@/lib/banner-api';
import { useAuthStore } from '@/lib/auth-store';
import { createDraft, discardShipment, getOpenDraft, type Shipment } from '@/lib/shipment-api';

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
  const [resumeDraft, setResumeDraft] = useState<Shipment | null>(null);
  const [busy, setBusy] = useState(false);

  const bannersQuery = useQuery({ queryKey: ['banners'], queryFn: getBanners });

  const name = user?.fullName ?? 'there';

  const openShipLocal = (shipmentId: string) =>
    router.push({ pathname: '/ship-local', params: { id: shipmentId } });

  const startFreshLocal = async () => {
    const draft = await createDraft('LOCAL');
    openShipLocal(draft.id);
  };

  const handleQuickAction = async (key: string) => {
    if (key !== 'ship-local' || busy) {
      return; // Other flows aren't built yet.
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
              <Text className="mt-1 text-3xl font-extrabold text-white">₦0.00</Text>
            </View>
            <Pressable className="rounded-full bg-brand-gold px-4 py-2 active:opacity-90">
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
            onChangeText={setTrackingId}
            placeholder="Enter tracking ID"
            placeholderTextColor={Brand.muted}
            className="flex-1 text-base text-gray-900"
          />
          <Pressable className="rounded-xl bg-brand-blue px-5 py-3 active:opacity-90">
            <Text className="text-sm font-semibold text-white">Track</Text>
          </Pressable>
        </View>

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
          <Text className="mb-3 text-lg font-bold text-brand-navy">Recent shipments</Text>
          <View className="items-center gap-2 rounded-3xl border border-gray-100 bg-brand-surface px-6 py-10">
            <PackageIcon size={32} color={Brand.muted} />
            <Text className="font-semibold text-gray-700">No shipments yet</Text>
            <Text className="text-center text-sm text-gray-500">
              Book your first delivery and track it right here.
            </Text>
          </View>
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
