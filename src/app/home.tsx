import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';

const logo = require('@/assets/images/logo.png');

export default function HomeScreen() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const endSession = useAuthStore((state) => state.endSession);

  const signOut = useMutation({
    mutationFn: logout,
    // Revoke server-side if we can, but always clear the local session.
    onSettled: async () => {
      await endSession();
      router.replace('/');
    },
  });

  if (status !== 'authenticated' || !user) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-night px-6">
      <StatusBar style="light" />

      <View className="flex-1 items-center justify-center gap-4">
        <Image source={logo} style={{ width: 72, height: 72 }} contentFit="contain" />
        <Text className="text-2xl font-bold text-white">Welcome, {user.fullName}</Text>
        <Text className="text-base text-brand-muted">{user.email ?? user.phoneNumber}</Text>
      </View>

      <View className="pb-6">
        <Button
          label="Log out"
          variant="secondary"
          loading={signOut.isPending}
          onPress={() => signOut.mutate()}
        />
      </View>
    </SafeAreaView>
  );
}
