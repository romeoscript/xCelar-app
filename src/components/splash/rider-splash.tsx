import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { Brand } from '@/constants/theme';

const courier = require('@/assets/images/courier-top.webp');

/**
 * The launch animation: an Xcelar courier, seen from above, rides through the
 * streets at night. The camera follows the rider, so the courier always faces
 * up the screen while the map moves and swings round underneath: up the road,
 * a smooth right turn, along the next street, a left turn back to heading
 * forward, then on. The wordmark fades in and the courier pulls away into the
 * app. With Reduce Motion on it's a still frame that fades.
 */

type Point = { x: number; y: number };

/** The route, in map units. Headings are degrees clockwise from north (up). */
const TURN_RADIUS = 150;
const START: Point = { x: 520, y: 2050 };
const FIRST_STRAIGHT = 380;
const SECOND_STRAIGHT = 340;
const LAST_STRAIGHT = 700;
const QUARTER_TURN = (Math.PI / 2) * TURN_RADIUS;

/** Corners of the route, worked out once from the lengths above. */
const BEFORE_RIGHT: Point = { x: START.x, y: START.y - FIRST_STRAIGHT };
const AFTER_RIGHT: Point = { x: BEFORE_RIGHT.x + TURN_RADIUS, y: BEFORE_RIGHT.y - TURN_RADIUS };
const BEFORE_LEFT: Point = { x: AFTER_RIGHT.x + SECOND_STRAIGHT, y: AFTER_RIGHT.y };
const AFTER_LEFT: Point = { x: BEFORE_LEFT.x + TURN_RADIUS, y: BEFORE_LEFT.y - TURN_RADIUS };
const END: Point = { x: AFTER_LEFT.x, y: AFTER_LEFT.y - LAST_STRAIGHT };

/** Distance along the route at the end of each piece. */
const LEGS = {
  first: FIRST_STRAIGHT,
  right: FIRST_STRAIGHT + QUARTER_TURN,
  second: FIRST_STRAIGHT + QUARTER_TURN + SECOND_STRAIGHT,
  left: FIRST_STRAIGHT + QUARTER_TURN * 2 + SECOND_STRAIGHT,
} as const;
/** How far the camera travels: past both turns, stopping well before the end of the map. */
const RIDE_DISTANCE = LEGS.left + 260;

const ROUTE =
  `M${START.x} ${START.y + 900} L${BEFORE_RIGHT.x} ${BEFORE_RIGHT.y} ` +
  `A${TURN_RADIUS} ${TURN_RADIUS} 0 0 1 ${AFTER_RIGHT.x} ${AFTER_RIGHT.y} L${BEFORE_LEFT.x} ${BEFORE_LEFT.y} ` +
  `A${TURN_RADIUS} ${TURN_RADIUS} 0 0 0 ${AFTER_LEFT.x} ${AFTER_LEFT.y} L${END.x} ${END.y}`;

const WORLD = { width: 1700, height: 3000 } as const;

/** Where the rider is and which way they face, a given distance along the route. */
function riderAt(distance: number): { x: number; y: number; heading: number } {
  'worklet';
  if (distance <= LEGS.first) {
    return { x: START.x, y: START.y - distance, heading: 0 };
  }
  if (distance <= LEGS.right) {
    // Clockwise quarter circle round a centre to the right of the road.
    const turned = (distance - LEGS.first) / TURN_RADIUS;
    const centre = { x: BEFORE_RIGHT.x + TURN_RADIUS, y: BEFORE_RIGHT.y };
    return { x: centre.x - TURN_RADIUS * Math.cos(turned), y: centre.y - TURN_RADIUS * Math.sin(turned), heading: (turned * 180) / Math.PI };
  }
  if (distance <= LEGS.second) {
    return { x: AFTER_RIGHT.x + (distance - LEGS.right), y: AFTER_RIGHT.y, heading: 90 };
  }
  if (distance <= LEGS.left) {
    // Anticlockwise quarter circle back to heading north.
    const turned = (distance - LEGS.second) / TURN_RADIUS;
    const centre = { x: BEFORE_LEFT.x, y: BEFORE_LEFT.y - TURN_RADIUS };
    return { x: centre.x + TURN_RADIUS * Math.sin(turned), y: centre.y + TURN_RADIUS * Math.cos(turned), heading: 90 - (turned * 180) / Math.PI };
  }
  return { x: AFTER_LEFT.x, y: AFTER_LEFT.y - (distance - LEGS.left), heading: 0 };
}

/** Lean into a turn: right turns lean right, left turns lean left. */
function leanAt(distance: number): number {
  'worklet';
  const MAX_LEAN = 7;
  const curve = (start: number) => Math.sin(Math.min(1, Math.max(0, (distance - start) / QUARTER_TURN)) * Math.PI);
  return MAX_LEAN * curve(LEGS.first) - MAX_LEAN * curve(LEGS.second);
}

const COURIER = { width: 140, height: 209 } as const;
const BEAM = { width: 150, height: 170 } as const;

const ARRIVE_MS = 900;
const RIDE_MS = 4_200;
const WORDMARK_AT_MS = 3_100;
const LEAVE_AT_MS = 4_500;
const LEAVE_MS = 700;
const REDUCED_EXIT_MS = 300;

export function RiderSplash({ start, onDone }: { start: boolean; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const arrive = useSharedValue(reduceMotion ? 1 : 0);
  const ride = useSharedValue(reduceMotion ? LEGS.second : 0);
  const wordmark = useSharedValue(reduceMotion ? 1 : 0);
  const leave = useSharedValue(0);
  const anchor = { x: width / 2, y: height * 0.42 };

  useEffect(() => {
    if (!start) return;
    const finish = (finished?: boolean) => {
      'worklet';
      if (finished) scheduleOnRN(onDone);
    };
    if (reduceMotion) {
      leave.value = withDelay(600, withTiming(1, { duration: REDUCED_EXIT_MS }, finish));
      return;
    }
    arrive.value = withTiming(1, { duration: ARRIVE_MS, easing: Easing.out(Easing.cubic) });
    ride.value = withTiming(RIDE_DISTANCE, { duration: RIDE_MS, easing: Easing.inOut(Easing.sin) });
    wordmark.value = withDelay(WORDMARK_AT_MS, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    leave.value = withDelay(LEAVE_AT_MS, withTiming(1, { duration: LEAVE_MS, easing: Easing.in(Easing.cubic) }, finish));
  }, [arrive, leave, onDone, reduceMotion, ride, start, wordmark]);

  const camera = useDerivedValue(() => riderAt(ride.value));

  // The map moves under a fixed rider: put the rider's point at the anchor, facing up.
  const worldStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: anchor.x },
      { translateY: anchor.y },
      { rotate: `${-camera.value.heading}deg` },
      { translateX: -camera.value.x },
      { translateY: -camera.value.y },
    ],
  }));

  const courierStyle = useAnimatedStyle(() => ({
    transform: [
      // Rides up from below the screen, then pulls away off the top.
      { translateY: (1 - arrive.value) * (height - anchor.y) - leave.value * (anchor.y + COURIER.height + 60) },
      { rotate: `${leanAt(ride.value)}deg` },
    ],
  }));

  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordmark.value * (1 - leave.value),
    transform: [{ translateY: (1 - wordmark.value) * 14 }],
  }));

  // The scene fades only in the last part of the courier's exit.
  const screenStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.max(0, leave.value - 0.5) / 0.5 }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.screen, screenStyle]}>
      <Animated.View style={[styles.world, worldStyle]}>
        <StreetMap />
      </Animated.View>

      <Vignette width={width} height={height} anchorY={anchor.y} />

      <Animated.View
        style={[styles.courier, { left: anchor.x - COURIER.width / 2, top: anchor.y - COURIER.height * 0.3 }, courierStyle]}
      >
        <Headlight />
        <Image source={courier} style={{ width: COURIER.width, height: COURIER.height }} contentFit="contain" />
      </Animated.View>

      <Animated.View style={[styles.wordmark, { top: anchor.y + COURIER.height * 0.7 + 34 }, wordStyle]}>
        <Text style={styles.word}>Xcelar</Text>
        <Text style={styles.tagline}>Pickups and deliveries, tracked every step.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const ROAD_WIDTH = 130;
const ROAD_EDGE = 'rgba(255,255,255,0.12)';
/** Opaque so side streets don't show through where they cross the route. */
const ROAD_SURFACE = '#17162C';
const SIDE_STREET = 'rgba(255,255,255,0.05)';
const BLOCK = 'rgba(255,255,255,0.07)';
const LANE = 'rgba(255,255,255,0.3)';

/** City blocks either side of the route, as [x, y, width, height]. */
const BLOCKS = [
  [220, 1800, 210, 300],
  [620, 1820, 230, 260],
  [220, 1380, 230, 230],
  [560, 1050, 280, 270],
  [980, 1500, 260, 280],
  [1260, 1080, 240, 280],
  [880, 820, 230, 220],
  [1260, 700, 240, 260],
];

/** A minimal night street map: the route, side streets and city blocks. */
function StreetMap() {
  return (
    <Svg width={WORLD.width} height={WORLD.height}>
      {BLOCKS.map(([x, y, blockWidth, blockHeight]) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width={blockWidth} height={blockHeight} rx={14} fill="none" stroke={BLOCK} strokeWidth={2} />
      ))}
      {/* Side streets */}
      <Rect x={0} y={1720} width={WORLD.width} height={44} fill={SIDE_STREET} />
      <Rect x={0} y={1180} width={WORLD.width} height={44} fill={SIDE_STREET} />
      <Rect x={1140} y={1200} width={44} height={900} fill={SIDE_STREET} />
      <Rect x={460} y={600} width={44} height={760} fill={SIDE_STREET} />

      {/* The route: one stroked line with rounded corners, then lane markings along its middle. */}
      <Path d={ROUTE} stroke={ROAD_EDGE} strokeWidth={ROAD_WIDTH + 4} strokeLinejoin="round" fill="none" />
      <Path d={ROUTE} stroke={ROAD_SURFACE} strokeWidth={ROAD_WIDTH} strokeLinejoin="round" fill="none" />
      <Path d={ROUTE} stroke={LANE} strokeWidth={3} strokeDasharray="30 30" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/** Fades the map into the night at the edges, keeping the eye on the rider. */
function Vignette({ width, height, anchorY }: { width: number; height: number; anchorY: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="vignette" cx={width / 2} cy={anchorY} r={Math.max(width, height) * 0.6} gradientUnits="userSpaceOnUse">
          <Stop offset="0.4" stopColor={Brand.night} stopOpacity={0} />
          <Stop offset="1" stopColor={Brand.night} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#vignette)" />
    </Svg>
  );
}

/** A soft cone of light spreading forward from the scooter's headlight. */
function Headlight() {
  const tipX = BEAM.width / 2;
  return (
    <Svg width={BEAM.width} height={BEAM.height} style={styles.beam}>
      <Defs>
        <LinearGradient id="beam-fade" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={Brand.blueLight} stopOpacity={0.4} />
          <Stop offset="1" stopColor={Brand.blueLight} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={`M${tipX - 8} ${BEAM.height} L0 0 H${BEAM.width} L${tipX + 8} ${BEAM.height} Z`} fill="url(#beam-fade)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: Brand.night, zIndex: 100, overflow: 'hidden' },
  world: { position: 'absolute', left: 0, top: 0, width: WORLD.width, height: WORLD.height, transformOrigin: '0 0' },
  courier: { position: 'absolute', width: COURIER.width, alignItems: 'center' },
  // The beam's narrow end sits on the headlight, about 30 px into the image.
  beam: { position: 'absolute', top: -BEAM.height + 30 },
  wordmark: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  word: { color: '#ffffff', fontSize: 34, fontWeight: '800', letterSpacing: 0.3 },
  tagline: { marginTop: 8, color: 'rgba(255,255,255,0.62)', fontSize: 15 },
});
