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
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-white px-5 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View
        className="flex-row items-center justify-between rounded-full bg-white p-1.5"
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
                className={`h-12 flex-row items-center justify-center gap-2 rounded-full ${focused ? 'bg-brand-blue-tint px-4' : 'w-14'}`}
              >
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                {focused ? <Text className="text-sm font-bold text-brand-blue">{label}</Text> : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
