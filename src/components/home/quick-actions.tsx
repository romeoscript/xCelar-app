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
  iconColor: string;
};

const ACTIONS: QuickAction[] = [
  {
    key: 'ship-local',
    Icon: TruckIcon,
    label: 'Ship locally',
    tileClassName: 'bg-brand-blue-tint',
    iconColor: Brand.blue,
  },
  {
    key: 'export',
    Icon: PlaneTakeoffIcon,
    label: 'Export',
    tileClassName: 'bg-brand-gold-tint',
    iconColor: '#D97706',
  },
  {
    key: 'import',
    Icon: ShipIcon,
    label: 'Import',
    tileClassName: 'bg-brand-indigo-tint',
    iconColor: Brand.indigo,
  },
  {
    key: 'quote',
    Icon: CalculatorIcon,
    label: 'Quote',
    tileClassName: 'bg-brand-surface',
    iconColor: Brand.navy,
  },
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
      <View className={`h-14 w-14 items-center justify-center rounded-2xl ${action.tileClassName}`}>
        <Icon size={24} color={action.iconColor} />
      </View>
      <Text className="text-center text-xs font-semibold text-gray-700">{action.label}</Text>
    </Pressable>
  );
}
