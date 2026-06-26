import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BannerCarousel } from '@/components/home/banner-carousel';
import { QuickActions } from '@/components/home/quick-actions';
import { PackageIcon, SearchIcon } from '@/components/icons';
import { SupportWidget } from '@/components/support-widget';
import { Brand } from '@/constants/theme';
import { getBanners } from '@/lib/banner-api';
import { useAuthStore } from '@/lib/auth-store';

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
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [trackingId, setTrackingId] = useState('');

  const bannersQuery = useQuery({ queryKey: ['banners'], queryFn: getBanners });

  const name = user?.fullName ?? 'there';

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
          <QuickActions />
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
