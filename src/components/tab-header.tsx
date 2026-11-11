import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';

/** How far a search bar or card placed right after the header overlaps it. */
export const TAB_HEADER_OVERLAP = 28;

export type TabHeaderProps = {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  /** Leave room at the bottom for the next element to overlap the header. */
  overlap?: boolean;
  children?: ReactNode;
};

/** The blue, round-bottomed header every customer tab opens with. */
export function TabHeader({ title, subtitle, action, overlap = false, children }: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[Brand.blue, Brand.blueDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: overlap ? TAB_HEADER_OVERLAP + 20 : 22,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
      }}
    >
      <View className="absolute -right-20 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-extrabold text-white">{title}</Text>
          {subtitle ? <Text className="mt-1 text-sm text-white/80">{subtitle}</Text> : null}
        </View>
        {action ? (
          <Pressable
            onPress={action.onPress}
            hitSlop={8}
            accessibilityRole="button"
            className="rounded-full bg-white/15 px-3.5 py-2 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      {children ? <View className="mt-5">{children}</View> : null}
    </LinearGradient>
  );
}
