import { Redirect, Tabs } from 'expo-router';

import { BiometricGate } from '@/components/biometric-gate';
import { HomeIcon, PackageIcon, StorefrontIcon, UserIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';

export default function AppTabsLayout() {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);

  if (status !== 'authenticated') {
    return <Redirect href="/" />;
  }

  // Couriers live in the rider experience, not the customer app.
  if (role === 'COURIER') {
    return <Redirect href="/rider" />;
  }

  return (
    <BiometricGate>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Brand.blue,
          tabBarInactiveTintColor: Brand.muted,
          tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#EFEFF2' },
          tabBarLabelStyle: { fontSize: 12 },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{ title: 'Home', tabBarIcon: ({ color }) => <HomeIcon size={24} color={color} /> }}
        />
        <Tabs.Screen
          name="shipments"
          options={{
            title: 'Shipments',
            tabBarIcon: ({ color }) => <PackageIcon size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="marketplace"
          options={{
            title: 'Market',
            tabBarIcon: ({ color }) => <StorefrontIcon size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color }) => <UserIcon size={24} color={color} />,
          }}
        />
      </Tabs>
    </BiometricGate>
  );
}
