import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { HomeIcon, PackageIcon, UserIcon } from '@/components/icons';

/** The rider's three main screens, with a compact version of the customer app's floating tab bar. */
export default function RiderTabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} compact />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <HomeIcon size={22} color={color} /> }} />
      <Tabs.Screen name="deliveries" options={{ title: 'Jobs', tabBarIcon: ({ color }) => <PackageIcon size={22} color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserIcon size={22} color={color} /> }} />
    </Tabs>
  );
}
