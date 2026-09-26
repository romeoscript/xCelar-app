import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function StatTile({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 flex-row items-center gap-3 rounded-2xl bg-brand-surface p-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
        <MaterialCommunityIcons name={icon} size={18} color={Brand.blue} />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-gray-500">{label}</Text>
        <Text className="text-base font-bold text-brand-navy" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}
