import { Pressable, Text, View } from 'react-native';

export type ChipGroupProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

export function ChipGroup({ options, value, onChange }: ChipGroupProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            className={`rounded-full border px-4 py-2 active:opacity-70 ${
              isSelected ? 'border-brand-blue bg-brand-blue-tint' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`text-sm font-medium ${isSelected ? 'text-brand-blue' : 'text-gray-600'}`}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
