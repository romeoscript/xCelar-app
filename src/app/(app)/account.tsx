import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { SettingsRow } from '@/components/account/settings-row';
import { SettingsSection } from '@/components/account/settings-section';
import { TabHeader } from '@/components/tab-header';
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
  ShieldIcon,
  StorefrontIcon,
  TrashIcon,
  WalletIcon,
  PlusIcon,
} from '@/components/icons';
import { Brand } from '@/constants/theme';
import { logout } from '@/lib/auth-api';
import { BusinessQueryKeys, getMyBusiness, type BusinessStatus } from '@/lib/business-api';
import { useAuthStore } from '@/lib/auth-store';
import { formatNaira, initials } from '@/lib/format';
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

function accountLabel(role: string | undefined, businessStatus: BusinessStatus | undefined): string {
  if (role === 'COURIER') return 'Courier account';
  if (businessStatus === 'APPROVED' || businessStatus === 'SUSPENDED') return 'Business account';
  return 'Individual account';
}

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const endSession = useAuthStore((state) => state.endSession);

  const biometricEnabled = usePreferencesStore((state) => state.biometricEnabled);
  const pushEnabled = usePreferencesStore((state) => state.pushEnabled);
  const setBiometricEnabled = usePreferencesStore((state) => state.setBiometricEnabled);
  const setPushEnabled = usePreferencesStore((state) => state.setPushEnabled);

  const isCustomer = user?.role === 'USER';
  const businessQuery = useQuery({ queryKey: BusinessQueryKeys.mine, queryFn: getMyBusiness, enabled: isCustomer });
  const businessStatus = businessQuery.data?.business?.status;
  const hasInvoices = businessStatus === 'APPROVED' || businessStatus === 'SUSPENDED';

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
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <TabHeader title="Account">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-brand-gold">
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} className="h-16 w-16" resizeMode="cover" />
              ) : (
                <Text className="text-xl font-bold text-brand-navy">{initials(user?.fullName ?? '?')}</Text>
              )}
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-lg font-bold text-white" numberOfLines={1}>
                {user?.fullName}
              </Text>
              <View className="self-start rounded-full bg-white/15 px-2.5 py-1">
                <Text className="text-xs font-semibold text-white">{accountLabel(user?.role, businessStatus)}</Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/wallet')}
            accessibilityRole="button"
            accessibilityLabel="Wallet. Top up"
            className="mt-5 flex-row items-center justify-between rounded-2xl bg-white/15 py-3 pl-4 pr-3 active:opacity-80"
          >
            <View>
              <Text className="text-xs text-white/75">Wallet balance</Text>
              <Text className="text-xl font-extrabold text-white">{formatNaira((user?.balanceKobo ?? 0) / 100)}</Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-full bg-brand-gold px-3.5 py-2">
              <PlusIcon size={14} color={Brand.navy} />
              <Text className="text-sm font-bold text-brand-navy">Top up</Text>
            </View>
          </Pressable>
        </TabHeader>

        <View className="gap-6 px-5 pt-6">
          <SettingsSection title="Account">
            <SettingsRow icon={IdCardIcon} label="My profile" onPress={() => router.push('/profile')} />
            <SettingsRow icon={WalletIcon} label="My wallet" onPress={() => router.push('/wallet')} />
            <SettingsRow
              icon={LockIcon}
              label="My password"
              onPress={() => router.push('/change-password')}
            />
          </SettingsSection>

          {isCustomer ? (
            <SettingsSection title="Business">
              <SettingsRow
                icon={StorefrontIcon}
                label={businessStatus ? 'Business account' : 'Ship on account as a business'}
                onPress={() => router.push('/business')}
              />
              {hasInvoices ? (
                <SettingsRow icon={DocumentIcon} label="Invoices" onPress={() => router.push('/invoices')} />
              ) : null}
            </SettingsSection>
          ) : null}

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
        </View>
      </ScrollView>
    </View>
  );
}
