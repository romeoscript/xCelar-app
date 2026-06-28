import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow } from '@/components/account/settings-row';
import { SettingsSection } from '@/components/account/settings-section';
import {
  BellIcon,
  DocumentIcon,
  FingerprintIcon,
  HelpCircleIcon,
  IdCardIcon,
  InfoIcon,
  LockIcon,
  LogoutIcon,
  MessageIcon,
  PinIcon,
  RouteSwapIcon,
  ShieldIcon,
  TrashIcon,
  WalletIcon,
} from '@/components/icons';
import { logout } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import {
  authenticate,
  getBiometricLabel,
  isBiometricAvailable,
} from '@/lib/biometrics';
import {
  getPushToken,
  removePushToken,
  requestNotificationPermission,
  syncPushToken,
} from '@/lib/notifications';
import { usePreferencesStore } from '@/lib/preferences-store';
import { toast } from '@/lib/toast-store';

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const endSession = useAuthStore((state) => state.endSession);

  const biometricEnabled = usePreferencesStore((state) => state.biometricEnabled);
  const pushEnabled = usePreferencesStore((state) => state.pushEnabled);
  const setBiometricEnabled = usePreferencesStore((state) => state.setBiometricEnabled);
  const setPushEnabled = usePreferencesStore((state) => state.setPushEnabled);

  const [biometricLabel, setBiometricLabel] = useState('biometric unlock');
  const [busyToggle, setBusyToggle] = useState(false);

  useEffect(() => {
    void getBiometricLabel().then(setBiometricLabel);
  }, []);

  const signOut = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await endSession();
      router.replace('/');
    },
  });

  const handleBiometricToggle = async (next: boolean) => {
    if (busyToggle) {
      return;
    }
    if (!next) {
      await setBiometricEnabled(false);
      toast(`${biometricLabel} disabled`);
      return;
    }

    setBusyToggle(true);
    try {
      if (!(await isBiometricAvailable())) {
        Alert.alert(
          'Not available',
          'Set up Face ID, Touch ID, or a fingerprint in your device settings first.',
        );
        return;
      }
      const ok = await authenticate(`Confirm it's you to enable ${biometricLabel}`);
      if (ok) {
        await setBiometricEnabled(true);
        toast(`${biometricLabel} enabled`);
      }
    } finally {
      setBusyToggle(false);
    }
  };

  const handlePushToggle = async (next: boolean) => {
    if (busyToggle) {
      return;
    }
    if (!next) {
      await setPushEnabled(false);
      toast('Push notifications off');
      // Best-effort: unregister this device's token on the server.
      void getPushToken().then((token) => {
        if (token) {
          void removePushToken(token);
        }
      });
      return;
    }

    setBusyToggle(true);
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for Xcelar in your device settings to turn this on.',
        );
        return;
      }
      await setPushEnabled(true);
      toast('Push notifications on');
      // Best-effort: register this device's push token with the server.
      void syncPushToken();
    } finally {
      setBusyToggle(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut.mutate() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, gap: 24 }}>
        <View className="items-center gap-3">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-navy">
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} className="h-20 w-20" resizeMode="cover" />
            ) : (
              <Text className="text-2xl font-bold text-white">{initials(user?.fullName ?? '?')}</Text>
            )}
          </View>
          <View className="items-center gap-1.5">
            <Text className="text-xl font-bold text-brand-navy">{user?.fullName}</Text>
            <View className="rounded-full bg-brand-blue-tint px-3 py-1">
              <Text className="text-xs font-semibold text-brand-blue">Individual account</Text>
            </View>
          </View>
        </View>

        <SettingsSection title="Account">
          <SettingsRow icon={IdCardIcon} label="My profile" onPress={() => router.push('/profile')} />
          <SettingsRow icon={WalletIcon} label="My wallet" onPress={() => router.push('/wallet')} />
          <SettingsRow
            icon={LockIcon}
            label="My password"
            onPress={() => router.push('/change-password')}
          />
        </SettingsSection>

        <SettingsSection title="Security & Preferences">
          <SettingsRow
            icon={FingerprintIcon}
            label={`Enable ${biometricLabel}`}
            trailing="toggle"
            toggleValue={biometricEnabled}
            onToggle={handleBiometricToggle}
            toggleDisabled={busyToggle}
          />
          <SettingsRow
            icon={BellIcon}
            label="Enable push notifications"
            trailing="toggle"
            toggleValue={pushEnabled}
            onToggle={handlePushToggle}
            toggleDisabled={busyToggle}
          />
        </SettingsSection>

        <SettingsSection title="Saved items">
          <SettingsRow
            icon={PinIcon}
            label="Saved addresses"
            onPress={() => router.push('/saved-addresses')}
          />
        </SettingsSection>

        <SettingsSection title="Earn with Xcelar">
          <SettingsRow
            icon={RouteSwapIcon}
            label="Become a rider"
            onPress={() => router.push('/rider')}
          />
        </SettingsSection>

        <SettingsSection title="Support & Legal">
          <SettingsRow icon={InfoIcon} label="About us" onPress={() => router.push('/about')} />
          <SettingsRow icon={MessageIcon} label="Contact us" onPress={() => router.push('/contact')} />
          <SettingsRow icon={HelpCircleIcon} label="FAQ" onPress={() => router.push('/faq')} />
          <SettingsRow
            icon={DocumentIcon}
            label="Terms of service"
            onPress={() => router.push('/terms')}
          />
          <SettingsRow
            icon={ShieldIcon}
            label="Privacy policy"
            onPress={() => router.push('/privacy')}
          />
        </SettingsSection>

        <SettingsSection title="Session">
          <SettingsRow
            icon={LogoutIcon}
            label="Sign out"
            trailing="none"
            destructive
            onPress={confirmSignOut}
          />
        </SettingsSection>

        <SettingsSection title="Account deletion">
          <SettingsRow
            icon={TrashIcon}
            label="Delete account"
            trailing="none"
            destructive
            onPress={() => router.push('/delete-account')}
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
