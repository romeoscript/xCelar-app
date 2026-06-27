import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

const DURATION_MS = 500;

/**
 * Animates a number from its previous value to the next one, returning the
 * current in-between value to render. Honours the OS "reduce motion" setting by
 * snapping straight to the target.
 */
export function useCountUp(value: number): number {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const progress = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotion.current = enabled;
    });
  }, []);

  useEffect(() => {
    const from = previous.current;
    const to = value;
    previous.current = to;

    if (from === to || reduceMotion.current) {
      setDisplay(to);
      return;
    }

    progress.setValue(0);
    const id = progress.addListener(({ value: t }) => {
      setDisplay(Math.round(from + (to - from) * t));
    });
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      useNativeDriver: false,
    }).start();

    return () => progress.removeListener(id);
  }, [value, progress]);

  return display;
}
