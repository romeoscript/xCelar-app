import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInRight,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';

const logo = require('@/assets/images/logo.png');
const character = require('@/assets/images/courier-character.webp');

/** Shown at the image's own proportions (540×675). */
const CHARACTER = { width: 196, height: 245 } as const;
const FLOAT_MS = 2_800;
/** How far the form card overlaps the bottom of the header. */
export const HEADER_OVERLAP = 28;

/**
 * The top of the sign-in and sign-up screens: a soft blue header with the
 * Xcelar mark and our courier, who rises in when the screen opens and then
 * floats gently. Back appears only when there's a screen to go back to.
 */
export function CourierHeader({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const float = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    float.value = withRepeat(withTiming(1, { duration: FLOAT_MS, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(float);
  }, [float, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -float.value * 6 }] }));

  return (
    <LinearGradient
      colors={['#D6E8FF', Brand.blueTint]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top + 8, paddingBottom: HEADER_OVERLAP, overflow: 'hidden' }}
    >
      <View className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-white/50" />
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="absolute left-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"
          style={{ top: insets.top + 6, shadowColor: Brand.navy, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <ChevronLeftIcon size={22} color={Brand.navy} />
        </Pressable>
      ) : null}
      <View className="flex-row items-end justify-between px-6">
        <View className="flex-1 pb-10">
          <View className="flex-row items-center gap-2">
            <Image source={logo} style={{ width: 30, height: 30 }} contentFit="contain" />
            <Text className="text-xl font-extrabold text-brand-navy">Xcelar</Text>
          </View>
          <Text className="mt-2 text-sm leading-5 text-brand-navy/70">Send it today,{'\n'}track it all the way.</Text>
        </View>

        <Animated.View entering={reduceMotion ? undefined : FadeInRight.duration(600).springify().damping(16)}>
          <Animated.View style={floatStyle}>
            <Image
              source={character}
              style={{ width: CHARACTER.width, height: CHARACTER.height }}
              contentFit="contain"
              accessibilityIgnoresInvertColors
              accessible={false}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
