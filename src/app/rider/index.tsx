import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon, CrosshairIcon, PinIcon, TruckIcon, WalletIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { getMyRiderProfile } from '@/lib/rider-api';

/** Routes into the rider experience. Xcelar staff add riders, so a signed-out
 *  visitor is offered activation or sign-in, and a signed-in account without a
 *  rider record is told how to join rather than shown an application. */
export default function RiderGate() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const isCourier = useAuthStore((state) => state.user?.role === 'COURIER');
  const updateUser = useAuthStore((state) => state.updateUser);

  const profileQuery = useQuery({
    queryKey: ['rider-profile'],
    queryFn: getMyRiderProfile,
    enabled: isAuthenticated,
  });

  // Staff can turn an existing customer into a rider while they're signed in,
  // leaving a stale USER role in the session. The server's rider record is the
  // truth; without this the courier-only screens would bounce them back here.
  const hasProfile = Boolean(profileQuery.data);
  useEffect(() => {
    if (hasProfile && !isCourier) {
      updateUser({ role: 'COURIER' });
    }
  }, [hasProfile, isCourier, updateUser]);

  if (!isAuthenticated) {
    return (
      <RiderLanding
        onBack={() => router.back()}
        onActivate={() => router.push('/rider/activate')}
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

  if (profileQuery.data) {
    return isCourier ? <Redirect href="/rider/home" /> : null;
  }
  return <NotARider onBack={() => router.replace('/home')} />;
}

function NotARider({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-8" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-surface">
        <TruckIcon size={30} color={Brand.navy} />
      </View>
      <Text className="mt-5 text-center text-xl font-bold text-brand-navy">This isn’t a rider account</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
        Xcelar adds riders directly. To ride with us, contact Xcelar. Once you’re added you’ll get an
        activation code to set up your rider account.
      </Text>
      <View className="mt-6 w-56">
        <Button label="Back to home" variant="secondary" onPress={onBack} />
      </View>
    </SafeAreaView>
  );
}

function RiderLanding({
  onBack,
  onActivate,
  onSignIn,
}: {
  onBack: () => void;
  onActivate: () => void;
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
          Ride with Xcelar
        </Text>
        <Text className="mt-3 text-base leading-6 text-white/70">
          Been added as a rider? Activate your account with the code Xcelar gave you.
        </Text>

        <View className="mt-8 gap-4">
          <Perk icon={PinIcon} title="Jobs assigned to you" body="Dispatch sends each pickup and delivery to you." />
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
        <Button label="Activate my rider account" variant="primary" onPress={onActivate} />
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
