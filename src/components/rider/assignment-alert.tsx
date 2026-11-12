import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Pressable, Text, Vibration, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BikeIcon, ChevronRightIcon } from '@/components/icons';
import { Brand } from '@/constants/theme';

const ringtone = require('@/assets/sounds/assignment.wav');

/** Ring for at most a minute, the same as the push repeats on the server. */
const RING_FOR_MS = 60_000;
/** Buzz, pause, buzz, longer pause — repeated while ringing. */
const VIBRATION_PATTERN = [0, 700, 300, 700, 1200];
const PULSE_MS = 1_100;

export type AssignmentAlertData = { shipmentId: string; title: string; body: string };

/**
 * Full-screen "new job" alert shown while the rider has the app open. It rings
 * (even with the phone on silent) and vibrates until they act, or for a minute.
 */
export function AssignmentAlert({
  alert,
  onView,
  onDismiss,
}: {
  alert: AssignmentAlertData | null;
  onView: (alert: AssignmentAlertData) => void;
  onDismiss: (alert: AssignmentAlertData) => void;
}) {
  const insets = useSafeAreaInsets();
  const player = useAudioPlayer(ringtone);
  const ringing = alert != null;

  useEffect(() => {
    if (!ringing) return;
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' });
    player.loop = true;
    void player.seekTo(0);
    player.play();
    Vibration.vibrate(VIBRATION_PATTERN, true);

    const stop = () => {
      player.pause();
      Vibration.cancel();
    };
    const timeout = setTimeout(stop, RING_FOR_MS);
    return () => {
      clearTimeout(timeout);
      stop();
    };
  }, [player, ringing]);

  return (
    <Modal visible={ringing} animationType="fade" statusBarTranslucent onRequestClose={() => alert && onDismiss(alert)}>
      {alert ? (
        <LinearGradient
          colors={[Brand.blue, Brand.blueDeep]}
          style={{ flex: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}
        >
          <View className="flex-1 items-center justify-center">
            <Pulse />
            <Text className="mt-10 text-center text-3xl font-extrabold text-white" accessibilityRole="header">
              {alert.title}
            </Text>
            <Text className="mt-3 text-center text-base leading-6 text-white/85">{alert.body}</Text>
          </View>

          <Pressable
            onPress={() => onView(alert)}
            accessibilityRole="button"
            className="h-16 flex-row items-center justify-center gap-1 rounded-full bg-brand-gold active:opacity-90"
          >
            <Text className="text-lg font-extrabold text-brand-navy">View job</Text>
            <ChevronRightIcon size={20} color={Brand.navy} />
          </Pressable>
          <Pressable onPress={() => onDismiss(alert)} accessibilityRole="button" hitSlop={8} className="mt-4 items-center py-2 active:opacity-70">
            <Text className="text-base font-semibold text-white/85">Stop ringing</Text>
          </Pressable>
        </LinearGradient>
      ) : null}
    </Modal>
  );
}

/** The courier icon with rings spreading out from it, like an incoming call. */
function Pulse() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const outer = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - progress.value), transform: [{ scale: 1 + progress.value * 0.9 }] }));
  const inner = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - progress.value), transform: [{ scale: 1 + progress.value * 0.45 }] }));

  return (
    <View className="h-36 w-36 items-center justify-center">
      <Animated.View style={outer} className="absolute h-36 w-36 rounded-full bg-white" />
      <Animated.View style={inner} className="absolute h-36 w-36 rounded-full bg-white" />
      <View className="h-28 w-28 items-center justify-center rounded-full bg-white">
        <BikeIcon size={48} color={Brand.blue} />
      </View>
    </View>
  );
}
