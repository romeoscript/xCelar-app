import { Pressable, Text, View } from 'react-native';

import { tapFeedback } from '@/lib/haptics';

type QuickAction = {
  key: string;
  emoji: string;
  label: string;
  tileClassName: string;
};

const ACTIONS: QuickAction[] = [
  { key: 'ship-local', emoji: '🇳🇬', label: 'Ship locally', tileClassName: 'bg-brand-blue-tint' },
  { key: 'export', emoji: '✈️', label: 'Export', tileClassName: 'bg-brand-gold-tint' },
  { key: 'import', emoji: '📦', label: 'Import', tileClassName: 'bg-brand-indigo-tint' },
  { key: 'quote', emoji: '🧮', label: 'Quote', tileClassName: 'bg-brand-surface' },
];

export type QuickActionsProps = {
  onSelect: (key: string) => void;
};

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
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className="items-center gap-2 active:opacity-70"
      style={{ width: '23%' }}
    >
      <View className={`h-16 w-16 items-center justify-center rounded-2xl ${action.tileClassName}`}>
        <Text className="text-2xl">{action.emoji}</Text>
      </View>
      <Text className="text-center text-xs font-medium text-gray-700">{action.label}</Text>
    </Pressable>
  );
}
