import { Pressable, Switch, Text, View } from 'react-native';

import { ChevronRightIcon, type IconProps } from '@/components/icons';
import { Brand } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';

const DESTRUCTIVE = '#EF4444';
const TRACK_OFF = '#D1D5DB';

type Trailing = 'chevron' | 'toggle' | 'none';

export type SettingsRowProps = {
  icon: (props: IconProps) => React.JSX.Element;
  label: string;
  onPress?: () => void;
  trailing?: Trailing;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  toggleDisabled?: boolean;
  destructive?: boolean;
};

export function SettingsRow({
  icon: Icon,
  label,
  onPress,
  trailing = 'chevron',
  toggleValue,
  onToggle,
  toggleDisabled,
  destructive = false,
}: SettingsRowProps) {
  const accent = destructive ? DESTRUCTIVE : Brand.blue;
  const badgeClass = destructive ? 'bg-red-50' : 'bg-brand-blue-tint';
  const labelClass = destructive ? 'text-red-500' : 'text-gray-900';

  const handlePress = () => {
    tapFeedback();
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={trailing === 'toggle' || !onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-gray-50"
    >
      <View className={`h-10 w-10 items-center justify-center rounded-full ${badgeClass}`}>
        <Icon size={20} color={accent} />
      </View>
      <Text className={`flex-1 text-base font-medium ${labelClass}`}>{label}</Text>

      {trailing === 'chevron' ? <ChevronRightIcon size={20} color={Brand.muted} /> : null}
      {trailing === 'toggle' ? (
        <Switch
          value={toggleValue ?? false}
          onValueChange={onToggle}
          disabled={toggleDisabled}
          trackColor={{ true: Brand.blue, false: TRACK_OFF }}
          // iOS draws the off-state track with ios_backgroundColor; without it
          // the track is white and the switch is invisible on a white card.
          ios_backgroundColor={TRACK_OFF}
          thumbColor="#ffffff"
        />
      ) : null}
    </Pressable>
  );
}
