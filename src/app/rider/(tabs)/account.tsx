import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, ScrollView, Text, View } from 'react-native';

import { SettingsRow } from '@/components/account/settings-row';
import { SettingsSection } from '@/components/account/settings-section';
import { IdCardIcon, LockIcon, LogoutIcon, TrashIcon } from '@/components/icons';
import { TabHeader } from '@/components/tab-header';
import { logout } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import { initials } from '@/lib/format';
import { getMyRiderProfile, setAvailability } from '@/lib/rider-api';

export default function RiderAccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const endSession = useAuthStore((state) => state.endSession);
  const profileQuery = useQuery({ queryKey: ['rider-profile'], queryFn: getMyRiderProfile });
  const profile = profileQuery.data;

  const signOut = useMutation({
    mutationFn: async () => {
      // Signing out ends the shift, so dispatch doesn't count on this rider.
      await setAvailability(false).catch(() => undefined);
      await logout();
    },
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
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <TabHeader title="Profile">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-brand-gold">
              <Text className="text-xl font-bold text-brand-navy">{initials(user?.fullName ?? '?')}</Text>
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-lg font-bold text-white" numberOfLines={1}>
                {user?.fullName}
              </Text>
              <Text className="text-sm text-white/80">{user?.email ?? user?.phoneNumber}</Text>
              <View className="self-start rounded-full bg-white/15 px-2.5 py-1">
                <Text className="text-xs font-semibold text-white">
                  {profile ? `${profile.type === 'HEAD_RIDER' ? 'Head rider' : 'Rider'} · ${profile.riderCode}` : 'Rider account'}
                </Text>
              </View>
            </View>
          </View>
        </TabHeader>

        <View className="gap-6 px-5 pt-6">
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
        </View>
      </ScrollView>
    </View>
  );
}
