import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const endSession = useAuthStore((state) => state.endSession);

  const signOut = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await endSession();
      router.replace('/');
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-white px-6" edges={['top']}>
      <Text className="mt-2 text-2xl font-bold text-brand-navy">Account</Text>

      <View className="mt-6 rounded-2xl bg-brand-surface p-5">
        <Text className="text-lg font-semibold text-gray-900">{user?.fullName}</Text>
        <Text className="mt-1 text-base text-gray-500">{user?.email ?? user?.phoneNumber}</Text>
      </View>

      <View className="flex-1 justify-end pb-6">
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
