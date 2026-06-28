import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
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
        <Text className="text-6xl">🛵</Text>
        <Text className="mt-4 text-[34px] font-extrabold leading-[40px] text-white">
          Deliver with Xcelar
        </Text>
        <Text className="mt-3 text-base leading-6 text-white/70">
          Earn on your own schedule. Accept deliveries near you, navigate with one tap, and get paid
          per drop-off.
        </Text>
      </View>

      <View className="gap-3 px-6 pb-4">
        <Button label="Create a rider account" variant="primary" onPress={onCreate} />
        <Button label="I already have an account" variant="secondary" onPress={onSignIn} />
      </View>
    </SafeAreaView>
  );
}
