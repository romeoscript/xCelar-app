import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow } from '@/components/account/settings-row';
import { SettingsSection } from '@/components/account/settings-section';
import { IdCardIcon, LockIcon, LogoutIcon, TrashIcon } from '@/components/icons';
import { RiderTabBar } from '@/components/rider/rider-tab-bar';
import { logout } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import { getMyRiderProfile } from '@/lib/rider-api';

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export default function RiderAccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const endSession = useAuthStore((state) => state.endSession);
  const profileQuery = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });
  const profile = profileQuery.data;

  const signOut = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await endSession();
      router.replace('/');
    },
  });

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut.mutate() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <Text className="px-6 pb-2 pt-2 text-xl font-extrabold text-brand-navy">Account</Text>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 110, gap: 24 }}>
        <View className="items-center gap-3">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-night">
            <Text className="text-2xl font-bold text-white">{initials(user?.fullName ?? '?')}</Text>
          </View>
          <View className="items-center gap-1.5">
            <Text className="text-xl font-bold text-brand-navy">{user?.fullName}</Text>
            <Text className="text-sm text-gray-500">{user?.email ?? user?.phoneNumber}</Text>
            <View className="rounded-full bg-brand-gold-tint px-3 py-1">
              <Text className="text-xs font-semibold text-brand-navy">
                {profile
                  ? `${profile.type === 'HEAD_RIDER' ? 'Head rider' : 'Rider'} · ${profile.riderCode}`
                  : 'Rider account'}
              </Text>
            </View>
          </View>
        </View>

        <SettingsSection title="Account">
          <SettingsRow icon={IdCardIcon} label="My profile" onPress={() => router.push('/profile')} />
          <SettingsRow
            icon={LockIcon}
            label="My password"
            onPress={() => router.push('/change-password')}
          />
        </SettingsSection>

        <SettingsSection title="Session">
          <SettingsRow icon={LogoutIcon} label="Sign out" onPress={confirmSignOut} />
          <SettingsRow
            icon={TrashIcon}
            label="Delete account"
            destructive
            onPress={() => router.push('/delete-account')}
          />
        </SettingsSection>
      </ScrollView>
      <RiderTabBar />
    </SafeAreaView>
  );
}
