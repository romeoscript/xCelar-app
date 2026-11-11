import { useEffect, type ReactElement } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Brand } from '@/constants/theme';

/** An icon component from `@/components/icons`. */
export type FieldIcon = (props: { size?: number; color?: string }) => ReactElement;

const ICON_SIZE = 20;
const FOCUS_MS = 180;
const ERROR_RED = '#EF4444';
const IDLE_BORDER = '#E5E7EB';
const IDLE_FILL = '#F9FAFB';

/**
 * The animated box around an input. On focus the border and fill ease to
 * Xcelar blue and white with a soft glow, and the icon lights up with a small
 * bounce; on a new error the box shakes once and turns red. Reduce Motion
 * keeps the colour change but drops the bounce and shake.
 */
export function FieldFrame({
  focused,
  error,
  icon: Icon,
  children,
  trailing,
}: {
  focused: boolean;
  error?: string;
  icon?: FieldIcon;
  children: ReactElement;
  trailing?: ReactElement | null;
}) {
  const reduceMotion = useReducedMotion();
  const focus = useSharedValue(0);
  const failed = useSharedValue(0);
  const shake = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: FOCUS_MS });
    if (focused && !reduceMotion) {
      pop.value = withSequence(withTiming(1.18, { duration: 110 }), withSpring(1, { damping: 8, stiffness: 220 }));
    }
  }, [focus, focused, pop, reduceMotion]);

  useEffect(() => {
    failed.value = withTiming(error ? 1 : 0, { duration: FOCUS_MS });
    if (error && !reduceMotion) {
      shake.value = withSequence(
        withTiming(-7, { duration: 50 }),
        withTiming(7, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [error, failed, reduceMotion, shake]);

  const frameStyle = useAnimatedStyle(() => {
    const border = interpolateColor(focus.value, [0, 1], [IDLE_BORDER, Brand.blue]);
    return {
      borderColor: interpolateColor(failed.value, [0, 1], [border, ERROR_RED]),
      backgroundColor: interpolateColor(focus.value, [0, 1], [IDLE_FILL, '#FFFFFF']),
      shadowOpacity: focus.value * 0.18,
      transform: [{ translateX: shake.value }],
    };
  });
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: focus.value, transform: [{ scale: pop.value }] }));
  const idleIconStyle = useAnimatedStyle(() => ({ opacity: 1 - focus.value, transform: [{ scale: pop.value }] }));

  return (
    <Animated.View
      style={[
        {
          height: 48,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderRadius: 14,
          paddingLeft: Icon ? 14 : 16,
          shadowColor: Brand.blue,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        },
        frameStyle,
      ]}
    >
      {Icon ? (
        <View style={{ width: ICON_SIZE, height: ICON_SIZE, marginRight: 10 }}>
          <Animated.View style={[{ position: 'absolute' }, idleIconStyle]}>
            <Icon size={ICON_SIZE} color={Brand.muted} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, activeIconStyle]}>
            <Icon size={ICON_SIZE} color={Brand.blue} />
          </Animated.View>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>{children}</View>
      {trailing}
    </Animated.View>
  );
}
