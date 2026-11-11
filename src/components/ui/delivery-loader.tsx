import { useEffect } from 'react';
import { Modal, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { Brand } from '@/constants/theme';

/**
 * A full-screen "working on it" moment for waits the user started, such as
 * signing in: an Xcelar truck driving on the spot, wheels turning and road
 * streaming past, with a clock whose hands sweep round. Holds still with
 * Reduce Motion on. Shown over the current screen while `visible`.
 */

const WHEEL_TURN_MS = 520;
const ROAD_LOOP_MS = 420;
const CLOCK_TURN_MS = 1_600;
const BOUNCE_MS = 180;

export function DeliveryLoader({ visible, label }: { visible: boolean; label: string }) {
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)} className="flex-1 items-center justify-center bg-brand-night/55">
        <Animated.View entering={ZoomIn.springify().damping(14)} className="items-center rounded-[28px] bg-white px-8 pb-6 pt-7">
          <Scene />
          <Text className="mt-3 text-base font-semibold text-brand-navy" accessibilityLiveRegion="polite">
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function useLoop(duration: number, still: boolean, easing = Easing.linear): SharedValue<number> {
  const value = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    value.value = withRepeat(withTiming(1, { duration, easing }), -1, false);
    return () => cancelAnimation(value);
  }, [duration, easing, still, value]);
  return value;
}

function Scene() {
  const reduceMotion = useReducedMotion();
  const wheel = useLoop(WHEEL_TURN_MS, reduceMotion);
  const road = useLoop(ROAD_LOOP_MS, reduceMotion);
  const clock = useLoop(CLOCK_TURN_MS, reduceMotion, Easing.inOut(Easing.cubic));
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    bounce.value = withRepeat(withSequence(withTiming(-2.5, { duration: BOUNCE_MS }), withTiming(0, { duration: BOUNCE_MS })), -1, false);
    return () => cancelAnimation(bounce);
  }, [bounce, reduceMotion]);

  const truckStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));
  const roadStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -road.value * 36 }] }));
  const streakStyle = useAnimatedStyle(() => ({ opacity: 0.35 + Math.sin(road.value * Math.PI * 2) * 0.25 }));
  const minuteStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${clock.value * 360}deg` }] }));
  const hourStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${45 + clock.value * 30}deg` }] }));

  return (
    <View style={{ width: 200, height: 128 }}>
      {/* Road streaming past under the truck */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 6, height: 4, overflow: 'hidden' }}>
        <Animated.View style={[{ flexDirection: 'row', width: 260 }, roadStyle]}>
          {Array.from({ length: 8 }, (_, index) => (
            <View key={index} style={{ width: 20, height: 3, marginRight: 16, borderRadius: 2, backgroundColor: Brand.mist }} />
          ))}
        </Animated.View>
      </View>

      {/* Speed lines behind the truck */}
      <Animated.View style={[{ position: 'absolute', left: 4, top: 62 }, streakStyle]}>
        <Svg width={34} height={30}>
          <Line x1={8} y1={4} x2={30} y2={4} stroke={Brand.gold} strokeWidth={3} strokeLinecap="round" />
          <Line x1={0} y1={14} x2={26} y2={14} stroke={Brand.gold} strokeWidth={3} strokeLinecap="round" />
          <Line x1={12} y1={24} x2={30} y2={24} stroke={Brand.gold} strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <Animated.View style={[{ position: 'absolute', left: 36, top: 30 }, truckStyle]}>
        <Truck wheel={wheel} />
      </Animated.View>

      {/* Clock badge, top left of the cargo box */}
      <Animated.View entering={ZoomIn.delay(120).springify()} style={{ position: 'absolute', left: 22, top: 0, width: 58, height: 58 }}>
        <View className="h-full w-full items-center justify-center rounded-full border-4 border-brand-mist bg-white" style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
          {[0, 90, 180, 270].map((angle) => (
            <View key={angle} style={{ position: 'absolute', width: 3, height: 6, borderRadius: 2, backgroundColor: Brand.muted, transform: [{ rotate: `${angle}deg` }, { translateY: -19 }] }} />
          ))}
          <Animated.View style={[{ position: 'absolute', width: 4, height: 34, alignItems: 'center' }, hourStyle]}>
            <View style={{ width: 4, height: 13, marginTop: 4, borderRadius: 2, backgroundColor: Brand.navy }} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute', width: 3, height: 40, alignItems: 'center' }, minuteStyle]}>
            <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: Brand.blue }} />
          </Animated.View>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.navy }} />
        </View>
      </Animated.View>
    </View>
  );
}

/** A flat side-on Xcelar truck: blue cargo box with the gold mark, white cab. */
function Truck({ wheel }: { wheel: SharedValue<number> }) {
  return (
    <View style={{ width: 150, height: 92 }}>
      <Svg width={150} height={92} viewBox="0 0 150 92">
        {/* Cargo box */}
        <Rect x={0} y={6} width={96} height={62} rx={6} fill={Brand.blue} />
        <Rect x={0} y={6} width={96} height={10} rx={5} fill={Brand.blueLight} opacity={0.55} />
        <Path d="M36 26 L60 50 M60 26 L36 50" stroke={Brand.gold} strokeWidth={7} strokeLinecap="round" />
        {/* Cab */}
        <Path d="M96 24 H122 Q130 24 134 32 L146 50 Q148 53 148 57 V68 H96 Z" fill={Brand.mist} />
        <Path d="M104 30 H121 Q126 30 129 35 L137 48 H104 Z" fill={Brand.blueLight} opacity={0.9} />
        <Rect x={142} y={58} width={6} height={6} rx={2} fill={Brand.gold} />
        {/* Chassis */}
        <Rect x={0} y={66} width={148} height={6} rx={3} fill={Brand.navy} />
      </Svg>
      <Wheel left={18} turn={wheel} />
      <Wheel left={110} turn={wheel} />
    </View>
  );
}

function Wheel({ left, turn }: { left: number; turn: SharedValue<number> }) {
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left, top: 60, width: 28, height: 28 }, spin]}>
      <Svg width={28} height={28}>
        <Circle cx={14} cy={14} r={13} fill="#1B1A33" />
        <Circle cx={14} cy={14} r={6} fill={Brand.mist} />
        <Line x1={14} y1={3} x2={14} y2={9} stroke={Brand.mist} strokeWidth={2} />
        <Line x1={14} y1={19} x2={14} y2={25} stroke={Brand.mist} strokeWidth={2} />
      </Svg>
    </Animated.View>
  );
}
