import { usePathname, useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeIcon, PackageIcon, UserIcon, type IconProps } from '@/components/icons';
import { Brand } from '@/constants/theme';

type Tab = { label: string; route: Href; icon: (props: IconProps) => React.JSX.Element };

const TABS: Tab[] = [
  { label: 'Home', route: '/rider/home', icon: HomeIcon },
  { label: 'Bookings', route: '/rider/deliveries', icon: PackageIcon },
  { label: 'Profile', route: '/rider/account', icon: UserIcon },
];

/** Bottom navigation for the rider area's main screens. */
export function RiderTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingBottom: insets.bottom || 12 }}
      className="absolute inset-x-0 bottom-0 flex-row border-t border-gray-100 bg-white pt-2"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.route;
        const color = active ? Brand.blue : Brand.muted;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.label}
            onPress={() => router.replace(tab.route)}
            className="flex-1 items-center gap-1 py-1 active:opacity-70"
          >
            <Icon size={24} color={color} />
            <Text className={`text-xs ${active ? 'font-semibold text-brand-blue' : 'text-gray-400'}`}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
