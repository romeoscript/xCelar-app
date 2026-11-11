import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BikeIcon, CheckCircleIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { type JourneyStep } from '@/lib/shipment-status';

const DOT = 22;
const BOB_MS = 700;

/**
 * The delivery's stops on one line: ticked stops behind, the courier on the
 * current one (bobbing as if riding), hollow rings ahead. Dashes between
 * stops fill in once the leg is done.
 */
export function JourneyProgress({ steps }: { steps: JourneyStep[] }) {
  return (
    <View className="flex-row items-center" accessibilityRole="progressbar" accessibilityLabel={describe(steps)}>
      {steps.map((step, index) => (
        <View key={step.key} className={`flex-row items-center ${index === steps.length - 1 ? '' : 'flex-1'}`}>
          <Stop state={step.state} />
          {index < steps.length - 1 ? <Leg done={step.state === 'done'} /> : null}
        </View>
      ))}
    </View>
  );
}

function describe(steps: JourneyStep[]): string {
  const current = steps.find((step) => step.state === 'current') ?? steps[steps.length - 1];
  return `${current?.label ?? ''}, step ${steps.indexOf(current) + 1} of ${steps.length}`;
}

function Stop({ state }: { state: JourneyStep['state'] }) {
  if (state === 'done') {
    return (
      <View className="items-center justify-center rounded-full bg-white" style={{ width: DOT, height: DOT }}>
        <CheckCircleIcon size={DOT} color={Brand.navy} />
      </View>
    );
  }
  if (state === 'current') return <Courier />;
  return <View className="rounded-full border-2 border-white/50" style={{ width: DOT - 6, height: DOT - 6 }} />;
}

function Courier() {
  const reduceMotion = useReducedMotion();
  const bob = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    bob.value = withRepeat(withTiming(1, { duration: BOB_MS, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(bob);
  }, [bob, reduceMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 2 }] }));

  return (
    <Animated.View style={style} className="h-8 w-11 items-center justify-center rounded-full bg-white">
      <BikeIcon size={18} color={Brand.blue} />
    </Animated.View>
  );
}

function Leg({ done }: { done: boolean }) {
  return (
    <View className="mx-1.5 h-0.5 flex-1 flex-row justify-between overflow-hidden">
      {Array.from({ length: 7 }, (_, index) => (
        <View key={index} className={`h-0.5 w-1.5 rounded-full ${done ? 'bg-white' : 'bg-white/40'}`} />
      ))}
    </View>
  );
}
