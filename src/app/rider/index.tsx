import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon, CrosshairIcon, PinIcon, TruckIcon, WalletIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { getMyRiderProfile } from '@/lib/rider-api';

/** Routes into the rider experience: a landing page when signed out, otherwise
 *  on to onboarding / pending / home based on the rider's application status. */
export default function RiderGate() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');

  const profileQuery = useQuery({
    queryKey: ['rider-profile'],
    queryFn: getMyRiderProfile,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <RiderLanding
        onBack={() => router.back()}
        onCreate={() => router.push({ pathname: '/sign-up', params: { next: 'rider' } })}
        onSignIn={() => router.push({ pathname: '/sign-in', params: { next: 'rider' } })}
      />
    );
  }

  if (profileQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={Brand.blue} />
      </View>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return <Redirect href="/rider/onboarding" />;
  }
  if (profile.status === 'APPROVED') {
    return <Redirect href="/rider/home" />;
  }
  return <Redirect href="/rider/pending" />;
}

function RiderLanding({
  onBack,
  onCreate,
  onSignIn,
}: {
  onBack: () => void;
  onCreate: () => void;
  onSignIn: () => void;
}) {
  return (
    <SafeAreaView className="flex-1 bg-brand-night" edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View className="px-6 pt-2">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
        >
          <ChevronLeftIcon size={22} color="#ffffff" />
        </Pressable>
      </View>

      <View className="flex-1 justify-center px-6">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <TruckIcon size={32} color="#ffffff" />
        </View>
        <Text className="mt-5 text-[34px] font-extrabold leading-[40px] text-white">
          Deliver with Xcelar
        </Text>
        <Text className="mt-3 text-base leading-6 text-white/70">
          Turn your bike or car into earnings, on your own schedule.
        </Text>

        <View className="mt-8 gap-4">
          <Perk icon={PinIcon} title="Deliveries near you" body="See paid jobs around your location." />
          <Perk
            icon={CrosshairIcon}
            title="One-tap navigation"
            body="Route map plus handoff to your Maps app."
          />
          <Perk
            icon={WalletIcon}
            title="Paid per drop-off"
            body="Clear earnings on every completed delivery."
          />
        </View>
      </View>

      <View className="gap-3 px-6 pb-4">
        <Button label="Create a rider account" variant="primary" onPress={onCreate} />
        <Button label="I already have an account" variant="secondary" onPress={onSignIn} />
      </View>
    </SafeAreaView>
  );
}

function Perk({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof TruckIcon;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
        <Icon size={20} color="#ffffff" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-white">{title}</Text>
        <Text className="text-sm text-white/60">{body}</Text>
      </View>
    </View>
  );
}
