import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';

/**
 * The customer tabs as a floating pill. The active tab grows a tinted capsule
 * with its name beside the icon; the others show the icon alone.
 */
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
  compact = false,
}: BottomTabBarProps & {
  /** A smaller, centred pill that hugs its tabs instead of spanning the screen. */
  compact?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const itemHeight = compact ? 'h-10' : 'h-12';
  const iconOnlyWidth = compact ? 'w-12' : 'w-14';

  return (
    <View className={`bg-white px-5 pt-2 ${compact ? 'items-center' : ''}`} style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View
        className={`flex-row items-center rounded-full bg-white ${compact ? 'gap-1 p-1' : 'justify-between p-1.5'}`}
        style={{
          shadowColor: Brand.navy,
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
          borderWidth: 1,
          borderColor: '#EEF0F5',
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const color = focused ? Brand.blue : Brand.muted;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              tapFeedback();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Animated.View key={route.key} layout={LinearTransition.springify().damping(18)}>
              <Pressable
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                className={`${itemHeight} flex-row items-center justify-center gap-2 rounded-full ${focused ? 'bg-brand-blue-tint px-4' : iconOnlyWidth}`}
              >
                {options.tabBarIcon?.({ focused, color, size: compact ? 20 : 22 })}
                {focused ? <Text className="text-sm font-bold text-brand-blue">{label}</Text> : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
