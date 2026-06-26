import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BannerCarousel } from '@/components/home/banner-carousel';
import { QuickActions } from '@/components/home/quick-actions';
import { SearchIcon, WalletIcon } from '@/components/icons';
import { SupportWidget } from '@/components/support-widget';
import { Brand } from '@/constants/theme';
import { getBanners } from '@/lib/banner-api';
import { useAuthStore } from '@/lib/auth-store';

function firstName(fullName: string): string {
  return fullName.trim().split(' ')[0] || fullName;
}

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const [trackingId, setTrackingId] = useState('');

  const bannersQuery = useQuery({ queryKey: ['banners'], queryFn: getBanners });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between px-6 pt-2">
          <Text className="text-2xl font-bold text-brand-navy">
            Hello {user ? firstName(user.fullName) : 'there'}
          </Text>
          <View className="flex-row items-center gap-1.5 rounded-full bg-brand-blue-tint px-3 py-2">
            <WalletIcon size={16} color={Brand.blue} />
            <Text className="text-sm font-bold text-brand-blue">₦0.00</Text>
          </View>
        </View>

        <View className="mt-5 flex-row items-center gap-3 px-6">
          <View className="h-14 flex-1 flex-row items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4">
            <SearchIcon size={20} color={Brand.muted} />
            <TextInput
              value={trackingId}
              onChangeText={setTrackingId}
              placeholder="Enter tracking ID"
              placeholderTextColor={Brand.muted}
              className="flex-1 text-base text-gray-900"
            />
          </View>
          <Pressable className="h-14 items-center justify-center rounded-2xl bg-brand-blue px-6 active:opacity-90">
            <Text className="text-base font-semibold text-white">Track</Text>
          </Pressable>
        </View>

        {bannersQuery.data ? (
          <View className="mt-6">
            <BannerCarousel banners={bannersQuery.data} />
          </View>
        ) : null}

        <View className="mt-6 px-6">
          <Text className="mb-4 text-lg font-bold text-brand-navy">Quick actions</Text>
          <QuickActions />
        </View>
      </ScrollView>

      <SupportWidget />
    </SafeAreaView>
  );
}
