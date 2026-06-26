import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Slide-up sheet anchored to the bottom with a dimmed backdrop. Uses React
 * Native's built-in Animated (no extra Babel plugin) so it works everywhere.
 * Tapping the backdrop closes it.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
        <SheetPanel>{children}</SheetPanel>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SheetPanel({ children }: { children: ReactNode }) {
  const translateY = useRef(new Animated.Value(48)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [translateY, opacity]);

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      <View className="rounded-t-3xl bg-white px-6 pb-10 pt-3">
        <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-gray-200" />
        {children}
      </View>
    </Animated.View>
  );
}
