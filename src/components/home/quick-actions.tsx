import { Pressable, Text, View } from 'react-native';

import {
  CalculatorIcon,
  type IconProps,
  PlaneTakeoffIcon,
  ShipIcon,
  TruckIcon,
} from '@/components/icons';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';

type QuickAction = {
  key: string;
  Icon: (props: IconProps) => React.JSX.Element;
  label: string;
  tileClassName: string;
};

const ACTIONS: QuickAction[] = [
  { key: 'ship-local', Icon: TruckIcon, label: 'Ship locally', tileClassName: 'bg-brand-blue-tint' },
  { key: 'export', Icon: PlaneTakeoffIcon, label: 'Export', tileClassName: 'bg-brand-gold-tint' },
  { key: 'import', Icon: ShipIcon, label: 'Import', tileClassName: 'bg-brand-indigo-tint' },
  { key: 'quote', Icon: CalculatorIcon, label: 'Quote', tileClassName: 'bg-brand-surface' },
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
  const { Icon } = action;
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
        <Icon size={26} color={Brand.navy} />
      </View>
      <Text className="text-center text-xs font-medium text-gray-700">{action.label}</Text>
    </Pressable>
  );
}
