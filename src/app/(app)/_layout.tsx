import { Redirect, Tabs } from 'expo-router';

import { HomeIcon, LockerIcon, PackageIcon, UserIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';

export default function AppTabsLayout() {
  const status = useAuthStore((state) => state.status);

  if (status !== 'authenticated') {
    return <Redirect href="/" />;
  }

  return (
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
        name="lockers"
        options={{
          title: 'Lockers',
          tabBarIcon: ({ color }) => <LockerIcon size={24} color={color} />,
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
  );
}
