import { Pressable, Text, View } from 'react-native';

export type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

export type SegmentedToggleProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <View className="flex-row rounded-full bg-gray-100 p-1">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`flex-1 items-center rounded-full py-2.5 ${isSelected ? 'bg-brand-blue' : ''}`}
          >
            <Text
              className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-500'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
