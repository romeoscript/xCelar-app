import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckCircleIcon, InfoIcon } from '@/components/icons';
import { useToastStore } from '@/lib/toast-store';

const VISIBLE_MS = 2500;

/**
 * Single app-wide toast host. Mount once near the root; fire messages from
 * anywhere with `toast(...)`. Animated, dependency-free, and non-blocking.
 */
export function Toast() {
  const message = useToastStore((state) => state.message);
  const type = useToastStore((state) => state.type);
  const token = useToastStore((state) => state.token);
  const hide = useToastStore((state) => state.hide);

  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    if (!message) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -16, duration: 200, useNativeDriver: true }),
      ]).start(() => hide());
    }, VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [token, message, opacity, translateY, hide]);

  if (!message) {
    return null;
  }

  const isError = type === 'error';
  const Icon = isError ? InfoIcon : CheckCircleIcon;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <View
        className={`flex-row items-center gap-2 self-center rounded-full px-4 py-3 ${
          isError ? 'bg-red-500' : 'bg-brand-navy'
        }`}
      >
        <Icon size={18} color="#ffffff" />
        <Text className="text-sm font-semibold text-white">{message}</Text>
      </View>
    </Animated.View>
  );
}
