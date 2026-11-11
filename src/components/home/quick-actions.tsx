import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { tapFeedback } from '@/lib/haptics';

type QuickAction = {
  key: string;
  label: string;
  art: number;
  tileClassName: string;
};

const ACTIONS: QuickAction[] = [
  { key: 'ship-local', label: 'Ship locally', art: require('@/assets/images/home/ship-local.png'), tileClassName: 'bg-brand-surface' },
  { key: 'export', label: 'Export', art: require('@/assets/images/home/export.png'), tileClassName: 'bg-brand-surface' },
  { key: 'import', label: 'Import', art: require('@/assets/images/home/import.png'), tileClassName: 'bg-brand-surface' },
  { key: 'quote', label: 'Get a quote', art: require('@/assets/images/home/quote.png'), tileClassName: 'bg-brand-surface' },
];

export type QuickActionsProps = {
  onSelect: (key: string) => void;
};

/** What you can do with Xcelar, each shown as its own little 3D object. */
export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <View className="flex-row justify-between">
      {ACTIONS.map((action) => (
        <QuickActionTile key={action.key} action={action} onPress={() => onSelect(action.key)} />
      ))}
    </View>
  );
}

function QuickActionTile({ action, onPress }: { action: QuickAction; onPress: () => void }) {
  const press = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      onPressIn={() => {
        press.value = withSpring(0.92, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 10, stiffness: 240 });
      }}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      className="items-center gap-2"
      style={{ width: '23%' }}
    >
      <Animated.View style={style} className={`aspect-square w-full items-center justify-center overflow-hidden rounded-3xl ${action.tileClassName}`}>
        <Image source={action.art} style={{ width: '86%', height: '86%' }} contentFit="contain" accessible={false} />
      </Animated.View>
      <Text className="text-center text-xs font-semibold text-brand-navy" numberOfLines={1}>
        {action.label}
      </Text>
    </Pressable>
  );
}
